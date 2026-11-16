import { test, expect, type Page } from "@playwright/test";

test.use({ video: { mode: "on", size: { width: 1440, height: 900 } } });

declare global {
  interface Window {
    readFluxoBurst: () => { clip: string; hole: number; colors: string[] };
  }
}

// Observe actual GPU uniforms or SVG geometry without an application test API.
// This observer is not installed by the separate performance capture.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.readFluxoBurst = () => {
      const curtain = document.querySelector(".route-color-curtain");
      const canvas = curtain?.querySelector("canvas");
      const gl = canvas?.getContext("webgl");
      const program = gl?.getParameter(
        gl.CURRENT_PROGRAM,
      ) as WebGLProgram | null;
      if (gl && program) {
        const uniform = (name: string) =>
          gl.getUniform(program, gl.getUniformLocation(program, name)!);
        const point = uniform("uOrigin") as Float32Array;
        return {
          clip: `circle(${uniform("uOuterRadius")}px at ${point[0]}px ${point[1]}px)`,
          hole: Number(uniform("uHoleRadius")),
          colors: ["uHighlight", "uColor", "uDepth"].map(
            (name) =>
              `rgb(${Array.from(uniform(name) as Float32Array, (n) => Math.round(n * 255)).join(", ")})`,
          ),
        };
      }
      return {
        clip: curtain ? getComputedStyle(curtain).clipPath : "",
        hole: Number(
          curtain
            ?.querySelector(".route-color-aperture")
            ?.getAttribute("d")
            ?.match(/ Z M [-\d.e+]+ [-\d.e+]+ a([\d.e+]+) /)?.[1] ?? "0",
        ),
        colors: Array.from(
          curtain?.querySelectorAll("stop") ?? [],
          (stop) => getComputedStyle(stop).stopColor,
        ),
      };
    };
  });
});

