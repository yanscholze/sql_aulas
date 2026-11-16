import { useSearchParams } from "react-router";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { filteredEntries } from "../data/demo/selectors";
import { useApp } from "../app/context";
import {
  Card,
  PageHeading,
  Button,
  Empty,
  Badge,
  Confirm,
  IconButton,
} from "../design-system/ui";
import { QuerySearch, QuerySelect } from "./common";
import {
  csvCell,
  dateLabel,
  downloadFile,
  inputMoney,
  money,
} from "../shared/format";
import type { Entry } from "../data/contracts/models";
export default function Transactions() {
  const { state: s } = useDemo();
  const { edit } = useApp();
  const command = useCommand();
  const [params, setParams] = useSearchParams();
  if (!s) return null;
  const rows = filteredEntries(s, params);
  const size = params.get("limite") === "50" ? 50 : 25;
  const page = Math.max(
    1,
    Math.min(
      Math.ceil(rows.length / size) || 1,
      Number(params.get("pagina")) || 1,
    ),
  );
  const displayed = rows.slice((page - 1) * size, page * size);
  const origin = (t: Entry) =>
    t.origin.kind === "account"
      ? s.accounts.find(
          (a) => t.origin.kind === "account" && a.id === t.origin.accountId,
        )?.name
      : s.cards.find(
          (c) => t.origin.kind === "card" && c.id === t.origin.cardId,
        )?.name;
  const editTx = (t: Entry) =>
    edit({
      type: "transaction.save",
      title: "Editar lançamento",
      id: t.id,
      initial: {
        kind: t.kind,
        description: t.description,
        amount: inputMoney(t.amount),
        date: t.occurredOn,
        origin:
          t.origin.kind === "account"
            ? "account:" + t.origin.accountId
            : "card:" + t.origin.cardId,
        destination:
          t.destination?.kind === "account" ? t.destination.accountId : "",
        categoryId: t.categoryId || "",
        state: t.state,
        tripId: t.tripId || "",
        notes: t.notes || "",
      },
    });
  return (
    <>
      <PageHeading
        title="Cada movimento conta."
        description="O que entrou, o que saiu e o que está por vir."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                downloadFile(
                  "fluxo-lancamentos.csv",
                  "\uFEFF" +
                    [
                      [
                        "Data",
                        "Descrição",
                        "Tipo",
                        "Valor",
                        "Moeda",
                        "Situação",
                      ],
                      ...rows.map((t) => [
                        t.occurredOn,
                        t.description,
                        t.kind,
                        inputMoney(t.amount),
                        t.currency,
                        t.state,
                      ]),
                    ]
                      .map((r) => r.map(csvCell).join(";"))
                      .join("\n"),
                  "text/csv;charset=utf-8",
                )
              }
            >
              <Download size={16} />
              Exportar
            </Button>
            <Button
              onClick={() =>
                edit({ type: "transaction.save", title: "Novo lançamento" })
              }
            >
              <Plus size={17} />
              Novo lançamento
            </Button>
          </>
        }
      />
      <Card>
        <div className="toolbar">
          <QuerySearch placeholder="Buscar lançamento" />
          <label className="filter-select">
            <span className="sr-only">Competência</span>
            <input
              aria-label="Competência"
              type="month"
              value={params.get("mes") ?? ""}
              onChange={(e) => {
                const n = new URLSearchParams(params);
                if (e.target.value) n.set("mes", e.target.value);
                else n.delete("mes");
                n.delete("pagina");
                setParams(n);
              }}
            />
          </label>
          <QuerySelect
            name="conta"
            label="Conta"
            options={[
              { value: "", label: "Todas as contas" },
              ...s.accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
          <QuerySelect
            name="categoria"
            label="Categoria"
            options={[
              { value: "", label: "Todas as categorias" },
              ...s.categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <QuerySelect
            name="tipo"
            label="Tipo"
            options={[
              { value: "", label: "Todos os tipos" },
              { value: "expense", label: "Despesas" },
              { value: "income", label: "Receitas" },
              { value: "transfer", label: "Transferências" },
              { value: "invoice_payment", label: "Faturas" },
              { value: "refund", label: "Estornos" },
            ]}
          />
          <QuerySelect
            name="estado"
            label="Situação"
            options={[
              { value: "", label: "Todas as situações" },
              { value: "confirmed", label: "Confirmados" },
              { value: "planned", label: "Previstos" },
            ]}
          />
          <QuerySelect
            name="ordem"
            label="Ordenar"
            options={[
              { value: "", label: "Mais recentes" },
              { value: "valor", label: "Maior valor" },
            ]}
          />
          <Button variant="ghost" onClick={() => setParams({})}>
            Limpar
          </Button>
        </div>
        {!rows.length ? (
          <Empty
            title="Nenhum lançamento encontrado"
            description="Experimente outro filtro ou registre seu primeiro movimento."
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Lançamentos financeiros</caption>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Conta / cartão</th>
                    <th>Categoria</th>
                    <th>Data</th>
                    <th>Situação</th>
                    <th className="right">Valor</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <strong>{t.description}</strong>
                        <small>
                          {t.kind === "transfer"
                            ? "Transferência"
                            : t.kind === "invoice_payment"
                              ? "Pagamento de fatura"
                              : t.kind === "income"
                                ? "Receita"
                                : t.kind === "refund"
                                  ? "Estorno"
                                  : "Despesa"}
                          {t.installmentNumber
                            ? ` · parcela ${t.installmentNumber}`
                            : ""}
                        </small>
                      </td>
                      <td>{origin(t)}</td>
                      <td>
                        {s.categories.find((c) => c.id === t.categoryId)
                          ?.name ?? "—"}
                      </td>
                      <td className="nowrap">{dateLabel(t.occurredOn)}</td>
                      <td>
                        <Badge
                          tone={
                            t.state === "confirmed" ? "positive" : "warning"
                          }
                        >
                          {t.state === "confirmed" ? "Confirmado" : "Previsto"}
                        </Badge>
                      </td>
                      <td
                        className={`right amount ${t.kind === "income" ? "positive" : ""}`}
                      >
                        {t.kind === "income"
                          ? "+ "
                          : t.kind === "expense"
                            ? "− "
                            : ""}
                        {money(t.amount, t.currency)}
                      </td>
                      <td>
                        {t.kind !== "invoice_payment" && (
                          <div className="row-actions">
                            <IconButton
                              label={"Editar " + t.description}
                              onClick={() => editTx(t)}
                            >
                              <Pencil size={15} />
                            </IconButton>
                            <Confirm
                              label={"Excluir " + t.description}
                              title="Excluir lançamento?"
                              description="O saldo e os indicadores da demonstração serão recalculados."
                              onConfirm={() =>
                                command.mutateAsync({
                                  type: "transaction.delete",
                                  id: t.id,
                                })
                              }
                              danger
                            >
                              <Trash2 size={15} />
                            </Confirm>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                {rows.length} lançamentos · página {page} de{" "}
                {Math.max(1, Math.ceil(rows.length / size))}
              </span>
              <QuerySelect
                name="limite"
                label="Registros por página"
                defaultValue="25"
                options={[
                  { value: "25", label: "25 por página" },
                  { value: "50", label: "50 por página" },
                ]}
              />
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => {
                  const n = new URLSearchParams(params);
                  n.set("pagina", String(page - 1));
                  setParams(n);
                }}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={page * size >= rows.length}
                onClick={() => {
                  const n = new URLSearchParams(params);
                  n.set("pagina", String(page + 1));
                  setParams(n);
                }}
              >
                Próxima
              </Button>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
