import { useCallback, useLayoutEffect, useRef, type UIEvent } from "react";

/** Restore each history entry inside the frame after its content is ready. */
export function usePanelScroll(routeKey: string, onReady: () => void) {
  const ref = useRef<HTMLElement>(null);
  const positions = useRef(new Map<string, number>());
  const readyKey = useRef<string | null>(null);
  const restore = useCallback(() => {
    ref.current?.scrollTo({
      top: positions.current.get(routeKey) ?? 0,
      behavior: "instant",
    });
    readyKey.current = routeKey;
    onReady();
  }, [routeKey, onReady]);
  // On the initial mount the parent DOM ref can attach after PageReady's effect.
  useLayoutEffect(() => {
    if (readyKey.current === routeKey)
      ref.current?.scrollTo({
        top: positions.current.get(routeKey) ?? 0,
        behavior: "instant",
      });
  }, [routeKey]);
  const remember = useCallback(
    (event: UIEvent<HTMLElement>) => {
      if (readyKey.current === routeKey)
        positions.current.set(routeKey, event.currentTarget.scrollTop);
    },
    [routeKey],
  );
  return { ref, restore, remember };
}
