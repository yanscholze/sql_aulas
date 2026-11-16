import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";

const label = process.argv[2] ?? "baseline";
const baseURL = process.argv[3] ?? "http://127.0.0.1:4174";
const experiment = process.argv[4] ?? "normal";
const trials = Number(process.argv[5] ?? 5);
await mkdir("outputs/performance", { recursive: true });
const headed = process.env.PROFILE_HEADED === "1";
const viewport = {
  width: Number(process.env.PROFILE_WIDTH ?? 1920),
  height: Number(process.env.PROFILE_HEIGHT ?? 1080),
};
const browser = await chromium.launch({
  headless: !headed,
  ...(headed ? { executablePath: "/usr/bin/google-chrome-stable" } : {}),
});
const browserSession = await browser.newBrowserCDPSession();
const { gpu } = await browserSession.send("SystemInfo.getInfo");
const context = await browser.newContext({
  viewport,
  reducedMotion: "no-preference",
});
const page = await context.newPage();
if (headed) await page.bringToFront();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(baseURL + "/painel");
await page
  .getByRole("heading", { name: "Seu dinheiro, com clareza." })
  .waitFor();
await page.locator(".route-color-stage").waitFor({ state: "detached" });
await page.waitForTimeout(1500);
if (experiment === "no-mask")
  await page.addStyleTag({
    content:
      ".route-color-curtain { mask-image: none !important; -webkit-mask-image:none !important; }",
  });
if (experiment === "no-card-splash")
  await page.addStyleTag({
    content: ".card-color-splash-mask { display: none !important; }",
  });
const session = await context.newCDPSession(page);
await session.send("Performance.enable");
const metricNames = [
  "TaskDuration",
  "ScriptDuration",
  "LayoutDuration",
  "RecalcStyleDuration",
  "LayoutCount",
  "RecalcStyleCount",
];
const results = [];
for (let i = 0; i < trials; i++) {
  const before = (await session.send("Performance.getMetrics")).metrics;
  const recording = page.evaluate(
    () =>
      new Promise((resolve) => {
        const longTasks = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            longTasks.push({
              start: entry.startTime,
              duration: entry.duration,
            });
        });
        observer.observe({ type: "longtask" });
        document.addEventListener(
          "click",
          () => {
            const start = performance.now();
            const frames = [];
            const sample = (time) => {
              const stage = document.querySelector(".route-color-stage");
              frames.push({
                time: time - start,
                phase: stage?.getAttribute("data-phase") ?? null,
              });
              if (time - start < 1700) requestAnimationFrame(sample);
              else {
                observer.disconnect();
                resolve({
                  frames,
                  longTasks: longTasks.filter((x) => x.start >= start),
                });
              }
            };
            requestAnimationFrame(sample);
          },
          { once: true, capture: true },
        );
      }),
  );
  await page.getByRole("button", { name: "Rever animações" }).click();
  const sample = await recording;
  const after = (await session.send("Performance.getMetrics")).metrics;
  const metrics = Object.fromEntries(
    metricNames.map((name) => [
      name,
      (after.find((m) => m.name === name)?.value ?? 0) -
        (before.find((m) => m.name === name)?.value ?? 0),
    ]),
  );
  results.push({ ...sample, metrics });
}
if (process.env.PROFILE_TRACE === "1") {
  const events = [];
  session.on("Tracing.dataCollected", ({ value }) => events.push(...value));
  await session.send("Tracing.start", {
    categories: "devtools.timeline,blink.user_timing,v8",
    transferMode: "ReportEvents",
  });
  await page.getByRole("button", { name: "Rever animações" }).click();
  await page.waitForTimeout(1700);
  const finished = new Promise((resolve) =>
    session.once("Tracing.tracingComplete", resolve),
  );
  await session.send("Tracing.end");
  await finished;
  await writeFile(
    `outputs/performance/${label}-trace.json`,
    JSON.stringify({ traceEvents: events }),
  );
  const totals = {};
  for (const event of events)
    if (
      event.ph === "X" &&
      [
        "Paint",
        "PrePaint",
        "Layout",
        "UpdateLayoutTree",
        "FunctionCall",
        "RasterTask",
      ].includes(event.name)
    )
      totals[event.name] = (totals[event.name] ?? 0) + (event.dur ?? 0) / 1000;
  console.log("Trace totals (ms):", JSON.stringify(totals));
}
const gaps = results
  .flatMap((r) =>
    r.frames
      .slice(1)
      .map((f, i) => ({
        gap: f.time - r.frames[i].time,
        active: f.phase !== null || r.frames[i].phase !== null,
      })),
  )
  .filter((s) => s.active)
  .map((s) => s.gap)
  .sort((a, b) => a - b);
const mean = (a) => a.reduce((sum, x) => sum + x, 0) / Math.max(1, a.length);
const summary = {
  label,
  baseURL,
  experiment,
  trials,
  viewport,
  headed,
  browser: browser.version(),
  hardware: {
    cpu: os.cpus()[0].model,
    cores: os.cpus().length,
    gpu: gpu.devices,
    featureStatus: gpu.featureStatus,
  },
  animationFrames: gaps.length,
  frameMeanMs: mean(gaps),
  frameP95Ms: gaps[Math.floor(gaps.length * 0.95)],
  framesOver25ms: gaps.filter((x) => x > 25).length,
  longTasks: results.flatMap((r) => r.longTasks).length,
  longTaskTotalMs: results
    .flatMap((r) => r.longTasks)
    .reduce((sum, x) => sum + x.duration, 0),
  metrics: Object.fromEntries(
    metricNames.map((name) => [
      name,
      mean(results.map((r) => r.metrics[name])),
    ]),
  ),
  errors,
};
await writeFile(
  `outputs/performance/${label}.json`,
  JSON.stringify({ summary, results }, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
await browser.close();
