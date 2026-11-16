import { useState } from "react";
import { useSearchParams, Link, useLocation } from "react-router";
import {
  Landmark,
  Wallet,
  TrendingUp,
  Plus,
  Pencil,
  HeartPulse,
  ArrowLeftRight,
  Download,
  Plane,
} from "lucide-react";
import {
  PageHeading,
  Card,
  Metric,
  Button,
  Badge,
  Progress,
  Field,
  Empty,
  IconButton,
  Confirm,
} from "../design-system/ui";
import { LineChart, Donut } from "../charts/charts";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { useApp } from "../app/context";
import {
  money,
  inputMoney,
  readMoney,
  monthLabel,
  dateLabel,
  csvCell,
  downloadFile,
} from "../shared/format";
import { QueryTabs, AreaTabs, QuerySelect, QuerySearch } from "./common";
import { ActionDialog } from "./action-dialog";
export default function Wealth() {
  const { pathname } = useLocation();
  return pathname.startsWith("/relatorios") ? (
    <Reports />
  ) : pathname === "/viagens" ? (
    <Trips />
  ) : (
    <Overview />
  );
}
function Overview() {
  const { state: s, view: v } = useDemo();
  const { edit } = useApp();
  const cmd = useCommand();
  const [params] = useSearchParams();
  const [invest, setInvest] = useState<{ id: string; redeem: boolean } | null>(
    null,
  );
  if (!s || !v) return null;
  const tab = params.get("aba") || "patrimonio";
  const investments = v.accounts.filter(
    (a) => !a.archivedAt && ["investment", "savings"].includes(a.kind),
  );
  const tabs = [
    { value: "patrimonio", label: "Patrimônio" },
    { value: "investimentos", label: "Investimentos" },
    { value: "metas", label: "Metas" },
    { value: "saude", label: "Saúde financeira" },
  ];
  return (
    <>
      <PageHeading
        title="O todo também importa."
        description="Seu patrimônio, seus objetivos e a tranquilidade que você está construindo."
        action={
          tab === "metas" ? (
            <Button
              onClick={() => edit({ type: "goal.save", title: "Nova meta" })}
            >
              <Plus size={17} />
              Nova meta
            </Button>
          ) : tab === "investimentos" ? (
            <Button
              onClick={() =>
                edit({
                  type: "account.save",
                  title: "Novo investimento",
                  initial: { kind: "investment", openingBalance: "0" },
                })
              }
            >
              <Plus size={17} />
              Novo investimento
            </Button>
          ) : undefined
        }
      />
      <QueryTabs items={tabs} fallback="patrimonio" />
      {tab === "patrimonio" && (
        <>
          <div className="metric-grid">
            <Metric
              label="Patrimônio líquido"
              value={v.position.netWorth}
              hint="Ativos menos dívidas"
              icon={<Landmark size={17} />}
            />
            <Metric
              label="Ativos"
              value={v.position.totalAssets}
              hint="Contas, investimentos e reservas"
              icon={<Wallet size={17} />}
              color="#315D99"
            />
            <Metric
              label="Dívidas atuais"
              value={v.position.cardDebt}
              hint="Compras já cobradas nos cartões"
              icon={<ArrowLeftRight size={17} />}
              color="#A367C4"
            />
            <Metric
              label="Guardado"
              value={v.position.investments}
              hint="Separado do dinheiro do dia a dia"
              icon={<TrendingUp size={17} />}
              color="#D99A40"
            />
          </div>
          <div className="split two-one">
            <Card
              title="Onde seu dinheiro está"
              subtitle="Saldos atuais em reais"
            >
              {v.accounts
                .filter((a) => a.currency === "BRL" && !a.archivedAt)
                .map((a) => (
                  <div className="ranking" key={a.id}>
                    <div>
                      <span>{a.name}</span>
                      <b>{money(a.balanceCents)}</b>
                    </div>
                    <Progress
                      value={Math.max(0, a.balanceCents)}
                      total={Math.max(1, v.position.totalAssets)}
                      color={a.color}
                      label={a.name}
                    />
                  </div>
                ))}
            </Card>
            <Card title="Composição dos ativos">
              <Donut
                slices={[
                  {
                    name: "Uso diário",
                    value: Math.max(0, v.position.currentBalance),
                    color: "#518FF1",
                  },
                  {
                    name: "Investimentos",
                    value: Math.max(0, v.position.investments),
                    color: "#315D99",
                  },
                ]}
              />
            </Card>
          </div>
          <Card
            title="Sua capacidade de construir"
            subtitle="Resultado mensal confirmado · não é uma série de patrimônio"
          >
            <LineChart
              labels={v.historical.map((h) => monthLabel(h.month))}
              series={[
                {
                  name: "Resultado do mês",
                  values: v.historical.map((h) => h.net),
                  color: "#518FF1",
                },
              ]}
              bars
            />
          </Card>
        </>
      )}
      {tab === "investimentos" && (
        <div className="catalog-grid">
          {investments.map((a) => (
            <Card key={a.id} title={a.name} subtitle={a.institution}>
              <Badge tone="positive">
                {a.currency} · posição demonstrativa
              </Badge>
              <strong className="hero-value">
                {money(a.balanceCents, a.currency)}
              </strong>
              <p>Saldo derivado dos aportes e resgates. Sem cotação remota.</p>
              <div className="catalog-actions">
                <Button onClick={() => setInvest({ id: a.id, redeem: false })}>
                  Aportar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setInvest({ id: a.id, redeem: true })}
                >
                  Resgatar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab === "metas" && (
        <div className="catalog-grid">
          {v.goals.map((g) => (
            <Card
              key={g.id}
              title={g.name}
              subtitle={"Até " + dateLabel(g.dueOn)}
              action={
                <IconButton
                  label={"Editar " + g.name}
                  onClick={() =>
                    edit({
                      type: "goal.save",
                      title: "Editar meta",
                      id: g.id,
                      initial: {
                        name: g.name,
                        target: inputMoney(g.targetCents),
                        accountId: g.accountId,
                        dueOn: g.dueOn,
                      },
                    })
                  }
                >
                  <Pencil size={16} />
                </IconButton>
              }
            >
              <Donut
                slices={[
                  {
                    name: "Guardado",
                    value: Math.min(g.saved, g.targetCents),
                    color: "#518FF1",
                  },
                  {
                    name: "Falta",
                    value: Math.max(0, g.targetCents - g.saved),
                    color: "#DFE8E3",
                  },
                ]}
                center={Math.round((g.saved / g.targetCents) * 100) + "%"}
                subtitle="do objetivo"
              />
              <div className="key-values">
                <div>
                  <span>Já guardado</span>
                  <b>{money(g.saved)}</b>
                </div>
                <div>
                  <span>Objetivo</span>
                  <b>{money(g.targetCents)}</b>
                </div>
              </div>
              <small>
                Vinculada a {s.accounts.find((a) => a.id === g.accountId)?.name}
                . Não adiciona patrimônio.
              </small>
            </Card>
          ))}
        </div>
      )}
      {tab === "saude" && (
        <div className="split">
          <Card
            title="Um colchão para imprevistos"
            subtitle="Reserva / despesas essenciais confirmadas do mês"
          >
            <span className="round-feature">
              <HeartPulse size={30} />
            </span>
            <strong className="hero-value">
              {v.essentialSpend > 0
                ? (
                    (v.accounts.find((a) => a.id === "acc-reserve")
                      ?.balanceCents ?? 0) / v.essentialSpend
                  ).toFixed(1)
                : "—"}{" "}
              <small>meses</small>
            </strong>
            <p>
              A estimativa usa moradia, alimentação e saúde marcadas como
              essenciais. Não é uma avaliação profissional ou pontuação de
              crédito.
            </p>
            <Link className="text-link" to="/configuracoes?aba=categorias">
              Revisar categorias essenciais
            </Link>
          </Card>
          <Card title="Sinais para acompanhar">
            <div className="health-item">
              <Badge
                tone={
                  v.position.freeToSpend.amount >= 0 ? "positive" : "negative"
                }
              >
                {v.position.freeToSpend.amount >= 0
                  ? "Folga positiva"
                  : "Ciclo pressionado"}
              </Badge>
              <p>Folga projetada: {money(v.position.freeToSpend.amount)}</p>
            </div>
            <div className="health-item">
              <Badge
                tone={
                  v.budgets.some((b) => b.spent > b.limitCents)
                    ? "warning"
                    : "positive"
                }
              >
                Orçamentos
              </Badge>
              <p>
                {v.budgets.filter((b) => b.spent > b.limitCents).length}{" "}
                categorias acima do planejado.
              </p>
            </div>
            <div className="health-item">
              <Badge tone="blue">Próximos passos</Badge>
              <p>
                Confira vencimentos e mantenha a reserva separada do saldo de
                uso diário.
              </p>
            </div>
          </Card>
        </div>
      )}
      {invest && (
        <ActionDialog
          title={invest.redeem ? "Resgatar investimento" : "Fazer um aporte"}
          onClose={() => setInvest(null)}
          onSubmit={(f) =>
            cmd.mutateAsync({
              type: "investment.transfer",
              investmentId: invest.id,
              redeem: invest.redeem,
              accountId: String(f.get("account")),
              amountCents: readMoney(String(f.get("amount"))),
            })
          }
        >
          <Field label={invest.redeem ? "Conta de destino" : "Conta de origem"}>
            <select name="account">
              {s.accounts
                .filter((a) => !a.archivedAt && a.kind === "checking")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Valor">
            <input
              name="amount"
              required
              inputMode="decimal"
              placeholder="0,00"
            />
          </Field>
        </ActionDialog>
      )}
    </>
  );
}
function Reports() {
  const { state: s, view: v } = useDemo();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  if (!s || !v) return null;
  const period = params.get("periodo") || "6m";
  const count =
    period === "mes" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const history =
    period === "todos" ? v.historical : v.historical.slice(-count);
  const from = history[0]?.month || "2026-11";
  const rows = s.transactions.filter(
    (t) =>
      t.state === "confirmed" &&
      t.occurredOn <= s.today &&
      t.currency === "BRL" &&
      t.competence >= from,
  );
  const income = rows
      .filter((t) => t.kind === "income")
      .reduce((a, t) => a + t.amount, 0),
    expense =
      rows
        .filter((t) => t.kind === "expense")
        .reduce((a, t) => a + t.amount, 0) -
      rows.filter((t) => t.kind === "refund").reduce((a, t) => a + t.amount, 0);
  const type = pathname.endsWith("/renda") ? "income" : "expense";
  const categories = s.categories
    .filter((c) => c.kind === type)
    .map((c) => ({
      ...c,
      value: rows
        .filter((t) => t.categoryId === c.id)
        .reduce(
          (a, t) =>
            a +
            (t.kind === type
              ? t.amount
              : t.kind === "refund" && type === "expense"
                ? -t.amount
                : 0),
          0,
        ),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const subscriptions = pathname.endsWith("/assinaturas");
  return (
    <>
      <PageHeading
        title="Os números contam uma história."
        description="Encontre padrões, reveja prioridades e faça escolhas com mais contexto."
        action={
          <Button
            variant="secondary"
            onClick={() =>
              downloadFile(
                "fluxo-relatorio.csv",
                "\uFEFF" +
                  [
                    ["Mês", "Receitas", "Despesas", "Resultado"],
                    ...history.map((h) => [
                      h.month,
                      inputMoney(h.income),
                      inputMoney(h.expense),
                      inputMoney(h.net),
                    ]),
                  ]
                    .map((r) => r.map(csvCell).join(";"))
                    .join("\n"),
                "text/csv;charset=utf-8",
              )
            }
          >
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />
      <AreaTabs
        items={[
          { href: "/relatorios", label: "Visão geral" },
          { href: "/relatorios/renda", label: "Renda" },
          { href: "/relatorios/despesas", label: "Despesas" },
          { href: "/relatorios/assinaturas", label: "Assinaturas" },
        ]}
      />
      <div className="toolbar">
        <QuerySelect
          name="periodo"
          label="Período do relatório"
          defaultValue="6m"
          options={[
            { value: "mes", label: "Este mês" },
            { value: "3m", label: "3 meses" },
            { value: "6m", label: "6 meses" },
            { value: "12m", label: "12 meses" },
            { value: "todos", label: "Tudo" },
          ]}
        />
        <span className="muted">Valores confirmados · BRL</span>
      </div>
      {subscriptions ? (
        <Card
          title="O custo de continuar"
          subtitle="Assinaturas ativas · projeção mensal"
        >
          {s.recurrences
            .filter((r) => r.role === "subscription" && r.isActive)
            .map((r) => (
              <div className="ranking" key={r.id}>
                <div>
                  <span>{r.description}</span>
                  <b>{money(r.amount)} / mês</b>
                </div>
                <Progress
                  value={r.amount}
                  total={s.recurrences
                    .filter((x) => x.role === "subscription" && x.isActive)
                    .reduce((a, x) => a + x.amount, 0)}
                  label={r.description}
                />
              </div>
            ))}
          <Link className="text-link" to="/assinaturas">
            Gerenciar assinaturas
          </Link>
        </Card>
      ) : (
        <>
          <div className="metric-grid">
            <Metric
              label="Receitas"
              value={income}
              hint="Entradas confirmadas no período"
              icon={<TrendingUp size={17} />}
              series={history.map((h) => h.income)}
            />
            <Metric
              label="Despesas"
              value={expense}
              hint="Gastos, descontados os estornos"
              icon={<Wallet size={17} />}
              color="#315D99"
              series={history.map((h) => h.expense)}
            />
            <Metric
              label="Resultado"
              value={income - expense}
              hint="Receitas menos despesas"
              icon={<Landmark size={17} />}
              color="#A367C4"
              series={history.map((h) => h.net)}
            />
            <Metric
              label="Média de gastos"
              value={Math.round(expense / (history.length || 1))}
              hint="Por mês no período"
              icon={<ArrowLeftRight size={17} />}
              color="#D99A40"
            />
          </div>
          <div className="split two-one">
            <Card
              title="Entradas e saídas"
              subtitle="Compare os meses, sem misturar transferências"
            >
              <LineChart
                labels={history.map((h) => monthLabel(h.month))}
                series={[
                  {
                    name: "Receitas",
                    values: history.map((h) => h.income),
                    color: "#518FF1",
                  },
                  {
                    name: "Despesas",
                    values: history.map((h) => h.expense),
                    color: "#315D99",
                  },
                ]}
                bars
              />
            </Card>
            <Card
              title={
                type === "income"
                  ? "Origem da renda"
                  : "Distribuição dos gastos"
              }
            >
              <Donut
                slices={categories.map((c) => ({
                  name: c.name,
                  value: c.value,
                  color: c.color,
                }))}
              />
            </Card>
          </div>
          <div className="split">
            <Card
              title="Categorias em perspectiva"
              subtitle="Do maior para o menor"
            >
              {categories.map((c) => (
                <div className="ranking" key={c.id}>
                  <div>
                    <span>{c.name}</span>
                    <b>{money(c.value)}</b>
                  </div>
                  <Progress
                    value={c.value}
                    total={categories[0]?.value || 1}
                    color={c.color}
                    label={c.name}
                  />
                </div>
              ))}
            </Card>
            <Card
              title="Movimentos de maior valor"
              subtitle="Dentro do período selecionado"
            >
              <div className="entity-list">
                {rows
                  .filter((t) => t.kind === type)
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map((t) => (
                    <div className="key-row" key={t.id}>
                      <span>
                        {t.description}
                        <small>{dateLabel(t.occurredOn)}</small>
                      </span>
                      <b>{money(t.amount)}</b>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
function Trips() {
  const { state: s } = useDemo();
  const { edit } = useApp();
  const cmd = useCommand();
  const [params] = useSearchParams();
  if (!s) return null;
  const trips = s.trips.filter(
    (t) =>
      !t.archived &&
      t.name.toLowerCase().includes((params.get("q") || "").toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Planos que viram memórias."
        description="Organize o orçamento. Aproveite o caminho."
        action={
          <Button
            onClick={() => edit({ type: "trip.save", title: "Nova viagem" })}
          >
            <Plus size={17} />
            Nova viagem
          </Button>
        }
      />
      <div className="toolbar">
        <QuerySearch placeholder="Buscar viagem" />
      </div>
      <div className="catalog-grid">
        {trips.map((t) => {
          const spent = s.transactions
            .filter(
              (x) =>
                x.tripId === t.id &&
                x.kind === "expense" &&
                x.state === "confirmed" &&
                x.currency === t.currency,
            )
            .reduce((a, x) => a + x.amount, 0);
          return (
            <Card key={t.id} className="trip-card">
              <div className="trip-art" aria-hidden="true">
                <Plane size={42} />
                <span>{t.destination.split(",")[0]}</span>
              </div>
              <h2>{t.name}</h2>
              <p>
                {t.destination} · {dateLabel(t.startOn)} a {dateLabel(t.endOn)}
              </p>
              <div className="key-values">
                <div>
                  <span>Orçamento</span>
                  <b>{money(t.budgetCents, t.currency)}</b>
                </div>
                <div>
                  <span>Gastos associados</span>
                  <b>{money(spent, t.currency)}</b>
                </div>
              </div>
              <Progress value={spent} total={t.budgetCents} label={t.name} />
              <div className="catalog-actions">
                <Button
                  variant="secondary"
                  onClick={() =>
                    edit({
                      type: "transaction.save",
                      title: "Registrar gasto da viagem",
                      initial: { tripId: t.id, kind: "expense" },
                    })
                  }
                >
                  Adicionar gasto
                </Button>
                <IconButton
                  label={"Editar " + t.name}
                  onClick={() =>
                    edit({
                      type: "trip.save",
                      title: "Editar viagem",
                      id: t.id,
                      initial: {
                        name: t.name,
                        destination: t.destination,
                        startOn: t.startOn,
                        endOn: t.endOn,
                        currency: t.currency,
                        budget: inputMoney(t.budgetCents),
                      },
                    })
                  }
                >
                  <Pencil size={15} />
                </IconButton>
                <Confirm
                  label="Arquivar viagem"
                  title="Arquivar viagem?"
                  description="Os lançamentos associados permanecerão no extrato."
                  onConfirm={() =>
                    cmd.mutateAsync({ type: "trip.archive", id: t.id })
                  }
                >
                  Arquivar
                </Confirm>
              </div>
            </Card>
          );
        })}
      </div>
      {!trips.length && <Empty title="Seu próximo destino começa aqui" />}
    </>
  );
}
