import { expect, test } from "@playwright/test";

// Keep native scrollbars visible: hidden scrollbars previously concealed
// horizontal overflow in the animated sidebar and changed available width.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test("o painel acompanha janelas 20:9, 21:9 e larguras intermediárias", async ({
  page,
}) => {
  await page.goto("/painel");
  await expect(
    page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const size of [
    { width: 3440, height: 1440 },
    { width: 2560, height: 1080 },
    { width: 2560, height: 1152 },
    { width: 1920, height: 823 },
    { width: 1920, height: 864 },
    { width: 1600, height: 720 },
    { width: 1536, height: 690 },
    { width: 1365, height: 615 },
    { width: 1280, height: 576 },
    { width: 1279, height: 700 },
    { width: 1024, height: 600 },
    { width: 800, height: 600 },
    { width: 390, height: 650 },
    { width: 320, height: 650 },
  ]) {
    await page.setViewportSize(size);
    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const dashboard = document
        .querySelector(".dashboard")!
        .getBoundingClientRect();
      const values = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".dashboard .metric-value, .dashboard .free-value",
        ),
      );
      return {
        available: root.clientWidth,
        width: root.scrollWidth,
        left: dashboard.left,
        right: dashboard.right,
        outerHeight: root.scrollHeight,
        viewportHeight: window.innerHeight,
        frameBottom: document
          .querySelector(".app-shell")!
          .getBoundingClientRect().bottom,
        overflowingValues: values
          .filter((value) => value.scrollWidth > value.clientWidth + 1)
          .map((value) => ({
            text: value.textContent,
            width: value.clientWidth,
            content: value.scrollWidth,
          })),
      };
    });
    expect(layout.width, JSON.stringify({ size, layout })).toBeLessThanOrEqual(
      layout.available + 1,
    );
    expect(layout.left).toBeGreaterThanOrEqual(0);
    expect(layout.right).toBeLessThanOrEqual(layout.available + 1);
    expect(layout.outerHeight, JSON.stringify(size)).toBeLessThanOrEqual(
      layout.viewportHeight + 1,
    );
    expect(layout.frameBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
    expect(layout.overflowingValues, JSON.stringify(size)).toEqual([]);
    if ([3440, 1920, 1365].includes(size.width))
      await page.screenshot({
        path: `test-results/fluid-${size.width}x${size.height}.png`,
        fullPage: true,
      });
  }
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await page.setViewportSize({ width: 2560, height: 1080 });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: "test-results/fluid-dark-2560x1080.png",
    fullPage: true,
  });
});

test("o conteúdo rola dentro do quadro e restaura a posição ao voltar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 690 });
  await page.goto("/painel");
  await expect(
    page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
  ).toBeVisible();
  const panel = page.locator("#conteudo");
  const before = {
    header: await page.locator(".topbar").boundingBox(),
    sidebar: await page.locator(".desktop-sidebar").boundingBox(),
    frame: await page.locator(".main-surface").boundingBox(),
  };
  await page
    .getByRole("link", { name: "Acompanhar meus projetos", exact: true })
    .scrollIntoViewIfNeeded();
  await expect
    .poll(() => panel.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(100);
  const saved = await panel.evaluate((element) => element.scrollTop);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.locator(".topbar").boundingBox()).toEqual(before.header);
  expect(await page.locator(".desktop-sidebar").boundingBox()).toEqual(
    before.sidebar,
  );
  expect(await page.locator(".main-surface").boundingBox()).toEqual(
    before.frame,
  );
  const link = (await page
    .getByRole("link", { name: "Acompanhar meus projetos", exact: true })
    .boundingBox())!;
  const bounds = (await panel.boundingBox())!;
  expect(link.y + link.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  await page.screenshot({ path: "test-results/frame-scrolled-1536x690.png" });
  await page
    .locator(".desktop-sidebar")
    .getByRole("link", { name: "Contas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Um lugar para cada plano." }),
  ).toBeVisible();
  await expect
    .poll(() => panel.evaluate((element) => element.scrollTop))
    .toBe(0);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
  ).toBeVisible();
  await expect
    .poll(() =>
      panel.evaluate(
        (element, target) => Math.abs(element.scrollTop - target),
        saved,
      ),
    )
    .toBeLessThanOrEqual(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThanOrEqual(690);
});

test.describe("menu com movimento e barras nativas", () => {
  test.use({ reducedMotion: "no-preference" });
  test("recolher e expandir não cria uma barra horizontal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 823 });
    await page.goto("/painel");
    await expect(
      page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
    ).toBeVisible();
    await expect(page.locator(".route-color-stage")).toHaveCount(0);
    const recording = page.evaluate(
      () =>
        new Promise<{ pageOverflow: number; horizontalBar: number }[]>(
          (resolve) => {
            const start = performance.now(),
              frames: { pageOverflow: number; horizontalBar: number }[] = [];
            const sample = () => {
              const nav = document.querySelector<HTMLElement>(".sidebar-nav")!;
              frames.push({
                pageOverflow:
                  document.documentElement.scrollWidth -
                  document.documentElement.clientWidth,
                horizontalBar: nav.offsetHeight - nav.clientHeight,
              });
              if (performance.now() - start < 1200)
                requestAnimationFrame(sample);
              else resolve(frames);
            };
            requestAnimationFrame(sample);
          },
        ),
    );
    await page.getByRole("button", { name: "Recolher menu" }).click();
    await page.getByRole("button", { name: "Expandir menu" }).click();
    const frames = await recording;
    expect(frames.length).toBeGreaterThan(5);
    expect(
      Math.max(...frames.map((frame) => frame.pageOverflow)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.max(...frames.map((frame) => frame.horizontalBar)),
    ).toBeLessThanOrEqual(1);
  });
});
