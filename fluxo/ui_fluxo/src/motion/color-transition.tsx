import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  m,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  preparedColorCanvas,
  type ColorCanvasRenderer,
  type ColorCanvasColors,
} from "./color-canvas";
import {
  COLOR_MOTION,
  colorGeometry,
  type MotionOrigin,
  type ColorTransitionPhase,
} from "./color-contract";
export type { MotionOrigin, ColorTransitionPhase } from "./color-contract";

type TransitionProps = {
  origin: MotionOrigin;
  phase: ColorTransitionPhase;
  onCovered: () => void;
  onComplete: () => void;
};

export function ColorTransition(props: TransitionProps) {
  const [renderer, setRenderer] = useState(preparedColorCanvas);
  return renderer ? (
    <CanvasColorTransition
      {...props}
      renderer={renderer}
      onUnavailable={() => setRenderer(null)}
    />
  ) : (
    <SvgColorTransition {...props} />
  );
}

function canvasColors(element: Element): ColorCanvasColors {
  const style = getComputedStyle(element);
  const rgb = (name: string): readonly [number, number, number] => {
    const hex = style.getPropertyValue(name).trim().slice(1);
    const channel = (offset: number) =>
      parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return [channel(0), channel(2), channel(4)];
  };
  return {
    highlight: rgb("--burst-highlight"),
    color: rgb("--burst-color"),
    depth: rgb("--burst-depth"),
  };
}

function CanvasColorTransition({
  origin,
  phase,
  onCovered,
  onComplete,
  renderer,
  onUnavailable,
}: TransitionProps & {
  renderer: ColorCanvasRenderer;
  onUnavailable: () => void;
}) {
  const reduced = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const [geometry] = useState(() =>
    colorGeometry(origin, window.innerWidth, window.innerHeight),
  );
  const radii = useRef({
    outerRadius: phase === "covering" ? 22 : geometry.radius,
    holeRadius: 0,
  });
  const colors = useRef<ColorCanvasColors | null>(null);
  const callbacks = useRef({ onCovered, onComplete, onUnavailable });
  useLayoutEffect(() => {
    callbacks.current = { onCovered, onComplete, onUnavailable };
    if (host.current) {
      colors.current = canvasColors(host.current);
      renderer.draw(geometry, radii.current, colors.current);
    }
  });
  useLayoutEffect(() => {
    const node = host.current;
    if (!node) return;
    const context = renderer.canvas.getContext("webgl");
    if (!context || context.isContextLost()) {
      callbacks.current.onUnavailable();
      return;
    }
    renderer.canvas.style.width = `${geometry.width}px`;
    renderer.canvas.style.height = `${geometry.height}px`;
    node.appendChild(renderer.canvas);
    const unavailable = () => callbacks.current.onUnavailable();
    renderer.canvas.addEventListener("webglcontextlost", unavailable);
    return () => {
      renderer.canvas.removeEventListener("webglcontextlost", unavailable);
      renderer.canvas.remove();
    };
  }, [geometry, renderer]);
  useLayoutEffect(() => {
    if (reduced || !colors.current) return;
    const draw = () => renderer.draw(geometry, radii.current, colors.current!);
    if (phase === "covered") {
      radii.current = { outerRadius: geometry.radius, holeRadius: 0 };
      draw();
      return;
    }
    const covering = phase === "covering";
    if (!covering) radii.current.outerRadius = geometry.radius;
    draw();
    const key = covering ? "outerRadius" : "holeRadius";
    const control = animate(radii.current[key], geometry.radius, {
      ...(covering ? COLOR_MOTION.cover : COLOR_MOTION.reveal),
      onUpdate(radius) {
        radii.current[key] = radius;
        draw();
      },
      onComplete() {
        radii.current[key] = geometry.radius;
        draw();
        if (covering) callbacks.current.onCovered();
        else callbacks.current.onComplete();
      },
    });
    return () => control.stop();
  }, [geometry, phase, reduced, renderer]);
  if (reduced) return null;
  return (
    <div
      className="route-color-stage"
      aria-hidden="true"
      data-motion="color-transition"
      data-phase={phase}
      data-renderer="webgl"
    >
      {phase === "covering" && (
        <m.div
          className="route-color-orb"
          initial={{
            x: geometry.start.x - 22,
            y: geometry.start.y - 22,
            scale: 1,
            opacity: 1,
          }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: COLOR_MOTION.cover.duration,
            ease: "easeOut",
          }}
        />
      )}
      <div className="route-color-curtain" ref={host} />
    </div>
  );
}

/** The current page stays intact until this opaque burst has covered the viewport. */
function SvgColorTransition({
  origin,
  phase,
  onCovered,
  onComplete,
}: TransitionProps) {
  const reduced = useReducedMotion();
  const gradientId = useId();
  const [geometry] = useState(() =>
    colorGeometry(origin, window.innerWidth, window.innerHeight),
  );
  const { start, radius, width, height } = geometry;
  const point = `${start.x}px ${start.y}px`;
  const outerRadius = useMotionValue(phase === "covering" ? 22 : radius);
  const revealRadius = useMotionValue(0);
  const clip = useMotionTemplate`circle(${outerRadius}px at ${point})`;
  // A single even-odd shape leaves the growing circle transparent, avoiding
  // a viewport-sized CSS alpha mask and its additional compositing pass.
  const aperture = useTransform(
    revealRadius,
    (r) =>
      `M 0 0 H ${width} V ${height} H 0 Z M ${start.x - r} ${start.y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`,
  );
  const callbacks = useRef({ onCovered, onComplete });
  useLayoutEffect(() => {
    callbacks.current = { onCovered, onComplete };
  });
  useLayoutEffect(() => {
    if (reduced) return;
    if (phase === "covered") {
      outerRadius.set(radius);
      revealRadius.set(0);
      return;
    }
    const control =
      phase === "covering"
        ? animate(outerRadius, radius, {
            ...COLOR_MOTION.cover,
            onComplete: () => callbacks.current.onCovered(),
          })
        : animate(revealRadius, radius, {
            ...COLOR_MOTION.reveal,
            onComplete: () => callbacks.current.onComplete(),
          });
    return () => control.stop();
  }, [phase, reduced, outerRadius, revealRadius, radius]);
  if (reduced) return null;
  return (
    <div
      className="route-color-stage"
      aria-hidden="true"
      data-motion="color-transition"
      data-phase={phase}
      data-renderer="svg"
    >
      {phase === "covering" && (
        <m.div
          className="route-color-orb"
          initial={{ x: start.x - 22, y: start.y - 22, scale: 1, opacity: 1 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: COLOR_MOTION.cover.duration,
            ease: "easeOut",
          }}
        />
      )}
      <m.svg
        className="route-color-curtain"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ clipPath: clip }}
      >
        <defs>
          <radialGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            cx={start.x}
            cy={start.y}
            r={radius}
          >
            <stop offset="0" stopColor="var(--burst-highlight)" />
            <stop offset=".58" stopColor="var(--burst-color)" />
            <stop offset="1" stopColor="var(--burst-depth)" />
          </radialGradient>
        </defs>
        <m.path
          className="route-color-aperture"
          d={aperture}
          fill={`url(#${gradientId})`}
          fillRule="evenodd"
        />
      </m.svg>
    </div>
  );
}
