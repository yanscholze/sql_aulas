import { chromium } from "playwright";
import ts from "typescript";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Pixel equivalence only. This fixture does not measure presented FPS or prove
// navigation sequencing; motion.spec.ts and the exclusive profiler cover those.
// Usage: VISUAL_HEADED=1 node scripts/compare-color-renderers.mjs [URL] [OUTPUT]
const execFile = promisify(execFileCallback);
const project = fileURLToPath(new URL("../", import.meta.url));
const baseURL = process.argv[2] ?? "http://127.0.0.1:4174";
const output = path.resolve(
  project,
  process.argv[3] ?? "outputs/performance/2026-11-15-visual",
);
const viewport = { width: 1440, height: 900 };
const dpr = Number(process.env.VISUAL_DPR ?? 1);
const headed = process.env.VISUAL_HEADED === "1";
const approvedRef = process.env.VISUAL_APPROVED_REF ?? "5d70963";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const timing = {
  covering: { durationMs: 220, ease: [0.35, 0, 0.3, 1] },
  revealing: { durationMs: 420, ease: [0.45, 0, 0.3, 1] },
};
const palettes = {
  light: { highlight: "#6ba8f4", color: "#3678ec", depth: "#2353b7" },
  dark: { highlight: "#234c79", color: "#17345a", depth: "#101d34" },
};

function geometryAt(origin) {
  const start = {
    x: Math.max(0, Math.min(origin.x, viewport.width)),
    y: Math.max(0, Math.min(origin.y, viewport.height)),
  };
  return {
    start,
    ...viewport,
    radius:
      Math.ceil(
        Math.hypot(
          Math.max(start.x, viewport.width - start.x),
          Math.max(start.y, viewport.height - start.y),
        ),
      ) + 32,
  };
}

// Solve the Bezier x coordinate before evaluating y: a time fraction is not the
// Bezier parameter. The same approved easing is used for both renderers.
function easedProgress(fraction, [x1, y1, x2, y2]) {
  const cubic = (t, a, b) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 48; i++) {
    const middle = (low + high) / 2;
    if (cubic(middle, x1, x2) < fraction) low = middle;
    else high = middle;
  }
  return cubic((low + high) / 2, y1, y2);
}