async function expectBurstAt(page: Page, point: { x: number; y: number }) {
  const curtain = page.locator(".route-color-curtain");
  await expect(curtain).toBeAttached();
  const centers = await curtain.evaluate(
    (element) =>
      new Promise<{ phase: string; x: number; y: number }[]>((resolve) => {
        const output: { phase: string; x: number; y: number }[] = [];
        const start = performance.now();
        const sample = () => {
          const phase =
            element.closest<HTMLElement>(".route-color-stage")?.dataset.phase ??
            "";
          const coordinates = window
            .readFluxoBurst()
            .clip.match(/ at ([\d.]+)px ([\d.]+)px/);
          if (coordinates)
            output.push({
              phase,
              x: Number(coordinates[1]),
              y: Number(coordinates[2]),
            });
          if (element.isConnected && performance.now() - start < 5000)
            requestAnimationFrame(sample);
          else resolve(output);
        };
        requestAnimationFrame(sample);
      }),
  );
  expect(centers.length).toBeGreaterThan(1);
  expect(centers.some((center) => center.phase === "revealing")).toBe(true);
  for (const center of centers) {
    expect(Math.abs(center.x - point.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(center.y - point.y)).toBeLessThanOrEqual(1);
  }
  await expect(curtain).toHaveCount(0);
}

test.describe("movimento expressivo", () => {
  test.use({
    reducedMotion: "no-preference",
  });
  test("a transição repete sem perder filtros e cancela ao navegar", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/painel");
    await expect(
      page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
    ).toBeVisible();
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      0,
    );
    await page.getByRole("button", { name: "3M", exact: true }).click();
    const numbers = await page
      .locator(".metric-value .sr-only")
      .allTextContents();
    await page.getByRole("button", { name: "Rever animações" }).click();
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      1,
    );
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "3M", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.locator(".metric-value .sr-only").allTextContents(),
    ).toEqual(numbers);
    await page
      .locator(".desktop-sidebar")
      .getByRole("link", { name: "Relatórios", exact: true })
      .click();
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      1,
    );
    await expect(page.locator('[data-motion="nav-pill"]')).toHaveCount(1);
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      0,
    );
    // Capture actual chart growth, including its settling phase.
    await expect
      .poll(() =>
        page.locator(".plot-wrap rect").evaluateAll((nodes) =>
          nodes
            .filter((n) => n.closest("clipPath") === null)
            .map((n) => getComputedStyle(n).transform)
            .every((t) => t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)"),
        ),
      )
      .toBe(true);
    await page
      .locator(".desktop-sidebar")
      .getByRole("link", { name: "Contas", exact: true })
      .click();
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      1,
    );
    await page
      .locator(".desktop-sidebar")
      .getByRole("link", { name: "Cartões", exact: true })
      .click();
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      1,
    );
    await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("heading", { name: "No crédito. Sob controle." }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a explosão acompanha o clique, o centro pelo teclado e a gaveta mobile", async ({
    page,
  }) => {
    await page.goto("/painel");
    await expect(page.locator(".route-color-curtain")).toHaveCount(0);
    const account = page.locator(".desktop-sidebar").getByRole("link", {
      name: "Contas",
      exact: true,
    });
    const accountBounds = (await account.boundingBox())!;
    await account.click({ position: { x: 14, y: 9 } });
    await expectBurstAt(page, {
      x: accountBounds.x + 14,
      y: accountBounds.y + 9,
    });

    const cards = page.locator(".desktop-sidebar").getByRole("link", {
      name: "Cartões",
      exact: true,
    });
    await cards.focus();
    const cardBounds = (await cards.boundingBox())!;
    await cards.press("Enter");
    await expectBurstAt(page, {
      x: cardBounds.x + cardBounds.width / 2,
      y: cardBounds.y + cardBounds.height / 2,
    });

    await page.getByRole("button", { name: "Ativar tema escuro" }).click();
    const replay = page.getByRole("button", { name: "Rever animações" });
    const replayBounds = (await replay.boundingBox())!;
    await replay.click({ position: { x: 6, y: 8 } });
    await expectBurstAt(page, {
      x: replayBounds.x + 6,
      y: replayBounds.y + 8,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Abrir menu" }).last().click();
    const mobileAccount = page
      .getByRole("dialog", { name: "Menu principal" })
      .getByRole("link", { name: "Contas", exact: true });
    const mobileBounds = (await mobileAccount.boundingBox())!;
    await mobileAccount.click({ position: { x: 10, y: 10 } });
    await expectBurstAt(page, {
      x: mobileBounds.x + 10,
      y: mobileBounds.y + 10,
    });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("cobre antes de trocar a página, espera o conteúdo e usa azul profundo no escuro", async ({
    page,
  }) => {
    // Deliberately hold an unloaded route chunk to exercise the loading curtain.
    await page.route("**/finance-*.js", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 750));
      await route.continue();
    });
    await page.goto("/painel");
    await expect(
      page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
    ).toBeVisible();
    await expect(page.locator(".route-color-stage")).toHaveCount(0);
    await page.getByRole("button", { name: "Ativar tema escuro" }).click();
    const account = page
      .locator(".desktop-sidebar")
      .getByRole("link", { name: "Contas", exact: true });
    const bounds = (await account.boundingBox())!;
    const origin = {
      x: Math.floor(bounds.x + 14),
      y: Math.floor(bounds.y + 9),
    };
    const samplesPromise = page.evaluate(
      () =>
        new Promise<
          {
            time: number;
            phase: string | undefined;
            path: string;
            heading: string | null;
            clip: string;
            hole: number;
          }[]
        >((resolve) => {
          document.addEventListener(
            "click",
            () => {
              const start = performance.now();
              const frames: {
                time: number;
                phase: string | undefined;
                path: string;
                heading: string | null;
                clip: string;
                hole: number;
              }[] = [];
              const tick = () => {
                const stage =
                  document.querySelector<HTMLElement>(".route-color-stage");
                const drawing = window.readFluxoBurst();
                frames.push({
                  time: performance.now() - start,
                  phase: stage?.dataset.phase,
                  path: window.location.pathname,
                  heading: document.querySelector("h1")?.textContent ?? null,
                  clip: drawing.clip,
                  hole: drawing.hole,
                });
                if (
                  performance.now() - start < 1700 &&
                  (stage || frames.length < 3)
                )
                  requestAnimationFrame(tick);
                else resolve(frames);
              };
              requestAnimationFrame(tick);
            },
            { once: true, capture: true },
          );
        }),
    );
    await account.click({ position: { x: 14, y: 9 } });
    const stage = page.locator(".route-color-stage");
    await expect(stage).toHaveAttribute("data-phase", "covered");
    const colors = await page.evaluate(() => window.readFluxoBurst().colors);
    expect(colors).toContain("rgb(23, 52, 90)");
    expect(colors).toContain("rgb(16, 29, 52)");
    await page.screenshot({
      path: "test-results/explosao-escura-cobertura.png",
    });
    const frames = await samplesPromise;
    await test.info().attach("quadros-da-transicao", {
      body: JSON.stringify(frames),
      contentType: "application/json",
    });
    const covering = frames.filter((frame) => frame.phase === "covering");
    expect(covering.length).toBeGreaterThan(1);
    const viewportRadius = Math.hypot(
      1440 - origin.x,
      Math.max(origin.y, 900 - origin.y),
    );
    const partiallyCovered = covering.filter(
      (frame) =>
        Number(frame.clip.match(/circle\(([\d.]+)px/)?.[1] ?? "0") <
        viewportRadius,
    );
    expect(partiallyCovered.length).toBeGreaterThan(1);
    expect(
      partiallyCovered.every(
        (frame) =>
          frame.path === "/painel" &&
          frame.heading === "Seu dinheiro, com clareza.",
      ),
    ).toBe(true);
    expect(covering[0].time).toBeLessThan(100);
    const held = frames.filter((frame) => frame.phase === "covered");
    expect(held.length).toBeGreaterThan(3);
    expect(held.every((frame) => frame.hole === 0)).toBe(true);
    const changed = frames.find((frame) => frame.path === "/contas")!;
    expect(changed.time).toBeLessThan(350);
    const radius = Number(changed.clip.match(/circle\(([\d.]+)px/)![1]);
    expect(radius).toBeGreaterThan(viewportRadius);
    // The circle must visibly pass through intermediate sizes, rather than
    // jumping from an opaque screen to an almost complete reveal.
    const expandingWindow = frames.filter(
      (frame) =>
        frame.phase === "revealing" &&
        frame.hole > viewportRadius * 0.05 &&
        frame.hole < viewportRadius * 0.9,
    );
    expect(expandingWindow.length).toBeGreaterThanOrEqual(3);
    expect(
      expandingWindow.some((frame) => frame.hole < viewportRadius * 0.35),
    ).toBe(true);
    expect(
      expandingWindow.some((frame) => frame.hole > viewportRadius * 0.55),
    ).toBe(true);
    for (const frame of expandingWindow) {
      expect(frame.clip).toContain(`at ${origin.x}px ${origin.y}px`);
    }
    await expect(stage).toHaveCount(0);
    await expect(
      page
        .locator(".desktop-sidebar")
        .getByRole("link", { name: "Contas", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });
  test("mantém a transição SVG quando WebGL está indisponível", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        value(this: HTMLCanvasElement, type: string, ...options: unknown[]) {
          if (type === "webgl") return null;
          return Reflect.apply(getContext, this, [type, ...options]);
        },
      });
    });
    await page.goto("/painel");
    await expect(page.locator(".route-color-stage")).toHaveCount(0);
    await page.getByRole("button", { name: "Rever animações" }).click();
    await expect(page.locator(".route-color-stage")).toHaveAttribute(
      "data-renderer",
      "svg",
    );
    await expectBurstAt(
      page,
      await page
        .getByRole("button", { name: "Rever animações" })
        .evaluate((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }),
    );
  });

  test("perda do contexto gráfico recupera sem travar ou perder filtros", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/painel");
    await expect(page.locator(".route-color-stage")).toHaveCount(0);
    await page.getByRole("button", { name: "3M", exact: true }).click();
    await page.getByRole("button", { name: "Rever animações" }).click();
    const canvas = page.locator(".route-color-canvas");
    await expect(canvas).toBeAttached();
    await canvas.evaluate((node: HTMLCanvasElement) => {
      const extension = node
        .getContext("webgl")
        ?.getExtension("WEBGL_lose_context");
      if (!extension)
        throw new Error("Context loss test requires WEBGL_lose_context");
      extension.loseContext();
    });
    await expect(page.locator(".route-color-stage")).toHaveAttribute(
      "data-renderer",
      "svg",
    );
    await expect(page.locator(".route-color-stage")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "3M", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test("movimento reduzido não cria bolhas ou atrasos de conteúdo", async ({
  page,
}) => {
  await page.goto("/painel");
  await expect(
    page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
  ).toBeVisible();
  await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Rever animações" }).click();
  await expect(page.locator('[data-motion="color-transition"]')).toHaveCount(0);
});
