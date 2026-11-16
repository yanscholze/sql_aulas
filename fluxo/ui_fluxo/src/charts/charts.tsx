import { useId, useState, useRef, type KeyboardEvent } from "react";
import { m, useReducedMotion } from "motion/react";
import { ease } from "../motion/presets";
import { useSceneDelay } from "../motion/scene";
import { money, compact } from "../shared/format";
import { domain, monotone } from "./geometry";
export const PALETTE = ["#518FF1", "#315D99", "#A367C4", "#D99A40", "#93A1A5"];
export interface ChartSeries {
  name: string;
  values: number[];
  color: string;
  projected?: boolean;
}
export function LineChart({
  labels,
  series,
  height = 200,
  area = false,
  bars = false,
  label = "Evolução financeira",
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  area?: boolean;
  bars?: boolean;
  label?: string;
}) {
  const id = useId().replaceAll(":", ""),
    [active, setActive] = useState<number | null>(null),
    reduced = useReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const sceneDelay = useSceneDelay();
  const W = 660,
    H = 220,
    P = 36,
    B = 22;
  const d = domain(series.flatMap((s) => s.values));
  const x = (i: number) =>
      P + ((i + 0.5) * (W - P - 10)) / Math.max(1, labels.length),
    y = (v: number) => H - B - ((v - d.min) / d.range) * (H - B - 15);
  const step = (W - P - 10) / Math.max(1, labels.length);
  const keyboard = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setActive((i) =>
        Math.min(
          labels.length - 1,
          Math.max(0, (i ?? -1) + (event.key === "ArrowRight" ? 1 : -1)),
        ),
      );
    }
    if (event.key === "Escape") setActive(null);
  };
  return (
    <div className="chart">
      <div className="chart-legend">
        {series.map((s) => (
          <span key={s.name}>
            <i style={{ background: s.color }} />
            {s.name}
            {s.projected ? " · previsto" : ""}
          </span>
        ))}
      </div>
      <div className="plot-wrap" style={{ height }}>
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={label}
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient
                key={s.name}
                id={`${id}-gradient-${i}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity=".22" />
                <stop offset="100%" stopColor={s.color} stopOpacity=".01" />
              </linearGradient>
            ))}
            <clipPath id={`${id}-clip`}>
              <m.rect
                x={P}
                y={0}
                width={W - P}
                height={H}
                initial={reduced ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{ transformOrigin: `${P}px 0px` }}
                transition={{
                  duration: 1.05,
                  delay: reduced ? 0 : sceneDelay + 0.12,
                  ease,
                }}
              />
            </clipPath>
          </defs>
          {Array.from({ length: 4 }, (_, i) => {
            const value = d.min + (d.range * i) / 3;
            return (
              <g key={i}>
                <line
                  x1={P}
                  x2={W}
                  y1={y(value)}
                  y2={y(value)}
                  stroke="var(--line)"
                  strokeDasharray="3 5"
                />
              </g>
            );
          })}
          {d.min < 0 && (
            <line x1={P} x2={W} y1={y(0)} y2={y(0)} stroke="var(--muted)" />
          )}
          {series.map((s, si) => {
            const points = s.values.map((v, i) => ({ x: x(i), y: y(v) }));
            const path = monotone(points);
            return (
              <g key={s.name}>
                {bars ? (
                  s.values.map((v, i) => (
                    <m.rect
                      key={labels[i]}
                      x={
                        x(i) +
                        (si - (series.length - 1) / 2) * (step * 0.23) -
                        step * 0.1
                      }
                      y={Math.min(y(v), y(0))}
                      width={step * 0.2}
                      height={Math.max(0, Math.abs(y(v) - y(0)))}
                      rx="5"
                      fill={s.color}
                      initial={reduced ? false : { scaleY: 0 }}
                      animate={{ scaleY: reduced ? 1 : [0, 1.07, 0.98, 1] }}
                      style={{ transformOrigin: `${x(i)}px ${y(0)}px` }}
                      transition={{
                        duration: 1.05,
                        times: [0, 0.64, 0.82, 1],
                        delay: reduced
                          ? 0
                          : sceneDelay + 0.12 + Math.min(i * 0.055, 0.28),
                        ease,
                      }}
                    />
                  ))
                ) : (
                  <g clipPath={`url(#${id}-clip)`}>
                    {area && points.length > 0 && (
                      <m.path
                        d={`${path} L${points.at(-1)!.x},${y(0)} L${points[0].x},${y(0)} Z`}
                        fill={`url(#${id}-gradient-${si})`}
                        initial={reduced ? false : { scaleY: 0.02, opacity: 0 }}
                        animate={{
                          scaleY: reduced ? 1 : [0.02, 1.06, 0.985, 1],
                          opacity: 1,
                        }}
                        style={{ transformOrigin: `0px ${y(0)}px` }}
                        transition={{
                          duration: 1.15,
                          delay: reduced ? 0 : sceneDelay + 0.15 + si * 0.08,
                          times: [0, 0.68, 0.86, 1],
                          ease,
                        }}
                      />
                    )}
                    <path
                      d={path}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="2.5"
                      strokeDasharray={s.projected ? "6 5" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={active === i ? 4.5 : 2.5}
                        fill="var(--surface)"
                        stroke={s.color}
                        strokeWidth="2"
                      />
                    ))}
                  </g>
                )}
              </g>
            );
          })}
          {active !== null && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={10}
              y2={H - B}
              stroke="var(--muted)"
              strokeDasharray="3 4"
            />
          )}
        </svg>
        <div className="chart-y-labels" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => {
            const value = d.min + (d.range * i) / 3;
            return (
              <span key={i} style={{ top: `${(y(value) / H) * 100}%` }}>
                {compact(Math.round(value))}
              </span>
            );
          })}
        </div>
        <button
          className="chart-hitbox"
          aria-label={`${label}. Use as setas para explorar os valores.`}
          onKeyDown={keyboard}
          onFocus={() => setActive(0)}
          onBlur={() => setActive(null)}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const local = ((e.clientX - rect.left) / rect.width) * W;
            setActive(
              Math.max(
                0,
                Math.min(labels.length - 1, Math.floor((local - P) / step)),
              ),
            );
          }}
          onPointerLeave={() => setActive(null)}
          onClick={() => setActive((v) => v ?? 0)}
        />
        {active !== null && labels[active] && (
          <div
            className="chart-tooltip"
            style={{
              left: `${Math.max(18, Math.min(78, (x(active) / W) * 100))}%`,
            }}
          >
            <strong>{labels[active]}</strong>
            {series.map((s) => (
              <span key={s.name}>
                <i style={{ background: s.color }} />
                {s.name}
                <b>{money(s.values[active] ?? 0)}</b>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="chart-axis">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <details className="chart-data">
        <summary>Ver dados do gráfico</summary>
        <div className="table-scroll">
          <table>
            <caption>{label}</caption>
            <thead>
              <tr>
                <th>Período</th>
                {series.map((s) => (
                  <th key={s.name}>{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((l, i) => (
                <tr key={i}>
                  <th>{l}</th>
                  {series.map((s) => (
                    <td key={s.name}>{money(s.values[i] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
export function Donut({
  slices,
  center,
  subtitle = "do total",
  size = 140,
}: {
  slices: { name: string; value: number; color?: string }[];
  center?: string;
  subtitle?: string;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const sceneDelay = useSceneDelay();
  const total = slices.reduce((a, s) => a + Math.max(0, s.value), 0);
  let used = 0;
  const C = 2 * Math.PI * 54;
  return (
    <div className="donut-content">
      <m.div
        className="donut"
        style={{ width: size, height: size }}
        initial={reduced ? false : { scale: 0.72, rotate: -18 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 240,
          damping: 16,
          delay: reduced ? 0 : sceneDelay + 0.12,
        }}
      >
        <svg
          viewBox="0 0 140 140"
          role="img"
          aria-label={slices
            .map((s) => `${s.name}: ${money(s.value)}`)
            .join(", ")}
        >
          <circle
            cx="70"
            cy="70"
            r="54"
            stroke="var(--inset)"
            strokeWidth="13"
            fill="none"
          />
          {slices.map((s, i) => {
            const length = total ? (Math.max(0, s.value) / total) * C : 0;
            const offset = used;
            used += length;
            return (
              <m.circle
                key={s.name}
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke={s.color ?? PALETTE[i % PALETTE.length]}
                strokeWidth="13"
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
                strokeDashoffset={-offset}
                initial={reduced ? false : { strokeDasharray: `0 ${C}` }}
                animate={{
                  strokeDasharray: `${Math.max(0, length - (slices.length > 1 ? 5 : 0))} ${C - length + (slices.length > 1 ? 5 : 0)}`,
                }}
                transition={{
                  duration: 1.15,
                  delay: reduced ? 0 : sceneDelay + 0.1 + i * 0.045,
                  ease,
                }}
              />
            );
          })}
        </svg>
        <div className="donut-center">
          <strong>{center ?? (total ? "100%" : "0%")}</strong>
          <small>{subtitle}</small>
        </div>
      </m.div>
      <ul className="donut-legend">
        {slices.map((s, i) => (
          <li key={s.name}>
            <i style={{ background: s.color ?? PALETTE[i % PALETTE.length] }} />
            <span>{s.name}</span>
            <strong>{total ? Math.round((s.value / total) * 100) : 0}%</strong>
          </li>
        ))}
      </ul>
      <details className="chart-data">
        <summary>Ver valores</summary>
        {slices.map((s) => (
          <p key={s.name}>
            {s.name}: {money(s.value)}
          </p>
        ))}
      </details>
    </div>
  );
}