function moduleURL(source, fileName, dependencies = {}) {
  const result = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      isolatedModules: true,
    },
    reportDiagnostics: true,
  });
  const errors = result.diagnostics?.filter(
    (item) => item.category === ts.DiagnosticCategory.Error,
  );
  if (errors?.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(errors, {
        getCurrentDirectory: () => project,
        getCanonicalFileName: (name) => name,
        getNewLine: () => "\n",
      }),
    );
  let javascript = result.outputText;
  for (const [specifier, url] of Object.entries(dependencies))
    javascript = javascript
      .replaceAll(JSON.stringify(specifier), JSON.stringify(url))
      .replaceAll(`'${specifier}'`, JSON.stringify(url));
  const parsed = ts.createSourceFile(
    fileName,
    javascript,
    ts.ScriptTarget.ES2022,
  );
  for (const statement of parsed.statements) {
    if (
      (ts.isImportDeclaration(statement) ||
        ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith(".")
    )
      throw new Error(`${fileName} has an unresolved relative runtime import`);
  }
  return `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
}

const pixelComparison = String.raw`
import json, math, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat

manifest = json.loads(Path(sys.argv[1]).read_text())
results = []
for case in manifest:
    expected = Image.open(case['expected']).convert('RGBA')
    actual = Image.open(case['actual']).convert('RGBA')
    if expected.size != actual.size:
        raise ValueError('Screenshot dimensions differ: ' + case['name'])
    width, height = actual.size
    sx, sy = width / case['geometry']['width'], height / case['geometry']['height']
    if abs(sx - sy) > 1e-9:
        raise ValueError('Nonuniform screenshot scale is unsupported')
    cx = case['geometry']['start']['x'] * sx
    cy = case['geometry']['start']['y'] * sy
    radius = case['boundaryRadius'] * sx
    band_width = 1.5  # Physical pixels, regardless of CSS DPR.
    outer, inner = radius + band_width, max(0, radius - band_width)
    band = Image.new('L', actual.size, 0)
    draw = ImageDraw.Draw(band)
    def interval(left, right, row):
        first, last = max(0, math.ceil(left - 0.5)), min(width - 1, math.floor(right - 0.5))
        if first <= last:
            draw.line((first, row, last, row), fill=255)
    for row in range(height):
        dy = abs(row + 0.5 - cy)
        if dy > outer:
            continue
        dx_outer = math.sqrt(max(0, outer * outer - dy * dy))
        if dy >= inner:
            interval(cx - dx_outer, cx + dx_outer, row)
        else:
            dx_inner = math.sqrt(max(0, inner * inner - dy * dy))
            interval(cx - dx_outer, cx - dx_inner, row)
            interval(cx + dx_inner, cx + dx_outer, row)
    outside = ImageChops.invert(band)
    difference = ImageChops.difference(expected, actual)
    channels = difference.split()
    maximum = channels[0]
    for channel in channels[1:]:
        maximum = ImageChops.lighter(maximum, channel)
    above_two = maximum.point(lambda value: 255 if value > 2 else 0)
    outside_errors = ImageChops.multiply(above_two, outside)
    outside_count = outside.histogram()[255]
    stat = ImageStat.Stat(difference, outside)
    bad_count = outside_errors.histogram()[255]
    result = {
        **case,
        'physicalSize': [width, height],
        'aaBandPhysicalPixels': band_width,
        'tolerancePerChannel': 2,
        'outsideBandPixels': outside_count,
        'aaBandPixels': band.histogram()[255],
        'meanAbsoluteRGBAOutsideBand': sum(stat.sum) / (4 * outside_count) if outside_count else 0,
        'meanAbsoluteChannelsOutsideBand': stat.mean,
        'maxChannelErrorOutsideBand': ImageChops.multiply(maximum, outside).getextrema()[1],
        'pixelsAboveTwoOutsideBand': bad_count,
        'pixelsAboveTwoWholeImage': above_two.histogram()[255],
        'maxChannelErrorWholeImage': maximum.getextrema()[1],
        'passed': bad_count == 0,
    }
    # Yellow marks tolerated edge differences; red marks forbidden interior or
    # exterior differences. The unchanged app backdrop stays dimly visible.
    heatmap = actual.convert('RGB').point(lambda value: round(value * 0.3))
    heatmap.paste((255, 220, 0), mask=ImageChops.multiply(above_two, band))
    heatmap.paste((255, 30, 90), mask=outside_errors)
    diff_path = str(Path(case['actual']).with_name(case['name'] + '-diff.png'))
    heatmap.save(diff_path)
    result['difference'] = diff_path
    results.append(result)
print(json.dumps(results))
`;

async function run() {
  if (!Number.isFinite(dpr) || dpr <= 0) throw new Error("Invalid VISUAL_DPR");
  await mkdir(output, { recursive: true });
  const git = async (...args) =>
    (await execFile("git", args, { cwd: project })).stdout.trim();
  const prefix = await git("rev-parse", "--show-prefix");
  const approvedSource = await git(
    "show",
    `${approvedRef}:${prefix}src/motion/color-transition.tsx`,
  );
  const approvedCSS = await git(
    "show",
    `${approvedRef}:${prefix}src/design-system/styles.css`,
  );
  // Fail if HEAD no longer represents the approved SVG implementation. The
  // reference must be explicit rather than silently comparing a rewrite to itself.
  for (const token of [
    'fillRule="evenodd"',
    'gradientUnits="userSpaceOnUse"',
    'offset=".58"',
    'phase === "covering" ? 22 : radius',
    "cover: 0.22, reveal: 0.42",
    "[0.35, 0, 0.3, 1]",
    "[0.45, 0, 0.3, 1]",
  ]) {
    if (!approvedSource.includes(token))
      throw new Error(`Approved HEAD renderer guard failed: ${token}`);
  }
  for (const palette of Object.values(palettes))
    for (const value of Object.values(palette))
      if (!approvedCSS.toLowerCase().includes(value))
        throw new Error(`Approved HEAD palette guard failed: ${value}`);
  const canvasSource = await readFile(
    path.join(project, "src/motion/color-canvas.ts"),
    "utf8",
  );
  const contractSource = await readFile(
    path.join(project, "src/motion/color-contract.ts"),
    "utf8",
  );
  const contractURL = moduleURL(contractSource, "color-contract.ts");
  const canvasURL = moduleURL(canvasSource, "color-canvas.ts", {
    "./color-contract": contractURL,
  });
  const contract = await import(contractURL);
  for (const [phase, key] of [
    ["covering", "cover"],
    ["revealing", "reveal"],
  ]) {
    const current = contract.COLOR_MOTION[key];
    if (
      current.duration * 1000 !== timing[phase].durationMs ||
      JSON.stringify(current.ease) !== JSON.stringify(timing[phase].ease)
    )
      throw new Error(
        `Current ${phase} timing differs from the approved contract`,
      );
  }
  const report = {
    status: "running",
    createdAt: new Date().toISOString(),
    baseURL,
    viewport,
    dpr,
    headed,
    approved: {
      commit: await git("rev-parse", approvedRef),
      rendererSHA256: sha256(approvedSource),
      cssSHA256: sha256(approvedCSS),
    },
    candidate: {
      rendererSHA256: sha256(canvasSource),
      contractSHA256: sha256(contractSource),
    },
    method: {
      backdrop: "One stable real-app PNG per theme, shared by both renderers",
      origins: "Centers of the real Replay button and sidebar Contas link",
      checkpoints: [0.25, 0.5, 0.75],
      timing,
      reference:
        "Approved HEAD SVG gradient, outer CSS circle clip and even-odd aperture",
      exclusions:
        "Shared orb is unchanged and already covered by the disc at these checkpoints",
      presentation:
        "Canvas redraws the same fixed state on each fixture rAF during screenshots",
      assertion:
        "No RGBA channel difference >2 outside an exact 1.5-physical-pixel radial edge band",
      limitations:
        "Frozen renderer fixture; not an end-to-end transition, timing or FPS measurement",
    },
  };
  let browser;
  try {
    browser = await chromium.launch({
      headless: !headed,
      ...(process.env.VISUAL_CHROME || headed
        ? {
            executablePath:
              process.env.VISUAL_CHROME ?? "/usr/bin/google-chrome-stable",
          }
        : {}),
    });
    report.browser = browser.version();
    const cdp = await browser.newBrowserCDPSession();
    report.gpu = (await cdp.send("SystemInfo.getInfo")).gpu;
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: dpr,
      reducedMotion: "reduce",
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    });
    const app = await context.newPage();
    const fixture = await context.newPage();
    const pageErrors = [];
    app.on("pageerror", (error) => pageErrors.push(error.message));
    fixture.on("pageerror", (error) => pageErrors.push(error.message));
    const cases = [];
    for (const [theme, palette] of Object.entries(palettes)) {
      await app.addInitScript((value) => {
        localStorage.setItem("fluxo-ui:theme", value);
      }, theme);
      await app.goto(`${baseURL.replace(/\/$/, "")}/painel`);
      await app
        .getByRole("heading", { name: "Seu dinheiro, com clareza." })
        .waitFor();
      await app.locator(".route-color-stage").waitFor({ state: "detached" });
      await app.evaluate(() => document.fonts.ready);
      // Select explicitly after navigation too: multiple init scripts have no
      // guaranteed ordering, and theme persistence must not depend on their order.
      const currentTheme = await app.locator("html").getAttribute("data-theme");
      if ((currentTheme === "dark" ? "dark" : "light") !== theme)
        await app
          .getByRole("button", {
            name: theme === "dark" ? "Ativar tema escuro" : "Ativar tema claro",
          })
          .click();
      await app.waitForTimeout(150);
      const actualPalette = await app.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return Object.fromEntries(
          [
            ["highlight", "--burst-highlight"],
            ["color", "--burst-color"],
            ["depth", "--burst-depth"],
          ].map(([key, property]) => [
            key,
            style.getPropertyValue(property).trim().toLowerCase(),
          ]),
        );
      });
      if (JSON.stringify(actualPalette) !== JSON.stringify(palette))
        throw new Error(
          `Current ${theme} palette differs from approved HEAD: ${JSON.stringify(actualPalette)}`,
        );
      const points = {};
      for (const [name, locator] of [
        ["replay", app.getByRole("button", { name: "Rever animações" })],
        [
          "contas",
          app
            .locator(".desktop-sidebar")
            .getByRole("link", { name: "Contas", exact: true }),
        ],
      ]) {
        const box = await locator.boundingBox();
        if (!box) throw new Error(`Origin target is missing: ${name}`);
        points[name] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }
      const backgroundPath = path.join(output, `${theme}-app-background.png`);
      const backdrop = await app.screenshot({
        path: backgroundPath,
        animations: "disabled",
        caret: "hide",
      });
      await fixture.setContent(`<!doctype html><html><head><style>
        html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}
        #backdrop,#candidate,#reference{position:fixed;inset:0;width:100%;height:100%}
        #backdrop{display:block}#reference{display:none}#candidate{display:block}
      </style></head><body><img id="backdrop" alt="" src="data:image/png;base64,${backdrop.toString("base64")}">
      <canvas id="candidate"></canvas><svg id="reference" xmlns="http://www.w3.org/2000/svg"></svg></body></html>`);
      await fixture.evaluate(
        async ({ canvasURL, palette }) => {
          const { createColorCanvas } = await import(canvasURL);
          const canvas = document.querySelector("#candidate");
          const svg = document.querySelector("#reference");
          const renderer = createColorCanvas(canvas);
          if (!renderer)
            throw new Error(
              "Canvas renderer unavailable; no pixel equivalence claim is possible",
            );
          const rgb = (hex) =>
            [1, 3, 5].map(
              (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
            );
          const colors = Object.fromEntries(
            Object.entries(palette).map(([key, value]) => [key, rgb(value)]),
          );
          let current = null;
          let frame = 0;
          const draw = () => {
            if (!current) return;
            renderer.draw(current.geometry, current.radii, colors);
            frame = requestAnimationFrame(draw);
          };
          window.colorFixture = {
            async show({ kind, geometry, radii }) {
              cancelAnimationFrame(frame);
              current = null;
              canvas.style.display = kind === "canvas" ? "block" : "none";
              svg.style.display = kind === "svg" ? "block" : "none";
              if (kind === "canvas") {
                current = { geometry, radii };
                draw();
              } else {
                const { width, height, start, radius } = geometry;
                const hole = radii.holeRadius;
                // Exact path expression and static user-space gradient from HEAD.
                const aperture = `M 0 0 H ${width} V ${height} H 0 Z M ${start.x - hole} ${start.y} a${hole} ${hole} 0 1 0 ${2 * hole} 0 a${hole} ${hole} 0 1 0 ${-2 * hole} 0 Z`;
                svg.setAttribute("width", width);
                svg.setAttribute("height", height);
                svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
                svg.style.clipPath = `circle(${radii.outerRadius}px at ${start.x}px ${start.y}px)`;
                svg.innerHTML = `<defs><radialGradient id="approved-gradient" gradientUnits="userSpaceOnUse" cx="${start.x}" cy="${start.y}" r="${radius}">
                <stop offset="0" stop-color="${palette.highlight}"/><stop offset=".58" stop-color="${palette.color}"/><stop offset="1" stop-color="${palette.depth}"/>
                </radialGradient></defs><path d="${aperture}" fill="url(#approved-gradient)" fill-rule="evenodd"/>`;
              }
              await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              );
            },
            dispose() {
              cancelAnimationFrame(frame);
              current = null;
              renderer.dispose();
            },
          };
        },
        { canvasURL, palette },
      );
      for (const [origin, point] of Object.entries(points)) {
        const geometry = geometryAt(point);
        if (
          JSON.stringify(
            contract.colorGeometry(point, viewport.width, viewport.height),
          ) !==
          JSON.stringify({
            start: geometry.start,
            radius: geometry.radius,
            width: geometry.width,
            height: geometry.height,
          })
        )
          throw new Error(
            `Candidate geometry differs from approved HEAD at ${origin}`,
          );
        for (const [phase, contractTiming] of Object.entries(timing)) {
          for (const fraction of [0.25, 0.5, 0.75]) {
            const progress = easedProgress(fraction, contractTiming.ease);
            const radii =
              phase === "covering"
                ? {
                    outerRadius: 22 + (geometry.radius - 22) * progress,
                    holeRadius: 0,
                  }
                : {
                    outerRadius: geometry.radius,
                    holeRadius: geometry.radius * progress,
                  };
            const name = `${theme}-${origin}-${phase}-${fraction * 100}`;
            const actual = path.join(output, `${name}-canvas.png`);
            const expected = path.join(output, `${name}-approved-svg.png`);
            await fixture.evaluate((state) => window.colorFixture.show(state), {
              kind: "canvas",
              geometry,
              radii,
            });
            await fixture.screenshot({ path: actual });
            await fixture.evaluate((state) => window.colorFixture.show(state), {
              kind: "svg",
              geometry,
              radii,
            });
            await fixture.screenshot({ path: expected });
            cases.push({
              name,
              theme,
              origin,
              phase,
              fraction,
              timeMs: contractTiming.durationMs * fraction,
              easedProgress: progress,
              timing: contractTiming,
              geometry,
              radii,
              boundaryRadius:
                phase === "covering" ? radii.outerRadius : radii.holeRadius,
              background: backgroundPath,
              actual,
              expected,
            });
          }
        }
      }
      await fixture.evaluate(() => window.colorFixture.dispose());
    }
    if (pageErrors.length)
      throw new Error(`Page errors: ${pageErrors.join("; ")}`);
    const manifest = path.join(output, "cases.json");
    await writeFile(manifest, JSON.stringify(cases, null, 2) + "\n");
    const comparison = await execFile(
      process.env.VISUAL_PYTHON ?? "python3",
      ["-c", pixelComparison, manifest],
      { cwd: project, maxBuffer: 16 * 1024 * 1024 },
    );
    report.results = JSON.parse(comparison.stdout);
    report.summary = {
      pairs: report.results.length,
      passed: report.results.filter((item) => item.passed).length,
      failed: report.results.filter((item) => !item.passed).length,
      worstOutsideBandChannelError: Math.max(
        ...report.results.map((item) => item.maxChannelErrorOutsideBand),
      ),
      totalPixelsAboveTwoOutsideBand: report.results.reduce(
        (sum, item) => sum + item.pixelsAboveTwoOutsideBand,
        0,
      ),
    };
    if (report.summary.pairs !== 24)
      throw new Error("Expected exactly 24 checkpoint pairs");
    report.status = report.summary.failed ? "failed" : "passed";
    if (report.summary.failed) process.exitCode = 1;
  } catch (error) {
    report.status = "failed";
    report.error = error instanceof Error ? error.stack : String(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await writeFile(
      path.join(output, "comparison.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
  }
  console.log(
    JSON.stringify(
      { status: report.status, output, ...report.summary, error: report.error },
      null,
      2,
    ),
  );
}

if (process.argv.includes("--help")) {
  console.log(
    "VISUAL_HEADED=1 node scripts/compare-color-renderers.mjs [http://127.0.0.1:4174] [outputs/performance/2026-11-15-visual]\nRequires a running app, Playwright Chromium (or VISUAL_CHROME), Python3/Pillow and a supported WebGL context. VISUAL_DPR defaults to1. Does not measure FPS.",
  );
} else {
  await run();
}
