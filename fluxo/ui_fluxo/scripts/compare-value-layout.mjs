import { chromium } from "playwright";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Reproduce the original final visual markup without loading another app build.
// Only AnimatedValue's aria-hidden wrapper is replaced; accessible final text,
// parents, actual financial values, fonts, theme and all other DOM stay intact.
const execFile = promisify(execFileCallback);
const project = fileURLToPath(new URL("../", import.meta.url));
const baseURL = process.argv[2] ?? "http://127.0.0.1:4174";
const output = path.resolve(
  project,
  process.argv[3] ?? "outputs/performance/2026-11-16-values-visual",
);
const headed = process.env.VISUAL_HEADED === "1";
const containOverride = process.env.VISUAL_VALUE_CONTAIN;
if (
  containOverride &&
  !["style", "none", "layout style"].includes(containOverride)
)
  throw new Error("VISUAL_VALUE_CONTAIN must be style, none or layout style");
const sizes = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];
await mkdir(output, { recursive: true });
const report = {
  status: "running",
  createdAt: new Date().toISOString(),
  baseURL,
  headed,
  containOverride: containOverride ?? null,
  method:
    "Same stable real-app viewport before and after replacing .animated-value with its final live textNode; reduced motion, no hover. Assert exact RGBA inside each numeric rectangle plus2px and exact text/parent geometry. Report other viewport pixels separately without asserting them.",
  limitations:
    "Final number pixels and geometry only; does not claim the whole viewport is identical, or measure count performance/intermediate widths. Offscreen number pixels are not tested, but their text and parent geometry is checked.",
  cases: [],
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
  for (const viewport of sizes) {
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        locale: "pt-BR",
        timezoneId: "America/Sao_Paulo",
      });
      await context.addInitScript(
        (value) => localStorage.setItem("fluxo-ui:theme", value),
        theme,
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${baseURL.replace(/\/$/, "")}/painel`);
      await page
        .getByRole("heading", { name: "Seu dinheiro, com clareza." })
        .waitFor();
      await page.locator(".route-color-stage").waitFor({ state: "detached" });
      await page.waitForFunction(
        () => document.querySelectorAll(".animated-value").length === 5,
      );
      await page.evaluate(() => document.fonts.ready);
      if (containOverride)
        await page.addStyleTag({
          content: `.animated-value-live{contain:${containOverride}!important}`,
        });
      await page.waitForTimeout(150);
      const name = `${viewport.width}x${viewport.height}-${theme}`;
      const current = path.join(output, `${name}-reserved.png`);
      const original = path.join(output, `${name}-original-text.png`);
      const values = await page
        .locator(".animated-value")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const final = element.querySelector(
              ".animated-value-size",
            )?.textContent;
            const live = element.querySelector(
              ".animated-value-live",
            )?.textContent;
            if (final !== live)
              throw new Error("Numeric animation was not settled");
            const { x, y, width, height } = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            const range = document.createRange();
            range.selectNodeContents(
              element.querySelector(".animated-value-live"),
            );
            return {
              final,
              x,
              y,
              width,
              height,
              font: style.font,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              liveTextRange: range.getBoundingClientRect().toJSON(),
              parentRect: element.parentElement
                .getBoundingClientRect()
                .toJSON(),
            };
          }),
        );
      const themeInDOM = await page.locator("html").getAttribute("data-theme");
      if ((themeInDOM === "dark" ? "dark" : "light") !== theme)
        throw new Error(`Incorrect theme in ${name}`);
      await page.screenshot({
        path: current,
        animations: "disabled",
        caret: "hide",
      });
      const originalValues = await page
        .locator(".animated-value")
        .evaluateAll((elements) => {
          return elements.map((element) => {
            const value = element.querySelector(
              ".animated-value-live",
            )?.textContent;
            if (value === undefined || value === null)
              throw new Error("Missing final number text");
            const parent = element.parentElement;
            const text = document.createTextNode(value);
            element.replaceWith(text);
            const range = document.createRange();
            range.selectNodeContents(text);
            return {
              final: value,
              textRange: range.getBoundingClientRect().toJSON(),
              parentRect: parent.getBoundingClientRect().toJSON(),
            };
          });
        });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      await page.screenshot({
        path: original,
        animations: "disabled",
        caret: "hide",
      });
      if (errors.length) throw new Error(errors.join("; "));
      report.cases.push({
        name,
        viewport,
        theme,
        values,
        originalValues,
        current,
        original,
        difference: path.join(output, `${name}-difference.png`),
      });
      await context.close();
    }
  }
  const manifest = path.join(output, "cases.json");
  await writeFile(manifest, JSON.stringify(report.cases, null, 2) + "\n");
  const compared = await execFile(
    process.env.VISUAL_PYTHON ?? "python3",
    [
      "-c",
      String.raw`
import json, math, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageStat
results=[]
for case in json.loads(Path(sys.argv[1]).read_text()):
    current=Image.open(case['current']).convert('RGBA')
    original=Image.open(case['original']).convert('RGBA')
    if current.size != original.size:
        raise ValueError('Screenshot dimensions differ')
    difference=ImageChops.difference(current,original)
    maximum=difference.getchannel('R')
    for channel in difference.split()[1:]:
        maximum=ImageChops.lighter(maximum,channel)
    changed=maximum.point(lambda value: 255 if value else 0)
    count=changed.histogram()[255]
    outside_numbers=changed.copy()
    outside_draw=ImageDraw.Draw(outside_numbers)
    width,height=current.size
    number_regions=[]
    for value,original_value in zip(case['values'],case['originalValues']):
        left=max(0,min(width,math.floor(value['x'])-2))
        top=max(0,min(height,math.floor(value['y'])-2))
        right=max(0,min(width,math.ceil(value['x']+value['width'])+2))
        bottom=max(0,min(height,math.ceil(value['y']+value['height'])+2))
        visible=left<right and top<bottom
        different=changed.crop((left,top,right,bottom)).histogram()[255] if visible else None
        if visible:
            outside_draw.rectangle((left,top,right-1,bottom-1),fill=0)
        text_delta={key:original_value['textRange'][key]-value['liveTextRange'][key] for key in ['x','y','width','height']}
        parent_delta={key:original_value['parentRect'][key]-value['parentRect'][key] for key in ['x','y','width','height']}
        geometry_equal=all(delta==0 for delta in [*text_delta.values(),*parent_delta.values()])
        number_regions.append({'value':value['final'],'roi':[left,top,right,bottom],
                               'visibleInViewport':visible,'differentPixels':different,
                               'textRangeDelta':text_delta,'parentRectDelta':parent_delta,
                               'geometryEqual':geometry_equal,
                               'passed':geometry_equal and (different==0 or not visible)})
    heatmap=current.convert('RGB').point(lambda value: round(value*0.3))
    heatmap.paste((255,30,90),mask=changed)
    heatmap.save(case['difference'])
    results.append({**case,'numericRegions':number_regions,
                    'numericPixelsDifferent':sum(region['differentPixels'] or 0 for region in number_regions),
                    'differentPixelsWholeViewport':count,
                    'differentPixelsOutsideNumbers':outside_numbers.histogram()[255],
                    'outsideNumbersDifferenceBBox':outside_numbers.getbbox(),
                    'maximumChannelErrorWholeViewport':maximum.getextrema()[1],
                    'meanAbsoluteRGBAWholeViewport':sum(ImageStat.Stat(difference).mean)/4,
                    'passed':all(region['passed'] for region in number_regions)})
print(json.dumps(results))
`,
      manifest,
    ],
    { maxBuffer: 4 * 1024 * 1024 },
  );
  report.cases = JSON.parse(compared.stdout);
  report.summary = {
    cases: report.cases.length,
    passed: report.cases.filter((item) => item.passed).length,
    failed: report.cases.filter((item) => !item.passed).length,
    numericPixelsDifferent: report.cases.reduce(
      (sum, item) => sum + item.numericPixelsDifferent,
      0,
    ),
    differentPixelsWholeViewport: report.cases.reduce(
      (sum, item) => sum + item.differentPixelsWholeViewport,
      0,
    ),
    differentPixelsOutsideNumbers: report.cases.reduce(
      (sum, item) => sum + item.differentPixelsOutsideNumbers,
      0,
    ),
  };
  report.status =
    report.summary.failed || report.summary.cases !== 6 ? "failed" : "passed";
  if (report.status === "failed") process.exitCode = 1;
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
