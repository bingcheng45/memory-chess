#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Most slow /game interactions in the field come from tablets, so the lab plays a round on a touch tablet.
const TABLET = {
  width: 820,
  height: 1180,
  deviceScaleFactor: 2,
  mobile: true,
};
const TABLET_UA = "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CPU_SLOWDOWN = 4;
const SETTLE_MS = 600;

function parseArgs(argv) {
  const args = { base: "http://127.0.0.1:4517", runs: 3, preset: "hard", daily: false, out: null, profile: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--runs") args.runs = Number(argv[++i]);
    else if (argv[i] === "--preset") args.preset = argv[++i];
    else if (argv[i] === "--daily") args.daily = true;
    else if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--profile") args.profile = argv[++i];
    else args.base = argv[i];
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function poll(fn, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {}
    if (Date.now() > deadline) throw new Error(label);
    await sleep(100);
  }
}

async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "measure-inp-"));
  const proc = spawn(CHROME, ["--remote-debugging-port=0", `--user-data-dir=${profile}`, "--headless=new", "--no-first-run", "--mute-audio", "about:blank"], { stdio: "ignore" });
  const port = await poll(() => Number(readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]) || 0, 15_000, "Chrome did not start");
  const wsUrl = await poll(async () => (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl, 10_000, "no page target");
  return { proc, profile, wsUrl };
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const listeners = new Map();
    const cdp = {
      send(method, params = {}) {
        const id = nextId++;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => pending.set(id, { res, rej }));
      },
      once(method) {
        return new Promise((res) => listeners.set(method, res));
      },
    };
    ws.onopen = () => resolve(cdp);
    ws.onerror = () => reject(new Error("websocket error"));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
        return;
      }
      const once = listeners.get(msg.method);
      if (once) {
        listeners.delete(msg.method);
        once(msg.params);
      }
    };
  });
}

// Event Timing entries are what INP is made of; long animation frames say which script held each slow one.
const OBSERVER = `
  window.__events = [];
  window.__frames = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      if (!e.interactionId) continue;
      window.__events.push({
        id: e.interactionId,
        type: e.name,
        start: e.startTime,
        duration: e.duration,
        inputDelay: e.processingStart - e.startTime,
        processing: e.processingEnd - e.processingStart,
        presentation: e.startTime + e.duration - e.processingEnd,
      });
    }
  }).observe({ type: "event", durationThreshold: 16, buffered: true });
  new PerformanceObserver((list) => {
    for (const f of list.getEntries()) {
      window.__frames.push({
        start: f.startTime,
        duration: f.duration,
        styleAndLayout: f.styleAndLayoutStart ? f.startTime + f.duration - f.styleAndLayoutStart : 0,
        scripts: f.scripts.map((s) => ({
          invoker: s.invoker,
          source: (s.sourceFunctionName || "") + " " + (s.sourceURL || "").replace(location.origin, "") + ":" + s.sourceCharPosition,
          duration: Math.round(s.duration),
          forcedLayout: Math.round(s.forcedStyleAndLayoutDuration),
        })),
      });
    }
  }).observe({ type: "long-animation-frame", buffered: true });
`;

