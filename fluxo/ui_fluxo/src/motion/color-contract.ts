export interface MotionOrigin {
  x: number;
  y: number;
}
export type ColorTransitionPhase = "covering" | "covered" | "revealing";
export interface ColorGeometry {
  start: MotionOrigin;
  radius: number;
  width: number;
  height: number;
}
export const COLOR_MOTION = {
  cover: { duration: 0.22, ease: [0.35, 0, 0.3, 1] as const },
  reveal: { duration: 0.42, ease: [0.45, 0, 0.3, 1] as const },
};

/** Keep the approved viewport-space geometry independent of the renderer. */
export function colorGeometry(
  origin: MotionOrigin,
  width: number,
  height: number,
): ColorGeometry {
  const start = {
    x: Math.max(0, Math.min(origin.x, width)),
    y: Math.max(0, Math.min(origin.y, height)),
  };
  const radius =
    Math.ceil(
      Math.hypot(
        Math.max(start.x, width - start.x),
        Math.max(start.y, height - start.y),
      ),
    ) + 32;
  return { start, radius, width, height };
}

export function colorCircle(geometry: ColorGeometry, radius: number) {
  return `circle(${radius}px at ${geometry.start.x}px ${geometry.start.y}px)`;
}
