import {
  useId,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { Dialog as RDialog } from "radix-ui";
import { m, useReducedMotion } from "motion/react";
import { useSceneDelay } from "../motion/scene";
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertCircle,
  Inbox,
  LoaderCircle,
} from "lucide-react";
import { Reveal, AnimatedValue } from "../motion/presets";
import { money } from "../shared/format";
export function Button({
  children,
  variant = "primary",
  className = "",
  busy = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      className={`button ${variant} ${className}`}
      {...props}
      disabled={props.disabled || busy}
    >
      {busy ? <LoaderCircle className="spin" size={16} /> : null}
      {children}
    </button>
  );
}
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`icon-button ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
export function PageHeading({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </header>
  );
}
export function Card({
  title,
  subtitle,
  action,
  children,
  className = "",
  index = 0,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <Reveal index={index} className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </Reveal>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "positive" | "negative" | "warning" | "neutral" | "purple" | "blue";
}) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
export function Metric({
  label,
  value,
  hint,
  icon,
  trend,
  series,
  color = "#518FF1",
  index = 0,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  trend?: number;
  series?: number[];
  color?: string;
  index?: number;
}) {
  const reduced = useReducedMotion();
  const sceneDelay = useSceneDelay();
  const min = series ? Math.min(...series) : 0,
    max = series ? Math.max(...series) : 1;
  return (
    <Reveal index={index} className="metric card">
      <div className="metric-top">
        <m.span
          className="metric-icon"
          style={{ color, background: `${color}18` }}
          initial={reduced ? false : { scale: 0, rotate: -22 }}
          animate={{
            scale: reduced ? 1 : [0, 1.25, 0.94, 1],
            rotate: reduced ? 0 : [-22, 8, -3, 0],
          }}
          transition={{
            duration: 0.75,
            delay: reduced ? 0 : sceneDelay + index * 0.055,
            times: [0, 0.55, 0.78, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {icon}
        </m.span>
        <span>{label}</span>
        {trend !== undefined && (
          <span
            className={`metric-trend ${trend < 0 ? "negative" : "positive"}`}
          >
            {trend < 0 ? (
              <ArrowDownRight size={12} />
            ) : (
              <ArrowUpRight size={12} />
            )}{" "}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <strong className="metric-value">
        <AnimatedValue value={value} format={money} />
      </strong>
      <p className="metric-hint">{hint}</p>
      {series && series.length > 1 && (
        <svg
          className="sparkline"
          viewBox="0 0 300 36"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d={series
              .map(
                (n, i) =>
                  `${i ? "L" : "M"}${(i / (series.length - 1)) * 300},${30 - ((n - min) / (max - min || 1)) * 25}`,
              )
              .join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </Reveal>
  );
}
export function Progress({
  value,
  total,
  color = "var(--chart-accent)",
  label,
}: {
  value: number;
  total: number;
  color?: string;
  label: string;
}) {
  const percent = total > 0 ? Math.max(0, (value / total) * 100) : 0;
  const reduced = useReducedMotion();
  const sceneDelay = useSceneDelay();
  return (
    <div
      className="progress"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(total, value, 1)}
      aria-valuenow={value}
      aria-valuetext={`${Math.round(percent)}%`}
    >
      <m.span
        style={{
          width: Math.min(percent, 100) + "%",
          background: color,
          transformOrigin: "0% 50%",
        }}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: reduced ? 1 : [0, 1.055, 0.985, 1] }}
        transition={{
          duration: 0.95,
          delay: reduced ? 0 : sceneDelay + 0.15,
          times: [0, 0.62, 0.82, 1],
          ease: [0.22, 1, 0.36, 1],
        }}
      />
    </div>
  );
}
export function Empty({
  title = "Nada por aqui, por enquanto",
  description = "Os próximos registros aparecerão neste espaço.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span>
        <Inbox size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success";
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <AlertCircle size={17} />
      <div>{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div
      aria-label="Carregando demonstração"
      aria-busy="true"
      className="loading-grid"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <RDialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <RDialog.Portal>
        <RDialog.Overlay className="dialog-overlay" />
        <RDialog.Content className={`dialog-content ${wide ? "wide" : ""}`}>
          <div className="dialog-heading">
            <div>
              <RDialog.Title>{title}</RDialog.Title>
              <RDialog.Description>
                {description ??
                  "Os dados desta demonstração ficam apenas neste navegador."}
              </RDialog.Description>
            </div>
            <RDialog.Close asChild>
              <IconButton label="Fechar">
                <X size={20} />
              </IconButton>
            </RDialog.Close>
          </div>
          {children}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
export function Confirm({
  label,
  title,
  description,
  onConfirm,
  danger = false,
  children,
}: {
  label: string;
  title: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  danger?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <Button
        variant={danger ? "ghost" : "secondary"}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        {children ?? label}
      </Button>
      <Modal
        open={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={title}
        description={description}
      >
        {error && <Notice tone="error">{error}</Notice>}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            busy={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await onConfirm();
                setOpen(false);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Não foi possível concluir.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </>
  );
}
export function AddButton({
  children = "Adicionar",
  onClick,
}: {
  children?: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick}>
      <Plus size={17} />
      {children}
    </Button>
  );
}
export function TextDisclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <details className="disclosure">
      <summary aria-controls={id}>{label}</summary>
      <div id={id}>{children}</div>
    </details>
  );
}
