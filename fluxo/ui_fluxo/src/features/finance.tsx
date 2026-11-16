import { useState } from "react";
import { useLocation, useSearchParams, Link } from "react-router";
import {
  Plus,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  Pencil,
  Archive,
  CalendarDays,
  Repeat,
  Check,
  ChevronRight,
} from "lucide-react";
import {
  PageHeading,
  Card,
  Metric,
  Button,
  Badge,
  Progress,
  Field,
  Confirm,
  Empty,
  Notice,
  IconButton,
} from "../design-system/ui";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { useApp } from "../app/context";
import {
  money,
  inputMoney,
  readMoney,
  dateLabel,
  monthLabel,
} from "../shared/format";
import { ActionDialog } from "./action-dialog";
import {
  AreaTabs,
  planningTabs,
  TransactionRows,
  QuerySearch,
  QuerySelect,
} from "./common";
import { Donut, LineChart } from "../charts/charts";
import { anticipation } from "../data/demo/commands";
import type { Account } from "../data/contracts/models";
export default function Finance() {
  const { pathname } = useLocation();
  if (pathname === "/contas") return <Accounts />;
  if (pathname === "/cartoes") return <Cards />;
  if (pathname === "/recompensas") return <Rewards />;
  if (pathname === "/orcamentos") return <Budgets />;
  return <Planning />;
}
function Accounts() {
  const { state: s, view: v } = useDemo();
  const { edit } = useApp();
  const cmd = useCommand();
  const [reconcile, setReconcile] = useState<Account | null>(null);
  const [params] = useSearchParams();
  if (!s || !v) return null;
  const accounts = v.accounts.filter(
    (a) =>
      !a.archivedAt &&
      a.name.toLowerCase().includes((params.get("q") ?? "").toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Um lugar para cada plano."
        description="Suas contas, reservas e saldos. Sempre em perspectiva."
        action={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                edit({
                  type: "transaction.save",
                  title: "Transferir entre contas",
                  initial: { kind: "transfer" },
                })
              }
            >
              <ArrowLeftRight size={16} />
              Transferir
            </Button>
            <Button
              onClick={() =>
                edit({
                  type: "account.save",
                  title: "Nova conta",
                  initial: { kind: "checking", openingBalance: "0" },
                })
              }
            >
              <Plus size={17} />
              Nova conta
            </Button>
          </>
        }
      />
      <div className="metric-grid three">
        <Metric
          label="Saldo atual"
          value={v.position.currentBalance}
          hint="Contas de uso diário em reais"
          icon={<Wallet size={16} />}
        />
        <Metric
          label="Guardado e investido"
          value={v.position.investments}
          hint="Reservas e planos de longo prazo"
          icon={<Landmark size={16} />}
          color="#315D99"
        />
        <Metric
          label="Ativos totais"
          value={v.position.totalAssets}
          hint="Antes de descontar as dívidas"
          icon={<ArrowUpRight size={16} />}
          color="#A367C4"
        />
      </div>
      <div className="toolbar">
        <QuerySearch placeholder="Buscar conta" />
      </div>
      <div className="catalog-layout">
        <div className="catalog-grid">
          {accounts.map((a, i) => (
            <Card className="account-card" key={a.id} index={i}>
              <div className="catalog-top">
                <span
                  className="entity-symbol"
                  style={{ color: a.color, background: a.color + "18" }}
                >
                  <Landmark size={21} />
                </span>
                <Badge>
                  {a.kind === "investment"
                    ? "Investimento"
                    : a.kind === "benefit"
                      ? "Benefício"
                      : "Conta"}
                </Badge>
              </div>
              <h2>{a.name}</h2>
              <p>{a.institution}</p>
              <strong className="catalog-value">
                {money(a.balanceCents, a.currency)}
              </strong>
              <small>Saldo em 11 de novembro</small>
              <div className="catalog-actions">
                <Button
                  variant="ghost"
                  onClick={() =>
                    edit({
                      type: "account.save",
                      title: "Editar conta",
                      id: a.id,
                      initial: {
                        name: a.name,
                        institution: a.institution,
                        kind: a.kind,
                        currency: a.currency,
                        openingBalance: inputMoney(a.openingBalance),
                        color: a.color,
                        includeInTotals: String(a.includeInTotals),
                      },
                    })
                  }
                >
                  <Pencil size={14} />
                  Editar
                </Button>
                <Button variant="ghost" onClick={() => setReconcile(a)}>
                  Conferir saldo
                </Button>
                <Confirm
                  label={"Arquivar " + a.name}
                  title="Arquivar conta?"
                  description="Contas protegidas ou com saldo não podem ser arquivadas."
                  onConfirm={() =>
                    cmd.mutateAsync({ type: "account.archive", id: a.id })
                  }
                >
                  <Archive size={14} />
                </Confirm>
              </div>
            </Card>
          ))}
        </div>
        <Card title="Seu dinheiro distribuído" subtitle="Contas em reais">
          <Donut
            slices={v.accounts
              .filter(
                (a) =>
                  !a.archivedAt && a.currency === "BRL" && a.balanceCents > 0,
              )
              .map((a) => ({
                name: a.name,
                value: a.balanceCents,
                color: a.color,
              }))}
          />
          <Notice>
            Valores em outras moedas ficam fora dos totais em reais.
          </Notice>
        </Card>
      </div>
      {!accounts.length && <Empty />}
      {reconcile && (
        <ActionDialog
          title="Conferir saldo"
          description="Ajuste o saldo inicial da demonstração para conciliar o saldo observado."
          onClose={() => setReconcile(null)}
          onSubmit={(f) =>
            cmd.mutateAsync({
              type: "account.reconcile",
              id: reconcile.id,
              balanceCents: readMoney(String(f.get("balance"))),
            })
          }
        >
          <Field label="Saldo conferido">
            <input
              name="balance"
              inputMode="decimal"
              required
              defaultValue={inputMoney(
                v.accounts.find((a) => a.id === reconcile.id)!.balanceCents,
              )}
            />
          </Field>
        </ActionDialog>
      )}
    </>
  );
}
function Cards() {
  const { state: s, view: v } = useDemo();
  const { edit } = useApp();
  const cmd = useCommand();
  const [params, setParams] = useSearchParams();
  const [pay, setPay] = useState(false);
  if (!s || !v) return null;
  const cards = v.cards.filter((c) => !c.archived);
  const card = cards.find((c) => c.id === params.get("cartao")) ?? cards[0];
  if (!card)
    return (
      <>
        <PageHeading
          title="Cartões e faturas"
          description="Separe o que comprou do que já pagou."
          action={
            <Button
              onClick={() => edit({ type: "card.save", title: "Novo cartão" })}
            >
              Novo cartão
            </Button>
          }
        />
        <Empty />
      </>
    );
  const competence = params.get("competencia") ?? card.competence;
  const invoice = card.invoices.find((i) => i.competence === competence) ?? {
    outstanding: 0,
    charges: 0,
    payments: 0,
    dueOn: s.today,
  };
  const rows = s.transactions.filter(
    (t) =>
      ((t.origin.kind === "card" && t.origin.cardId === card.id) ||
        (t.destination?.kind === "card" && t.destination.cardId === card.id)) &&
      t.competence === competence,
  );
  return (
    <>
      <PageHeading
        title="No crédito. Sob controle."
        description="Cada compra na sua fatura, cada pagamento no lugar certo."
        action={
          <Button
            onClick={() => edit({ type: "card.save", title: "Novo cartão" })}
          >
            <Plus size={17} />
            Novo cartão
          </Button>
        }
      />
      <div className="credit-layout">
        <Card className="credit-selector">
          <div
            className="credit-face"
            style={{
              background: `linear-gradient(130deg, ${card.color}, #273E48)`,
            }}
          >
            <span>
              fluxo <CreditCard size={24} />
            </span>
            <div className="chip" />
            <strong>{card.name}</strong>
            <b>•••• &nbsp; •••• &nbsp; •••• &nbsp; {card.last4}</b>
            <small>
              {s.profile.name.toUpperCase()} <span>mastercard</span>
            </small>
          </div>
          <div className="credit-picker">
            {cards.map((c) => (
              <button
                key={c.id}
                className={c.id === card.id ? "active" : ""}
                onClick={() => {
                  setParams({ cartao: c.id });
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="catalog-actions">
            <Button
              variant="ghost"
              onClick={() =>
                edit({
                  type: "card.save",
                  title: "Editar cartão",
                  id: card.id,
                  initial: {
                    name: card.name,
                    last4: card.last4,
                    closingDay: String(card.closingDay),
                    dueDay: String(card.dueDay),
                    limit: inputMoney(card.limitCents),
                    color: card.color,
                  },
                })
              }
            >
              <Pencil size={14} />
              Editar
            </Button>
            <Confirm
              label="Arquivar cartão"
              title="Arquivar cartão?"
              description="É necessário quitar todas as competências antes de arquivar."
              onConfirm={() =>
                cmd.mutateAsync({ type: "card.archive", id: card.id })
              }
            >
              <Archive size={14} />
              Arquivar
            </Confirm>
            <Link className="text-link" to="/recompensas">
              Meus pontos <ChevronRight size={14} />
            </Link>
          </div>
        </Card>
        <Card
          title="Sua fatura"
          subtitle="Selecione a competência para conferir"
        >
          <label className="field">
            <span>Competência da fatura</span>
            <select
              value={competence}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                next.set("cartao", card.id);
                next.set("competencia", e.target.value);
                setParams(next);
              }}
            >
              {[
                ...new Set([
                  ...card.invoices.map((i) => i.competence),
                  card.competence,
                ]),
              ]
                .sort()
                .reverse()
                .map((c) => (
                  <option key={c} value={c}>
                    {monthLabel(c)}
                  </option>
                ))}
            </select>
          </label>
          <strong className="hero-value">{money(invoice.outstanding)}</strong>
          <Badge
            tone={
              invoice.outstanding === 0
                ? "positive"
                : invoice.dueOn < s.today
                  ? "negative"
                  : "warning"
            }
          >
            {invoice.outstanding === 0
              ? "Sem valor em aberto"
              : invoice.dueOn < s.today
                ? "Fatura vencida"
                : "Em aberto"}
          </Badge>
          <div className="key-values">
            <div>
              <span>Compras da competência</span>
              <b>{money(invoice.charges)}</b>
            </div>
            <div>
              <span>Pagamentos e créditos</span>
              <b>{money(invoice.payments)}</b>
            </div>
            <div>
              <span>Vencimento</span>
              <b>{dateLabel(invoice.dueOn)}</b>
            </div>
            <div>
              <span>Limite disponível</span>
              <b>{money(card.availableCents)}</b>
            </div>
          </div>
          <Progress
            value={card.limitCents - card.availableCents}
            total={card.limitCents}
            color={card.color}
            label="Limite utilizado"
          />
          <Button
            disabled={invoice.outstanding === 0}
            onClick={() => setPay(true)}
          >
            Simular pagamento <ArrowUpRight size={16} />
          </Button>
        </Card>
      </div>
      <Card
        title="Movimentos desta fatura"
        subtitle="O pagamento reduz a dívida; não cria uma nova despesa."
      >
        {rows.length ? (
          <TransactionRows rows={rows} />
        ) : (
          <Empty title="Nenhuma compra nesta competência" />
        )}
      </Card>
      {pay && (
        <ActionDialog
          title="Pagar fatura na demonstração"
          description="O pagamento simulado reduz o saldo da conta e a dívida do cartão, sem duplicar a despesa."
          onClose={() => setPay(false)}
          onSubmit={(f) =>
            cmd.mutateAsync({
              type: "invoice.pay",
              cardId: card.id,
              competence,
              accountId: String(f.get("account")),
              amountCents: readMoney(String(f.get("amount"))),
            })
          }
        >
          <Field label="Conta de pagamento">
            <select name="account">
              {s.accounts
                .filter(
                  (a) =>
                    !a.archivedAt &&
                    a.currency === "BRL" &&
                    ["checking", "cash"].includes(a.kind),
                )
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Valor do pagamento">
            <input
              name="amount"
              inputMode="decimal"
              required
              defaultValue={inputMoney(invoice.outstanding)}
            />
          </Field>
        </ActionDialog>
      )}
    </>
  );
}
function Planning() {
  const { state: s, view: v } = useDemo();
  const { edit, notify } = useApp();
  const cmd = useCommand();
  const { pathname } = useLocation();
  const subscriptions = pathname === "/assinaturas",
    installments = pathname === "/parcelamentos";
  const [preview, setPreview] = useState<{
    planId: string;
    count: number;
  } | null>(null);
  if (!s || !v) return null;
  const rules = s.recurrences.filter((r) =>
    subscriptions ? r.role === "subscription" : r.role !== "subscription",
  );
  const plans = [
    ...new Set(
      s.transactions
        .map((t) => t.installmentPlanId)
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  const simulation = preview
    ? anticipation(s, preview.planId, preview.count)
    : null;
  return (
    <>
      <PageHeading
        title={
          subscriptions
            ? "O que se repete, à vista."
            : installments
              ? "Uma parcela de cada vez."
              : "Hoje tranquilo. Amanhã planejado."
        }
        description={
          subscriptions
            ? "Assinaturas e serviços que fazem parte do seu mês."
            : installments
              ? "Acompanhe as compras parceladas e simule a antecipação."
              : "Seus compromissos, organizados ao longo do tempo."
        }
        action={
          <Button
            onClick={() =>
              edit({
                type: installments ? "transaction.save" : "recurrence.save",
                title: installments
                  ? "Nova compra parcelada"
                  : subscriptions
                    ? "Nova assinatura"
                    : "Novo compromisso",
                initial: installments
                  ? {
                      kind: "expense",
                      origin: "card:card-nu",
                      installments: "3",
                    }
                  : {
                      role: subscriptions ? "subscription" : "standard",
                      day: "15",
                      kind: "expense",
                    },
              })
            }
          >
            <Plus size={17} />
            {installments
              ? "Nova compra"
              : subscriptions
                ? "Nova assinatura"
                : "Novo compromisso"}
          </Button>
        }
      />
      <AreaTabs items={planningTabs} />
      {installments ? (
        <div className="catalog-grid">
          {plans.map((planId) => {
            const rows = s.transactions.filter(
                (t) => t.installmentPlanId === planId,
              ),
              future = rows.filter((t) => t.state === "planned");
            const total = rows.reduce((a, t) => a + t.amount, 0);
            return (
              <Card
                key={planId}
                title={rows[0].description}
                subtitle={`${rows.length} parcelas no histórico`}
              >
                <strong className="catalog-value">{money(total)}</strong>
                <Progress
                  value={rows.length - future.length}
                  total={rows.length}
                  label="Parcelas já cobradas"
                />
                <p>
                  {future.length} parcelas futuras ·{" "}
                  {money(future.reduce((a, t) => a + t.amount, 0))}
                </p>
                <details className="disclosure">
                  <summary>Ver cronograma</summary>
                  {rows.map((t) => (
                    <div className="key-row" key={t.id}>
                      <span>
                        {t.installmentNumber} · {monthLabel(t.competence)}
                      </span>
                      <b>{money(t.amount)}</b>
                      <Badge>
                        {t.state === "planned" ? "Futura" : "Cobrada"}
                      </Badge>
                    </div>
                  ))}
                </details>
                <Button
                  variant="secondary"
                  disabled={!future.length}
                  onClick={() => setPreview({ planId, count: future.length })}
                >
                  Simular antecipação
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <>
          <div className="metric-grid three">
            <Metric
              label={subscriptions ? "Custo mensal" : "Entradas previstas"}
              value={
                subscriptions
                  ? rules
                      .filter((r) => r.isActive)
                      .reduce((a, r) => a + r.amount, 0)
                  : v.cashflow[0].inflow
              }
              hint={
                subscriptions
                  ? "Assinaturas ativas"
                  : "Projeção, não saldo disponível"
              }
              icon={<Repeat size={17} />}
            />
            <Metric
              label="Comprometido no ciclo"
              value={v.position.committed}
              hint="Faturas e contas previstas"
              icon={<CalendarDays size={17} />}
              color="#315D99"
            />
            <Metric
              label="Folga projetada"
              value={v.position.freeToSpend.amount}
              hint="Dentro do ciclo do cartão principal"
              icon={<Wallet size={17} />}
              color="#A367C4"
            />
          </div>
          {!subscriptions && (
            <Card
              title="O horizonte dos próximos meses"
              subtitle="Projeções derivadas dos compromissos conhecidos"
            >
              <LineChart
                labels={v.cashflow.map((p) => monthLabel(p.competence))}
                series={[
                  {
                    name: "Saldo projetado",
                    values: v.cashflow.map((p) => p.projectedBalance),
                    color: "#518FF1",
                    projected: true,
                  },
                ]}
                area
              />
            </Card>
          )}
          <div className="catalog-grid">
            {rules.map((r) => {
              const confirmed = s.transactions.some(
                (t) =>
                  t.recurrenceId === r.id &&
                  t.occurredOn.slice(0, 7) === s.today.slice(0, 7),
              );
              return (
                <Card
                  key={r.id}
                  title={r.description}
                  subtitle={`Todo dia ${r.scheduleDay}`}
                >
                  <Badge tone={r.isActive ? "positive" : "neutral"}>
                    {r.isActive ? "Ativa" : "Pausada"}
                  </Badge>
                  <strong className="catalog-value">{money(r.amount)}</strong>
                  <p>
                    {r.cardId
                      ? s.cards.find((c) => c.id === r.cardId)?.name
                      : s.accounts.find((a) => a.id === r.accountId)?.name}
                  </p>
                  <div className="catalog-actions">
                    <Button
                      variant="secondary"
                      disabled={!r.isActive || confirmed || cmd.isPending}
                      onClick={() =>
                        void cmd
                          .mutateAsync({
                            type: "recurrence.confirm",
                            id: r.id,
                            month: s.today.slice(0, 7),
                          })
                          .then(() => notify("Ocorrência confirmada"))
                          .catch((e) => notify(e.message))
                      }
                    >
                      <Check size={15} />
                      {confirmed ? "Confirmada" : "Confirmar mês"}
                    </Button>
                    <IconButton
                      label={"Editar " + r.description}
                      onClick={() =>
                        edit({
                          type: "recurrence.save",
                          id: r.id,
                          title: "Editar compromisso",
                          initial: {
                            description: r.description,
                            amount: inputMoney(r.amount),
                            kind: r.kind,
                            role: r.role,
                            day: String(r.scheduleDay),
                            categoryId: r.categoryId ?? "",
                            origin: r.cardId
                              ? "card:" + r.cardId
                              : "account:" + r.accountId,
                            startsOn: r.startsOn,
                          },
                        })
                      }
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        void cmd
                          .mutateAsync({ type: "recurrence.toggle", id: r.id })
                          .catch((e) => notify(e.message))
                      }
                    >
                      {r.isActive ? "Pausar" : "Retomar"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
      {preview && simulation && (
        <ActionDialog
          title="Antecipação sem juros"
          description="A compra demonstrativa não contém juros. Antecipar move parcelas futuras para a fatura atual; pagar a fatura é uma ação separada."
          onClose={() => setPreview(null)}
          onSubmit={() =>
            cmd.mutateAsync({ type: "installment.anticipate", ...preview })
          }
        >
          <Field label="Quantidade de parcelas">
            <input
              type="number"
              min={1}
              max={
                s.transactions.filter(
                  (t) =>
                    t.installmentPlanId === preview.planId &&
                    t.state === "planned",
                ).length
              }
              value={preview.count}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (
                  n >= 1 &&
                  n <=
                    s.transactions.filter(
                      (t) =>
                        t.installmentPlanId === preview.planId &&
                        t.state === "planned",
                    ).length
                )
                  setPreview({ ...preview, count: n });
              }}
            />
          </Field>
          <div className="key-values">
            <div>
              <span>Valor a antecipar</span>
              <b>{money(simulation.amountDueToday)}</b>
            </div>
            <div>
              <span>Economia de juros</span>
              <b>{money(simulation.savings)}</b>
            </div>
          </div>
        </ActionDialog>
      )}
    </>
  );
}
function Budgets() {
  const { state: s, view: v } = useDemo();
  const { edit } = useApp();
  const [params] = useSearchParams();
  if (!s || !v) return null;
  const month = params.get("mes") || "2026-11";
  const rows = v.budgets.filter((b) => b.month === month);
  return (
    <>
      <PageHeading
        title="Limites que dão liberdade."
        description="Escolha suas prioridades e acompanhe cada categoria."
        action={
          <Button
            onClick={() =>
              edit({
                type: "budget.save",
                title: "Novo orçamento",
                initial: { month },
              })
            }
          >
            <Plus size={17} />
            Definir orçamento
          </Button>
        }
      />
      <div className="toolbar">
        <QuerySelect
          name="mes"
          label="Competência"
          defaultValue="2026-11"
          options={v.historical
            .slice()
            .reverse()
            .map((h) => ({ value: h.month, label: monthLabel(h.month) }))}
        />
      </div>
      <div className="metric-grid three">
        <Metric
          label="Planejado"
          value={rows.reduce((a, b) => a + b.limitCents, 0)}
          hint="Limites das categorias"
          icon={<Wallet size={17} />}
        />
        <Metric
          label="Utilizado"
          value={rows.reduce((a, b) => a + b.spent, 0)}
          hint="Despesas confirmadas"
          icon={<CreditCard size={17} />}
          color="#315D99"
        />
        <Metric
          label="Margem restante"
          value={rows.reduce((a, b) => a + b.limitCents - b.spent, 0)}
          hint="Pode ser negativa ao exceder"
          icon={<Landmark size={17} />}
          color="#A367C4"
        />
      </div>
      <div className="catalog-grid">
        {rows.map((b) => (
          <Card
            key={b.id}
            title={b.category?.name}
            action={
              <IconButton
                label={"Editar orçamento de " + b.category?.name}
                onClick={() =>
                  edit({
                    type: "budget.save",
                    id: b.id,
                    title: "Editar orçamento",
                    initial: {
                      categoryId: b.categoryId,
                      limit: inputMoney(b.limitCents),
                      month: b.month,
                    },
                  })
                }
              >
                <Pencil size={16} />
              </IconButton>
            }
          >
            <Badge tone={b.spent > b.limitCents ? "negative" : "positive"}>
              {b.spent > b.limitCents
                ? "Limite ultrapassado"
                : "Dentro do planejado"}
            </Badge>
            <strong className="catalog-value">{money(b.spent)}</strong>
            <p>de {money(b.limitCents)} planejados</p>
            <Progress
              value={b.spent}
              total={b.limitCents}
              color={
                b.spent > b.limitCents ? "var(--negative)" : b.category?.color
              }
              label={"Uso do orçamento " + b.category?.name}
            />
            <p>{Math.round((b.spent / b.limitCents) * 100)}% utilizado</p>
            <Link
              className="text-link"
              to={`/lancamentos?categoria=${b.categoryId}&mes=${month}`}
            >
              Ver lançamentos <ChevronRight size={14} />
            </Link>
          </Card>
        ))}
      </div>
      {!rows.length && (
        <Empty
          title="Ainda sem orçamento neste mês"
          description="Defina os limites que fazem sentido para você."
        />
      )}
    </>
  );
}
function Rewards() {
  const { state: s } = useDemo();
  const { edit } = useApp();
  if (!s) return null;
  return (
    <>
      <PageHeading
        title="Pequenas recompensas."
        description="Pontos são pontos. Eles não se misturam ao seu saldo financeiro."
        action={
          <Button
            onClick={() =>
              edit({
                type: "reward.save",
                title: "Movimentar pontos",
                initial: { kind: "earn" },
              })
            }
          >
            <Plus size={17} />
            Movimentar pontos
          </Button>
        }
      />
      <div className="catalog-grid">
        {s.cards.map((c) => (
          <Card title={c.name} key={c.id}>
            <strong className="hero-value">
              {s.rewards
                .filter((r) => r.cardId === c.id)
                .reduce((a, r) => a + r.points, 0)
                .toLocaleString("pt-BR")}
            </strong>
            <p>pontos disponíveis</p>
            <Button
              variant="secondary"
              onClick={() =>
                edit({
                  type: "reward.save",
                  title: "Resgatar pontos",
                  initial: { kind: "redeem", cardId: c.id },
                })
              }
            >
              Resgatar pontos
            </Button>
          </Card>
        ))}
      </div>
      <Card title="Histórico de pontos">
        {s.rewards.map((r) => (
          <div className="key-row" key={r.id}>
            <span>{r.description}</span>
            <small>{dateLabel(r.date)}</small>
            <strong>
              {r.points > 0 ? "+" : ""}
              {r.points}
            </strong>
          </div>
        ))}
      </Card>
    </>
  );
}
