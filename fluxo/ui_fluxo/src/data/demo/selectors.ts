import { cents } from "@fluxo/core/kernel/money.ts";
import { localDate } from "@fluxo/core/time/local-date.ts";
import { competenceOf, shift } from "@fluxo/core/time/competence.ts";
import { postTransaction } from "@fluxo/core/domain/ledger/posting.ts";
import {
  accountBalance,
  availableLimit,
  invoiceTotals,
} from "@fluxo/core/domain/ledger/balance.ts";
import {
  computeFinancialPosition,
  projectCashflow,
} from "@fluxo/core/domain/position/financial-position.ts";
import {
  activeCompetence,
  dueDateFor,
} from "@fluxo/core/domain/card/invoice-cycle.ts";
import { projectRecurrences } from "@fluxo/core/domain/recurrence/projection.ts";
import { occurrenceKey } from "@fluxo/core/domain/recurrence/schedule.ts";
import type { LedgerEntry } from "@fluxo/core/domain/ledger/types.ts";
import type { DemoState, Entry } from "../contracts/models";
export function ledger(s: DemoState): LedgerEntry[] {
  return s.transactions.flatMap((t) =>
    postTransaction(t).map((e, i) => ({ ...e, id: t.id + ":" + i })),
  );
}
export function derived(s: DemoState) {
  const today = localDate(s.today),
    month = competenceOf(today),
    entries = ledger(s);
  const projection = projectRecurrences({
    rules: s.recurrences,
    from: month,
    to: shift(month, 5),
    confirmedKeys: new Set(
      s.transactions
        .filter((t) => t.recurrenceId)
        .map((t) => occurrenceKey(t.recurrenceId!, competenceOf(t.occurredOn))),
    ),
    cycleOf: (id) => s.cards.find((c) => c.id === id) ?? null,
  });
  const allEntries = [...entries, ...projection.entries];
  const categories = new Map(
    [...s.transactions, ...projection.transactions].map((t) => [
      t.id,
      t.categoryId,
    ]),
  );
  const input = {
    accounts: s.accounts,
    cards: s.cards,
    entries: allEntries,
    today,
    categoryByTransaction: categories,
    policy: {
      excludedCategoryIds: new Set(
        s.categories.filter((c) => c.excluded).map((c) => c.id),
      ),
    },
  };
  const position = computeFinancialPosition(input);
  const accounts = s.accounts.map((a) => ({
    ...a,
    balanceCents: accountBalance(entries, a.id, today, a.openingBalance),
  }));
  const cards = s.cards.map((c) => {
    const comp = activeCompetence(c, today);
    return {
      ...c,
      competence: comp,
      invoice: invoiceTotals(entries, c.id, comp),
      availableCents: availableLimit(entries, c.id, cents(c.limitCents)),
      invoices: [
        ...new Set(
          entries
            .filter((e) => e.party.kind === "card" && e.party.cardId === c.id)
            .map((e) => e.competence),
        ),
      ]
        .sort()
        .map((co) => ({
          ...invoiceTotals(entries, c.id, co),
          dueOn: dueDateFor(c, co),
        })),
    };
  });
  const historical = Array.from({ length: 12 }, (_, i) => {
    const co = shift(month, i - 11);
    const rows = s.transactions.filter(
      (t) =>
        t.competence === co &&
        t.state === "confirmed" &&
        t.currency === "BRL" &&
        t.occurredOn <= today,
    );
    const income = rows
      .filter((t) => t.kind === "income")
      .reduce((a, t) => a + t.amount, 0);
    const expense =
      rows
        .filter((t) => t.kind === "expense")
        .reduce((a, t) => a + t.amount, 0) -
      rows.filter((t) => t.kind === "refund").reduce((a, t) => a + t.amount, 0);
    return { month: co, income, expense, net: income - expense };
  });
  const spend = (categoryId: string, mo = month) =>
    s.transactions
      .filter(
        (t) =>
          t.categoryId === categoryId &&
          t.competence === mo &&
          t.state === "confirmed" &&
          t.currency === "BRL" &&
          t.occurredOn <= today,
      )
      .reduce(
        (a, t) =>
          a +
          (t.kind === "expense"
            ? t.amount
            : t.kind === "refund"
              ? -t.amount
              : 0),
        0,
      );
  const categorySpend = s.categories
    .filter((c) => c.kind === "expense")
    .map((c) => ({ ...c, value: spend(c.id) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const upcoming = [
    ...s.transactions.filter((t) => t.state === "planned"),
    ...projection.transactions,
  ]
    .filter((t) => t.occurredOn >= today)
    .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn));
  const cashflow = projectCashflow({
    ...input,
    competences: Array.from({ length: 6 }, (_, i) => shift(month, i)),
  });
  const projects = s.projects.map((p) => {
    const payments = s.payments.filter((x) => x.projectId === p.id);
    const received = payments
      .filter((x) => x.transactionId)
      .reduce(
        (a, x) =>
          a +
          (s.transactions.find((t) => t.id === x.transactionId)?.amount ?? 0),
        0,
      );
    const tasks = s.tasks.filter((x) => x.projectId === p.id);
    return {
      ...p,
      received,
      pending: Math.max(0, p.amountCents - received),
      minutes: s.sessions
        .filter((x) => x.projectId === p.id)
        .reduce((a, x) => a + x.minutes, 0),
      progress: tasks.length
        ? Math.round(
            (tasks.filter((x) => x.status === "done").length / tasks.length) *
              100,
          )
        : 0,
      tasks,
    };
  });
  const budgets = s.budgets.map((b) => ({
    ...b,
    spent: spend(b.categoryId, b.month as typeof month),
    category: s.categories.find((c) => c.id === b.categoryId),
  }));
  const goals = s.goals.map((g) => ({
    ...g,
    saved: accounts.find((a) => a.id === g.accountId)?.balanceCents ?? 0,
  }));
  const essentialSpend = s.categories
    .filter((c) => c.essential)
    .reduce((sum, c) => sum + spend(c.id), 0);
  return {
    position,
    accounts,
    cards,
    historical,
    monthFlow: historical.at(-1)!,
    categorySpend,
    upcoming,
    cashflow,
    projects,
    budgets,
    goals,
    essentialSpend,
    entries,
  };
}
export type View = ReturnType<typeof derived>;
export function filteredEntries(
  s: DemoState,
  params: URLSearchParams,
): Entry[] {
  const query = (params.get("q") ?? "").toLocaleLowerCase("pt-BR");
  return s.transactions
    .filter(
      (t) =>
        t.description.toLocaleLowerCase("pt-BR").includes(query) &&
        (!params.get("mes") || t.competence === params.get("mes")) &&
        (!params.get("conta") ||
          (t.origin.kind === "account" &&
            t.origin.accountId === params.get("conta"))) &&
        (!params.get("categoria") ||
          t.categoryId === params.get("categoria")) &&
        (!params.get("tipo") || t.kind === params.get("tipo")) &&
        (!params.get("estado") || t.state === params.get("estado")),
    )
    .sort((a, b) =>
      params.get("ordem") === "valor"
        ? b.amount - a.amount
        : b.occurredOn.localeCompare(a.occurredOn) || a.id.localeCompare(b.id),
    );
}
