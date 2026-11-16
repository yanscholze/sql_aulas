import { useState } from "react";
import { Link } from "react-router";
import {
  Wallet,
  ArrowUpRight,
  Landmark,
  ChartNoAxesCombined,
  CreditCard,
  ArrowRight,
  CalendarDays,
  Check,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  Card,
  Metric,
  PageHeading,
  Button,
  Badge,
  Progress,
} from "../design-system/ui";
import { LineChart, Donut } from "../charts/charts";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { useApp } from "../app/context";
import { money, dateLabel, shortMonth } from "../shared/format";
import { AnimatedValue } from "../motion/presets";
import { TransactionRows, SeeAll } from "./common";
export default function Dashboard() {
  const { state: s, view: v } = useDemo();
  const { edit, notify } = useApp();
  const command = useCommand();
  const [period, setPeriod] = useState(6);
  if (!s || !v) return null;
  const history = v.historical.slice(-period),
    f = v.position.freeToSpend;
  const categories = v.categorySpend;
  const current = v.monthFlow;
  const previous = v.historical.at(-2)!;
  const change = previous.net
    ? ((current.net - previous.net) / Math.abs(previous.net)) * 100
    : undefined;
  return (
    <>
      <PageHeading
        title="Seu dinheiro, com clareza."
        description={`Bom dia, ${s.profile.name.split(" ")[0]}. Um olhar para hoje, espaço para o amanhã.`}
        action={
          <Button
            onClick={() =>
              edit({ type: "transaction.save", title: "Novo lançamento" })
            }
          >
            <Plus size={17} />
            Novo lançamento
          </Button>
        }
      />
      <div className="dashboard">
        <div className="metric-grid">
          <Metric
            label="Saldo atual"
            value={v.position.currentBalance}
            hint="Nas suas contas, hoje"
            icon={<Wallet size={17} />}
            index={0}
          />
          <Metric
            label="Comprometido"
            value={v.position.committed}
            hint="Faturas e próximos compromissos"
            icon={<CalendarDays size={17} />}
            color="#315D99"
            index={1}
          />
          <Metric
            label="Patrimônio líquido"
            value={v.position.netWorth}
            hint="O que você tem, menos o que deve"
            icon={<Landmark size={17} />}
            color="#A367C4"
            index={2}
          />
          <Metric
            label="Resultado do mês"
            value={current.net}
            hint="Receitas menos despesas confirmadas"
            icon={<ChartNoAxesCombined size={17} />}
            color="#D99A40"
            trend={change}
            series={v.historical.slice(-7).map((h) => h.net)}
            index={3}
          />
        </div>
        <div className="dashboard-main">
          <Card
            className="flow-panel"
            title="Seu fluxo financeiro"
            subtitle="Entradas e saídas · valores confirmados"
            action={
              <div className="segmented" aria-label="Período do gráfico">
                {[3, 6, 12].map((n) => (
                  <button
                    key={n}
                    className={period === n ? "active" : ""}
                    aria-pressed={period === n}
                    onClick={() => setPeriod(n)}
                  >
                    {n}M
                  </button>
                ))}
              </div>
            }
            index={3}
          >
            <LineChart
              labels={history.map((h) => shortMonth(h.month))}
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
              area
              height={200}
            />
            <div className="chart-footer">
              <span>
                <i className="status-dot" />
                Seu saldo de hoje não inclui projeções.
              </span>
              <SeeAll to="/relatorios">Explorar</SeeAll>
            </div>
          </Card>
          <Card className="free-card" index={4}>
            <div className="free-top">
              <span className="free-icon">
                <Sparkles size={18} />
              </span>
              <Badge tone={f.amount < 0 ? "negative" : "positive"}>
                {f.amount < 0 ? "Atenção ao ciclo" : "Seu próximo passo"}
              </Badge>
            </div>
            <h2>Livre para gastar</h2>
            <p>Folga projetada no ciclo atual</p>
            <strong className="free-value">
              <AnimatedValue value={f.amount} format={money} />
            </strong>
            <span className="free-period">
              {dateLabel(f.windowStart)} — {dateLabel(f.windowEnd)}
            </span>
            <div className="free-breakdown">
              <div>
                <span>Saldo disponível</span>
                <b>{money(f.liquidBalance)}</b>
              </div>
              <div>
                <span>Entradas previstas</span>
                <b>+ {money(f.pendingIncome)}</b>
              </div>
              <div>
                <span>Compromissos</span>
                <b>− {money(f.openInvoices + f.otherCommitments)}</b>
              </div>
            </div>
            {v.position.benefitFreeToSpend.amount > 0 && (
              <p className="benefit-note">
                Inclui {money(v.position.benefitFreeToSpend.amount)} de uso
                restrito em alimentação.
              </p>
            )}
            <Link to="/planejamento" className="free-link">
              Planejar meus próximos dias <ArrowUpRight size={16} />
            </Link>
          </Card>
          <Card
            className="category-panel"
            title="Para onde vai"
            subtitle="Despesas de novembro"
            index={5}
          >
            <Donut
              slices={categories.map((c) => ({
                name: c.name,
                value: c.value,
                color: c.color,
              }))}
              size={140}
            />
            <SeeAll to="/relatorios/despesas">Ver categorias</SeeAll>
          </Card>
        </div>
        <div className="dashboard-operations">
          <Card
            className="upcoming-panel"
            title="No seu radar"
            subtitle="Os próximos compromissos"
            action={<SeeAll to="/planejamento" />}
            index={5}
          >
            <div className="entity-list">
              {v.upcoming.slice(0, 4).map((t) => (
                <Link to="/planejamento" className="entity-row" key={t.id}>
                  <span className="date-tile">
                    <b>{t.occurredOn.slice(8)}</b>
                    <small>{shortMonth(t.occurredOn)}</small>
                  </span>
                  <div className="entity-main">
                    <strong>{t.description}</strong>
                    <span>
                      {t.kind === "income"
                        ? "Entrada prevista"
                        : "Pagamento previsto"}
                    </span>
                  </div>
                  <strong
                    className={`amount ${t.kind === "income" ? "positive" : ""}`}
                  >
                    {money(t.amount)}
                  </strong>
                </Link>
              ))}
            </div>
          </Card>
          <Card
            className="cards-panel"
            title="Seus cartões"
            subtitle="Tudo sob controle, em um lugar"
            action={<SeeAll to="/cartoes" />}
            index={6}
          >
            {v.cards
              .filter((c) => !c.archived)
              .map((c) => (
                <Link
                  className="mini-credit"
                  key={c.id}
                  to={"/cartoes?cartao=" + c.id}
                >
                  <span
                    className="credit-symbol"
                    style={{ background: c.color }}
                  >
                    <CreditCard size={21} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <span>•••• {c.last4}</span>
                    <Progress
                      value={c.limitCents - c.availableCents}
                      total={c.limitCents}
                      color={c.color}
                      label={"Limite utilizado " + c.name}
                    />
                  </div>
                  <div className="mini-credit-value">
                    <strong>{money(c.invoice.outstanding)}</strong>
                    <small>fatura atual</small>
                  </div>
                </Link>
              ))}
            <div className="soft-note">
              <Check size={15} />
              As compras no crédito entram na fatura.
            </div>
          </Card>
          <Card
            className="tasks-panel"
            title="Próximos passos"
            subtitle="O que merece sua atenção"
            action={<SeeAll to="/projetos/quadro" />}
            index={7}
          >
            <div className="task-list">
              {s.tasks
                .filter((t) => t.status !== "done")
                .slice(0, 3)
                .map((t) => (
                  <div
                    key={t.id}
                    className={`task-item ${t.status === "blocked" ? "warm" : ""}`}
                  >
                    <button
                      className="task-check"
                      aria-label={"Concluir " + t.title}
                      disabled={command.isPending}
                      onClick={() =>
                        void command
                          .mutateAsync({
                            type: "task.move",
                            id: t.id,
                            status: "done",
                          })
                          .then(() => notify("Tarefa concluída"))
                          .catch((e) => notify(e.message))
                      }
                    >
                      <Check size={12} />
                    </button>
                    <div>
                      <Link to={"/projetos/" + t.projectId}>{t.title}</Link>
                      <span>
                        {s.projects.find((p) => p.id === t.projectId)?.client}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
        <div className="dashboard-bottom">
          <Card
            title="Últimos movimentos"
            subtitle="Uma história contada por cada lançamento"
            action={<SeeAll to="/lancamentos" />}
            index={7}
          >
            <TransactionRows
              rows={s.transactions
                .filter(
                  (t) => t.occurredOn <= s.today && t.state === "confirmed",
                )
                .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
                .slice(0, 4)}
            />
          </Card>
          <Card
            title="Espaço para os seus planos"
            subtitle="Metas que estão ganhando forma"
            action={<SeeAll to="/patrimonio?aba=metas" />}
            index={8}
          >
            <div className="goal-list">
              {v.goals.map((g) => (
                <Link key={g.id} to="/patrimonio?aba=metas">
                  <div>
                    <span className="goal-icon">
                      <Landmark size={17} />
                    </span>
                    <strong>{g.name}</strong>
                    <span>{Math.round((g.saved / g.targetCents) * 100)}%</span>
                  </div>
                  <Progress
                    value={g.saved}
                    total={g.targetCents}
                    label={g.name}
                  />
                  <p>
                    {money(g.saved)} <span>de {money(g.targetCents)}</span>
                  </p>
                </Link>
              ))}
            </div>
            <Link className="quiet-link" to="/projetos">
              Acompanhar meus projetos <ArrowRight size={15} />
            </Link>
          </Card>
        </div>
      </div>
      <p className="page-footnote">
        Demonstração · 11 de novembro de 2026{" "}
        <span>Feito para dar mais leveza à sua vida financeira.</span>
      </p>
    </>
  );
}
