import {
  useState,
  useEffect,
  useRef,
  useId,
  useCallback,
  useMemo,
  Suspense,
  type MouseEvent,
} from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  AnimatePresence,
  LayoutGroup,
  m,
  useReducedMotion,
} from "motion/react";
import { Dialog as RDialog } from "radix-ui";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  CalendarDays,
  Wallet,
  ChartNoAxesCombined,
  Plane,
  Folder,
  WandSparkles,
  Sparkles,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  ChevronDown,
  LogOut,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { AppContext } from "./context";
import { useDemo, useCommand } from "../data/queries/use-demo";
import { Editor, type EditorSpec } from "../features/forms";
import {
  Button,
  IconButton,
  Loading,
  Modal,
  Notice,
} from "../design-system/ui";
import { ColorTransition, type MotionOrigin } from "../motion/color-transition";
import { warmColorTransition } from "../motion/color-canvas";
import { MotionScene } from "../motion/scene";
import { PageReady, useColorNavigation } from "../motion/navigation";
import { usePanelScroll } from "./use-panel-scroll";
const groups: {
  label: string;
  items: { href: string; label: string; icon: LucideIcon }[];
}[] = [
  {
    label: "SEU ESPAÇO",
    items: [
      { href: "/painel", label: "Painel", icon: LayoutDashboard },
      { href: "/assistente", label: "Fluxo IA", icon: Sparkles },
    ],
  },
  {
    label: "FINANCEIRO",
    items: [
      { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
      { href: "/contas", label: "Contas", icon: Landmark },
      { href: "/cartoes", label: "Cartões", icon: CreditCard },
      { href: "/planejamento", label: "Compromissos", icon: CalendarDays },
      { href: "/orcamentos", label: "Orçamentos", icon: Wallet },
      { href: "/patrimonio", label: "Visão geral", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "SEUS PLANOS",
    items: [
      { href: "/viagens", label: "Viagens", icon: Plane },
      { href: "/projetos", label: "Projetos", icon: Folder },
      { href: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "ORGANIZAÇÃO",
    items: [{ href: "/automaticos", label: "Automações", icon: WandSparkles }],
  },
];
const allRoutes = [
  ...groups.flatMap((g) => g.items),
  { href: "/parcelamentos", label: "Parcelamentos", icon: CreditCard },
  { href: "/assinaturas", label: "Assinaturas", icon: CalendarDays },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/patrimonio?aba=metas", label: "Metas", icon: Landmark },
  {
    href: "/patrimonio?aba=investimentos",
    label: "Investimentos",
    icon: Landmark,
  },
  { href: "/projetos/quadro", label: "Quadro de tarefas", icon: Folder },
];
function motionOriginFromClick(
  event: MouseEvent<HTMLElement>,
  target: Element = event.currentTarget,
): MotionOrigin {
  if (event.detail > 0) return { x: event.clientX, y: event.clientY };
  const rect = target.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
function Navigation({
  onNavigate,
  compact = false,
}: {
  onNavigate: () => void;
  compact?: boolean;
}) {
  const location = useLocation();
  const groupId = useId();
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(
    ["/planejamento", "/parcelamentos", "/assinaturas"].includes(
      location.pathname,
    ),
  );
  return (
    <>
      <Link
        className="brand"
        to="/painel"
        onClick={onNavigate}
        aria-label="fluxo. — Painel"
      >
        <span className="brand-icon" aria-hidden="true">
          <svg width="25" height="28" viewBox="0 0 25 28">
            <path
              fill="currentColor"
              d="M10 28V15H6v-6h4V7c0-5 3-7 8-7h5v6h-4c-2 0-2 1-2 3h5v6h-5v13z"
            />
          </svg>
        </span>
        <span className="brand-word">
          fluxo
          <span className="brand-dot" aria-hidden="true">
            .
          </span>
        </span>
      </Link>
      <LayoutGroup id={groupId}>
        <div className="sidebar-nav">
          {groups.map((g) => (
            <div className="nav-group" key={g.label}>
              <h2>{g.label}</h2>
              {g.items.map((item) => (
                <div key={item.href} className="nav-item-wrap">
                  <NavLink
                    to={item.href}
                    aria-label={item.label}
                    end={item.href === "/projetos"}
                    title={compact ? item.label : undefined}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      "nav-item " + (isActive ? "active" : "")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <m.span
                            className="nav-color-pill"
                            data-motion="nav-pill"
                            layoutId="active-navigation"
                            transition={
                              reduced
                                ? { duration: 0 }
                                : {
                                    type: "spring",
                                    stiffness: 460,
                                    damping: 27,
                                    mass: 0.8,
                                  }
                            }
                          />
                        )}
                        <item.icon size={17} strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                  {item.href === "/planejamento" && !compact && (
                    <button
                      className="subnav-toggle"
                      onClick={() => setExpanded(!expanded)}
                      aria-label="Mostrar parcelamentos e assinaturas"
                      aria-expanded={expanded}
                    >
                      <ChevronDown size={13} />
                    </button>
                  )}
                  {item.href === "/planejamento" && expanded && !compact && (
                    <div className="subnav">
                      <NavLink onClick={onNavigate} to="/parcelamentos">
                        Parcelamentos
                      </NavLink>
                      <NavLink onClick={onNavigate} to="/assinaturas">
                        Assinaturas
                      </NavLink>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </LayoutGroup>
    </>
  );
}
export default function Shell() {
  const { state: s, error, refetch, isLoading } = useDemo();
  const cmd = useCommand();
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [theme, setThemeState] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  const [editor, setEditor] = useState<EditorSpec | null>(null),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [notices, setNotices] = useState(false),
    [menu, setMenu] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [toast, setToast] = useState("");
  const colorNavigation = useColorNavigation(navigate, reduced);
  const panelScroll = usePanelScroll(location.key, colorNavigation.ready);
  const transition = colorNavigation.transition;
  const colorLayer = transition && (
    <ColorTransition
      key={transition.id}
      origin={transition.origin}
      phase={transition.phase}
      onCovered={() => {
        setMenu(false);
        colorNavigation.covered(transition.id);
      }}
      onComplete={() => colorNavigation.complete(transition.id)}
    />
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  }, []);
  const setTheme = useCallback(
    (value: string) => {
      setThemeState(value);
      document.documentElement.dataset.theme = value;
      try {
        localStorage.setItem("fluxo-ui:theme", value);
      } catch {
        notify("Tema aplicado; o navegador não permitiu salvar a preferência.");
      }
    },
    [notify],
  );
  const appContext = useMemo(
    () => ({ edit: setEditor, notify, theme, setTheme }),
    [notify, theme, setTheme],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!reduced) warmColorTransition();
  }, [reduced]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  if (location.pathname === "/entrar")
    return (
      <AppContext.Provider value={appContext}>
        {colorLayer}
        <Suspense fallback={<Loading />}>
          <PageReady routeKey={location.key} onReady={panelScroll.restore}>
            <Outlet />
          </PageReady>
        </Suspense>
        {toast && (
          <div role="status" className="toast">
            {toast}
          </div>
        )}
      </AppContext.Provider>
    );
  return (
    <AppContext.Provider value={appContext}>
      <div
        className={"app-shell " + (collapsed ? "collapsed" : "")}
        onClickCapture={(event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.defaultPrevented ||
            editor
          )
            return;
          const anchor = (event.target as Element).closest("a[href]");
          if (!anchor) return;
          if (
            anchor.hasAttribute("download") ||
            anchor.getAttribute("target") === "_blank"
          )
            return;
          const url = new URL(
            anchor.getAttribute("href")!,
            window.location.href,
          );
          if (
            url.origin !== window.location.origin ||
            (url.pathname === location.pathname && !transition?.to)
          )
            return;
          if (reduced) return;
          event.preventDefault();
          event.stopPropagation();
          colorNavigation.start(
            motionOriginFromClick(event, anchor),
            url.pathname + url.search + url.hash,
          );
        }}
      >
        {colorLayer}
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        <aside className="sidebar desktop-sidebar">
          <Navigation compact={collapsed} onNavigate={() => {}} />
          <div className="sidebar-bottom">
            <div className="demo-badge">
              <span className="status-dot" />
              <strong>Seu espaço para explorar</strong>
              <p>Demonstração com dados fictícios.</p>
            </div>
            <NavLink
              className="nav-item"
              to="/configuracoes"
              aria-label="Configurações"
            >
              <Settings size={17} />
              <span>Configurações</span>
            </NavLink>
            <Link to="/configuracoes?aba=perfil" className="sidebar-profile">
              <span className="avatar">
                {s?.profile.name.slice(0, 1) || "A"}
              </span>
              <div>
                <strong>{s?.profile.name || "Seu perfil"}</strong>
                <small>Conta demonstrativa</small>
              </div>
              <LogOut size={14} />
            </Link>
          </div>
          <IconButton
            label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={15} />
            ) : (
              <PanelLeftClose size={15} />
            )}
          </IconButton>
        </aside>
        <div className="main-surface">
          <header className="topbar">
            <div className="topbar-left">
              <IconButton
                className="mobile-menu"
                label="Abrir menu"
                onClick={() => setMenu(true)}
              >
                <Menu size={21} />
              </IconButton>
              <span className="breadcrumb">
                <span className="status-dot" /> Seu espaço financeiro{" "}
                <span>/</span>{" "}
                <b>
                  {allRoutes.find((r) => r.href === location.pathname)?.label ??
                    "Detalhes"}
                </b>
              </span>
            </div>
            <div className="topbar-actions">
              <button
                className="motion-replay-button"
                aria-label="Rever animações"
                title="Rever animações"
                onClick={(event) => {
                  colorNavigation.start(motionOriginFromClick(event));
                }}
              >
                <RotateCcw size={16} />
                <span>Rever animações</span>
              </button>
              <button
                ref={searchTrigger}
                className="global-search"
                onClick={() => {
                  setQuery("");
                  setSearch(true);
                }}
                aria-label="Buscar no Fluxo ⌘ K"
              >
                <Search size={16} />
                <span>Buscar no Fluxo</span>
                <kbd aria-hidden="true">⌘ K</kbd>
              </button>
              <IconButton
                label={
                  theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
                }
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </IconButton>
              <button
                className="icon-button notification-button"
                aria-label="Notificações"
                onClick={() => setNotices(true)}
              >
                <Bell size={19} />
                {s?.notifications.some((n) => !n.read) && <i />}
              </button>
              <Link
                className="avatar header-avatar"
                aria-label="Meu perfil"
                to="/configuracoes?aba=perfil"
              >
                {s?.profile.name.slice(0, 1) || "A"}
              </Link>
            </div>
          </header>
          <main
            id="conteudo"
            tabIndex={-1}
            ref={panelScroll.ref}
            onScroll={panelScroll.remember}
          >
            {isLoading ? (
              <Loading />
            ) : error ? (
              <PageReady routeKey={location.key} onReady={panelScroll.restore}>
                <div className="load-error">
                  <Notice tone="error">
                    Não foi possível abrir a demonstração: {error.message}
                  </Notice>
                  <Button onClick={() => void refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              </PageReady>
            ) : (
              <MotionScene
                key={location.pathname}
                replay={colorNavigation.replay}
              >
                <Suspense fallback={<Loading />}>
                  <PageReady
                    routeKey={location.key}
                    onReady={panelScroll.restore}
                  >
                    <div className="page-content">
                      <Outlet />
                    </div>
                  </PageReady>
                </Suspense>
              </MotionScene>
            )}
          </main>
        </div>
        <nav className="bottom-nav" aria-label="Navegação rápida">
          <NavLink to="/painel">
            <LayoutDashboard size={20} />
            <span>Painel</span>
          </NavLink>
          <NavLink to="/lancamentos">
            <ArrowLeftRight size={20} />
            <span>Movimentos</span>
          </NavLink>
          <button
            className="quick-add"
            aria-label="Novo lançamento"
            onClick={() =>
              setEditor({ type: "transaction.save", title: "Novo lançamento" })
            }
          >
            <Plus size={24} />
          </button>
          <NavLink to="/assistente">
            <Sparkles size={20} />
            <span>Fluxo IA</span>
          </NavLink>
          <button onClick={() => setMenu(true)} aria-label="Abrir menu">
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </nav>
        <RDialog.Root open={menu} onOpenChange={setMenu}>
          <RDialog.Portal>
            <RDialog.Overlay className="dialog-overlay" />
            <RDialog.Content className="mobile-drawer">
              <RDialog.Title className="sr-only">Menu principal</RDialog.Title>
              <RDialog.Description className="sr-only">
                Navegue pelas áreas do Fluxo.
              </RDialog.Description>
              <RDialog.Close asChild>
                <IconButton label="Fechar menu" className="drawer-close">
                  <X size={20} />
                </IconButton>
              </RDialog.Close>
              <Navigation onNavigate={() => setMenu(false)} />
              <NavLink
                to="/configuracoes"
                className="nav-item"
                onClick={() => setMenu(false)}
              >
                <Settings size={18} />
                Configurações
              </NavLink>
            </RDialog.Content>
          </RDialog.Portal>
        </RDialog.Root>
        <Modal
          open={search}
          onClose={() => {
            setSearch(false);
            searchTrigger.current?.focus();
          }}
          title="Para onde vamos?"
          description="Encontre uma área do seu Fluxo."
        >
          <label className="search-field command-search">
            <Search size={18} />
            <span className="sr-only">Buscar área</span>
            <input
              placeholder="Contas, metas, projetos…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="command-results">
            {allRoutes
              .filter((r) =>
                r.label
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .includes(
                    query
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase(),
                  ),
              )
              .map((r) => (
                <button
                  key={r.href}
                  onClick={(event) => {
                    setSearch(false);
                    colorNavigation.start(motionOriginFromClick(event), r.href);
                  }}
                >
                  <r.icon size={18} />
                  {r.label}
                  <ArrowUpRight size={16} />
                </button>
              ))}
          </div>
        </Modal>
        <Modal
          open={notices}
          onClose={() => setNotices(false)}
          title="Seu radar"
          description="Avisos da demonstração."
        >
          {s?.notifications.map((n) => (
            <div className="notification-item" key={n.id}>
              <span className={n.read ? "read-dot" : "status-dot"} />
              <div>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
                <Button
                  variant="ghost"
                  onClick={(event) => {
                    const origin = motionOriginFromClick(event);
                    void cmd
                      .mutateAsync({ type: "notification.read", id: n.id })
                      .then(() => {
                        setNotices(false);
                        colorNavigation.start(origin, n.href);
                      })
                      .catch((e) => notify(e.message));
                  }}
                >
                  Conferir <ArrowUpRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </Modal>
        {editor && s && (
          <Editor
            key={editor.id ?? editor.type}
            spec={editor}
            onClose={() => setEditor(null)}
            onSaved={() => notify("Salvo na demonstração")}
          />
        )}
        <AnimatePresence>
          {toast && (
            <m.div
              role="status"
              className="toast"
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="status-dot" />
              {toast}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
}
