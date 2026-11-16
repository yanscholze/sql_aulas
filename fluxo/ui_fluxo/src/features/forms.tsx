import { useState, useEffect, type FormEvent } from "react";
import { useBeforeUnload, useBlocker } from "react-router";
import { Button, Field, Modal, Notice } from "../design-system/ui";
import { useCommand, useDemo } from "../data/queries/use-demo";
import type { DemoState, FormCommand, Values } from "../data/contracts/models";
interface FormField {
  key: string;
  label: string;
  type?:
    | "text"
    | "money"
    | "date"
    | "month"
    | "number"
    | "email"
    | "color"
    | "textarea"
    | "select"
    | "checkbox";
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
}
export interface EditorSpec {
  type: FormCommand;
  title: string;
  id?: string;
  initial?: Values;
}
function fieldsFor(type: FormCommand, s: DemoState): FormField[] {
  const accounts = s.accounts
    .filter((a) => !a.archivedAt)
    .map((a) => ({ value: a.id, label: a.name }));
  const origins = [
    ...s.accounts
      .filter((a) => !a.archivedAt)
      .map((a) => ({ value: "account:" + a.id, label: a.name })),
    ...s.cards
      .filter((c) => !c.archived)
      .map((c) => ({ value: "card:" + c.id, label: c.name + " · crédito" })),
  ];
  const categories = s.categories.map((c) => ({ value: c.id, label: c.name }));
  const projects = s.projects.map((p) => ({ value: p.id, label: p.name }));
  const text = (key: string, label: string, required = true): FormField => ({
    key,
    label,
    required,
  });
  const amount = (key = "amount", label = "Valor (R$)"): FormField => ({
    key,
    label,
    type: "money",
    required: true,
  });
  const select = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
  ): FormField => ({ key, label, type: "select", options, required: true });
  const date = (key = "date", label = "Data"): FormField => ({
    key,
    label,
    type: "date",
    required: true,
  });
  switch (type) {
    case "transaction.save":
      return [
        select("kind", "Tipo", [
          { value: "expense", label: "Despesa" },
          { value: "income", label: "Receita" },
          { value: "transfer", label: "Transferência" },
          { value: "refund", label: "Estorno" },
        ]),
        text("description", "Descrição"),
        amount(),
        date(),
        select("origin", "Conta ou cartão", origins),
        {
          ...select("destination", "Conta de destino", accounts),
          required: false,
        },
        select("categoryId", "Categoria", [
          { value: "", label: "Sem categoria" },
          ...categories,
        ]),
        select("state", "Situação", [
          { value: "confirmed", label: "Confirmado" },
          { value: "planned", label: "Previsto" },
        ]),
        {
          key: "installments",
          label: "Parcelas (somente nova compra no crédito)",
          type: "number",
          hint: "O total será distribuído sem perder centavos.",
        },
        {
          ...select("tripId", "Viagem", [
            { value: "", label: "Nenhuma" },
            ...s.trips
              .filter((t) => !t.archived)
              .map((t) => ({ value: t.id, label: t.name })),
          ]),
          required: false,
        },
        { key: "notes", label: "Observações", type: "textarea" },
      ];
    case "account.save":
      return [
        text("name", "Nome da conta"),
        text("institution", "Instituição"),
        select("kind", "Tipo", [
          { value: "checking", label: "Conta corrente" },
          { value: "cash", label: "Dinheiro" },
          { value: "benefit", label: "Benefício" },
          { value: "investment", label: "Investimento" },
          { value: "savings", label: "Poupança" },
        ]),
        select(
          "currency",
          "Moeda",
          ["BRL", "USD", "EUR", "GBP", "ARS", "CAD", "JPY", "CHF"].map(
            (value) => ({ value, label: value }),
          ),
        ),
        amount("openingBalance", "Saldo inicial"),
        {
          key: "includeInTotals",
          label: "Incluir nos totais",
          type: "checkbox",
        },
        { key: "color", label: "Cor", type: "color" },
      ];
    case "card.save":
      return [
        text("name", "Nome do cartão"),
        text("last4", "Últimos quatro dígitos"),
        amount("limit", "Limite (R$)"),
        {
          key: "closingDay",
          label: "Dia de fechamento",
          type: "number",
          required: true,
        },
        {
          key: "dueDay",
          label: "Dia de vencimento",
          type: "number",
          required: true,
        },
        { key: "color", label: "Cor", type: "color" },
      ];
    case "recurrence.save":
      return [
        text("description", "Descrição"),
        amount(),
        select("kind", "Tipo", [
          { value: "expense", label: "Despesa" },
          { value: "income", label: "Receita" },
        ]),
        select("origin", "Conta ou cartão", origins),
        select("categoryId", "Categoria", categories),
        { key: "day", label: "Dia do mês", type: "number", required: true },
        date("startsOn", "Início"),
        {
          key: "role",
          label: "Classificação",
          type: "select",
          options: [
            { value: "standard", label: "Recorrência" },
            { value: "subscription", label: "Assinatura" },
          ],
        },
      ];
    case "budget.save":
      return [
        select(
          "categoryId",
          "Categoria",
          s.categories
            .filter((c) => c.kind === "expense")
            .map((c) => ({ value: c.id, label: c.name })),
        ),
        amount("limit", "Limite mensal (R$)"),
        { key: "month", label: "Competência", type: "month", required: true },
      ];
    case "goal.save":
      return [
        text("name", "Nome da meta"),
        amount("target", "Objetivo (R$)"),
        select("accountId", "Conta vinculada", accounts),
        date("dueOn", "Prazo"),
      ];
    case "trip.save":
      return [
        text("name", "Nome da viagem"),
        text("destination", "Destino"),
        date("startOn", "Ida"),
        date("endOn", "Volta"),
        select(
          "currency",
          "Moeda",
          ["BRL", "USD", "EUR"].map((value) => ({ value, label: value })),
        ),
        amount("budget", "Orçamento na moeda escolhida"),
      ];
    case "project.save":
      return [
        text("name", "Nome do projeto"),
        text("client", "Cliente"),
        amount("amount", "Valor contratado (R$)"),
        date("dueOn", "Prazo"),
        { key: "description", label: "Descrição", type: "textarea" },
        { key: "color", label: "Cor", type: "color" },
      ];
    case "task.save":
      return [
        select("projectId", "Projeto", projects),
        text("title", "Tarefa"),
        date("dueOn", "Prazo"),
        { key: "checklist", label: "Item de checklist", type: "checkbox" },
      ];
    case "session.save":
      return [
        select("projectId", "Projeto", projects),
        text("description", "Atividade"),
        date(),
        {
          key: "minutes",
          label: "Duração em minutos",
          type: "number",
          required: true,
        },
      ];
    case "payment.save":
      return [
        select("projectId", "Projeto", projects),
        text("description", "Descrição da cobrança"),
        amount(),
        date("dueOn", "Vencimento"),
      ];
    case "proposal.save":
      return [
        select("projectId", "Projeto", projects),
        text("title", "Título da proposta"),
        amount(),
        select("status", "Situação", [
          { value: "draft", label: "Rascunho" },
          { value: "sent", label: "Enviada (demo)" },
          { value: "accepted", label: "Aceita (demo)" },
        ]),
      ];
    case "category.save":
      return [
        text("name", "Nome"),
        select("kind", "Tipo", [
          { value: "expense", label: "Despesa" },
          { value: "income", label: "Receita" },
        ]),
        { key: "color", label: "Cor", type: "color" },
        { key: "essential", label: "Despesa essencial", type: "checkbox" },
        {
          key: "excluded",
          label: "Excluir do cálculo de livre para gastar",
          type: "checkbox",
        },
      ];
    case "reward.save":
      return [
        select(
          "cardId",
          "Cartão",
          s.cards.map((c) => ({ value: c.id, label: c.name })),
        ),
        select("kind", "Operação", [
          { value: "earn", label: "Adicionar pontos" },
          { value: "redeem", label: "Resgatar pontos" },
        ]),
        text("description", "Descrição"),
        { key: "points", label: "Pontos", type: "number", required: true },
      ];
    case "profile.save":
      return [
        text("name", "Nome"),
        {
          key: "email",
          label: "E-mail fictício",
          type: "email",
          required: true,
        },
      ];
    case "capture.save":
      return [
        text("description", "Descrição"),
        amount(),
        select("accountId", "Conta", accounts),
        select("categoryId", "Categoria", categories),
      ];
    case "capture-rule.save":
      return [
        text("match", "Texto a reconhecer"),
        select("categoryId", "Categoria sugerida", categories),
      ];
  }
}
export function Editor({
  spec,
  onClose,
  onSaved,
}: {
  spec: EditorSpec;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { state } = useDemo();
  const command = useCommand();
  const defaults: Values = {
    date: state!.today,
    startsOn: state!.today,
    dueOn: state!.today,
    month: state!.today.slice(0, 7),
    kind: "expense",
    state: "confirmed",
    origin: "account:acc-main",
    categoryId: "food",
    installments: "1",
    includeInTotals: "true",
    currency: "BRL",
    color: "#6DBF65",
    ...spec.initial,
  };
  const [values, setValues] = useState(defaults),
    [dirty, setDirty] = useState(false);
  const blocker = useBlocker(dirty && !command.isPending);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("Descartar as alterações deste formulário?"))
        blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useBeforeUnload((event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  const close = () => {
    if (!dirty || window.confirm("Descartar as alterações deste formulário?"))
      onClose();
  };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (command.isPending) return;
    try {
      await command.mutateAsync({ type: spec.type, values, id: spec.id });
      setDirty(false);
      onSaved?.();
      onClose();
    } catch {
      /* error rendered below */
    }
  }
  return (
    <Modal open onClose={close} title={spec.title} wide>
      <form onSubmit={save} className="editor-form">
        <div className="form-grid">
          {fieldsFor(spec.type, state!)
            .filter(
              (f) =>
                !(
                  spec.type === "transaction.save" &&
                  f.key === "destination" &&
                  values.kind !== "transfer"
                ) &&
                !(
                  spec.type === "transaction.save" &&
                  ["categoryId", "installments"].includes(f.key) &&
                  values.kind === "transfer"
                ) &&
                !(spec.id && f.key === "installments"),
            )
            .map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                {f.type === "select" ? (
                  <select
                    value={values[f.key] ?? ""}
                    required={f.required}
                    onChange={(e) => {
                      setValues({ ...values, [f.key]: e.target.value });
                      setDirty(true);
                    }}
                  >
                    <option value="" disabled={f.required}>
                      Selecione
                    </option>
                    {f.options!.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={values[f.key] ?? ""}
                    rows={3}
                    onChange={(e) => {
                      setValues({ ...values, [f.key]: e.target.value });
                      setDirty(true);
                    }}
                  />
                ) : f.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={values[f.key] === "true"}
                    onChange={(e) => {
                      setValues({
                        ...values,
                        [f.key]: String(e.target.checked),
                      });
                      setDirty(true);
                    }}
                  />
                ) : (
                  <input
                    type={f.type === "money" ? "text" : (f.type ?? "text")}
                    inputMode={f.type === "money" ? "decimal" : undefined}
                    value={values[f.key] ?? ""}
                    required={f.required}
                    min={f.type === "number" ? 1 : undefined}
                    onChange={(e) => {
                      setValues({ ...values, [f.key]: e.target.value });
                      setDirty(true);
                    }}
                  />
                )}
              </Field>
            ))}
        </div>
        {command.error && <Notice tone="error">{command.error.message}</Notice>}
        <div className="dialog-actions">
          <Button type="button" variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" busy={command.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
