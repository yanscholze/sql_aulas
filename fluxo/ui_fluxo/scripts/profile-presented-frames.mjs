/**
 * Isolated, headed Chrome capture. No personal profile, video or screenshots.
 *
 * node scripts/profile-presented-frames.mjs --label before --base-url http://127.0.0.1:4174 --trials 5 --viewport 1920x1080
 * node scripts/profile-presented-frames.mjs --label after --compare outputs/performance/before-summary.json
 *
 * Renderer PipelineReporter termination timestamps are presentation FEEDBACK,
 * not physical-display measurements or proof that every element was updated.
 * rAF and draw/swap event cadences are deliberately reported separately.
 */
import { chromium } from "playwright";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import os from "node:os";

const argv = process.argv.slice(2);
const options = {};
for (let index = 0; index < argv.length; index++) {
  const argument = argv[index];
  if (argument === "--help") {
    console.log("Options: --label NAME --base-url URL --trials N --viewport WIDTHxHEIGHT --duration-ms N --settle-ms N --target-hz N --display :0 --compare FILE --allow-software --overwrite --reanalyze SUMMARY.json");
    process.exit(0);
  }
  if (["--allow-software", "--overwrite"].includes(argument)) options[argument.slice(2)] = true;
  else if (argument.startsWith("--") && argv[index + 1] && !argv[index + 1].startsWith("--")) options[argument.slice(2)] = argv[++index];
  else throw new Error(`Invalid argument: ${argument}. Use --help.`);
}
const label = options.label ?? `headed-${new Date().toISOString().replace(/[:.]/g, "-")}`;
if (!/^[a-zA-Z0-9._-]+$/.test(label)) throw new Error("Label must contain only letters, numbers, ., _ and -.");
const baseURL = options["base-url"] ?? process.env.PROFILE_BASE_URL ?? "http://127.0.0.1:4174";
const viewportMatch = (options.viewport ?? process.env.PROFILE_VIEWPORT ?? "1920x1080").match(/^(\d+)x(\d+)$/);
if (!viewportMatch) throw new Error("Viewport must be WIDTHxHEIGHT.");
const viewport = { width: Number(viewportMatch[1]), height: Number(viewportMatch[2]) };
const trials = Number(options.trials ?? process.env.PROFILE_TRIALS ?? 5);
const durationMs = Number(options["duration-ms"] ?? process.env.PROFILE_DURATION_MS ?? 1700);
const settleMs = Number(options["settle-ms"] ?? process.env.PROFILE_SETTLE_MS ?? 1500);
let targetHz = Number(options["target-hz"] ?? 60);
if (!Number.isInteger(trials) || trials < 1 || trials > 30 || ![durationMs, settleMs, targetHz, viewport.width, viewport.height].every((value) => Number.isFinite(value) && value > 0)) throw new Error("Invalid capture dimensions, duration, trial count or target frequency.");
const outputDirectory = resolve("outputs/performance");
const outputFile = resolve(outputDirectory, `${label}-summary.json`);
await mkdir(outputDirectory, { recursive: true });
if (!options.overwrite) {
  try { await access(outputFile); throw new Error(`Refusing to replace ${outputFile}; choose another --label or use --overwrite.`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
const traceCategories = [
  "toplevel", "cc", "viz", "benchmark", "devtools.timeline", "blink.user_timing", "v8",
  "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame",
  "disabled-by-default-cc.debug.scheduler",
];
const metricNames = ["TaskDuration", "ScriptDuration", "LayoutDuration", "RecalcStyleDuration", "LayoutCount", "RecalcStyleCount"];
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
function intervalStatistics(intervalsMs) {
  const sorted = intervalsMs.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  const average = mean(sorted);
  const percentile = (fraction) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] : null;
  return {
    intervalCount: sorted.length,
    intervalMeanMs: average,
    intervalMedianMs: percentile(0.5),
    intervalP95Ms: percentile(0.95),
    intervalMaxMs: sorted.at(-1) ?? null,
    cadenceHz: average ? 1000 / average : null,
    intervalsOver25Ms: sorted.filter((value) => value > 25).length,
    intervalsOver1_5TargetPeriods: sorted.filter((value) => value > 1500 / targetHz).length,
    targetHz,
  };
}
function cadence(timestampsUs) {
  const unique = [...new Set(timestampsUs)].sort((a, b) => a - b);
  const intervalsMs = unique.slice(1).map((value, index) => (value - unique[index]) / 1000);
  return { eventCount: timestampsUs.length, uniqueTimestampCount: unique.length, ...intervalStatistics(intervalsMs), intervalsMs };
}
function groupedCadences(events, identity) {
  const groups = new Map();
  for (const event of events) {
    const key = identity(event);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  return [...groups.entries()].map(([group, records]) => ({ group, pid:records[0].pid, tid:records[0].tid, ...cadence(records.map((event) => event.ts)) })).sort((a, b) => b.eventCount - a.eventCount);
}
function reporterPayload(event) {
  return event.args?.frame_reporter ?? event.args?.chrome_frame_reporter ?? event.args?.chrome_frame_reporter2 ?? event.args?.data?.chrome_frame_reporter ?? null;
}
function analyzeTrace(trace, markerPrefix) {
  const events = trace.traceEvents ?? [];
  const start = events.find((event) => event.name === `${markerPrefix}-start`);
  const end = events.find((event) => event.name === `${markerPrefix}-end`);
  const stageEnd = events.find((event) => event.name === `${markerPrefix}-stage-end`);
  if (!start || !end) throw new Error("Trace has no matching user-timing markers; refusing to infer timing windows.");
  const rendererPid = start.pid;
  const rendererTid = start.tid;
  const asyncIdentity = (event) => `${event.pid}:${event.id2?.global ?? event.id2?.local ?? event.id ?? "missing"}`;
  const pendingReports = new Map();
  const completedReports = [];
  const trackerNames = new Map();
  const trackerFrameEnds = [];
  for (const event of [...events].sort((a,b) => a.ts-b.ts)) {
    if (event.pid !== rendererPid) continue;
    const identity = asyncIdentity(event);
    if (event.name === "FrameSequenceTrackerV3" && event.ph === "b") trackerNames.set(identity,event.args?.name??"unknown");
    if (/^Frame\s*$/.test(event.name??"") && event.ph === "e" && trackerNames.has(identity)) trackerFrameEnds.push({...event,tracker:trackerNames.get(identity)});
    if (event.name !== "PipelineReporter") continue;
    if (event.ph === "b" && reporterPayload(event)) pendingReports.set(identity,event);
    else if (event.ph === "e" && pendingReports.has(identity)) {
      const beginning=pendingReports.get(identity);
      completedReports.push({...reporterPayload(beginning),pid:event.pid,tid:event.tid,startTs:beginning.ts,endTs:event.ts});
      pendingReports.delete(identity);
    } else if (event.ph === "X" && reporterPayload(event)) completedReports.push({...reporterPayload(event),pid:event.pid,tid:event.tid,startTs:event.ts,endTs:event.ts+(event.dur??0)});
  }
  const windowAnalysis = (to) => {
    const inside = events.filter((event) => typeof event.ts === "number" && event.ts >= start.ts && event.ts <= to);
    const presented = inside.filter((event) => event.name === "FramePresented");
    const animationFramePresentation = inside.filter((event) => event.pid === rendererPid && event.name === "AnimationFrame::Presentation");
    const pipelinePresentation = completedReports.filter((report) => report.endTs >= start.ts && report.endTs <= to && ["STATE_PRESENTED_ALL","STATE_PRESENTED_PARTIAL",1,2].includes(report.state)).map((report) => ({...report,ts:report.endTs}));
    const sequenceTerminations = trackerFrameEnds.filter((event)=>event.ts>=start.ts&&event.ts<=to);
    const trackerSummaries = inside.filter((event) => event.pid===rendererPid&&event.name==="FrameSequenceTrackerV3"&&event.ph==="b").map((event)=>({tracker:event.args?.name,id:asyncIdentity(event),ts:event.ts,data:event.args?.args?.data??event.args?.data??null}));
    const rendererPresented = presented.filter((event) => event.pid === rendererPid);
    const browserPresented = presented.filter((event) => event.args?.environment === "browser");
    const namedDrawEvents = inside.filter((event) => ["DrawFrame", "Display::DrawAndSwap", "Graphics.Pipeline.DrawAndSwap", "Graphics.Pipeline.Draw"].includes(event.name) && ["X", "B", "b", "I", "i"].includes(event.ph));
    const pipelineEvents = inside.filter((event) => event.pid === rendererPid && event.name === "PipelineReporter" && reporterPayload(event));
    const pipelineStates = {};
    const pipelineRecords = pipelineEvents.map((event) => {
      const data = reporterPayload(event);
      pipelineStates[String(data.state)] = (pipelineStates[String(data.state)] ?? 0) + 1;
      return { ts:event.ts, pid:event.pid, tid:event.tid, phase:event.ph, ...data };
    });
    const mainThreadCosts = {};
    for (const event of inside) if (event.pid === rendererPid && event.tid === rendererTid && event.ph === "X" && ["FunctionCall", "UpdateLayoutTree", "PrePaint", "Paint", "Layout", "CompositeLayers"].includes(event.name)) {
      mainThreadCosts[event.name] = (mainThreadCosts[event.name] ?? 0) + (event.dur ?? 0) / 1000;
    }
    const frameSequenceEvents = inside.filter((event) => event.pid === rendererPid && event.name === "FrameSequenceTracker");
    const frameSequencePresentedSteps = frameSequenceEvents.filter((event) => event.args?.step === "FramePresented" || event.args?.data?.step === "FramePresented");
    return {
      elapsedMs:(to - start.ts) / 1000,
      presentationFeedback:{
        interpretation:"Renderer PipelineReporter presented-state termination timestamps and AnimationFrame::Presentation are Chromium presentation feedback. Browser-window FramePresented is reported separately and is not used as app presentation cadence.",
        pipelinePresentedTerminations:groupedCadences(pipelinePresentation,(event)=>`${event.pid}:layer-tree-${event.layer_tree_host_id??"unknown"}`),
        animationFramePresentation:groupedCadences(animationFramePresentation,(event)=>`${event.pid}:${event.tid}`),
        frameSequenceTrackerV3Terminations:groupedCadences(sequenceTerminations,(event)=>`${event.tracker}:${asyncIdentity(event)}`),
        renderer:groupedCadences(rendererPresented, (event) => `${event.pid}:${event.tid}`),
        browserWindow:groupedCadences(browserPresented, (event) => `${event.pid}:${event.tid}`),
        otherFramePresented:groupedCadences(presented.filter((event) => event.pid !== rendererPid && event.args?.environment !== "browser"), (event) => `${event.pid}:${event.tid}:${event.args?.environment??"unspecified"}`),
      },
      drawEventCadences:groupedCadences(namedDrawEvents, (event) => `${event.name}:${event.pid}:${event.tid}`),
      pipelineReporter:{
        interpretation:"Raw renderer PipelineReporter states, not a deduplicated dropped-frame percentage. Forked/backfill reports can share a frame sequence.",
        rawRecordCount:pipelineRecords.length, rawStates:pipelineStates,
        compositorAnimationRecords:pipelineRecords.filter((record) => record.has_compositor_animation).length,
        mainAnimationRecords:pipelineRecords.filter((record) => record.has_main_animation).length,
        affectsSmoothnessRecords:pipelineRecords.filter((record) => record.affects_smoothness).length,
        records:pipelineRecords,
      },
      frameSequenceTrackerV3Summaries:{interpretation:"Tracker-level cumulative expected/dropped counters. They can cover more than the selected window; do not sum overlapping tracker types.",records:trackerSummaries},
      frameSequencePresentedSteps:groupedCadences(frameSequencePresentedSteps, (event) => `${event.pid}:${event.tid}:${event.id??event.id2?.local??"unknown"}`),
      rendererMainSynchronousEventDurationSumsMs:mainThreadCosts,
      caveat:"Per-event duration sums may overlap nested events; do not sum categories as total CPU time. Draw/swap cadence is not presented-frame cadence.",
    };
  };
  const inventory = {};
  for (const event of events) if (/Present|FrameSequenceTracker|PipelineReporter|DrawFrame|DrawAndSwap/.test(event.name??"")) {
    const key = `${event.name}|${event.ph}`;
    if (!inventory[key]) inventory[key] = {count:0,sample:{pid:event.pid,tid:event.tid,args:event.args}};
    inventory[key].count++;
  }
  return {
    clock:"Trace timestamps are monotonic microseconds; window boundaries come from renderer performance.mark, not wall-clock guesses.",
    rendererPid,rendererTid,markers:{startUs:start.ts,endUs:end.ts,stageEndUs:stageEnd?.ts??null},
    stage:stageEnd ? windowAnalysis(stageEnd.ts) : null,
    interaction:windowAnalysis(end.ts),
    eventInventory:inventory,
  };
}
async function captureTrace(session, action) {
  const batches = [];
  const receive = ({value}) => batches.push(...value);
  session.on("Tracing.dataCollected",receive);
  await session.send("Tracing.start",{categories:traceCategories.join(","),transferMode:"ReportEvents",options:"record-until-full",bufferUsageReportingInterval:1000});
  let result;
  try { result = await action(); }
  finally {
    const ended = new Promise((resolveEnd) => session.once("Tracing.tracingComplete",resolveEnd));
    await session.send("Tracing.end");
    await ended;
    session.off("Tracing.dataCollected",receive);
  }
  return {result,trace:{traceEvents:batches}};
}
async function inspectCompositing(session, page) {
  const snapshots = [];
  const animations = [];
  const reasons = new Map();
  const requests = [];
  const receiveLayers = ({ layers = [] }) => {
    snapshots.push({ elapsedMs: performance.now() - started, layers });
    for (const layer of layers) {
      const key = `${snapshots.length}:${layer.layerId}`;
      reasons.set(key, { snapshot: snapshots.length, layerId: layer.layerId });
      requests.push(session.send("LayerTree.compositingReasons", { layerId: layer.layerId })
        .then((result) => reasons.set(key, { snapshot: snapshots.length, layerId: layer.layerId, ...result }))
        .catch((error) => reasons.set(key, { layerId: layer.layerId, unavailable: error.message })));
    }
  };
  const receiveAnimation = ({ animation }) => animations.push(animation);
  const started = performance.now();
  session.on("LayerTree.layerTreeDidChange", receiveLayers);
  session.on("Animation.animationStarted", receiveAnimation);
  await session.send("LayerTree.enable");
  await session.send("Animation.enable");
  let geometry;
  try {
    const sample = page.evaluate(() => new Promise((resolveSample) => {
      document.addEventListener("click", () => {
        const stages = [];
        const start = performance.now();
        let previous = "";
        const inspect = () => {
          const phase = document.querySelector(".route-color-stage")?.getAttribute("data-phase") ?? null;
          const elements = [".app-viewport", ".route-color-stage", ".route-color-portal"].map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return { selector, exists: false };
            const style = getComputedStyle(element);
            return { selector, exists: true, clipPath: style.clipPath, willChange: style.willChange, transform: style.transform,
              animations: element.getAnimations().map((animation) => ({ playState: animation.playState, currentTime: animation.currentTime, effect: animation.effect?.getTiming() })) };
          });
          if (phase !== previous) stages.push({ phase, elapsedMs: performance.now() - start, elements });
          previous = phase;
          if (performance.now() - start < 1200) requestAnimationFrame(inspect);
          else resolveSample(stages);
        };
        requestAnimationFrame(inspect);
      }, { once: true, capture: true });
    }));
    await page.getByRole("button", { name: "Rever animações" }).click();
    geometry = await sample;
  } finally {
    await Promise.all(requests);
    session.off("LayerTree.layerTreeDidChange", receiveLayers);
    session.off("Animation.animationStarted", receiveAnimation);
    await session.send("LayerTree.disable");
    await session.send("Animation.disable");
  }
  return {
    interpretation: "Separate diagnostic replay after timed trials. LayerTree reasons are compositor evidence; computed clips and WAAPI records alone do not establish acceleration. It adds CDP observation overhead and is excluded from cadence comparisons.",
    snapshots, layerReasons: Object.fromEntries(reasons), animations, geometry,
  };
}
function primaryPresentation(window) {
  if (!window) return null;
  const pipeline = window.presentationFeedback.pipelinePresentedTerminations[0];
  if (pipeline) return {source:"renderer PipelineReporter presented ALL/PARTIAL termination timestamps",...pipeline};
  const renderer = window.presentationFeedback.renderer[0];
  if (renderer) return {source:"renderer FramePresented feedback",...renderer};
  // Browser-window FramePresented is intentionally not a fallback: it can
  // reflect only browser-chrome updates while its child surface animates.
  return null;
}
function aggregate(results) {
  const stageRafIntervals = results.flatMap((result) => result.sample.frames.slice(1).flatMap((frame,index) => frame.phase || result.sample.frames[index].phase ? [frame.timeMs-result.sample.frames[index].timeMs] : []));
  const presentationSeries = results.map((result) => primaryPresentation(result.analysis.stage));
  const samePresentationSource = presentationSeries.length && presentationSeries.every((series) => series?.source === presentationSeries[0]?.source);
  const presentation = samePresentationSource && presentationSeries[0] ? {source:presentationSeries[0].source,...intervalStatistics(presentationSeries.flatMap((series)=>series.intervalsMs)),eventCount:presentationSeries.reduce((sum,series)=>sum+series.eventCount,0)} : null;
  return {
    stageMainThreadRaf:{interpretation:"Main-thread callback cadence only; not presented FPS.",...intervalStatistics(stageRafIntervals)},
    stagePresentationFeedback:presentation,
    longTaskCount:results.reduce((sum,result)=>sum+result.sample.longTasks.length,0),
    longTaskTotalMs:results.reduce((sum,result)=>sum+result.sample.longTasks.reduce((duration,task)=>duration+task.durationMs,0),0),
    meanStageDurationMs:mean(results.map((result)=>result.sample.stageEndMs).filter((value)=>value!==null)),
    meanPerformanceMetrics:Object.fromEntries(metricNames.map((name)=>[name,mean(results.map((result)=>result.performanceMetrics[name]))])),
    presentationAvailableTrials:presentationSeries.filter(Boolean).length,
    limitations:[
      "Presentation feedback is browser instrumentation; no physical monitor presentation sensor is used.",
      "A presented compositor frame can contain stale content from one animated element. Cadence alone does not prove all geometry updates were fresh.",
      "rAF samples, presentation feedback and draw/swap events are distinct metrics. Native compositor animations may continue while main-thread rAF callbacks are delayed.",
      "Tracing adds overhead. Compare captures with the same browser, categories, viewport, display, hardware, scene and trial count; avoid concurrent measurements.",
    ],
  };
}
if (options.reanalyze) {
  const previousPath=resolve(options.reanalyze);
  const report=JSON.parse(await readFile(previousPath,"utf8"));
  targetHz=report.metadata.targetHz??targetHz;
  const results=[];
  for (const trialFile of report.trialFiles) {
    const trialPath=resolve(outputDirectory,trialFile);
    const trial=JSON.parse(await readFile(trialPath,"utf8"));
    const trace=JSON.parse(await readFile(resolve(outputDirectory,trial.traceFile),"utf8"));
    trial.analysis=analyzeTrace(trace,`fluxo-presented-${report.metadata.label}-${trial.index}`);
    results.push(trial);
    await writeFile(trialPath,JSON.stringify(trial,null,2));
  }
  report.summary=aggregate(results);
  report.metadata.analysisVersion=2;
  report.metadata.presentationSources=[
    "https://chromium.googlesource.com/chromium/src/+/HEAD/cc/metrics/compositor_frame_reporter.cc",
    "https://chromium.googlesource.com/chromium/src/third_party/+/refs/heads/main/blink/renderer/core/frame/animation_frame_timing_monitor.cc",
    "https://chromium.googlesource.com/chromium/src/+/HEAD/cc/metrics/frame_sequence_metrics.cc",
  ];
  await writeFile(previousPath,JSON.stringify(report,null,2));
  console.log(JSON.stringify({reanalyzed:previousPath,summary:report.summary},null,2));
  process.exit(0);
}
let browser;
try {
  browser = await chromium.launch({
    executablePath:"/usr/bin/google-chrome-stable",headless:false,
    env:{...process.env,DISPLAY:options.display??process.env.DISPLAY??":0"},
    args:["--disable-background-timer-throttling","--disable-renderer-backgrounding","--disable-backgrounding-occluded-windows"],
  });
  const browserSession=await browser.newBrowserCDPSession();
  const {gpu}=await browserSession.send("SystemInfo.getInfo");
  if (gpu.featureStatus?.gpu_compositing !== "enabled" && !options["allow-software"]) throw new Error(`GPU composition is ${gpu.featureStatus?.gpu_compositing}; use --allow-software only for a separately labeled software experiment.`);
  const context=await browser.newContext({viewport,reducedMotion:"no-preference",deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",(error)=>errors.push(error.message));
  await page.goto(baseURL.replace(/\/$/,"")+"/painel");
  await page.bringToFront();
  await page.getByRole("heading",{name:"Seu dinheiro, com clareza."}).waitFor();
  await page.locator(".route-color-stage").waitFor({state:"detached"});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(settleMs);
  const session=await context.newCDPSession(page);
  await session.send("Performance.enable");
  const results=[];
  const metadata={
    label,baseURL,trials,viewport,durationMs,settleMs,targetHz,headed:true,analysisVersion:2,
    browser:browser.version(),chromePath:"/usr/bin/google-chrome-stable",display:options.display??process.env.DISPLAY??":0",
    recordedAt:new Date().toISOString(),cpu:os.cpus()[0]?.model,logicalCores:os.cpus().length,gpu,
    categories:traceCategories,
    isolation:"Playwright temporary browser profile and one fresh context; no personal profile, video or screenshots.",
    sources:[
      "https://chromium.googlesource.com/chromium/src/+/HEAD/docs/speed/debug-janks.md",
      "https://chromium.googlesource.com/chromium/src/+/HEAD/ui/compositor/compositor.cc",
      "https://chromium.googlesource.com/chromium/src/+/HEAD/cc/trees/layer_tree_host_impl.cc",
      "https://chromium.googlesource.com/chromium/src/+/HEAD/cc/metrics/compositor_frame_reporter.cc",
      "https://chromium.googlesource.com/chromium/src/third_party/+/refs/heads/main/blink/renderer/core/frame/animation_frame_timing_monitor.cc",
    ],
  };
  for (let index=0;index<trials;index++) {
    const markerPrefix=`fluxo-presented-${label}-${index+1}`;
    const before=(await session.send("Performance.getMetrics")).metrics;
    const {result:sample,trace}=await captureTrace(session,async()=>{
      const recording=page.evaluate(({markerPrefix,durationMs})=>new Promise((resolveSample)=>{
        const longTasks=[];
        const append=(entries)=>{for(const entry of entries)longTasks.push({startMs:entry.startTime,durationMs:entry.duration});};
        const observer=new PerformanceObserver((list)=>append(list.getEntries()));
        observer.observe({type:"longtask"});
        document.addEventListener("click",()=>{
          const start=performance.now();
          performance.mark(`${markerPrefix}-start`);
          const frames=[];
          let sawStage=false,stageEndMs=null;
          const sampleFrame=(timestamp)=>{
            const stage=document.querySelector(".route-color-stage");
            const phase=stage?.getAttribute("data-phase")??null;
            const elapsed=performance.now()-start;
            frames.push({timeMs:timestamp-start,callbackElapsedMs:elapsed,phase});
            if(stage)sawStage=true;
            if(sawStage&&!stage&&stageEndMs===null){stageEndMs=elapsed;performance.mark(`${markerPrefix}-stage-end`);}
            if(elapsed<durationMs)requestAnimationFrame(sampleFrame);
            else {
              append(observer.takeRecords());observer.disconnect();performance.mark(`${markerPrefix}-end`);
              resolveSample({frames,sawStage,stageEndMs,elapsedMs:elapsed,longTasks:longTasks.filter((entry)=>entry.startMs>=start),visibility:document.visibilityState});
            }
          };
          requestAnimationFrame(sampleFrame);
        },{once:true,capture:true});
      }),{markerPrefix,durationMs});
      await page.getByRole("button",{name:"Rever animações"}).click();
      return recording;
    });
    if(!sample.sawStage||sample.stageEndMs===null)throw new Error(`Trial ${index+1} did not capture a complete color transition. Increase --duration-ms or inspect the app.`);
    if(sample.visibility!=="visible")throw new Error("The test page was not visible; refusing to compare a background capture.");
    const after=(await session.send("Performance.getMetrics")).metrics;
    const performanceMetrics=Object.fromEntries(metricNames.map((name)=>[name,(after.find((metric)=>metric.name===name)?.value??0)-(before.find((metric)=>metric.name===name)?.value??0)]));
    const analysis=analyzeTrace(trace,markerPrefix);
    const trialLabel=`${label}-trial-${String(index+1).padStart(2,"0")}`;
    await writeFile(resolve(outputDirectory,`${trialLabel}-trace.json`),JSON.stringify(trace));
    const trial={index:index+1,sample,performanceMetrics,analysis,traceFile:`${trialLabel}-trace.json`};
    results.push(trial);
    await writeFile(resolve(outputDirectory,`${trialLabel}.json`),JSON.stringify(trial,null,2));
    console.log(JSON.stringify({trial:index+1,stageMs:sample.stageEndMs,presentation:primaryPresentation(analysis.stage)&&{source:primaryPresentation(analysis.stage).source,cadenceHz:primaryPresentation(analysis.stage).cadenceHz,intervalP95Ms:primaryPresentation(analysis.stage).intervalP95Ms}}));
    await page.waitForTimeout(250);
  }
  const compositing = await inspectCompositing(session, page);
  const summary=aggregate(results);
  let comparison=null;
  if(options.compare){
    const before=JSON.parse(await readFile(resolve(options.compare),"utf8"));
    if(!before.summary)throw new Error("--compare must point to a summary produced by this script.");
    comparison={
      beforeFile:resolve(options.compare),
      sameConfiguration:JSON.stringify({viewport:before.metadata.viewport,browser:before.metadata.browser,trials:before.metadata.trials,durationMs:before.metadata.durationMs,categories:before.metadata.categories})===JSON.stringify({viewport,browser:metadata.browser,trials,durationMs,categories:traceCategories}),
      before:before.summary,after:summary,
      caveat:"A comparison does not establish causality if configuration, GPU/display state or competing workload differs.",
    };
  }
  const report={metadata,summary,trialFiles:results.map((result)=>`${label}-trial-${String(result.index).padStart(2,"0")}.json`),comparison,compositing,errors};
  await writeFile(outputFile,JSON.stringify(report,null,2));
  console.log(JSON.stringify({outputFile,summary,comparison:comparison&&{sameConfiguration:comparison.sameConfiguration},errors},null,2));
} finally {
  await browser?.close();
}
