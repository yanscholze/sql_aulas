import {
  createBrowserRouter,
  Navigate,
  Link,
  useRouteError,
} from "react-router";
import { lazy } from "react";
import Shell from "./shell";
import Dashboard from "../features/dashboard";
import { Empty, Notice } from "../design-system/ui";
const Transactions = lazy(() => import("../features/transactions"));
const Finance = lazy(() => import("../features/finance"));
const Wealth = lazy(() => import("../features/wealth"));
const Work = lazy(() => import("../features/work"));
const Tools = lazy(() => import("../features/tools"));
const Settings = lazy(() => import("../features/settings"));
const Login = lazy(() =>
  import("../features/settings").then((m) => ({ default: m.Login })),
);
const wrap = (Component: React.ComponentType) => <Component />;
function RouteError() {
  const error = useRouteError();
  return (
    <div className="load-error">
      <Notice tone="error">
        {error instanceof Error
          ? error.message
          : "Não foi possível abrir esta página."}
      </Notice>
      <a className="button secondary" href="/painel">
        Voltar ao painel
      </a>
    </div>
  );
}
export const router = createBrowserRouter([
  {
    element: <Shell />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <Navigate to="/painel" replace /> },
      { path: "/painel", element: <Dashboard /> },
      { path: "/lancamentos", element: wrap(Transactions) },
      ...[
        "contas",
        "cartoes",
        "recompensas",
        "planejamento",
        "parcelamentos",
        "assinaturas",
        "orcamentos",
      ].map((path) => ({ path: "/" + path, element: wrap(Finance) })),
      ...[
        "patrimonio",
        "viagens",
        "relatorios",
        "relatorios/renda",
        "relatorios/despesas",
        "relatorios/assinaturas",
      ].map((path) => ({ path: "/" + path, element: wrap(Wealth) })),
      ...[
        "projetos",
        "projetos/quadro",
        "projetos/agenda",
        "projetos/horas",
        "projetos/:projectId",
      ].map((path) => ({ path: "/" + path, element: wrap(Work) })),
      ...["assistente", "automaticos"].map((path) => ({
        path: "/" + path,
        element: wrap(Tools),
      })),
      { path: "/configuracoes", element: wrap(Settings) },
      { path: "/entrar", element: wrap(Login) },
      ...["metas", "investimentos", "saude"].map((aba) => ({
        path: "/" + aba,
        element: <Navigate to={"/patrimonio?aba=" + aba} replace />,
      })),
      {
        path: "/importar",
        element: <Navigate to="/automaticos?aba=importacoes" replace />,
      },
      {
        path: "/conectar",
        element: <Navigate to="/configuracoes?aba=aparelhos" replace />,
      },
      {
        path: "*",
        element: (
          <Empty
            title="Esse caminho ainda não existe"
            description="Volte ao seu espaço para continuar explorando."
            action={
              <Link className="button primary" to="/painel">
                Voltar ao Painel
              </Link>
            }
          />
        ),
      },
    ],
  },
]);
