import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import {
  Plus,
  Sparkles,
  Send,
  Upload,
  Check,
  X,
  Pencil,
  FileText,
  Camera,
  ArrowUpRight,
} from "lucide-react";
import {
  PageHeading,
  Card,
  Button,
  Badge,
  Field,
  Empty,
  Notice,
  IconButton,
  Confirm,
} from "../design-system/ui";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { useApp } from "../app/context";
import { QueryTabs } from "./common";
import { money, inputMoney, dateLabel } from "../shared/format";
import type { ImportBatch } from "../data/contracts/models";
export default function Tools() {
  const { pathname } = useLocation();
  return pathname === "/assistente" ? <Assistant /> : <Automations />;
}
function Assistant() {
  const { state: s } = useDemo();
  const cmd = useCommand();
  const { notify, edit } = useApp();
  const [params, setParams] = useSearchParams();
  const [message, setMessage] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const conversation = s?.conversations.find(
    (c) => c.id === params.get("conversa"),
  );
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [conversation?.messages.length]);
  if (!s) return null;
  async function send(text: string) {
    if (!text.trim() || cmd.isPending) return;
    const id = conversation?.id ?? crypto.randomUUID();
    try {
      await cmd.mutateAsync({ type: "conversation.send", id, text });
      setParams({ conversa: id });
      setMessage("");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Não foi possível enviar.");
    }
  }
  return (
    <>
      <PageHeading
        title="Vamos olhar juntos?"
        description="Um espaço para entender seus números e organizar os próximos passos."
      />
      <div className="assistant-layout">
        <aside className="conversation-sidebar">
          <Button
            variant="secondary"
            onClick={() => {
              setParams({});
              setMessage("");
            }}
          >
            <Plus size={16} />
            Nova conversa
          </Button>
          <h2>Suas conversas</h2>
          {s.conversations.map((c) => (
            <button
              key={c.id}
              className={c.id === conversation?.id ? "active" : ""}
              onClick={() => setParams({ conversa: c.id })}
            >
              <span>{c.title}</span>
              <ArrowUpRight size={14} />
            </button>
          ))}
          {!s.conversations.length && <p>Seu histórico aparece aqui.</p>}
          <div className="assistant-demo">
            <Sparkles size={18} />
            <strong>Uma prévia do Fluxo IA</strong>
            <p>
              Respostas locais de demonstração. Nenhuma chamada a um provedor de
              IA.
            </p>
          </div>
        </aside>
        <Card className="chat-panel">
          <div className="chat-heading">
            <span className="assistant-avatar">
              <Sparkles size={20} />
            </span>
            <div>
              <h2>Fluxo IA</h2>
              <span>Modo demonstração</span>
            </div>
            <Badge tone="positive">Local</Badge>
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-label="Conversa demonstrativa"
          >
            {!conversation ? (
              <div className="chat-welcome">
                <span className="welcome-orbit">
                  <Sparkles size={34} />
                </span>
                <h2>
                  Mais clareza.
                  <br />
                  Um passo de cada vez.
                </h2>
                <p>
                  Explore seus dados fictícios e experimente como uma conversa
                  financeira pode funcionar.
                </p>
                <div className="suggestions">
                  {[
                    "Quanto tenho livre para gastar?",
                    "Como estão minhas faturas?",
                    "Como está minha reserva?",
                    "Quais são as maiores despesas?",
                  ].map((q) => (
                    <button key={q} onClick={() => void send(q)}>
                      {q}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              conversation.messages.map((m) => (
                <div key={m.id} className={"chat-message " + m.role}>
                  {m.role === "assistant" && (
                    <span className="assistant-avatar">
                      <Sparkles size={15} />
                    </span>
                  )}
                  <div>
                    <strong>
                      {m.role === "assistant" ? "Fluxo · demonstração" : "Você"}
                    </strong>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={end} />
          </div>
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send(message);
            }}
          >
            <label className="sr-only" htmlFor="message">
              Mensagem
            </label>
            <textarea
              id="message"
              rows={1}
              placeholder="O que você quer entender hoje?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(message);
                }
              }}
            />
            <Button
              busy={cmd.isPending}
              disabled={!message.trim()}
              aria-label="Enviar mensagem"
            >
              <Send size={18} />
            </Button>
          </form>
          <small className="chat-disclaimer">
            Demonstração de interface. Respostas limitadas a cenários
            conhecidos.
          </small>
        </Card>
      </div>
      <Card
        title="Um comprovante, menos digitação"
        subtitle="Experimente a revisão de um exemplo. Não há reconhecimento de imagem ativo."
      >
        <Button
          variant="secondary"
          onClick={() =>
            edit({
              type: "transaction.save",
              title: "Revisar comprovante de exemplo",
              initial: {
                description: "Padaria · exemplo de comprovante",
                amount: "34,80",
                categoryId: "food",
                kind: "expense",
              },
            })
          }
        >
          <Camera size={17} />
          Testar exemplo de comprovante
        </Button>
      </Card>
    </>
  );
}
function Automations() {
  const { state: s } = useDemo();
  const cmd = useCommand();
  const { edit, notify } = useApp();
  const [params, setParams] = useSearchParams();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [account, setAccount] = useState("acc-main");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  if (!s) return null;
  const tab = params.get("aba") || "automacoes";
  const batch =
    s.imports.find((b) => b.id === params.get("lote")) ?? s.imports.at(-1);
  async function parseFile(file: File) {
    if (!s) return;
    setError("");
    setBusy(true);
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Use um extrato de até 5 MB.");
      const text = await file.text();
      const result = file.name.toLowerCase().endsWith(".ofx")
        ? (await import("@fluxo/core/domain/import/ofx-parser.ts")).parseOfx(
            text,
          )
        : (await import("@fluxo/core/domain/import/csv-parser.ts")).parseCsv(
            text,
          );
      const { fingerprintOf, isDuplicate } =
        await import("@fluxo/core/domain/import/fingerprint.ts");
      const target = { kind: "account" as const, accountId: account };
      const known = new Set(
        s.transactions
          .map((t) => t.fingerprint)
          .filter((f): f is string => Boolean(f)),
      );
      const batch: ImportBatch = {
        id: crypto.randomUUID(),
        name: file.name,
        accountId: account,
        confirmed: false,
        discarded: result.discarded.length,
        rows: result.rows.map((row) => {
          const fingerprint = fingerprintOf(row, target);
          const duplicate =
            isDuplicate(row, target, known) ||
            s.transactions.some(
              (t) =>
                t.origin.kind === "account" &&
                t.origin.accountId === account &&
                t.occurredOn === row.date &&
                t.amount === Math.abs(row.amount) &&
                t.description.trim().toLowerCase() ===
                  row.description.trim().toLowerCase(),
            );
          known.add(fingerprint);
          const rule = s.captureRules.find((r) =>
            row.description.toLowerCase().includes(r.match.toLowerCase()),
          );
          return {
            id: crypto.randomUUID(),
            description: row.description,
            date: row.date,
            amountCents: row.amount,
            fingerprint,
            duplicate,
            accepted: false,
            categoryId: rule?.categoryId ?? "",
          };
        }),
      };
      await cmd.mutateAsync({ type: "import.add", batch });
      setParams({ aba: "importacoes", lote: batch.id });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível ler o arquivo.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Menos trabalho repetido."
        description="Revise as sugestões antes de transformar informação em lançamento."
      />
      <QueryTabs
        items={[
          { value: "automacoes", label: "Capturas" },
          { value: "importacoes", label: "Importações" },
        ]}
        fallback="automacoes"
      />
      {tab === "automacoes" ? (
        <>
          <div className="split two-one">
            <Card
              title="Sua caixa de revisão"
              subtitle="Capturas fictícias, ainda sem efeito no saldo"
            >
              <div className="entity-list">
                {s.captures.map((c) => (
                  <div className="capture-row" key={c.id}>
                    <span className="entity-symbol">
                      <FileText size={19} />
                    </span>
                    <div className="entity-main">
                      <strong>{c.description}</strong>
                      <span>
                        {dateLabel(c.date)} ·{" "}
                        {s.categories.find((x) => x.id === c.categoryId)?.name}
                      </span>
                    </div>
                    <b>{money(c.amountCents)}</b>
                    {c.status === "review" ? (
                      <div className="row-actions">
                        <IconButton
                          label={"Editar " + c.description}
                          onClick={() =>
                            edit({
                              type: "capture.save",
                              id: c.id,
                              title: "Revisar captura",
                              initial: {
                                description: c.description,
                                amount: inputMoney(c.amountCents),
                                categoryId: c.categoryId,
                                accountId: c.accountId,
                              },
                            })
                          }
                        >
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton
                          label={"Ignorar " + c.description}
                          disabled={cmd.isPending}
                          onClick={() =>
                            void cmd
                              .mutateAsync({
                                type: "capture.resolve",
                                id: c.id,
                                accept: false,
                              })
                              .catch((e) => notify(e.message))
                          }
                        >
                          <X size={16} />
                        </IconButton>
                        <Button
                          variant="secondary"
                          busy={cmd.isPending}
                          onClick={() =>
                            void cmd
                              .mutateAsync({
                                type: "capture.resolve",
                                id: c.id,
                                accept: true,
                              })
                              .catch((e) => notify(e.message))
                          }
                        >
                          <Check size={15} />
                          Confirmar
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        tone={c.status === "accepted" ? "positive" : "neutral"}
                      >
                        {c.status === "accepted" ? "Confirmada" : "Ignorada"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Você mantém o controle">
              <span className="round-feature">
                <Check size={28} />
              </span>
              <h3>
                {s.captures.filter((c) => c.status === "review").length}{" "}
                capturas para revisar
              </h3>
              <p>Nenhuma captura altera seus saldos antes da confirmação.</p>
              <Link className="text-link" to="/configuracoes?aba=aparelhos">
                Ver aparelhos demonstrativos
              </Link>
            </Card>
          </div>
          <Card
            title="Regras de categorização"
            subtitle="Aplicadas à sugestão de categoria nas próximas importações"
            action={
              <Button
                variant="secondary"
                onClick={() =>
                  edit({ type: "capture-rule.save", title: "Nova regra" })
                }
              >
                <Plus size={15} />
                Nova regra
              </Button>
            }
          >
            {s.captureRules.map((r) => (
              <div className="key-row" key={r.id}>
                <span>Contém “{r.match}”</span>
                <b>{s.categories.find((c) => c.id === r.categoryId)?.name}</b>
              </div>
            ))}
            {!s.captureRules.length && (
              <Empty
                title="Ensine os padrões do seu extrato"
                description="Exemplo: descrições que contêm mercado sugerem Alimentação."
              />
            )}
          </Card>
        </>
      ) : (
        <>
          <Card
            title="Traga um extrato para experimentar"
            subtitle="Leitura local de CSV e OFX. Nenhum arquivo é enviado a um servidor."
          >
            <div className="import-upload">
              <Field label="Conta de destino">
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  {s.accounts
                    .filter((a) => !a.archivedAt)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Selecionar extrato">
                <input
                  type="file"
                  accept=".csv,.ofx"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void parseFile(file);
                    e.target.value = "";
                  }}
                />
              </Field>
              <Upload size={26} />
            </div>
            {busy && <Notice>Lendo o extrato…</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
          </Card>
          <div className="toolbar">
            {s.imports.map((b) => (
              <Button
                key={b.id}
                variant={b.id === batch?.id ? "primary" : "secondary"}
                onClick={() => setParams({ aba: "importacoes", lote: b.id })}
              >
                {b.name}
              </Button>
            ))}
          </div>
          {batch && (
            <Card
              title={batch.name}
              subtitle={`${batch.rows.length} linhas · ${batch.rows.filter((r) => r.duplicate).length} duplicadas · ${batch.discarded} descartadas pelo parser`}
              action={
                <Badge tone={batch.confirmed ? "positive" : "warning"}>
                  {batch.confirmed ? "Revisão concluída" : "Aguardando revisão"}
                </Badge>
              }
            >
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">Revisão de importação</caption>
                  <thead>
                    <tr>
                      <th>Importar</th>
                      <th>Descrição</th>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={"Importar " + r.description}
                            disabled={batch.confirmed || r.duplicate}
                            checked={
                              batch.confirmed
                                ? r.accepted
                                : (selected[r.id] ?? !r.duplicate)
                            }
                            onChange={(e) =>
                              setSelected({
                                ...selected,
                                [r.id]: e.target.checked,
                              })
                            }
                          />
                        </td>
                        <td>{r.description}</td>
                        <td>{dateLabel(r.date)}</td>
                        <td>
                          {money(
                            r.amountCents,
                            s.accounts.find((a) => a.id === batch.accountId)
                              ?.currency,
                          )}
                        </td>
                        <td>
                          <Badge
                            tone={
                              r.duplicate
                                ? "warning"
                                : r.accepted
                                  ? "positive"
                                  : "neutral"
                            }
                          >
                            {r.duplicate
                              ? "Duplicada"
                              : r.accepted
                                ? "Importada"
                                : "Nova"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!batch.confirmed && (
                <Confirm
                  label="Confirmar selecionados"
                  title="Registrar linhas selecionadas?"
                  description="Somente as linhas novas selecionadas entrarão no extrato da demonstração."
                  onConfirm={() =>
                    cmd.mutateAsync({
                      type: "import.confirm",
                      id: batch.id,
                      selected: batch.rows
                        .filter(
                          (r) =>
                            (selected[r.id] ?? !r.duplicate) && !r.duplicate,
                        )
                        .map((r) => r.id),
                    })
                  }
                />
              )}
            </Card>
          )}
        </>
      )}
    </>
  );
}
