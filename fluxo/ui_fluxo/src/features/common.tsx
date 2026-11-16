import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useSearchParams } from "react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  ChevronRight,
} from "lucide-react";
import { money, dateLabel } from "../shared/format";
import { useDemo } from "../data/queries/use-demo";
import type { Entry } from "../data/contracts/models";
export function AreaTabs({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  return (
    <nav className="area-tabs" aria-label="Seções desta área">
      {items.map((i) => (
        <NavLink
          key={i.href}
          to={i.href}
          end
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
export function QueryTabs({
  items,
  param = "aba",
  fallback,
}: {
  items: { value: string; label: string }[];
  param?: string;
  fallback: string;
}) {
  const [params, setParams] = useSearchParams();
  return (
    <nav className="area-tabs" aria-label="Seções desta área">
      {items.map((i) => (
        <button
          key={i.value}
          aria-current={
            (params.get(param) || fallback) === i.value ? "page" : undefined
          }
          className={
            (params.get(param) || fallback) === i.value ? "active" : ""
          }
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set(param, i.value);
            setParams(next);
          }}
        >
          {i.label}
        </button>
      ))}
    </nav>
  );
}
export function QuerySearch({
  placeholder = "Pesquisar…",
}: {
  placeholder?: string;
}) {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  useEffect(() => {
    if (draft === query) return;
    const timer = setTimeout(() => {
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          if (draft) next.set("q", draft);
          else next.delete("q");
          next.delete("pagina");
          return next;
        },
        { replace: true },
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [draft, query, setParams]);
  return (
    <label className="search-field">
      <Search size={16} />
      <span className="sr-only">{placeholder}</span>
      <input
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
    </label>
  );
}
export function QuerySelect({
  name,
  label,
  options,
  defaultValue = "",
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  const [params, setParams] = useSearchParams();
  return (
    <label className="filter-select">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={params.get(name) ?? defaultValue}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set(name, e.target.value);
          else next.delete(name);
          next.delete("pagina");
          setParams(next);
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function TransactionRows({
  rows,
  actions,
}: {
  rows: Entry[];
  actions?: (t: Entry) => ReactNode;
}) {
  const { state } = useDemo();
  return (
    <div className="entity-list">
      {rows.map((t) => {
        const category = state!.categories.find((c) => c.id === t.categoryId);
        const income = t.kind === "income" || t.kind === "refund";
        return (
          <div className="entity-row" key={t.id}>
            <span
              className={`entity-symbol ${income ? "income" : t.kind === "transfer" ? "transfer" : "expense"}`}
            >
              {t.kind === "transfer" ? (
                <ArrowLeftRight size={17} />
              ) : income ? (
                <ArrowDownLeft size={17} />
              ) : (
                <ArrowUpRight size={17} />
              )}
            </span>
            <div className="entity-main">
              <strong>{t.description}</strong>
              <span>
                {category?.name ??
                  (t.kind === "invoice_payment"
                    ? "Pagamento de fatura"
                    : "Transferência")}{" "}
                · {dateLabel(t.occurredOn)}
                {t.state === "planned" ? " · previsto" : ""}
              </span>
            </div>
            <strong className={`amount ${income ? "positive" : ""}`}>
              {income ? "+" : t.kind === "transfer" ? "" : "−"}
              {money(t.amount, t.currency)}
            </strong>
            {actions?.(t)}
          </div>
        );
      })}
    </div>
  );
}
export function SeeAll({
  to,
  children = "Ver todos",
}: {
  to: string;
  children?: ReactNode;
}) {
  return (
    <NavLink className="text-link" to={to}>
      {children}
      <ChevronRight size={13} />
    </NavLink>
  );
}
export const projectTabs = [
  { href: "/projetos", label: "Projetos" },
  { href: "/projetos/quadro", label: "Quadro" },
  { href: "/projetos/agenda", label: "Agenda" },
  { href: "/projetos/horas", label: "Horas" },
];
export const planningTabs = [
  { href: "/planejamento", label: "Compromissos" },
  { href: "/parcelamentos", label: "Parcelamentos" },
  { href: "/assinaturas", label: "Assinaturas" },
];
