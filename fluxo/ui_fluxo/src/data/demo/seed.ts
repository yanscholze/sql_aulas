import { cents } from "@fluxo/core/kernel/money.ts";
import { localDate } from "@fluxo/core/time/local-date.ts";
import { competenceOf } from "@fluxo/core/time/competence.ts";
import { competenceForPurchase } from "@fluxo/core/domain/card/invoice-cycle.ts";
import { scheduleInstallments } from "@fluxo/core/domain/installment/plan.ts";
import type { DemoState, Entry, Recurrence } from "../contracts/models";
export const TODAY = "2026-11-11";
export function seed(): DemoState {
  const accounts: DemoState["accounts"] = [
    ["acc-main", "Conta do dia a dia", "Nubank", "checking", 365000, "#7E5AB6"],
    ["acc-bank", "Conta pessoal", "Inter", "checking", 185000, "#E79B49"],
    [
      "acc-reserve",
      "Reserva de emergência",
      "CDB · liquidez diária",
      "investment",
      1580000,
      "#356E7E",
    ],
    [
      "acc-invest",
      "Planos para o futuro",
      "Tesouro Direto",
      "investment",
      940000,
      "#6DBF65",
    ],
    ["acc-benefit", "Vale-alimentação", "Caju", "benefit", 52000, "#C87662"],
  ].map(([id, name, institution, kind, openingBalance, color], i) => ({
    id: String(id),
    name: String(name),
    institution: String(institution),
    kind: kind as "checking" | "investment" | "benefit",
    openingBalance: cents(Number(openingBalance)),
    color: String(color),
    userId: "demo",
    currency: "BRL",
    openedOn: localDate("2025-12-01"),
    goalAmount: null,
    monthlyYieldBasisPoints: 80,
    includeInTotals: true,
    isProtected: id === "acc-reserve",
    sortOrder: i,
    archivedAt: null,
  }));
  const cards: DemoState["cards"] = [
    {
      id: "card-nu",
      name: "Nubank Platinum",
      last4: "4821",
      color: "#76619E",
      limitCents: 1200000,
      closingDay: 13,
      dueDay: 20,
      dueAdjustment: "next",
      kind: "credit",
      isPrimary: true,
      sortOrder: 0,
      archived: false,
    },
    {
      id: "card-inter",
      name: "Inter Mastercard",
      last4: "9306",
      color: "#D69B55",
      limitCents: 600000,
      closingDay: 5,
      dueDay: 12,
      dueAdjustment: "next",
      kind: "credit",
      isPrimary: false,
      sortOrder: 1,
      archived: false,
    },
  ];
  const categories: DemoState["categories"] = [
    ["salary", "Salário", "#356E7E", "income"],
    ["freelance", "Projetos", "#8D69AC", "income"],
    ["home", "Moradia", "#6DBF65", "expense"],
    ["food", "Alimentação", "#356E7E", "expense"],
    ["transport", "Transporte", "#A367C4", "expense"],
    ["leisure", "Lazer", "#D99A40", "expense"],
    ["health", "Saúde", "#93A1A5", "expense"],
    ["tools", "Assinaturas", "#7497B7", "expense"],
  ].map(([id, name, color, kind]) => ({
    id,
    name,
    color,
    kind: kind as "income" | "expense",
    essential: ["home", "food", "health"].includes(id),
    excluded: false,
  }));
  const transactions: Entry[] = [];
  const add = (
    id: string,
    description: string,
    amount: number,
    kind: Entry["kind"],
    date: string,
    categoryId: string | null,
    originId = "acc-main",
    card = false,
    destination: Entry["destination"] = null,
    comp?: string,
  ) => {
    transactions.push({
      id,
      userId: "demo",
      kind,
      state: "confirmed",
      source: "manual",
      description,
      categoryId,
      amount: cents(amount),
      currency: "BRL",
      occurredOn: localDate(date),
      origin: card
        ? { kind: "card", cardId: originId }
        : { kind: "account", accountId: originId },
      destination,
      competence: comp
        ? (comp as Entry["competence"])
        : card
          ? competenceForPurchase(
              cards.find((c) => c.id === originId)!,
              localDate(date),
            )
          : competenceOf(localDate(date)),
      tripId: null,
      installmentPlanId: null,
      installmentNumber: null,
      recurrenceId: null,
      notes: null,
    });
  };
  for (let m = 0; m < 12; m++) {
    const y = m === 0 ? 2025 : 2026;
    const month = m === 0 ? 12 : m;
    const prefix = `${y}-${String(month).padStart(2, "0")}`;
    add(
      `salary-${m}`,
      "Salário · Estúdio Forma",
      650000 + m * 3500,
      "income",
      prefix + "-05",
      "salary",
    );
    add(
      `rent-${m}`,
      "Aluguel do apartamento",
      195000,
      "expense",
      prefix + "-06",
      "home",
    );
    add(
      `market-${m}`,
      "Mercado Natural",
      42000 + m * 1300,
      "expense",
      prefix + "-08",
      "food",
    );
    add(
      `ride-${m}`,
      "Mobilidade e transporte",
      18000 + m * 410,
      "expense",
      prefix + "-09",
      "transport",
    );
    add(
      `health-${m}`,
      "Plano de saúde",
      32900,
      "expense",
      prefix + "-10",
      "health",
    );
    add(
      `foodcard-${m}`,
      "Restaurante Jardim",
      23500 + m * 190,
      "expense",
      prefix + "-09",
      "food",
      "card-nu",
      true,
    );
    add(
      `stream-${m}`,
      "Streaming e entretenimento",
      5590,
      "expense",
      prefix + "-04",
      "leisure",
      "card-inter",
      true,
    );
    if (m < 11) {
      add(
        `project-income-${m}`,
        "Projeto de identidade visual",
        185000 + m * 4500,
        "income",
        prefix + "-15",
        "freelance",
        "acc-bank",
      );
      add(
        `outing-${m}`,
        "Café, cinema e passeios",
        32500 + m * 750,
        "expense",
        prefix + "-18",
        "leisure",
      );
      add(
        `transfer-${m}`,
        "Aporte na reserva",
        120000,
        "transfer",
        prefix + "-21",
        null,
        "acc-main",
        false,
        { kind: "account", accountId: "acc-reserve" },
      );
      add(
        `payment-nu-${m}`,
        "Pagamento Nubank",
        23500 + m * 190,
        "invoice_payment",
        prefix + "-20",
        null,
        "acc-main",
        false,
        { kind: "card", cardId: "card-nu" },
        prefix,
      );
      if (m < 10)
        add(
          `payment-inter-${m}`,
          "Pagamento Inter",
          5590,
          "invoice_payment",
          prefix + "-12",
          null,
          "acc-main",
          false,
          { kind: "card", cardId: "card-inter" },
          prefix,
        );
    }
  }
  add("coffee-now", "Café do bairro", 2850, "expense", "2026-11-11", "food");
  add(
    "freelance-now",
    "Estúdio Aurora · primeira entrega",
    210000,
    "income",
    "2026-11-10",
    "freelance",
    "acc-bank",
  );
  transactions[transactions.length - 1].projectId = "project-aurora";
  const installments = scheduleInstallments({
    totalAmount: cents(420000),
    installmentCount: 6,
    purchaseDate: localDate("2026-09-18"),
    cycle: cards[0],
  });
  for (const p of installments) {
    add(
      "install-" + p.number,
      "Notebook para o estúdio",
      p.amount,
      "expense",
      p.occurredOn,
      "tools",
      "card-nu",
      true,
      null,
      p.competence,
    );
    const tx = transactions.at(-1)!;
    transactions[transactions.length - 1] = {
      ...tx,
      state: p.occurredOn <= TODAY ? "confirmed" : "planned",
      source: "installment",
      installmentPlanId: "plan-notebook",
      installmentNumber: p.number,
    };
  }
  add(
    "pay-install-first",
    "Pagamento parcela anterior",
    70000,
    "invoice_payment",
    "2026-10-20",
    null,
    "acc-main",
    false,
    { kind: "card", cardId: "card-nu" },
    "2026-10",
  );
  const rule = (
    id: string,
    description: string,
    amount: number,
    day: number,
    categoryId: string,
    kind: "income" | "expense" = "expense",
    role: Recurrence["role"] = "standard",
    cardId: string | null = null,
  ): Recurrence => ({
    id,
    userId: "demo",
    description,
    amount: cents(amount),
    scheduleDay: day,
    categoryId,
    kind,
    role,
    accountId: cardId ? null : "acc-main",
    cardId,
    destinationAccountId: null,
    amountMode: "fixed",
    scheduleMode: "day_of_month",
    dayAdjustment: "next",
    interval: "monthly",
    startsOn: localDate("2026-11-01"),
    endsOn: null,
    isActive: true,
  });
  const recurrences = [
    rule(
      "rule-salary",
      "Salário · Estúdio Forma",
      688500,
      5,
      "salary",
      "income",
      "salary",
    ),
    rule("rule-rent", "Aluguel do apartamento", 195000, 6, "home"),
    rule("rule-internet", "Internet fibra", 11990, 15, "home"),
    rule("rule-energy", "Energia elétrica", 18200, 18, "home"),
    rule(
      "rule-spotify",
      "Spotify Premium",
      2190,
      17,
      "tools",
      "expense",
      "subscription",
      "card-nu",
    ),
    rule(
      "rule-adobe",
      "Adobe Creative Cloud",
      13900,
      22,
      "tools",
      "expense",
      "subscription",
      "card-nu",
    ),
  ];
  transactions[transactions.findIndex((t) => t.id === "salary-11")] = {
    ...transactions.find((t) => t.id === "salary-11")!,
    recurrenceId: "rule-salary",
  };
  transactions[transactions.findIndex((t) => t.id === "rent-11")] = {
    ...transactions.find((t) => t.id === "rent-11")!,
    recurrenceId: "rule-rent",
  };
  return {
    schemaVersion: 1,
    revision: 0,
    today: TODAY,
    profile: { name: "Alex Morgan", email: "alex@exemplo.test" },
    accounts,
    cards,
    categories,
    transactions,
    recurrences,
    budgets: [
      {
        id: "budget-food",
        categoryId: "food",
        limitCents: 180000,
        month: "2026-11",
      },
      {
        id: "budget-home",
        categoryId: "home",
        limitCents: 250000,
        month: "2026-11",
      },
      {
        id: "budget-leisure",
        categoryId: "leisure",
        limitCents: 50000,
        month: "2026-11",
      },
      {
        id: "budget-tools",
        categoryId: "tools",
        limitCents: 50000,
        month: "2026-11",
      },
    ],
    goals: [
      {
        id: "goal-reserve",
        name: "Reserva de emergência",
        targetCents: 4000000,
        accountId: "acc-reserve",
        dueOn: "2027-06-30",
      },
      {
        id: "goal-house",
        name: "Meu próximo capítulo",
        targetCents: 2500000,
        accountId: "acc-invest",
        dueOn: "2027-12-31",
      },
    ],
    trips: [
      {
        id: "trip-serra",
        name: "Um respiro na serra",
        destination: "Gramado, RS",
        startOn: "2026-12-18",
        endOn: "2026-12-22",
        budgetCents: 450000,
        currency: "BRL",
        archived: false,
      },
    ],
    projects: [
      {
        id: "project-aurora",
        name: "Identidade Aurora",
        client: "Estúdio Aurora",
        description: "Uma identidade visual para um novo começo.",
        amountCents: 480000,
        dueOn: "2026-11-25",
        status: "active",
        color: "#A367C4",
      },
      {
        id: "project-horta",
        name: "Site Horta & Casa",
        client: "Horta & Casa",
        description: "Um espaço digital para crescer.",
        amountCents: 620000,
        dueOn: "2026-12-10",
        status: "testing",
        color: "#6DBF65",
      },
      {
        id: "project-norte",
        name: "Coleção Norte",
        client: "Norte Design",
        description: "Direção de arte e catálogo da coleção.",
        amountCents: 350000,
        dueOn: "2026-11-18",
        status: "proposal",
        color: "#D99A40",
      },
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "project-aurora",
        title: "Finalizar apresentação da marca",
        dueOn: "2026-11-13",
        status: "doing",
        checklist: false,
      },
      {
        id: "task-2",
        projectId: "project-horta",
        title: "Revisar versão mobile",
        dueOn: "2026-11-15",
        status: "review",
        checklist: false,
      },
      {
        id: "task-3",
        projectId: "project-norte",
        title: "Aguardar referências do cliente",
        dueOn: "2026-11-10",
        status: "blocked",
        checklist: false,
      },
      {
        id: "task-4",
        projectId: "project-aurora",
        title: "Organizar arquivos de entrega",
        dueOn: "2026-11-24",
        status: "todo",
        checklist: false,
      },
      {
        id: "task-5",
        projectId: "project-horta",
        title: "Aprovar paleta de cores",
        dueOn: "2026-11-08",
        status: "done",
        checklist: true,
      },
    ],
    sessions: [
      {
        id: "session-1",
        projectId: "project-aurora",
        description: "Exploração visual",
        date: "2026-11-09",
        minutes: 180,
      },
      {
        id: "session-2",
        projectId: "project-horta",
        description: "Desenvolvimento",
        date: "2026-11-10",
        minutes: 240,
      },
    ],
    payments: [
      {
        id: "payment-1",
        projectId: "project-aurora",
        description: "Primeira entrega",
        dueOn: "2026-11-10",
        amountCents: 210000,
        transactionId: "freelance-now",
      },
      {
        id: "payment-2",
        projectId: "project-aurora",
        description: "Entrega final",
        dueOn: "2026-11-25",
        amountCents: 270000,
        transactionId: null,
      },
      {
        id: "payment-3",
        projectId: "project-horta",
        description: "Entrega do site",
        dueOn: "2026-12-10",
        amountCents: 620000,
        transactionId: null,
      },
    ],
    proposals: [
      {
        id: "proposal-1",
        projectId: "project-norte",
        title: "Direção de arte · Coleção Norte",
        amountCents: 350000,
        status: "sent",
      },
    ],
    documents: [],
    rewards: [
      {
        id: "reward-1",
        cardId: "card-nu",
        description: "Pontos acumulados",
        points: 8450,
        date: TODAY,
      },
    ],
    captures: [
      {
        id: "capture-1",
        description: "Padaria da esquina",
        amountCents: 3480,
        date: TODAY,
        status: "review",
        accountId: "acc-main",
        categoryId: "food",
      },
      {
        id: "capture-2",
        description: "Farmácia Central",
        amountCents: 8650,
        date: "2026-11-10",
        status: "review",
        accountId: "acc-main",
        categoryId: "health",
      },
    ],
    imports: [
      {
        id: "batch-example",
        name: "Extrato de exemplo.csv",
        accountId: "acc-main",
        confirmed: false,
        discarded: 0,
        rows: [
          {
            id: "import-example-1",
            description: "Livraria Horizonte",
            date: "2026-11-10",
            amountCents: -8900,
            fingerprint: "demo-example",
            duplicate: false,
            accepted: false,
            categoryId: "leisure",
          },
        ],
      },
    ],
    notifications: [
      {
        id: "notice-invoice",
        title: "Uma fatura merece atenção",
        body: "Confira as competências em aberto no Inter.",
        href: "/cartoes?cartao=card-inter",
        read: false,
      },
      {
        id: "notice-captures",
        title: "Duas capturas para revisar",
        body: "Confira antes de registrar no seu extrato.",
        href: "/automaticos",
        read: false,
      },
    ],
    conversations: [],
    devices: [
      { id: "device-demo", name: "Android de demonstração", active: true },
    ],
    integrations: { github: false, ai: false },
    captureRules: [],
  };
}
