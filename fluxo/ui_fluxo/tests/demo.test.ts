import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { seed } from "../src/data/demo/seed";
import { applyCommand } from "../src/data/demo/commands";
import { derived, filteredEntries } from "../src/data/demo/selectors";
import { dispatch, loadDemo } from "../src/data/demo/storage";
import { domain, monotone } from "../src/charts/geometry";
import type { DemoState, Values } from "../src/data/contracts/models";
let state: DemoState;
beforeEach(() => {
  state = seed();
});
const expense = (extra: Values = {}) => ({
  type: "transaction.save" as const,
  values: {
    kind: "expense",
    description: "Teste de interface",
    amount: "100,01",
    date: "2026-11-11",
    origin: "account:acc-main",
    categoryId: "food",
    ...extra,
  },
});
describe("demonstração financeira", () => {
  it("seed é determinístico e todos os valores derivados são finitos", () => {
    expect(seed()).toEqual(state);
    const v = derived(state);
    expect(Number.isFinite(v.position.freeToSpend.amount)).toBe(true);
    expect(v.historical).toHaveLength(12);
  });
  it("receita muda conta e resultados", () => {
    const before = derived(state);
    const after = derived(
      applyCommand(state, expense({ kind: "income", categoryId: "salary" })),
    );
    expect(after.position.currentBalance - before.position.currentBalance).toBe(
      10001,
    );
    expect(after.monthFlow.income - before.monthFlow.income).toBe(10001);
  });
  it("crédito aumenta fatura sem mover saldo de conta", () => {
    const before = derived(state);
    const after = derived(
      applyCommand(state, expense({ origin: "card:card-nu" })),
    );
    expect(after.position.currentBalance).toBe(before.position.currentBalance);
    expect(
      after.cards[0].invoice.outstanding - before.cards[0].invoice.outstanding,
    ).toBe(10001);
  });
  it("pagamento reduz dívida e conta sem repetir despesa", () => {
    const before = derived(state);
    const after = derived(
      applyCommand(state, {
        type: "invoice.pay",
        cardId: "card-nu",
        competence: before.cards[0].competence,
        accountId: "acc-main",
        amountCents: 10000,
      }),
    );
    expect(after.position.currentBalance).toBe(
      before.position.currentBalance - 10000,
    );
    expect(after.cards[0].invoice.outstanding).toBe(
      before.cards[0].invoice.outstanding - 10000,
    );
    expect(after.monthFlow.expense).toBe(before.monthFlow.expense);
  });
  it("recusa pagamento maior que dívida sem mutar estado", () => {
    const original = structuredClone(state);
    expect(() =>
      applyCommand(state, {
        type: "invoice.pay",
        cardId: "card-nu",
        competence: "2026-11",
        accountId: "acc-main",
        amountCents: 999999999,
      }),
    ).toThrow();
    expect(state).toEqual(original);
  });
  it("transferência entre contas não cria receita ou despesa", () => {
    const before = derived(state);
    const after = derived(
      applyCommand(
        state,
        expense({ kind: "transfer", destination: "acc-bank" }),
      ),
    );
    expect(after.position.totalAssets).toBe(before.position.totalAssets);
    expect(after.monthFlow).toEqual(before.monthFlow);
  });
  it("projeção nunca altera o saldo atual", () => {
    const before = derived(state);
    const after = derived(applyCommand(state, expense({ state: "planned" })));
    expect(after.position.currentBalance).toBe(before.position.currentBalance);
    expect(after.position.committed).toBeGreaterThan(before.position.committed);
  });
  it("fechamento altera a competência de uma compra posterior", () => {
    const a = applyCommand(
      state,
      expense({ origin: "card:card-nu", date: "2026-11-14" }),
    );
    expect(a.transactions.at(-1)!.competence).toBe("2026-12");
  });
  it("parcelamento mantém a soma exata", () => {
    const next = applyCommand(
      state,
      expense({ origin: "card:card-nu", installments: "3" }),
    );
    const rows = next.transactions.slice(state.transactions.length);
    expect(rows).toHaveLength(3);
    expect(rows.reduce((a, t) => a + t.amount, 0)).toBe(10001);
  });
  it("confirmação repetida não duplica recorrência", () => {
    const next = applyCommand(state, {
      type: "recurrence.confirm",
      id: "rule-internet",
      month: "2026-11",
    });
    expect(() =>
      applyCommand(next, {
        type: "recurrence.confirm",
        id: "rule-internet",
        month: "2026-11",
      }),
    ).toThrow(/já foi/);
  });
  it("editar e excluir atualizam saldo", () => {
    let next = applyCommand(state, expense());
    const id = next.transactions.at(-1)!.id;
    next = applyCommand(next, { ...expense({ amount: "200,02" }), id });
    expect(derived(next).position.currentBalance).toBe(
      derived(state).position.currentBalance - 20002,
    );
    next = applyCommand(next, { type: "transaction.delete", id });
    expect(derived(next).position.currentBalance).toBe(
      derived(state).position.currentBalance,
    );
  });
  it("política de exclusão atua na folga sem esconder despesa", () => {
    const before = derived(state);
    const next = applyCommand(state, {
      type: "category.save",
      id: "tools",
      values: {
        name: "Assinaturas",
        kind: "expense",
        color: "#7497B7",
        excluded: "true",
        essential: "false",
      },
    });
    const after = derived(next);
    expect(after.position.freeToSpend.amount).toBeGreaterThan(
      before.position.freeToSpend.amount,
    );
    expect(after.monthFlow.expense).toBe(before.monthFlow.expense);
  });
  it("captura só move saldo após confirmação", () => {
    const before = derived(state);
    const after = derived(
      applyCommand(state, {
        type: "capture.resolve",
        id: "capture-1",
        accept: true,
      }),
    );
    expect(after.position.currentBalance).toBe(
      before.position.currentBalance - 3480,
    );
  });
  it("confirma lote uma vez e ignora duplicatas", () => {
    const batch = state.imports[0];
    const next = applyCommand(state, {
      type: "import.confirm",
      id: batch.id,
      selected: [batch.rows[0].id],
    });
    expect(next.transactions).toHaveLength(state.transactions.length + 1);
    expect(() =>
      applyCommand(next, {
        type: "import.confirm",
        id: batch.id,
        selected: [batch.rows[0].id],
      }),
    ).toThrow();
  });
  it("conta em dólar fica fora dos totais em reais", () => {
    const next = applyCommand(state, {
      type: "account.save",
      values: {
        name: "Dólares",
        kind: "checking",
        currency: "USD",
        openingBalance: "10000",
        includeInTotals: "true",
      },
    });
    expect(derived(next).position.totalAssets).toBe(
      derived(state).position.totalAssets,
    );
  });
  it("consultas respeitam filtros combinados", () => {
    const rows = filteredEntries(
      state,
      new URLSearchParams("mes=2026-11&categoria=food&tipo=expense"),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every(
        (t) =>
          t.competence === "2026-11" &&
          t.categoryId === "food" &&
          t.kind === "expense",
      ),
    ).toBe(true);
  });
  it("uma gravação inválida não altera a base", () => {
    const original = structuredClone(state);
    expect(() => applyCommand(state, expense({ amount: "-1" }))).toThrow();
    expect(state).toEqual(original);
  });
  it("persistência serializa alterações concorrentes sem perda", async () => {
    await dispatch({ type: "demo.reset" });
    const before = await loadDemo();
    await Promise.all([
      dispatch(expense({ amount: "10" })),
      dispatch(expense({ amount: "20" })),
    ]);
    const next = await loadDemo();
    expect(next.revision).toBe(before.revision + 2);
    expect(next.transactions).toHaveLength(before.transactions.length + 2);
  });
  it("falha de comando não é persistida", async () => {
    const before = await loadDemo();
    await expect(dispatch(expense({ amount: "invalido" }))).rejects.toThrow();
    expect((await loadDemo()).revision).toBe(before.revision);
  });
});
describe("gráficos", () => {
  it("escala cobre valores negativos e séries vazias", () => {
    const d = domain([-100, 20]);
    expect(d.min).toBeLessThan(-100);
    expect(d.max).toBeGreaterThan(20);
    expect(domain([]).range).toBeGreaterThan(0);
  });
  it("curva preserva pontos e não adiciona máximos", () => {
    expect(
      monotone([
        { x: 0, y: 10 },
        { x: 100, y: 40 },
      ]),
    ).toBe("M0,10 C33.333333333333336,10 66.66666666666666,40 100,40");
    expect(monotone([])).toBe("");
  });
});
