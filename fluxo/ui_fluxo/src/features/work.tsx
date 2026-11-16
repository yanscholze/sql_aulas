import { useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import {
  Plus,
  ArrowUpRight,
  Clock,
  CalendarDays,
  Folder,
  FileText,
  Download,
  Trash2,
  Check,
  Pencil,
} from "lucide-react";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
} from "@fluxo/core/domain/work/status.ts";
import {
  PageHeading,
  Card,
  Button,
  Badge,
  Progress,
  Field,
  Empty,
  Confirm,
  IconButton,
  Notice,
} from "../design-system/ui";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { useApp } from "../app/context";
import {
  TASK_STATUSES,
  TASK_LABELS,
  type TaskStatus,
  type ProjectStatus,
} from "../data/contracts/models";
import { money, dateLabel, inputMoney, downloadFile } from "../shared/format";
import {
  AreaTabs,
  projectTabs,
  QuerySearch,
  QuerySelect,
  QueryTabs,
} from "./common";
import { ActionDialog } from "./action-dialog";
export default function Work() {
  const { pathname } = useLocation();
  const { projectId } = useParams();
  if (projectId) return <ProjectDetail />;
  if (pathname === "/projetos/quadro") return <Board />;
  if (pathname === "/projetos/horas") return <Hours />;
  if (pathname === "/projetos/agenda") return <Agenda />;
  return <Projects />;
}
function Projects() {
  const { state: s, view: v } = useDemo();
  const { edit } = useApp();
  const [params] = useSearchParams();
  if (!s || !v) return null;
  const projects = v.projects.filter(
    (p) =>
      p.name.toLowerCase().includes((params.get("q") || "").toLowerCase()) &&
      (!params.get("status")
        ? !["done", "cancelled"].includes(p.status)
        : p.status === params.get("status")),
  );
  return (
    <>
      <PageHeading
        title="Seu trabalho, em movimento."
        description="Do primeiro encontro à última entrega. Acompanhe o que você está construindo."
        action={
          <Button
            onClick={() =>
              edit({ type: "project.save", title: "Novo projeto" })
            }
          >
            <Plus size={17} />
            Novo projeto
          </Button>
        }
      />
      <AreaTabs items={projectTabs} />
      <div className="toolbar">
        <QuerySearch placeholder="Buscar projeto" />
        <QuerySelect
          name="status"
          label="Situação do projeto"
          options={[
            { value: "", label: "Projetos abertos" },
            ...PROJECT_STATUSES.map((value) => ({
              value,
              label: PROJECT_STATUS_LABEL[value],
            })),
          ]}
        />
      </div>
      <div className="catalog-layout">
        <div className="catalog-grid">
          {projects.map((p, i) => (
            <Card
              key={p.id}
              className={`project-card ${i % 3 === 2 ? "warm-card" : ""}`}
              index={i}
            >
              <Link to={"/projetos/" + p.id} className="project-card-link">
                <div className="catalog-top">
                  <span
                    className="entity-symbol"
                    style={{ background: p.color + "20", color: p.color }}
                  >
                    <Folder size={21} />
                  </span>
                  <ArrowUpRight size={17} />
                </div>
                <small>{p.client}</small>
                <h2>{p.name}</h2>
                <Badge
                  tone={
                    p.status === "active"
                      ? "positive"
                      : p.status === "testing"
                        ? "blue"
                        : "warning"
                  }
                >
                  {PROJECT_STATUS_LABEL[p.status]}
                </Badge>
                <p className="project-description">{p.description}</p>
                <Progress
                  value={p.progress}
                  total={100}
                  color={p.color}
                  label={p.name}
                />
                <div className="project-card-bottom">
                  <span>
                    <CalendarDays size={13} />
                    {dateLabel(p.dueOn)}
                  </span>
                  <b>{money(p.amountCents)}</b>
                </div>
              </Link>
            </Card>
          ))}
        </div>
        <div className="stack">
          <Card title="Um olhar sobre o trabalho">
            <strong className="hero-value">{projects.length}</strong>
            <p>projetos neste recorte</p>
            <div className="key-values">
              <div>
                <span>Contratado</span>
                <b>{money(projects.reduce((a, p) => a + p.amountCents, 0))}</b>
              </div>
              <div>
                <span>Recebido</span>
                <b>{money(projects.reduce((a, p) => a + p.received, 0))}</b>
              </div>
              <div>
                <span>A receber</span>
                <b>{money(projects.reduce((a, p) => a + p.pending, 0))}</b>
              </div>
            </div>
          </Card>
          <Card title="Etapas do trabalho">
            {["active", "testing", "proposal", "delivered"].map((status) => (
              <div className="ranking" key={status}>
                <div>
                  <span>{PROJECT_STATUS_LABEL[status as ProjectStatus]}</span>
                  <b>{projects.filter((p) => p.status === status).length}</b>
                </div>
                <Progress
                  value={projects.filter((p) => p.status === status).length}
                  total={projects.length || 1}
                  label={status}
                />
              </div>
            ))}
          </Card>
        </div>
      </div>
      {!projects.length && <Empty title="Nenhum projeto neste recorte" />}
    </>
  );
}
function Board() {
  const { state: s } = useDemo();
  const { edit, notify } = useApp();
  const cmd = useCommand();
  const [params] = useSearchParams();
  if (!s) return null;
  const tasks = s.tasks.filter(
    (t) => !params.get("projeto") || t.projectId === params.get("projeto"),
  );
  return (
    <>
      <PageHeading
        title="Um passo de cada vez."
        description="As tarefas dos seus projetos, organizadas pelo que precisa acontecer."
        action={
          <Button
            onClick={() => edit({ type: "task.save", title: "Nova tarefa" })}
          >
            <Plus size={17} />
            Nova tarefa
          </Button>
        }
      />
      <AreaTabs items={projectTabs} />
      <div className="toolbar">
        <QuerySelect
          name="projeto"
          label="Projeto"
          options={[
            { value: "", label: "Todos os projetos" },
            ...s.projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      </div>
      <div className="board" aria-label="Quadro de tarefas">
        {TASK_STATUSES.map((status) => (
          <section className="board-column" key={status}>
            <h2>
              <i className={"task-dot " + status} />
              {TASK_LABELS[status]}{" "}
              <span>{tasks.filter((t) => t.status === status).length}</span>
            </h2>
            {tasks
              .filter((t) => t.status === status)
              .map((t) => (
                <article className="board-task" key={t.id}>
                  <Link to={"/projetos/" + t.projectId}>
                    <small>
                      {s.projects.find((p) => p.id === t.projectId)?.name}
                    </small>
                    <h3>{t.title}</h3>
                  </Link>
                  <span
                    className={
                      t.dueOn < s.today && status !== "done"
                        ? "negative"
                        : "muted"
                    }
                  >
                    <CalendarDays size={13} />
                    {dateLabel(t.dueOn)}
                  </span>
                  <label>
                    <span className="sr-only">Mover {t.title}</span>
                    <select
                      aria-label={"Mover " + t.title}
                      value={status}
                      disabled={cmd.isPending}
                      onChange={(e) =>
                        void cmd
                          .mutateAsync({
                            type: "task.move",
                            id: t.id,
                            status: e.target.value as TaskStatus,
                          })
                          .catch((e) => notify(e.message))
                      }
                    >
                      {TASK_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {TASK_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
            <Button
              variant="ghost"
              onClick={() => edit({ type: "task.save", title: "Nova tarefa" })}
            >
              <Plus size={14} />
              Adicionar tarefa
            </Button>
          </section>
        ))}
      </div>
    </>
  );
}
function Hours() {
  const { state: s } = useDemo();
  const { edit } = useApp();
  const [params] = useSearchParams();
  if (!s) return null;
  const rows = s.sessions.filter(
    (x) =>
      (!params.get("projeto") || x.projectId === params.get("projeto")) &&
      (!params.get("mes") || x.date.startsWith(params.get("mes")!)),
  );
  return (
    <>
      <PageHeading
        title="Seu tempo tem valor."
        description="Registre o esforço de cada projeto, sem perder de vista o resultado."
        action={
          <Button
            onClick={() =>
              edit({
                type: "session.save",
                title: "Registrar horas",
                initial: { minutes: "60" },
              })
            }
          >
            <Plus size={17} />
            Registrar horas
          </Button>
        }
      />
      <AreaTabs items={projectTabs} />
      <div className="toolbar">
        <QuerySelect
          name="projeto"
          label="Projeto"
          options={[
            { value: "", label: "Todos os projetos" },
            ...s.projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        <QuerySelect
          name="mes"
          label="Mês"
          options={[
            { value: "", label: "Todos os meses" },
            { value: "2026-11", label: "Novembro 2026" },
            { value: "2026-10", label: "Outubro 2026" },
          ]}
        />
      </div>
      <div className="split two-one">
        <Card title="Registro de atividades">
          {rows.length ? (
            rows.map((r) => (
              <div className="entity-row" key={r.id}>
                <span className="entity-symbol">
                  <Clock size={18} />
                </span>
                <div className="entity-main">
                  <strong>{r.description}</strong>
                  <span>
                    {s.projects.find((p) => p.id === r.projectId)?.name} ·{" "}
                    {dateLabel(r.date)}
                  </span>
                </div>
                <b>
                  {Math.floor(r.minutes / 60)}h {r.minutes % 60}min
                </b>
                <IconButton
                  label={"Editar " + r.description}
                  onClick={() =>
                    edit({
                      type: "session.save",
                      title: "Editar registro",
                      id: r.id,
                      initial: {
                        projectId: r.projectId,
                        description: r.description,
                        date: r.date,
                        minutes: String(r.minutes),
                      },
                    })
                  }
                >
                  <Pencil size={15} />
                </IconButton>
              </div>
            ))
          ) : (
            <Empty />
          )}
        </Card>
        <Card title="Tempo investido">
          <strong className="hero-value">
            {(rows.reduce((a, r) => a + r.minutes, 0) / 60).toFixed(1)}h
          </strong>
          <p>No recorte selecionado</p>
          {s.projects.map((p) => (
            <div className="ranking" key={p.id}>
              <div>
                <span>{p.name}</span>
                <b>
                  {(
                    rows
                      .filter((r) => r.projectId === p.id)
                      .reduce((a, r) => a + r.minutes, 0) / 60
                  ).toFixed(1)}
                  h
                </b>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
function Agenda() {
  const { state: s } = useDemo();
  const [params] = useSearchParams();
  if (!s) return null;
  const month = params.get("mes") || "2026-11";
  const events = [
    ...s.projects.map((p) => ({
      id: p.id,
      title: "Entrega · " + p.name,
      date: p.dueOn,
      projectId: p.id,
      type: "Projeto",
    })),
    ...s.tasks
      .filter((t) => t.status !== "done")
      .map((t) => ({
        id: t.id,
        title: t.title,
        date: t.dueOn,
        projectId: t.projectId,
        type: "Tarefa",
      })),
    ...s.payments
      .filter((p) => !p.transactionId)
      .map((p) => ({
        id: p.id,
        title: "Receber · " + p.description,
        date: p.dueOn,
        projectId: p.projectId,
        type: "Cobrança",
      })),
  ]
    .filter((e) => e.date.startsWith(month))
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageHeading
        title="O que vem pela frente."
        description="Prazos, tarefas e recebimentos dividem o mesmo calendário."
      />
      <AreaTabs items={projectTabs} />
      <div className="toolbar">
        <QuerySelect
          name="mes"
          label="Mês da agenda"
          defaultValue="2026-11"
          options={["2026-10", "2026-11", "2026-12", "2027-01"].map(
            (value) => ({ value, label: value }),
          )}
        />
      </div>
      <Card title="Agenda do mês">
        {events.map((e) => (
          <Link
            className="entity-row"
            key={e.id}
            to={"/projetos/" + e.projectId}
          >
            <span className="date-tile">
              <b>{e.date.slice(8)}</b>
              <small>{e.date.slice(5, 7)}</small>
            </span>
            <div className="entity-main">
              <strong>{e.title}</strong>
              <span>
                {s.projects.find((p) => p.id === e.projectId)?.client}
              </span>
            </div>
            <Badge tone={e.date < s.today ? "warning" : "neutral"}>
              {e.type}
            </Badge>
            <ArrowUpRight size={16} />
          </Link>
        ))}
        {!events.length && <Empty title="Agenda livre neste mês" />}
      </Card>
    </>
  );
}
function ProjectDetail() {
  const { projectId = "" } = useParams();
  const { state: s, view: v } = useDemo();
  const { edit, notify } = useApp();
  const cmd = useCommand();
  const [params] = useSearchParams();
  const [receive, setReceive] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  if (!s || !v) return null;
  const project = v.projects.find((p) => p.id === projectId);
  if (!project)
    return (
      <Empty
        title="Projeto não encontrado"
        action={<Link to="/projetos">Voltar aos projetos</Link>}
      />
    );
  const tab = params.get("aba") || "tarefas";
  const tasks = s.tasks.filter((t) => t.projectId === projectId),
    payments = s.payments.filter((p) => p.projectId === projectId),
    docs = s.documents.filter((d) => d.projectId === projectId);
  return (
    <>
      <Link className="back-link" to="/projetos">
        ← Todos os projetos
      </Link>
      <PageHeading
        title={project.name}
        description={`${project.client} · ${project.description}`}
        action={
          <Button
            variant="secondary"
            onClick={() =>
              edit({
                type: "project.save",
                title: "Editar projeto",
                id: project.id,
                initial: {
                  name: project.name,
                  client: project.client,
                  description: project.description,
                  amount: inputMoney(project.amountCents),
                  dueOn: project.dueOn,
                  color: project.color,
                },
              })
            }
          >
            <Pencil size={16} />
            Editar projeto
          </Button>
        }
      />
      <div className="project-overview">
        <Card title="Contratado">
          <strong className="catalog-value">
            {money(project.amountCents)}
          </strong>
        </Card>
        <Card title="Recebido">
          <strong className="catalog-value positive">
            {money(project.received)}
          </strong>
        </Card>
        <Card title="A receber">
          <strong className="catalog-value">{money(project.pending)}</strong>
        </Card>
        <Card title="Andamento">
          <label>
            <span className="sr-only">Situação do projeto</span>
            <select
              value={project.status}
              aria-label="Situação do projeto"
              onChange={(e) =>
                void cmd
                  .mutateAsync({
                    type: "project.status",
                    id: projectId,
                    status: e.target.value as ProjectStatus,
                  })
                  .catch((e) => notify(e.message))
              }
            >
              {PROJECT_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {PROJECT_STATUS_LABEL[st]}
                </option>
              ))}
            </select>
          </label>
        </Card>
      </div>
      <QueryTabs
        fallback="tarefas"
        items={[
          { value: "tarefas", label: "Tarefas e checklist" },
          { value: "cobranca", label: "Cobrança" },
          { value: "horas", label: "Horas" },
          { value: "documentos", label: "Documentos" },
          { value: "propostas", label: "Propostas" },
          { value: "github", label: "GitHub" },
        ]}
      />
      {tab === "tarefas" && (
        <Card
          title="Os próximos passos"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                edit({
                  type: "task.save",
                  title: "Nova tarefa",
                  initial: { projectId },
                })
              }
            >
              <Plus size={15} />
              Nova tarefa
            </Button>
          }
        >
          {tasks.map((t) => (
            <div className="entity-row" key={t.id}>
              <button
                className={
                  "task-check " + (t.status === "done" ? "checked" : "")
                }
                aria-label={
                  t.status === "done"
                    ? "Reabrir " + t.title
                    : "Concluir " + t.title
                }
                onClick={() =>
                  void cmd
                    .mutateAsync({
                      type: "task.move",
                      id: t.id,
                      status: t.status === "done" ? "todo" : "done",
                    })
                    .catch((e) => notify(e.message))
                }
              >
                <Check size={14} />
              </button>
              <div className="entity-main">
                <strong>{t.title}</strong>
                <span>
                  {dateLabel(t.dueOn)}
                  {t.checklist ? " · checklist" : ""}
                </span>
              </div>
              <Badge tone={t.status === "done" ? "positive" : "neutral"}>
                {TASK_LABELS[t.status]}
              </Badge>
              <IconButton
                label={"Editar " + t.title}
                onClick={() =>
                  edit({
                    type: "task.save",
                    title: "Editar tarefa",
                    id: t.id,
                    initial: {
                      projectId,
                      title: t.title,
                      dueOn: t.dueOn,
                      checklist: String(t.checklist),
                    },
                  })
                }
              >
                <Pencil size={15} />
              </IconButton>
            </div>
          ))}
          {!tasks.length && <Empty />}
        </Card>
      )}
      {tab === "cobranca" && (
        <Card
          title="Cobranças e recebimentos"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                edit({
                  type: "payment.save",
                  title: "Agendar cobrança",
                  initial: { projectId },
                })
              }
            >
              <Plus size={15} />
              Agendar cobrança
            </Button>
          }
        >
          {payments.map((p) => (
            <div className="entity-row" key={p.id}>
              <span className="entity-symbol">
                <WalletIcon />
              </span>
              <div className="entity-main">
                <strong>{p.description}</strong>
                <span>Vence {dateLabel(p.dueOn)}</span>
              </div>
              <b>{money(p.amountCents)}</b>
              {p.transactionId ? (
                <Badge tone="positive">Recebido</Badge>
              ) : (
                <Button variant="secondary" onClick={() => setReceive(p.id)}>
                  Receber
                </Button>
              )}
            </div>
          ))}
          {!payments.length && <Empty />}
        </Card>
      )}
      {tab === "horas" && (
        <Card
          title="Esforço registrado"
          subtitle={`${(project.minutes / 60).toFixed(1)} horas neste projeto`}
          action={
            <Button
              variant="secondary"
              onClick={() =>
                edit({
                  type: "session.save",
                  title: "Registrar horas",
                  initial: { projectId, minutes: "60" },
                })
              }
            >
              <Plus size={15} />
              Registrar
            </Button>
          }
        >
          {s.sessions
            .filter((x) => x.projectId === projectId)
            .map((x) => (
              <div className="key-row" key={x.id}>
                <span>
                  {x.description}
                  <small>{dateLabel(x.date)}</small>
                </span>
                <b>{x.minutes} min</b>
              </div>
            ))}
        </Card>
      )}
      {tab === "documentos" && (
        <Card
          title="Arquivos do projeto"
          subtitle="Anexos locais de até 10 MB. Permanecem apenas neste navegador."
        >
          <Field label="Adicionar documento">
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadError("");
                try {
                  await cmd.mutateAsync({
                    type: "document.add",
                    document: {
                      id: crypto.randomUUID(),
                      projectId,
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      blob: file,
                    },
                  });
                  e.target.value = "";
                } catch (error) {
                  setUploadError(
                    error instanceof Error ? error.message : "Falha no anexo.",
                  );
                }
              }}
            />
          </Field>
          {uploadError && <Notice tone="error">{uploadError}</Notice>}
          {docs.map((d) => (
            <div className="entity-row" key={d.id}>
              <FileText size={20} />
              <div className="entity-main">
                <strong>{d.name}</strong>
                <span>{Math.ceil(d.size / 1024)} KB</span>
              </div>
              <IconButton
                label={"Baixar " + d.name}
                onClick={() => downloadFile(d.name, d.blob)}
              >
                <Download size={16} />
              </IconButton>
              <Confirm
                label={"Excluir " + d.name}
                title="Excluir anexo local?"
                description="Este arquivo será removido apenas da demonstração."
                onConfirm={() =>
                  cmd.mutateAsync({ type: "document.delete", id: d.id })
                }
                danger
              >
                <Trash2 size={15} />
              </Confirm>
            </div>
          ))}
          {!docs.length && <Empty title="Os arquivos ficam juntos aqui" />}
        </Card>
      )}
      {tab === "propostas" && (
        <Card
          title="Propostas"
          action={
            <Button
              variant="secondary"
              onClick={() =>
                edit({
                  type: "proposal.save",
                  title: "Nova proposta",
                  initial: { projectId, status: "draft" },
                })
              }
            >
              <Plus size={15} />
              Nova proposta
            </Button>
          }
        >
          {s.proposals
            .filter((p) => p.projectId === projectId)
            .map((p) => (
              <div className="entity-row" key={p.id}>
                <div className="entity-main">
                  <strong>{p.title}</strong>
                  <span>
                    {p.status === "draft"
                      ? "Rascunho"
                      : p.status === "sent"
                        ? "Enviada · simulação"
                        : "Aceita · simulação"}
                  </span>
                </div>
                <b>{money(p.amountCents)}</b>
                <IconButton
                  label={"Editar " + p.title}
                  onClick={() =>
                    edit({
                      type: "proposal.save",
                      title: "Editar proposta",
                      id: p.id,
                      initial: {
                        projectId,
                        title: p.title,
                        amount: inputMoney(p.amountCents),
                        status: p.status,
                      },
                    })
                  }
                >
                  <Pencil size={15} />
                </IconButton>
              </div>
            ))}
        </Card>
      )}
      {tab === "github" && (
        <Card title="GitHub · demonstração">
          <Notice>
            Esta tela simula os estados da integração. Nenhuma conta externa é
            acessada.
          </Notice>
          <Badge tone={s.integrations.github ? "positive" : "neutral"}>
            {s.integrations.github
              ? "Conectado na demonstração"
              : "Desconectado"}
          </Badge>
          <p>
            {s.integrations.github
              ? "Repositório de exemplo · 3 tarefas abertas · última atividade fictícia em 10/11/2026."
              : "Ative a simulação para testar a apresentação de um repositório."}
          </p>
          <Button
            variant="secondary"
            onClick={() =>
              void cmd
                .mutateAsync({ type: "integration.toggle", name: "github" })
                .catch((e) => notify(e.message))
            }
          >
            {s.integrations.github ? "Desativar simulação" : "Simular conexão"}
          </Button>
        </Card>
      )}
      {receive && (
        <ActionDialog
          title="Registrar recebimento"
          description="Cria uma receita na conta escolhida e vincula à cobrança, dentro da demonstração."
          onClose={() => setReceive(null)}
          onSubmit={(f) =>
            cmd.mutateAsync({
              type: "payment.receive",
              id: receive,
              accountId: String(f.get("account")),
            })
          }
        >
          <Field label="Conta de recebimento">
            <select name="account">
              {s.accounts
                .filter((a) => a.kind === "checking" && !a.archivedAt)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </Field>
        </ActionDialog>
      )}
    </>
  );
}
function WalletIcon() {
  return <ArrowUpRight size={18} />;
}
