import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { NavigateFunction } from "react-router";
import type { MotionOrigin, ColorTransitionPhase } from "./color-transition";

interface TransitionRequest {
  id: number;
  origin: MotionOrigin;
  phase: ColorTransitionPhase;
  to?: string;
}

/** Cover the current page before committing navigation; reveal only ready content. */
export function useColorNavigation(
  navigate: NavigateFunction,
  reduced: boolean | null,
) {
  const [transition, setTransition] = useState<TransitionRequest | null>(() =>
    reduced ? null : { id: 0, origin: { x: 38, y: 38 }, phase: "covered" },
  );
  const request = useRef(transition);
  const sequence = useRef(0);
  const [replay, setReplay] = useState(0);

  const start = useCallback(
    (origin: MotionOrigin, to?: string) => {
      if (reduced) {
        if (to) void navigate(to);
        else setReplay((value) => value + 1);
        return;
      }
      const alreadyCovered = request.current?.phase === "covered";
      const next: TransitionRequest = {
        id: ++sequence.current,
        origin,
        phase: alreadyCovered ? (to ? "covered" : "revealing") : "covering",
        to,
      };
      request.current = next;
      setTransition(next);
      if (alreadyCovered) {
        if (to) void navigate(to);
        else setReplay((value) => value + 1);
      }
    },
    [navigate, reduced],
  );

  const covered = useCallback(
    (id: number) => {
      const current = request.current;
      if (current?.id !== id || current.phase !== "covering") return;
      const next: TransitionRequest = {
        ...current,
        phase: current.to ? "covered" : "revealing",
      };
      request.current = next;
      setTransition(next);
      if (current.to) void navigate(current.to);
      else setReplay((value) => value + 1);
    },
    [navigate],
  );

  const ready = useCallback(() => {
    const current = request.current;
    if (current?.phase !== "covered") return;
    const next: TransitionRequest = { ...current, phase: "revealing" };
    request.current = next;
    setTransition(next);
  }, []);

  const complete = useCallback((id: number) => {
    if (request.current?.id !== id) return;
    request.current = null;
    setTransition(null);
  }, []);

  useLayoutEffect(() => {
    if (!reduced || !request.current) return;
    const current = request.current;
    request.current = null;
    setTransition(null);
    if (current.phase === "covering") {
      if (current.to) void navigate(current.to);
      else setReplay((value) => value + 1);
    }
  }, [reduced, navigate]);

  return { transition, replay, start, covered, ready, complete };
}

/** Inside Suspense: its effect runs only after the destination has committed. */
export function PageReady({
  children,
  routeKey,
  onReady,
}: {
  children: ReactNode;
  routeKey: string;
  onReady: () => void;
}) {
  useLayoutEffect(onReady, [onReady, routeKey]);
  return children;
}
