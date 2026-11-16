import { createContext, useContext, useMemo, type ReactNode } from "react";
const Scene = createContext({ delay: 0, epoch: 0 });
/** Replay changes animation scopes, preserving page state and URL filters. */
export function MotionScene({
  children,
  replay = 0,
}: {
  children: ReactNode;
  replay?: number;
}) {
  const value = useMemo(() => ({ delay: 0.04, epoch: replay }), [replay]);
  return <Scene.Provider value={value}>{children}</Scene.Provider>;
}
export function useSceneDelay() {
  return useContext(Scene).delay;
}
export function useMotionEpoch() {
  return useContext(Scene).epoch;
}
