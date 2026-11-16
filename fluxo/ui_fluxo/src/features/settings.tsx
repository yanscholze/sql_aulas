import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Plus,
  Pencil,
  Sun,
  Moon,
  Monitor,
  Download,
  RotateCcw,
  ShieldCheck,
  LogOut,
  Smartphone,
} from "lucide-react";
import {
  PageHeading,
  Card,
  Button,
  Badge,
  Field,
  Confirm,
  IconButton,
  Notice,
} from "../design-system/ui";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { useApp } from "../app/context";
import { QueryTabs } from "./common";
import { downloadFile } from "../shared/format";
export default function Settings() {
  const { state: s } = useDemo();
  const cmd = useCommand();
  const { edit, notify, theme, setTheme } = useApp();
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const tab = params.get("aba") || "perfil";
  if (!s) return null;
  return (
    <>
      <PageHeading
        title="Do seu jeito."
        description="Ajustes para o seu espaço financeiro. Preferências salvas neste navegador."
      />
      <QueryTabs
        fallback="perfil"
        items={[
          { value: "perfil", label: "Perfil" },
          { value: "categorias", label: "Categorias" },
          { value: "aparencia", label: "Aparência" },
          { value: "integracoes", label: "Integrações" },
          { value: "aparelhos", label: "Aparelhos" },
          { value: "seguranca", label: "Sessão e dados" },
        ]}
      />
      {tab === "perfil" && (
        <Card title="Seu perfil de demonstração">
          <div className="profile-large">
            <span className="avatar large">{s.profile.name.slice(0, 1)}</span>
            <div>
              <h2>{s.profile.name}</h2>
              <p>{s.profile.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              edit({
                type: "profile.save",
                title: "Editar perfil fictício",
                initial: s.profile,
              })
            }
          >
            <Pencil size={15} />
            Editar perfil
          </Button>
        </Card>
      )}
      {tab === "categorias" && (
        <Card
          title="Um nome para cada movimento"
          subtitle="Categorias essenciais alimentam a estimativa da reserva."
          action={
            <Button
              variant="secondary"
              onClick={() =>
                edit({
                  type: "category.save",
                  title: "Nova categoria",
                  initial: { kind: "expense" },
                })
              }
            >
              <Plus size={15} />
              Nova categoria
            </Button>
          }
        >
          {s.categories.map((c) => (
            <div className="entity-row" key={c.id}>
              <span className="category-dot" style={{ background: c.color }} />
              <div className="entity-main">
                <strong>{c.name}</strong>
                <span>
                  {c.kind === "income" ? "Receita" : "Despesa"}
                  {c.essential ? " · essencial" : ""}
                  {c.excluded ? " · fora da folga do ciclo" : ""}
                </span>
              </div>
              <IconButton
                label={"Editar " + c.name}
                onClick={() =>
                  edit({
                    type: "category.save",
                    id: c.id,
                    title: "Editar categoria",
                    initial: {
                      name: c.name,
                      kind: c.kind,
                      color: c.color,
                      essential: String(c.essential),
                      excluded: String(c.excluded),
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
      {tab === "aparencia" && (
        <Card
          title="Um ambiente que combina com você"
          subtitle="A identidade azul acompanha os dois temas."
        >
          <div className="theme-options">
            {[
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Escuro", icon: Moon },
            ].map((t) => (
              <button
                className={
                  "theme-option " + (theme === t.value ? "selected" : "")
                }
                key={t.value}
                onClick={() => setTheme(t.value)}
                aria-pressed={theme === t.value}
              >
                <div className={"theme-preview " + t.value}>
                  <span />
                  <i />
                  <i />
                  <i />
                </div>
                <span>
                  <t.icon size={18} />
                  {t.label}
                </span>
                {theme === t.value && (
                  <Badge tone="positive">Selecionado</Badge>
                )}
              </button>
            ))}
          </div>
          <Notice>
            O movimento reduzido acompanha a preferência de acessibilidade do
            seu dispositivo.
          </Notice>
        </Card>
      )}
      {tab === "integracoes" && (
        <div className="split">
          {(["ai", "github"] as const).map((name) => (
            <Card
              key={name}
              title={name === "ai" ? "Provedor de IA" : "GitHub"}
              subtitle="Simulação de interface"
            >
              <Badge tone={s.integrations[name] ? "positive" : "neutral"}>
                {s.integrations[name] ? "Simulação ativa" : "Desconectado"}
              </Badge>
              <p>
                Nenhuma chave ou conta externa é necessária. Esta opção altera
                somente o estado visual da demonstração.
              </p>
              <Button
                variant="secondary"
                onClick={() =>
                  void cmd
                    .mutateAsync({ type: "integration.toggle", name })
                    .catch((e) => notify(e.message))
                }
              >
                {s.integrations[name]
                  ? "Desativar simulação"
                  : "Simular conexão"}
              </Button>
            </Card>
          ))}
        </div>
      )}
      {tab === "aparelhos" && (
        <Card
          title="Seus aparelhos"
          subtitle="Pareamento demonstrativo. Nenhuma conexão com Android é realizada."
        >
          {s.devices.map((d) => (
            <div className="entity-row" key={d.id}>
              <Smartphone size={24} />
              <div className="entity-main">
                <strong>{d.name}</strong>
                <span>Ambiente de demonstração</span>
              </div>
              <Badge tone={d.active ? "positive" : "neutral"}>
                {d.active ? "Autorizado · demo" : "Revogado · demo"}
              </Badge>
              <Button
                variant="secondary"
                onClick={() =>
                  void cmd
                    .mutateAsync({ type: "device.toggle", id: d.id })
                    .catch((e) => notify(e.message))
                }
              >
                {d.active ? "Simular revogação" : "Simular pareamento"}
              </Button>
            </div>
          ))}
        </Card>
      )}
      {tab === "seguranca" && (
        <div className="split">
          <Card
            title="Sessão demonstrativa"
            subtitle="Não há autenticação ou senha real nesta aplicação."
          >
            <ShieldCheck size={28} />
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                setPassword("");
                notify(
                  "Validação demonstrativa concluída. Nenhuma senha foi armazenada.",
                );
              }}
            >
              <Field
                label="Testar campo de nova senha"
                hint="Exemplo de validação. Use pelo menos 10 caracteres."
              >
                <input
                  type="password"
                  minLength={10}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Button variant="secondary">Testar validação</Button>
            </form>
            <Link className="button ghost" to="/entrar">
              <LogOut size={16} />
              Voltar à tela de entrada
            </Link>
          </Card>
          <Card
            title="Os dados são seus"
            subtitle="Somente os registros fictícios deste navegador."
          >
            <Button
              variant="secondary"
              onClick={() =>
                downloadFile(
                  "fluxo-demonstracao.json",
                  JSON.stringify(
                    {
                      ...s,
                      documents: s.documents.map(({ blob: _blob, ...d }) => d),
                    },
                    null,
                    2,
                  ),
                  "application/json",
                )
              }
            >
              <Download size={16} />
              Exportar demonstração
            </Button>
            <p>
              O JSON inclui os registros e metadados. Baixe os anexos
              separadamente na área de projetos.
            </p>
            <Confirm
              label="Restaurar demonstração"
              title="Recomeçar a demonstração?"
              description="Substitui os registros locais pelos exemplos iniciais. Não toca no projeto oficial do Fluxo."
              onConfirm={() => cmd.mutateAsync({ type: "demo.reset" })}
              danger
            >
              <RotateCcw size={16} />
              Restaurar demonstração
            </Confirm>
          </Card>
        </div>
      )}
      <p className="page-footnote">
        <Monitor size={14} /> Interface independente · sem backend ou banco de
        dados remoto.
      </p>
    </>
  );
}
export function Login() {
  const { state: s } = useDemo();
  const cmd = useCommand();
  const navigate = useNavigate();
  const [signup, setSignup] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="login-page">
      <div className="login-story">
        <Link to="/painel" className="brand">
          <span className="brand-icon">f</span>fluxo
          <span className="brand-dot">.</span>
        </Link>
        <div>
          <span className="eyebrow">UM NOVO OLHAR PARA O SEU DINHEIRO</span>
          <h1>
            Mais clareza.
            <br />
            Mais possibilidades.
          </h1>
          <p>
            Seu presente organizado.
            <br />
            Seus próximos planos, mais perto.
          </p>
          <div className="login-orbit">
            <span />
            <span />
            <i>f</i>
          </div>
        </div>
        <small>Demonstração de interface · dados fictícios</small>
      </div>
      <div className="login-form">
        <h2>
          {signup
            ? "Seu próximo capítulo começa aqui."
            : "Bom ter você por aqui."}
        </h2>
        <p>
          {signup
            ? "Experimente o cadastro com um perfil fictício."
            : "Entre na demonstração e explore o novo Fluxo."}
        </p>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setError("");
            try {
              if (signup)
                await cmd.mutateAsync({
                  type: "profile.save",
                  values: {
                    name: String(f.get("name")),
                    email: String(f.get("email")),
                  },
                });
              navigate("/painel");
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Não foi possível entrar.",
              );
            }
          }}
        >
          {signup && (
            <Field label="Como quer ser chamado?">
              <input name="name" required autoComplete="off" />
            </Field>
          )}
          <Field label="E-mail fictício">
            <input
              name="email"
              type="email"
              required
              defaultValue={s?.profile.email ?? "alex@exemplo.test"}
              autoComplete="off"
            />
          </Field>
          <Field
            label="Senha demonstrativa"
            hint="Não é verificada nem armazenada."
          >
            <input
              name="password"
              type="password"
              minLength={signup ? 10 : undefined}
              placeholder="Somente para testar a interface"
              autoComplete="off"
            />
          </Field>
          {error && <Notice tone="error">{error}</Notice>}
          <Button busy={cmd.isPending}>
            {signup ? "Criar perfil de demonstração" : "Explorar demonstração"}
          </Button>
        </form>
        <button className="text-link" onClick={() => setSignup(!signup)}>
          {signup ? "Já tenho um perfil" : "Quero experimentar o cadastro"}
        </button>
        <p className="login-note">
          Frontend local. Nenhuma credencial é enviada a um servidor.
        </p>
      </div>
    </div>
  );
}
