import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/painel",
  "/lancamentos",
  "/contas",
  "/cartoes",
  "/recompensas",
  "/planejamento",
  "/parcelamentos",
  "/assinaturas",
  "/orcamentos",
  "/patrimonio",
  "/patrimonio?aba=investimentos",
  "/patrimonio?aba=metas",
  "/patrimonio?aba=saude",
  "/viagens",
  "/relatorios",
  "/relatorios/renda",
  "/relatorios/despesas",
  "/relatorios/assinaturas",
  "/projetos",
  "/projetos/quadro",
  "/projetos/agenda",
  "/projetos/horas",
  "/projetos/project-aurora",
  "/projetos/project-aurora?aba=cobranca",
  "/projetos/project-aurora?aba=horas",
  "/projetos/project-aurora?aba=documentos",
  "/projetos/project-aurora?aba=propostas",
  "/projetos/project-aurora?aba=github",
  "/assistente",
  "/automaticos",
  "/automaticos?aba=importacoes",
  "/configuracoes",
  "/configuracoes?aba=categorias",
  "/configuracoes?aba=aparencia",
  "/configuracoes?aba=integracoes",
  "/configuracoes?aba=aparelhos",
  "/configuracoes?aba=seguranca",
  "/entrar",
];
test("todas as áreas abrem sem erros e permanecem dentro da largura da tela", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1, .login-form h2").first()).toBeVisible();
    await expect(
      page.getByText("Não foi possível abrir esta página."),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      route,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("lançamento pode ser criado, editado, filtrado e permanece após recarregar", async ({
  page,
}) => {
  await page.goto("/lancamentos");
  await page
    .getByRole("button", { name: "Novo lançamento", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Descrição", { exact: true })
    .fill("Despesa de validação");
  await dialog.getByLabel("Valor (R$)", { exact: true }).fill("123,45");
  await dialog.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByPlaceholder("Buscar lançamento").fill("Despesa de validação");
  await expect(
    page.getByText("Despesa de validação", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Despesa de validação", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar Despesa de validação" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Valor (R$)", { exact: true })
    .fill("234,56");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(page.getByRole("cell", { name: /234,56/ })).toBeVisible();
});
test("fatura, importação e conversa usam somente a demonstração", async ({
  page,
}) => {
  await page.goto("/cartoes");
  await page.getByRole("button", { name: "Simular pagamento" }).click();
  await page.getByRole("dialog").getByLabel("Valor do pagamento").fill("10,00");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/automaticos?aba=importacoes");
  await page.getByLabel("Selecionar extrato").setInputFiles({
    name: "validacao.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Data;Descrição;Valor\n11/11/2026;Compra de teste CSV;-45,90",
    ),
  });
  await expect(
    page.getByRole("cell", { name: "Compra de teste CSV", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar selecionados" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await expect(page.getByText("Revisão concluída")).toBeVisible();
  await page.goto("/assistente");
  await page
    .getByRole("button", { name: "Quanto tenho livre para gastar?" })
    .click();
  await expect(page.getByRole("log")).toContainText(
    "A folga projetada deste ciclo",
  );
});
test("desktop e mobile não apresentam violações sérias de acessibilidade", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/painel");
    await expect(
      page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
  }
});
test("seis resoluções, temas e navegação mobile", async ({ page }) => {
  for (const width of [1440, 1280, 1054, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/painel");
    await expect(
      page.getByRole("heading", { name: "Seu dinheiro, com clareza." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      "largura " + width,
    ).toBe(true);
    await page.screenshot({
      path: `test-results/painel-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "test-results/painel-escuro-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Abrir menu", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Contas", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Um lugar para cada plano." }),
  ).toBeVisible();
});
test("composição desktop usa a largura de 16:9 sem empurrar os blocos principais para baixo", async ({
  page,
}) => {
  for (const size of [
    { width: 1920, height: 930 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/painel");
    await expect(
      page.getByRole("heading", { name: "Espaço para os seus planos" }),
    ).toBeVisible();
    const bounds = await page.locator(".dashboard-bottom").boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThan(size.height);
    await page.screenshot({
      path: `test-results/desktop-${size.width}x${size.height}.png`,
      fullPage: true,
    });
  }
});