function makePage(cdp) {
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(`${expression}: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  };
  const waitFor = (expression, timeoutMs = 20_000) => poll(() => evaluate(`!!(${expression})`), timeoutMs, `timed out waiting for ${expression}`);
  const centerOf = async (selectorExpr) => {
    const box = await evaluate(`(() => { const el = ${selectorExpr}; if (!el) return null; el.scrollIntoView({ block: "nearest" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, size: r.width }; })()`);
    if (!box) throw new Error(`no element for ${selectorExpr}`);
    return box;
  };
  const touch = (type, points) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(({ x, y }) => ({ x, y, id: 1 })) });
  return {
    evaluate,
    waitFor,
    async tap(selectorExpr) {
      const point = await centerOf(selectorExpr);
      await touch("touchStart", [point]);
      await sleep(40);
      await touch("touchEnd", []);
    },
    async drag(fromExpr, toExpr) {
      const from = await centerOf(fromExpr);
      // Under a finger the piece lands where its ghost rides, three quarters of a square above the touch.
      const target = await centerOf(toExpr);
      const to = { x: target.x, y: target.y + target.size * 0.75 };
      await touch("touchStart", [from]);
      const steps = 12;
      for (let i = 1; i <= steps; i++) {
        await touch("touchMove", [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }]);
        await sleep(16);
      }
      await touch("touchEnd", []);
    },
  };
}

const byText = (text) => `[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === ${JSON.stringify(text)} && !b.disabled)`;
const phaseIs = (phase) => `document.querySelector("[data-round-phase]")?.dataset.roundPhase === ${JSON.stringify(phase)}`;
const square = (coordinate) => `document.querySelector('[data-coordinate="${coordinate}"]')`;
const paletteItem = (piece) => `document.querySelector('.lab-palette [aria-label^="${piece}, "]')`;

/** The occupied squares of the study board, read from their accessible names: "e4, white king". */
const STUDY_PIECES = `[...document.querySelectorAll("[data-coordinate]")]
  .map((el) => ({ square: el.dataset.coordinate, label: el.getAttribute("aria-label") }))
  .filter((p) => !p.label.endsWith(", empty"))
  .map((p) => ({ square: p.square, piece: p.label.slice(p.square.length + 2) }))`;

/** Opens today's board from its link and taps Start, which veils the board and counts 3, 2, 1 into study. */
async function startDaily(page, base, act) {
  const link = (await (await fetch(`${base}/daily`)).text()).match(/href="(\/game\?[^"]*source=daily[^"]*)"/)?.[1];
  if (!link) throw new Error("no daily board link on /daily");
  await page.evaluate(`location.href = ${JSON.stringify(base + link.replaceAll("&amp;", "&"))}`);
  await page.waitFor(byText("Start game"));
  await sleep(2_000);
  await act("daily start", () => page.tap(byText("Start game")));
  await page.waitFor(phaseIs("study"), 30_000);
}

/** Plays one round by touch, labelling each interaction so its Event Timing entries can be told apart. */
async function playRound(page, base, preset, act, idle) {
  await page.evaluate(`location.href = ${JSON.stringify(`${base}/game`)}`);
  await page.waitFor(byText("Start round"));
  await sleep(2_000);

  await act(`preset ${preset}`, () => page.tap(`document.querySelector('[data-preset="${preset}"]')`));
  await act("start round", () => page.tap(byText("Start round")));
  await page.waitFor(`${phaseIs("study")} || ${byText("Start")}`, 30_000);
  if (!(await page.evaluate(phaseIs("study")))) await act("first-round start", () => page.tap(byText("Start")));
  await page.waitFor(phaseIs("study"), 30_000);
  const pieces = await page.evaluate(STUDY_PIECES);
  const idleStudy = await idle(1_000);
  await act("hide board (end study)", () => page.tap(byText("Hide board")));
  await page.waitFor(phaseIs("rebuild"));
  await sleep(1_000);
  const idleRebuild = await idle(2_000);

  for (const [i, { square: to, piece }] of pieces.entries()) {
    if (i % 2 === 0) {
      // A second tap on the armed palette piece disarms it.
      if ((await page.evaluate(`${paletteItem(piece)}.getAttribute("aria-pressed")`)) !== "true") {
        await act("palette pick", () => page.tap(paletteItem(piece)));
      }
      await act("square place (tap)", () => page.tap(square(to)));
    } else {
      await act("piece drag-drop", () => page.drag(paletteItem(piece), square(to)));
    }
  }
  const placed = JSON.stringify(await page.evaluate(STUDY_PIECES));
  if (placed !== JSON.stringify(pieces)) throw new Error(`the rebuilt board ${placed} differs from the study board ${JSON.stringify(pieces)}`);

  await act("submit", () => page.tap(byText("Submit")));
  await page.waitFor(`!!document.getElementById("game-result-heading")`, 20_000);
  await sleep(1_500);
  return { pieceCount: pieces.length, idleStudy, idleRebuild };
}

async function measureOnce({ base, preset, daily, profile }) {
  const { proc, profile: dir, wsUrl } = await launchChrome();
  try {
    const cdp = await connect(wsUrl);
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", TABLET);
    await cdp.send("Emulation.setUserAgentOverride", { userAgent: TABLET_UA });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVER });
    const page = makePage(cdp);
    // Warm the HTTP cache unthrottled, so the measured round plays as a returning visit's would.
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: `${base}/game` });
    await loaded;
    await sleep(1_000);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });
    if (profile) await Promise.all([cdp.send("Profiler.enable"), cdp.send("Profiler.setSamplingInterval", { interval: 200 })]);

    const actions = [];
    const act = async (label, fn) => {
      const start = await page.evaluate("performance.now()");
      if (profile) await cdp.send("Profiler.start");
      await fn();
      await sleep(SETTLE_MS);
      const end = await page.evaluate("performance.now()");
      if (profile) {
        const { profile: cpu } = await cdp.send("Profiler.stop");
        writeFileSync(join(profile, `${String(actions.length).padStart(2, "0")}-${label.replace(/\W+/g, "-")}.cpuprofile`), JSON.stringify(cpu));
      }
      actions.push({ label, start, end });
    };
    if (profile) mkdirSync(profile, { recursive: true });
    // The main thread's share spent busy while a player only looks at the rebuild board: what every tap waits behind.
    await cdp.send("Performance.enable");
    const idle = async (ms) => {
      const read = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
      const before = await read();
      await sleep(ms);
      const after = await read();
      const share = (name) => Math.round(((after[name] - before[name]) * 1000 * 100) / ms);
      return { taskPct: share("TaskDuration"), stylePct: share("RecalcStyleDuration"), layoutPct: share("LayoutDuration") };
    };
    // Opening today's board first leaves a played round behind, so the measured round is then not the first.
    if (daily) await startDaily(page, base, act);
    const { pieceCount, idleStudy, idleRebuild } = await playRound(page, base, preset, act, idle);
    const { events, frames } = await page.evaluate("({ events: window.__events, frames: window.__frames })");

    const interactions = actions.map((action) => {
      const mine = events.filter((e) => e.start >= action.start && e.start < action.end);
      const worst = mine.reduce((a, e) => (!a || e.duration > a.duration ? e : a), null);
      const overlapping = frames.filter((f) => f.start < action.end && f.start + f.duration > action.start);
      return {
        label: action.label,
        latency: worst?.duration ?? 0,
        worstEvent: worst,
        events: mine.map((e) => `${e.type} ${Math.round(e.duration)}`),
        longFrames: overlapping.map((f) => ({ duration: Math.round(f.duration), styleAndLayout: Math.round(f.styleAndLayout), scripts: f.scripts.filter((s) => s.duration > 5) })),
      };
    });
    return { pieceCount, idleStudy, idleRebuild, interactions };
  } finally {
    const exited = new Promise((r) => proc.once("exit", r));
    proc.kill();
    await Promise.race([exited, sleep(5_000)]);
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {}
  }
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

const args = parseArgs(process.argv.slice(2));
const runs = [];
for (let i = 0; i < args.runs; i++) runs.push(await measureOnce({ ...args, profile: args.profile && join(args.profile, `run-${i}`) }));

const byLabel = new Map();
for (const run of runs) for (const it of run.interactions) byLabel.set(it.label, [...(byLabel.get(it.label) ?? []), it.latency]);
console.log(`/game on a touch tablet, ${CPU_SLOWDOWN}x CPU slowdown, preset ${args.preset}, ${runs.length} runs`);
console.log("interaction             median  worst   (ms, per-run worst of each kind)");
for (const [label, latencies] of byLabel) {
  console.log(`  ${label.padEnd(22)} ${String(median(latencies)).padStart(6)} ${String(Math.max(...latencies)).padStart(6)}`);
}
const busy = (b) => `${b.taskPct}% (style ${b.stylePct}%, layout ${b.layoutPct}%)`;
console.log(`main thread busy, nothing touched, study: ${runs.map((r) => busy(r.idleStudy)).join(", ")}`);
console.log(`main thread busy, nothing touched, rebuild: ${runs.map((r) => busy(r.idleRebuild)).join(", ")}`);
const worstPerRun = runs.map((r) => Math.max(...r.interactions.map((it) => it.latency)));
console.log(`worst interaction per run [${worstPerRun.join(", ")}]  median ${median(worstPerRun)}ms`);
if (args.out) {
  mkdirSync(join(args.out, ".."), { recursive: true });
  writeFileSync(args.out, JSON.stringify({ profile: { ...TABLET, cpuSlowdown: CPU_SLOWDOWN, preset: args.preset }, worstPerRun, runs }, null, 2));
  console.log(`report: ${args.out}`);
}
