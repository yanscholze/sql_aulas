import { cents } from "@fluxo/core/kernel/money.ts";
import { localDate } from "@fluxo/core/time/local-date.ts";
import { competenceOf } from "@fluxo/core/time/competence.ts";
import {
  activeCompetence,
  assertValidCycle,
  competenceForPurchase,
  dueDateFor,
} from "@fluxo/core/domain/card/invoice-cycle.ts";
import { postTransaction } from "@fluxo/core/domain/ledger/posting.ts";
import {
  invoiceTotals,
  accountBalance,
} from "@fluxo/core/domain/ledger/balance.ts";
import { scheduleInstallments } from "@fluxo/core/domain/installment/plan.ts";
import { simulateAnticipation } from "@fluxo/core/domain/installment/anticipation.ts";
import { isSupportedCurrency } from "@fluxo/core/domain/account/types.ts";
import { PROJECT_STATUSES } from "@fluxo/core/domain/work/status.ts";
import {
  assertValidSchedule,
  occurrenceDate,
  occurrenceAmount,
} from "@fluxo/core/domain/recurrence/schedule.ts";
import type {
  Command,
  DemoState,
  Entry,
  Values,
  Recurrence,
} from "../contracts/models";
import { readMoney, money } from "../../shared/format";
import { seed } from "./seed";
import { derived, ledger } from "./selectors";
export class DemoError extends Error {
  constructor(
    message: string,
    public code:
      "validation" | "missing" | "conflict" | "storage" = "validation",
  ) {
    super(message);
  }
}
const id = (): string => crypto.randomUUID();
const required = (v: Values, k: string) => {
  const x = v[k]?.trim();
  if (!x) throw new DemoError("Preencha os campos obrigatórios.");
  return x;
};
const positive = (v: Values, k = "amount") => {
  const n = readMoney(required(v, k));
  if (n <= 0) throw new DemoError("O valor deve ser maior que zero.");
  return n;
};
const whole = (v: Values, k: string, min = 1, max = 100000) => {
  const n = Number(v[k]);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new DemoError("Informe um número válido.");
  return n;
};
function upsert<T extends { id: string }>(rows: T[], value: T) {
  const index = rows.findIndex((r) => r.id === value.id);
  if (index < 0) rows.push(value);
  else rows[index] = value;
}
function must<T extends { id: string }>(rows: T[], value: string) {
  const row = rows.find((r) => r.id === value);
  if (!row) throw new DemoError("Registro não encontrado.", "missing");
  return row;
}
function transaction(s: DemoState, v: Values, entryId = id()): Entry {
  const old = s.transactions.find((t) => t.id === entryId);
  const kind = (v.kind || old?.kind || "expense") as Entry["kind"];
  if (
    !["expense", "income", "transfer", "refund", "invoice_payment"].includes(
      kind,
    )
  )
    throw new DemoError("Tipo de lançamento inválido.");
  const party = v.origin || "account:acc-main";
  const [partyKind, partyId] = party.split(":");
  const origin: Entry["origin"] =
    partyKind === "card"
      ? { kind: "card", cardId: partyId }
      : { kind: "account", accountId: partyId };
  const account =
    origin.kind === "account" ? must(s.accounts, origin.accountId) : null;
  const card = origin.kind === "card" ? must(s.cards, origin.cardId) : null;
  if (account?.archivedAt || card?.archived)
    throw new DemoError("Escolha uma conta ou cartão ativo.");
  const date = localDate(v.date || s.today);
  const destination: Entry["destination"] =
    kind === "transfer"
      ? { kind: "account", accountId: required(v, "destination") }
      : kind === "invoice_payment"
        ? { kind: "card", cardId: required(v, "destination") }
        : null;
  if (destination?.kind === "account") {
    const to = must(s.accounts, destination.accountId);
    if (to.archivedAt) throw new DemoError("Conta de destino arquivada.");
    if (to.currency !== account?.currency)
      throw new DemoError(
        "Transferências locais exigem contas na mesma moeda.",
      );
  }
  const categoryId = v.categoryId || null;
  if (categoryId) must(s.categories, categoryId);
  const state = (v.state || "confirmed") as Entry["state"];
  if (!["confirmed", "planned", "review"].includes(state))
    throw new DemoError("Situação inválida.");
  const entry: Entry = {
    id: entryId,
    userId: "demo",
    kind,
    state,
    source: old?.source ?? "manual",
    description: required(v, "description"),
    categoryId:
      kind === "transfer" || kind === "invoice_payment" ? null : categoryId,
    amount: positive(v),
    currency: account?.currency ?? "BRL",
    occurredOn: date,
    origin,
    destination,
    competence:
      kind === "invoice_payment" && v.competence
        ? (v.competence as Entry["competence"])
        : card
          ? competenceForPurchase(card, date)
          : competenceOf(date),
    tripId: v.tripId || null,
    installmentPlanId: old?.installmentPlanId ?? null,
    installmentNumber: old?.installmentNumber ?? null,
    recurrenceId: old?.recurrenceId ?? null,
    notes: v.notes || null,
    projectId: old?.projectId,
    fingerprint: old?.fingerprint,
  };
  if (entry.tripId) {
    const trip = must(s.trips, entry.tripId);
    if (trip.currency !== entry.currency)
      throw new DemoError(
        "Use a mesma moeda da viagem. Conversão remota não está ativa na demonstração.",
      );
  }
  postTransaction(entry);
  return entry;
}
export function anticipation(s: DemoState, planId: string, count: number) {
  const rows = s.transactions.filter(
    (t) => t.installmentPlanId === planId && t.state === "planned",
  );
  const card = s.cards.find(
    (c) => rows[0]?.origin.kind === "card" && c.id === rows[0].origin.cardId,
  );
  if (!card) throw new DemoError("Não há parcelas futuras para antecipar.");
  return simulateAnticipation({
    openInstallments: rows.map((t) => ({
      number: t.installmentNumber!,
      competence: t.competence,
      occurredOn: t.occurredOn,
      dueDate: dueDateFor(card, t.competence),
      amount: t.amount,
    })),
    count,
    anticipationCompetence: activeCompetence(card, localDate(s.today)),
    monthlyInterestBasisPoints: 0,
  });
}
export function applyCommand(previous: DemoState, command: Command): DemoState {
  if (command.type === "demo.reset") {
    const fresh = seed();
    fresh.revision = previous.revision + 1;
    return fresh;
  }
  const s = structuredClone(previous);
  const v = "values" in command ? command.values : {};
  const key = "id" in command ? command.id : undefined;
  switch (command.type) {
    case "transaction.save": {
      if (key) {
        const old = must(s.transactions, key);
        if (old.kind === "invoice_payment")
          throw new DemoError("Pagamentos são ajustados pela fatura.");
      }
      const t = transaction(s, v, key);
      const count = Number(v.installments || 1);
      if (count > 1 && !key) {
        if (t.kind !== "expense" || t.origin.kind !== "card")
          throw new DemoError("Parcelamento requer uma despesa no cartão.");
        const card = must(s.cards, t.origin.cardId);
        const planId = id();
        for (const part of scheduleInstallments({
          totalAmount: t.amount,
          installmentCount: count,
          purchaseDate: t.occurredOn,
          cycle: card,
        }))
          s.transactions.push({
            ...t,
            id: id(),
            amount: part.amount,
            competence: part.competence,
            occurredOn: part.occurredOn,
            source: "installment",
            installmentPlanId: planId,
            installmentNumber: part.number,
            state: part.occurredOn <= s.today ? "confirmed" : "planned",
          });
      } else upsert(s.transactions, t);
      break;
    }
    case "transaction.delete": {
      const t = must(s.transactions, command.id);
      if (t.kind === "invoice_payment")
        throw new DemoError("Este pagamento deve permanecer no histórico.");
      s.transactions = s.transactions.filter((x) => x.id !== command.id);
      s.payments = s.payments.map((p) =>
        p.transactionId === t.id ? { ...p, transactionId: null } : p,
      );
      break;
    }
    case "invoice.pay": {
      const card = must(s.cards, command.cardId);
      const account = must(s.accounts, command.accountId);
      if (
        account.archivedAt ||
        account.currency !== "BRL" ||
        account.kind === "benefit"
      )
        throw new DemoError(
          "Escolha uma conta em reais que possa pagar a fatura.",
        );
      const totals = invoiceTotals(
        ledger(s),
        card.id,
        command.competence as Entry["competence"],
      );
      if (command.amountCents <= 0 || command.amountCents > totals.outstanding)
        throw new DemoError(
          "O pagamento deve ser positivo e não superar a fatura aberta.",
        );
      const t = transaction(s, {
        kind: "invoice_payment",
        description: "Pagamento · " + card.name,
        amount: (command.amountCents / 100).toFixed(2),
        date: s.today,
        origin: "account:" + account.id,
        destination: card.id,
        competence: command.competence,
      });
      s.transactions.push({ ...t, source: "invoice_payment" });
      break;
    }
    case "account.save": {
      const currency = v.currency || "BRL";
      if (!isSupportedCurrency(currency))
        throw new DemoError("Moeda inválida.");
      const old = s.accounts.find((a) => a.id === key);
      const kind = (v.kind ||
        "checking") as DemoState["accounts"][number]["kind"];
      if (
        !["checking", "savings", "cash", "benefit", "investment"].includes(kind)
      )
        throw new DemoError("Tipo de conta inválido.");
      if (
        old &&
        currency !== old.currency &&
        s.transactions.some(
          (t) =>
            (t.origin.kind === "account" && t.origin.accountId === old.id) ||
            (t.destination?.kind === "account" &&
              t.destination.accountId === old.id),
        )
      )
        throw new DemoError(
          "Não é possível alterar a moeda de uma conta com movimentações.",
        );
      upsert(s.accounts, {
        id: key || id(),
        userId: "demo",
        name: required(v, "name"),
        institution: v.institution || "Conta pessoal",
        kind,
        currency,
        openingBalance: readMoney(v.openingBalance || "0"),
        openedOn: old?.openedOn || localDate(s.today),
        goalAmount: null,
        monthlyYieldBasisPoints: 0,
        includeInTotals: v.includeInTotals !== "false",
        isProtected: old?.isProtected ?? false,
        color: v.color || "#356E7E",
        sortOrder: old?.sortOrder ?? s.accounts.length,
        archivedAt: old?.archivedAt ?? null,
      });
      break;
    }
    case "account.archive": {
      const a = must(s.accounts, command.id);
      if (a.isProtected)
        throw new DemoError("A reserva de emergência é protegida.");
      if (
        accountBalance(
          ledger(s),
          a.id,
          localDate(s.today),
          a.openingBalance,
        ) !== 0
      )
        throw new DemoError("Transfira o saldo antes de arquivar esta conta.");
      upsert(s.accounts, { ...a, archivedAt: s.today });
      break;
    }
    case "account.reconcile": {
      const a = must(s.accounts, command.id);
      const balance = accountBalance(
        ledger(s),
        a.id,
        localDate(s.today),
        a.openingBalance,
      );
      upsert(s.accounts, {
        ...a,
        openingBalance: cents(
          a.openingBalance + command.balanceCents - balance,
        ),
      });
      break;
    }
    case "card.save": {
      const old = s.cards.find((c) => c.id === key);
      const c = {
        id: key || id(),
        name: required(v, "name"),
        last4: v.last4 || "0000",
        closingDay: whole(v, "closingDay", 1, 31),
        dueDay: whole(v, "dueDay", 1, 31),
        dueAdjustment: "next" as const,
        limitCents: positive(v, "limit"),
        color: v.color || "#76619E",
        kind: "credit" as const,
        isPrimary: old?.isPrimary ?? s.cards.length === 0,
        sortOrder: old?.sortOrder ?? s.cards.length,
        archived: false,
      };
      assertValidCycle(c);
      if (!/^\d{4}$/.test(c.last4))
        throw new DemoError("Informe os quatro últimos dígitos.");
      upsert(s.cards, c);
      break;
    }
    case "card.archive": {
      const c = must(s.cards, command.id);
      if (
        derived(s)
          .cards.find((x) => x.id === c.id)!
          .invoices.some((i) => i.outstanding > 0)
      )
        throw new DemoError("Quite as faturas antes de arquivar.");
      upsert(s.cards, { ...c, archived: true });
      break;
    }
    case "recurrence.save": {
      const old = s.recurrences.find((r) => r.id === key);
      const [kind, partyId] = (v.origin || "account:acc-main").split(":");
      if (kind === "card") must(s.cards, partyId);
      else must(s.accounts, partyId);
      const rule: Recurrence = {
        id: key || id(),
        userId: "demo",
        description: required(v, "description"),
        amount: positive(v),
        kind: v.kind === "income" ? "income" : "expense",
        role:
          v.role === "subscription"
            ? "subscription"
            : v.kind === "income"
              ? "salary"
              : "standard",
        categoryId: v.categoryId || null,
        accountId: kind === "account" ? partyId : null,
        cardId: kind === "card" ? partyId : null,
        destinationAccountId: null,
        amountMode: "fixed",
        scheduleMode: "day_of_month",
        scheduleDay: whole(v, "day", 1, 31),
        dayAdjustment: "next",
        interval: "monthly",
        startsOn: localDate(v.startsOn || s.today),
        endsOn: null,
        isActive: old?.isActive ?? true,
      };
      if (rule.kind === "income" && rule.cardId)
        throw new DemoError("Receitas devem entrar em contas.");
      assertValidSchedule(rule);
      upsert(s.recurrences, rule);
      break;
    }
    case "recurrence.toggle": {
      const rule = must(s.recurrences, command.id);
      upsert(s.recurrences, { ...rule, isActive: !rule.isActive });
      break;
    }
    case "recurrence.confirm": {
      const rule = must(s.recurrences, command.id);
      if (!rule.isActive) throw new DemoError("Esta recorrência está inativa.");
      if (
        s.transactions.some(
          (t) =>
            t.recurrenceId === rule.id &&
            t.occurredOn.slice(0, 7) === command.month,
        )
      )
        throw new DemoError("Esta ocorrência já foi confirmada.", "conflict");
      const comp = command.month as Entry["competence"];
      const t = transaction(s, {
        kind: rule.kind,
        description: rule.description,
        amount: (occurrenceAmount(rule, comp) / 100).toFixed(2),
        date: occurrenceDate(rule, comp),
        categoryId: rule.categoryId || "",
        origin: rule.cardId
          ? "card:" + rule.cardId
          : "account:" + rule.accountId,
      });
      s.transactions.push({
        ...t,
        recurrenceId: rule.id,
        source: "recurrence",
      });
      break;
    }
    case "budget.save": {
      const category = must(s.categories, required(v, "categoryId"));
      if (category.kind !== "expense")
        throw new DemoError("Orçamento requer categoria de despesa.");
      const month = v.month || s.today.slice(0, 7);
      localDate(month + "-01");
      const duplicate = s.budgets.find(
        (b) => b.month === month && b.categoryId === category.id,
      );
      upsert(s.budgets, {
        id: key || duplicate?.id || id(),
        categoryId: category.id,
        limitCents: positive(v, "limit"),
        month,
      });
      break;
    }
    case "goal.save":
      must(s.accounts, required(v, "accountId"));
      upsert(s.goals, {
        id: key || id(),
        name: required(v, "name"),
        accountId: v.accountId,
        targetCents: positive(v, "target"),
        dueOn: localDate(required(v, "dueOn")),
      });
      break;
    case "trip.save": {
      const start = localDate(required(v, "startOn")),
        end = localDate(required(v, "endOn"));
      if (end < start) throw new DemoError("A volta deve ser após a ida.");
      if (!isSupportedCurrency(v.currency || "BRL"))
        throw new DemoError("Moeda inválida.");
      upsert(s.trips, {
        id: key || id(),
        name: required(v, "name"),
        destination: required(v, "destination"),
        startOn: start,
        endOn: end,
        budgetCents: positive(v, "budget"),
        currency: v.currency || "BRL",
        archived: false,
      });
      break;
    }
    case "trip.archive": {
      const trip = must(s.trips, command.id);
      upsert(s.trips, { ...trip, archived: !trip.archived });
      break;
    }
    case "project.save":
      upsert(s.projects, {
        id: key || id(),
        name: required(v, "name"),
        client: required(v, "client"),
        description: v.description || "",
        amountCents: positive(v),
        dueOn: localDate(required(v, "dueOn")),
        status: s.projects.find((p) => p.id === key)?.status ?? "active",
        color: v.color || "#6DBF65",
      });
      break;
    case "project.status":
      if (!PROJECT_STATUSES.includes(command.status))
        throw new DemoError("Estado inválido.");
      upsert(s.projects, {
        ...must(s.projects, command.id),
        status: command.status,
      });
      break;
    case "task.save":
      must(s.projects, required(v, "projectId"));
      upsert(s.tasks, {
        id: key || id(),
        projectId: v.projectId,
        title: required(v, "title"),
        dueOn: localDate(required(v, "dueOn")),
        status: s.tasks.find((t) => t.id === key)?.status ?? "todo",
        checklist: v.checklist === "true",
      });
      break;
    case "task.move":
      upsert(s.tasks, { ...must(s.tasks, command.id), status: command.status });
      break;
    case "session.save":
      must(s.projects, required(v, "projectId"));
      upsert(s.sessions, {
        id: key || id(),
        projectId: v.projectId,
        description: required(v, "description"),
        date: localDate(v.date || s.today),
        minutes: whole(v, "minutes", 1, 1440),
      });
      break;
    case "payment.save":
      must(s.projects, required(v, "projectId"));
      upsert(s.payments, {
        id: key || id(),
        projectId: v.projectId,
        description: required(v, "description"),
        dueOn: localDate(required(v, "dueOn")),
        amountCents: positive(v),
        transactionId: null,
      });
      break;
    case "payment.receive": {
      const p = must(s.payments, command.id);
      if (p.transactionId)
        throw new DemoError("O recebimento já foi registrado.");
      const project = must(s.projects, p.projectId);
      const tx = transaction(s, {
        kind: "income",
        description: project.name + " · " + p.description,
        amount: (p.amountCents / 100).toFixed(2),
        origin: "account:" + command.accountId,
        date: s.today,
        categoryId: "freelance",
      });
      s.transactions.push({ ...tx, projectId: p.projectId });
      upsert(s.payments, { ...p, transactionId: tx.id });
      break;
    }
    case "proposal.save":
      must(s.projects, required(v, "projectId"));
      upsert(s.proposals, {
        id: key || id(),
        projectId: v.projectId,
        title: required(v, "title"),
        amountCents: positive(v),
        status:
          v.status === "accepted"
            ? "accepted"
            : v.status === "sent"
              ? "sent"
              : "draft",
      });
      break;
    case "category.save":
      upsert(s.categories, {
        id: key || id(),
        name: required(v, "name"),
        color: v.color || "#6DBF65",
        kind: v.kind === "income" ? "income" : "expense",
        essential: v.essential === "true",
        excluded: v.excluded === "true",
      });
      break;
    case "reward.save": {
      must(s.cards, required(v, "cardId"));
      const points = whole(v, "points");
      const balance = s.rewards
        .filter((r) => r.cardId === v.cardId)
        .reduce((a, r) => a + r.points, 0);
      if (v.kind === "redeem" && points > balance)
        throw new DemoError("Você não tem pontos suficientes.");
      s.rewards.push({
        id: id(),
        cardId: v.cardId,
        description: required(v, "description"),
        points: v.kind === "redeem" ? -points : points,
        date: s.today,
      });
      break;
    }
    case "profile.save":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
        throw new DemoError("Informe um e-mail válido para o perfil fictício.");
      s.profile = { name: required(v, "name"), email: v.email };
      break;
    case "investment.transfer": {
      const investment = must(s.accounts, command.investmentId);
      if (!["investment", "savings"].includes(investment.kind))
        throw new DemoError("Escolha uma conta de investimento.");
      const origin = command.redeem ? investment.id : command.accountId;
      const dest = command.redeem ? command.accountId : investment.id;
      if (
        command.redeem &&
        command.amountCents >
          accountBalance(
            ledger(s),
            investment.id,
            localDate(s.today),
            investment.openingBalance,
          )
      )
        throw new DemoError("Resgate maior que o saldo investido.");
      s.transactions.push(
        transaction(s, {
          kind: "transfer",
          description:
            (command.redeem ? "Resgate · " : "Aporte · ") + investment.name,
          amount: (command.amountCents / 100).toFixed(2),
          origin: "account:" + origin,
          destination: dest,
          date: s.today,
        }),
      );
      break;
    }
    case "capture.save": {
      const c = must(s.captures, key || "");
      if (c.status !== "review")
        throw new DemoError("Esta captura já foi resolvida.");
      upsert(s.captures, {
        ...c,
        description: required(v, "description"),
        amountCents: positive(v),
        categoryId: required(v, "categoryId"),
        accountId: required(v, "accountId"),
      });
      break;
    }
    case "capture.resolve": {
      const c = must(s.captures, command.id);
      if (c.status !== "review")
        throw new DemoError("Esta captura já foi resolvida.");
      if (command.accept) {
        const t = transaction(s, {
          kind: "expense",
          description: c.description,
          amount: (c.amountCents / 100).toFixed(2),
          date: c.date,
          origin: "account:" + c.accountId,
          categoryId: c.categoryId,
        });
        s.transactions.push({ ...t, source: "capture" });
      }
      upsert(s.captures, {
        ...c,
        status: command.accept ? "accepted" : "ignored",
      });
      break;
    }
    case "capture-rule.save":
      must(s.categories, required(v, "categoryId"));
      upsert(s.captureRules, {
        id: key || id(),
        match: required(v, "match"),
        categoryId: v.categoryId,
      });
      break;
    case "import.add":
      s.imports.push(command.batch);
      break;
    case "import.confirm": {
      const batch = must(s.imports, command.id);
      if (batch.confirmed) throw new DemoError("Este lote já foi confirmado.");
      for (const row of batch.rows) {
        if (row.duplicate || !command.selected.includes(row.id)) continue;
        if (s.transactions.some((t) => t.fingerprint === row.fingerprint))
          continue;
        const t = transaction(s, {
          kind: row.amountCents < 0 ? "expense" : "income",
          description: row.description,
          amount: (Math.abs(row.amountCents) / 100).toFixed(2),
          date: row.date,
          origin: "account:" + batch.accountId,
          categoryId: row.categoryId,
        });
        s.transactions.push({
          ...t,
          source: "import",
          fingerprint: row.fingerprint,
        });
        row.accepted = true;
      }
      batch.confirmed = true;
      break;
    }
    case "document.add":
      must(s.projects, command.document.projectId);
      if (command.document.size > 10 * 1024 * 1024)
        throw new DemoError("Use arquivos de até 10 MB.");
      s.documents.push(command.document);
      break;
    case "document.delete":
      s.documents = s.documents.filter((d) => d.id !== command.id);
      break;
    case "notification.read":
      upsert(s.notifications, {
        ...must(s.notifications, command.id),
        read: true,
      });
      break;
    case "device.toggle": {
      const d = must(s.devices, command.id);
      upsert(s.devices, { ...d, active: !d.active });
      break;
    }
    case "integration.toggle":
      s.integrations[command.name] = !s.integrations[command.name];
      break;
    case "conversation.send": {
      let conv = s.conversations.find((c) => c.id === command.id);
      if (!conv) {
        conv = {
          id: command.id,
          title: command.text.slice(0, 45),
          messages: [],
        };
        s.conversations.unshift(conv);
      }
      const view = derived(s);
      const text = command.text.trim();
      if (!text) throw new DemoError("Escreva uma mensagem.");
      const q = text.toLocaleLowerCase("pt-BR");
      let answer =
        "Esta é uma conversa demonstrativa, sem conexão com IA. Posso mostrar sua folga do ciclo, os gastos por categoria, as faturas ou a reserva usando os dados desta demonstração.";
      if (/gast|livre|saldo/.test(q))
        answer = `A folga projetada deste ciclo é ${money(view.position.freeToSpend.amount)}. Ela considera saldo, receitas previstas e compromissos. O saldo atual é ${money(view.position.currentBalance)}. Confira a decomposição no Painel antes de decidir.`;
      else if (/fatura|cart/.test(q))
        answer = `As faturas que compõem o ciclo somam ${money(view.position.freeToSpend.openInvoices)}. Em Cartões, você pode conferir cada competência e simular um pagamento.`;
      else if (/reserva|invest/.test(q))
        answer = `Há ${money(view.position.investments)} em contas de investimento e reserva. Esse dinheiro compõe o patrimônio, mas não é saldo de uso diário.`;
      else if (/categoria|despesa/.test(q))
        answer = `A maior categoria no mês é ${view.categorySpend[0]?.name ?? "nenhuma"}, com ${money(view.categorySpend[0]?.value ?? 0)}. Abra Relatórios para explorar os lançamentos.`;
      conv.messages.push(
        { id: id(), role: "user", text },
        { id: id(), role: "assistant", text: answer },
      );
      break;
    }
    case "installment.anticipate": {
      const simulation = anticipation(s, command.planId, command.count);
      const numbers = new Set(simulation.anticipated.map((p) => p.number));
      const rows = s.transactions.filter(
        (t) =>
          t.installmentPlanId === command.planId &&
          numbers.has(t.installmentNumber!),
      );
      const first = rows[0];
      const card = must(
        s.cards,
        first.origin.kind === "card" ? first.origin.cardId : "",
      );
      s.transactions = s.transactions.filter(
        (t) => !rows.some((r) => r.id === t.id),
      );
      s.transactions.push({
        ...first,
        id: id(),
        description: "Antecipação · " + first.description,
        amount: simulation.amountDueToday,
        competence: activeCompetence(card, localDate(s.today)),
        occurredOn: localDate(s.today),
        state: "confirmed",
        installmentPlanId: null,
        installmentNumber: null,
      });
      break;
    }
  }
  s.revision = previous.revision + 1;
  return s;
}
