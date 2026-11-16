import { useEffect, useRef } from "react";
import { animate, m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useSceneDelay, useMotionEpoch } from "./scene";
export const ease = [0.22, 1, 0.36, 1] as const;
export function Reveal({
  children,
  className = "",
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const reduced = useReducedMotion();
  const sceneDelay = useSceneDelay();
  const epoch = useMotionEpoch();
  return (
    <m.div
      key={epoch}
      className={className}
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: reduced ? "tween" : "spring",
        stiffness: 320,
        damping: 22,
        mass: 0.8,
        duration: reduced ? 0 : undefined,
        delay: reduced ? 0 : sceneDelay + Math.min(index * 0.055, 0.275),
        ease,
      }}
    >
      {!reduced && className.includes("card") && (
        <span className="card-color-splash-mask" aria-hidden="true">
          <m.span
            className="card-color-splash"
            initial={{ scale: 0, opacity: 0, x: -45, y: 40 }}
            animate={{
              scale: [0, 1.2, 2.6],
              opacity: [0, 0.24, 0],
              x: [-45, 10, 90],
              y: [40, -10, -85],
            }}
            transition={{
              duration: 1.1,
              delay: sceneDelay + Math.min(index * 0.055, 0.275),
              times: [0, 0.42, 1],
              ease,
            }}
          />
        </span>
      )}
      {children}
    </m.div>
  );
}
export function AnimatedValue({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef<number | undefined>(undefined);
  const sceneDelay = useSceneDelay();
  const reduced = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const initial = previous.current === undefined;
    const start = previous.current ?? 0;
    if (reduced) {
      node.textContent = format(value);
      previous.current = value;
      return;
    }
    const control = animate(start, value, {
      duration: initial ? 1.1 : 0.35,
      delay: initial ? sceneDelay + 0.12 : 0,
      ease,
      onUpdate(latest) {
        previous.current = latest;
        node.textContent = format(Math.round(latest));
      },
    });
    return () => control.stop();
  }, [value, reduced, format, sceneDelay]);
  return (
    <>
      <span className="sr-only">{format(value)}</span>
      <span className="animated-value" aria-hidden="true">
        <span className="animated-value-size">{format(value)}</span>
        <span className="animated-value-live" ref={ref}>
          {format(value)}
        </span>
      </span>
    </>
  );
}
