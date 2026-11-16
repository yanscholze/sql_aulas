import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax, MotionConfig } from "motion/react";
import { router } from "./app/router";
import { SyncDemo } from "./data/queries/use-demo";
import "./design-system/styles.css";
import { warmColorTransition } from "./motion/color-canvas";
const client = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
    mutations: { retry: false },
  },
});
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  warmColorTransition();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <LazyMotion features={domMax} strict>
        <MotionConfig reducedMotion="user">
          <SyncDemo />
          <RouterProvider router={router} />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  </StrictMode>,
);
