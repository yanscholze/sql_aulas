# Fluxo animation optimization — 2026-11-16

## Scope and cause

Only the independent UI_Fluxo application was changed. The official Fluxo
application, financial domain, demo entities and SQLite files were not modified.

The approved SVG implementation updated a viewport-sized circular clip and an
even-odd SVG aperture on every animation frame. Animated numeric text also
invalidated its surrounding inline layout. A native CSS clip-path experiment
did not demonstrate a consistent improvement and was not retained.

## Implementation

- Motion still owns interpolation, cancellation, sequencing and callbacks.
- A reusable native WebGL canvas draws the existing radial gradient and circular
  coverage in one quad. Per-frame work updates radii uniforms and submits a draw;
  it does not update React state, SVG paths or CSS clipping.
- The program and viewport buffer are prepared before interaction. Canvas
  resources are reused between transitions; there is no continuous idle loop.
- The approved SVG renderer remains the fallback for unavailable graphics or
  context loss. Reduced motion bypasses the decorative transition as before.
- Final numeric text reserves inline space invisibly. The visible counting text
  is absolutely positioned, retaining the same value, formatting and timing.
  Style containment is used without layout containment: the latter changed
  subpixel glyph rasterization at fractional positions and was rejected.

The following visual contract is unchanged:

- Actual pointer position, or the control center for keyboard activation.
- Cover radius 22 → R, 220 ms, cubic-bezier(.35,0,.3,1).
- Reveal hole 0 → R, 420 ms, cubic-bezier(.45,0,.3,1).
- R = ceil(hypot(max(x,W-x),max(y,H-y))) + 32.
- Fixed viewport-space sRGB gradient, stops 0/.58/1, existing light/dark tokens.
- Route changes after opaque coverage; reveal waits for PageReady.
- Existing card splashes, springs, charts, counts, filters and nested scrolling.

## Controlled GPU measurement

Five sequential replays per condition, production build, isolated headed Chrome
157.0.8103.38, 1920 × 1080, DPR 1, i5-1335U, Intel Iris Xe / Mesa 26.2.6.
GPU composition was enabled. No screenshots, video or concurrent test runs were
used in these timed captures. Chromium tracing itself adds overhead.

Baseline: approved implementation from commit `5d70963`.
Final: current production build served on port 5174.

| Metric | Approved baseline | Final |
| --- | ---: | ---: |
| Main-thread callback cadence, not presented FPS | 56.11 Hz | 60.00 Hz |
| Callback interval p95 | 16.8 ms | 16.8 ms |
| Maximum callback interval | 83.4 ms | 21.7 ms |
| Callback gaps >25 ms, all five replays | 7 | 0 |
| Renderer presentation feedback cadence | 52.10 Hz | 56.70 Hz |
| Presentation feedback interval p95 | 50.0 ms | 33.3 ms |
| Main-thread task duration per 1.7 s capture | 877.7 ms | 701.0 ms |
| Script duration per capture | 134.2 ms | 97.5 ms |
| Tasks >50 ms | 0 | 0 |

Main-thread task duration decreased 20.1%; script duration decreased 27.4%.
The configured animation durations were not shortened. Stage lifetime includes
frame scheduling and ready-state transitions, and averaged 683.7 → 698.6 ms.

Presentation feedback is Chromium instrumentation, not a physical display
sensor. A presented frame can contain stale content in one element. The final
callback loop reached the 60 Hz target, but presentation still had occasional
misses: this is not evidence of a locked 60 FPS across all frames or hardware.
These are local exploratory measurements, not population statistics.

A separate seven-replay capture without tracing at 1920×930 recorded a mean
callback interval of 16.82 ms, p95 16.8 ms, two gaps above 25 ms in 290 callback
intervals, and no long tasks. This is also a callback measurement, not presented
FPS. Evidence: `2026-11-16-final-gpu.json`.

Sources: `2026-11-15-presented-before-summary.json`,
`2026-11-16-final-summary.json`, their per-trial JSON and local raw traces.
Intermediate experiment reports are retained and are not final measurements.
Large new raw trace files remain local and are ignored by Git; summaries and
capture scripts are reviewable. No prior evidence was deleted.
The visual comparison script pins the approved commit by default; a later
application commit does not silently change its reference renderer.

## Visual and functional validation

- 24/24 circular render comparisons passed: two themes, two measured origins,
  covering/revealing, checkpoints at 25/50/75% of each approved curve. Outside a
  1.5 physical pixel edge band, maximum RGBA difference was 2/255. The edge band
  accounts for SVG/Skia versus analytic shader antialiasing; this is visual
  equivalence rather than a claim of bit-identical edge rasterization.
- 6/6 numeric comparisons passed: 1920×1080, 1440×900 and 390×844 in both themes.
  Visible number regions were pixel-identical, and text/parent geometry matched.
  Offscreen values have geometry checked but are not claimed pixel-tested.
  32 changed pixels elsewhere in the viewport were reported separately.
- 15/15 Playwright tests passed on the final build, including navigation order,
  pointer/keyboard/mobile origins, theme, preserved filters, reduced motion,
  unavailable WebGL, context loss, responsiveness, nested scroll restoration,
  local financial operations and accessibility checks.
- ESLint, TypeScript/production build and 21 unit tests passed. React Doctor
  reported no issues in the changed tracked React files (project score 89).
- The final production preview was reloaded in the in-app browser and Replay
  was exercised; the settled dashboard, values and frame remained intact. This
  visual smoke check is not a manual FPS measurement.

Visual evidence: `2026-11-15-visual/comparison.json` and
`2026-11-16-values-final/comparison.json`, with reference/candidate PNGs.
The visual fixture validates geometry and colors; it does not measure FPS.

## Reproduction

From the application directory, with its production preview running:

```sh
npm run build
npm run preview -- --port 5174
```

In another terminal, without concurrent browser tests:

```sh
node scripts/profile-presented-frames.mjs --label my-capture --base-url http://127.0.0.1:5174 --trials 5 --viewport 1920x1080
VISUAL_HEADED=1 node scripts/compare-color-renderers.mjs http://127.0.0.1:5174 outputs/performance/my-colors
VISUAL_HEADED=1 node scripts/compare-value-layout.mjs http://127.0.0.1:5174 outputs/performance/my-values
npm run test:e2e
```

The headed scripts use an isolated system Chrome profile, not the user's
personal session. Run measurements separately from visual comparisons/tests.
