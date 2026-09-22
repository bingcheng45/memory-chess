#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const MOBILE = {
  width: 390,
  height: 844,
  deviceScaleFactor: 3,
  mobile: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

const PIECE_COUNT = 8;
const SOLUTION_WINDOW_MS = 6_000;
const SCREENCAST_TAIL_MS = 3_000;

function parseArgs(argv) {
  const args = {
    base: "http://127.0.0.1:4690",
    out: null,
    label: "run",
    cpus: [1, 4, 6],
    durations: [2, 5, 10],
    screencast: null,
    hiddenTab: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--base") args.base = argv[++i];
    else if (flag === "--out") args.out = argv[++i];
    else if (flag === "--label") args.label = argv[++i];
    else if (flag === "--cpu") args.cpus = argv[++i].split(",").map(Number);
    else if (flag === "--durations") args.durations = argv[++i].split(",").map(Number);
    else if (flag === "--screencast") args.screencast = argv[++i];
    else if (flag === "--hidden-tab") args.hiddenTab = true;
    else {
      console.error(`unknown flag ${flag}`);
      process.exit(2);
    }
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
  const profile = mkdtempSync(join(tmpdir(), "measure-timer-"));
  const proc = spawn(
    CHROME,
    [
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--headless=new",
      "--no-first-run",
      "--mute-audio",
      "--autoplay-policy=no-user-gesture-required",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const port = await poll(
    () => Number(readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]) || 0,
    15_000,
    "Chrome did not start",
  );
  const wsUrl = await poll(
    async () => (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl,
    10_000,
    "no page target",
  );
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
      on(method, fn) {
        listeners.set(method, fn);
      },
      off(method) {
        listeners.delete(method);
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
      listeners.get(msg.method)?.(msg.params);
    };
  });
}

/**
 * Installed before any app script runs. The timer nodes are found by the shape
 * of the text they display rather than by a selector, so the same probe reads
 * both the old markup and the new one and the two measurements stay comparable.
 */
const PROBE = `
(() => {
  const COUNTDOWN = /^[0-9]+\\.[0-9]{2}$/;
  const COUNTUP = /^[0-9]{2}:[0-9]{2}\\.[0-9]{3}$/;
  const RESCAN_INTERVAL_MS = 100;

  const probe = {
    origin: { perfNow: performance.now(), dateNow: Date.now() },
    memorize: [],
    solution: [],
    frames: [],
    longTasks: [],
    memorizeGoneAt: null,
  };
  window.__timerProbe = probe;

  const node = { memorize: null, solution: null };
  const lastScanAt = { memorize: -Infinity, solution: -Infinity };

  function findNode(re) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let found = null;
    while (walker.nextNode()) {
      const text = (walker.currentNode.textContent || "").trim();
      if (re.test(text)) found = walker.currentNode;
    }
    return found;
  }

  function sample(kind, re, now) {
    let el = node[kind];
    if (el && !el.isConnected) {
      if (kind === "memorize" && probe.memorizeGoneAt === null) probe.memorizeGoneAt = now;
      el = null;
      node[kind] = null;
    }
    if (!el) {
      if (now - lastScanAt[kind] < RESCAN_INTERVAL_MS) return;
      lastScanAt[kind] = now;
      el = findNode(re);
      node[kind] = el;
      if (!el) return;
    }
    const text = (el.textContent || "").trim();
    if (!re.test(text)) {
      node[kind] = null;
      return;
    }
    const seen = probe[kind];
    if (seen.length && seen[seen.length - 1].v === text) return;
    seen.push({ t: now, v: text });
  }

  const observer = new MutationObserver(() => {
    const now = performance.now();
    sample("memorize", COUNTDOWN, now);
    sample("solution", COUNTUP, now);
  });

  const start = () => observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });

  const MAX_FRAMES = 60_000;
  const tick = (t) => {
    if (probe.frames.length < MAX_FRAMES) probe.frames.push(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        probe.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }
    }).observe({ type: "longtask", buffered: true });
  } catch {}
})();
`;

const quantile = (sorted, q) => {
  if (!sorted.length) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[index];
};

function gapStats(timestamps) {
  const gaps = [];
  for (let i = 1; i < timestamps.length; i++) gaps.push(timestamps[i] - timestamps[i - 1]);
  const sorted = [...gaps].sort((a, b) => a - b);
  return {
    count: gaps.length,
    p50: round(quantile(sorted, 0.5)),
    p95: round(quantile(sorted, 0.95)),
    max: round(sorted.length ? sorted[sorted.length - 1] : null),
  };
}

const round = (n) => (n == null ? null : Math.round(n * 10) / 10);

const countdownValue = (text) => Number(text);
const countupValue = (text) => {
  const [minutes, rest] = text.split(":");
  return Number(minutes) * 60 + Number(rest);
};

function monotonicBreaks(samples, toNumber, direction) {
  const breaks = [];
  for (let i = 1; i < samples.length; i++) {
    const previous = toNumber(samples[i - 1].v);
    const current = toNumber(samples[i].v);
    if (direction === "down" ? current > previous : current < previous) {
      breaks.push({ from: samples[i - 1].v, to: samples[i].v, t: round(samples[i].t) });
    }
  }
  return breaks;
}

/**
 * A countdown that steps from 3.xx straight to 1.xx never showed a whole second
 * the player was told to expect. Whole seconds are what the eye tracks, so a
 * missing one reads as the clock jumping.
 */
function skippedSeconds(samples) {
  const skipped = [];
  for (let i = 1; i < samples.length; i++) {
    const previous = Math.floor(countdownValue(samples[i - 1].v));
    const current = Math.floor(countdownValue(samples[i].v));
    for (let missing = previous - 1; missing > current; missing--) {
      skipped.push({ second: missing, t: round(samples[i].t) });
    }
  }
  return skipped;
}

/**
 * Where in the phase the longest stall sat. A stall in the opening frames is
 * the page still arriving; one in the middle is the timer itself.
 */
function worstGapOffset(samples, phaseStart) {
  let worst = { gap: 0, at: null };
  for (let i = 1; i < samples.length; i++) {
    const gap = samples[i].t - samples[i - 1].t;
    if (gap > worst.gap) worst = { gap, at: samples[i].t - phaseStart };
  }
  return round(worst.at);
}

function frameStats(frames, fromMs, toMs) {
  const inWindow = frames.filter((t) => t >= fromMs && t <= toMs);
  const spanMs = toMs - fromMs;
  return {
    frames: inWindow.length,
    fps: spanMs > 0 ? round((inWindow.length / spanMs) * 1000) : null,
    gaps: gapStats(inWindow),
  };
}

function longTaskStats(longTasks, fromMs, toMs) {
  const inWindow = longTasks.filter((task) => task.start + task.duration >= fromMs && task.start <= toMs);
  return {
    count: inWindow.length,
    totalMs: round(inWindow.reduce((total, task) => total + task.duration, 0)),
    maxMs: round(inWindow.reduce((worst, task) => Math.max(worst, task.duration), 0)),
  };
}

async function runOnce({ base, cpu, memorizeSeconds, screencastDir }) {
  const { proc, profile, wsUrl } = await launchChrome();
  const frames = [];
  try {
    const cdp = await connect(wsUrl);
    await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable")]);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await cdp.send("Emulation.setDeviceMetricsOverride", MOBILE);
    await cdp.send("Emulation.setUserAgentOverride", { userAgent: MOBILE.userAgent });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });

    if (screencastDir) {
      cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
        frames.push({ data, timestamp: metadata.timestamp });
        cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
      });
    }

    const url = `${base}/game?pieceCount=${PIECE_COUNT}&memorizeTime=${memorizeSeconds}`;
    await cdp.send("Page.navigate", { url });

    if (screencastDir) {
      await sleep(500);
      await cdp.send("Page.startScreencast", { format: "png", quality: 100, everyNthFrame: 1 });
    }

    const budgetMs = memorizeSeconds * 1000 + SOLUTION_WINDOW_MS + 8_000;
    await sleep(budgetMs);

    if (screencastDir) await cdp.send("Page.stopScreencast");

    const { result } = await cdp.send("Runtime.evaluate", {
      returnByValue: true,
      expression: "JSON.stringify(window.__timerProbe)",
    });
    const probe = JSON.parse(result.value);
    return { probe, frames };
  } finally {
    const exited = new Promise((r) => proc.once("exit", r));
    proc.kill();
    await Promise.race([exited, sleep(5_000)]);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {}
  }
}

const RESULT_TIMES = `[...document.querySelectorAll(".font-mono")]
  .map((el) => (el.textContent || "").trim())
  .filter((text) => /^[0-9]{2}:[0-9]{2}:[0-9]{3}$/.test(text))
  .map((text) => {
    const [minutes, seconds, milliseconds] = text.split(":");
    return Number(minutes) * 60 + Number(seconds) + Number(milliseconds) / 1000;
  })`;

/**
 * Hides the tab across the deadline and reads back the memorize time the round
 * recorded. Frames stop while a page is frozen, so the wake-up frame is however
 * long the player was away, and that figure reaches the score.
 */
async function runHiddenTabCheck({ base, cpu, memorizeSeconds, awaySeconds }) {
  const { proc, profile, wsUrl } = await launchChrome();
  try {
    const cdp = await connect(wsUrl);
    const evaluate = async (expression) => {
      const { result } = await cdp.send("Runtime.evaluate", { returnByValue: true, expression });
      return result.value;
    };

    await Promise.all([cdp.send("Page.enable"), cdp.send("Runtime.enable")]);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await cdp.send("Emulation.setDeviceMetricsOverride", MOBILE);
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: PROBE });
    await cdp.send("Page.navigate", { url: `${base}/game?pieceCount=${PIECE_COUNT}&memorizeTime=${memorizeSeconds}` });

    await poll(() => evaluate("(window.__timerProbe?.memorize.length ?? 0) > 0"), 20_000, "countdown never appeared");
    await sleep(600);

    const framesBefore = await evaluate("window.__timerProbe.frames.length");
    let froze = true;
    try {
      await cdp.send("Page.setWebLifecycleState", { state: "frozen" });
    } catch {
      froze = false;
    }
    await sleep(awaySeconds * 1000);
    const framesAfter = await evaluate("window.__timerProbe.frames.length");
    if (froze) await cdp.send("Page.setWebLifecycleState", { state: "active" });
    await sleep(1_000);

    // Headless Chrome never leaves visibilityState "hidden" after a freeze, and
    // a hidden page gets no frames, so the round cannot be resumed here.
    const visibility = await evaluate("document.visibilityState");
    if (visibility !== "visible") {
      return {
        cpu,
        memorizeSeconds,
        awaySeconds,
        framesWhileHidden: framesAfter - framesBefore,
        inconclusive: `the page stayed ${visibility} after thawing, so it never got another frame`,
      };
    }

    await poll(() => evaluate(`!!document.querySelector('[aria-label="Select white pieces"]')`), 20_000, "phase never changed");
    await evaluate(`[...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Submit")?.click()`);
    await poll(() => evaluate(`!!document.getElementById("game-result-heading")`), 20_000, "result screen never appeared");

    const times = await evaluate(RESULT_TIMES);
    return {
      cpu,
      memorizeSeconds,
      awaySeconds,
      framesWhileHidden: framesAfter - framesBefore,
      recordedTimes: times,
      reportedMemorizeSeconds: times.length ? Math.max(...times) : null,
    };
  } finally {
    const exited = new Promise((r) => proc.once("exit", r));
    proc.kill();
    await Promise.race([exited, sleep(5_000)]);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {}
  }
}

function analyse(probe, { cpu, memorizeSeconds }) {
  const configuredMs = memorizeSeconds * 1000;
  const memorize = probe.memorize;
  const solution = probe.solution;
  if (!memorize.length) throw new Error("no memorize countdown samples; the round did not start");
  if (!solution.length) throw new Error("no placement count-up samples; the phase never changed");

  const phaseStart = memorize[0].t;
  // The countdown node leaving the document is checked on every mutation, so it
  // dates the phase change without the probe's node-discovery latency.
  const phaseEnd = probe.memorizeGoneAt ?? solution[0].t;
  const zeroSample = memorize.find((sample) => countdownValue(sample.v) === 0);

  const memorizeWindow = frameStats(probe.frames, phaseStart, phaseEnd);
  const solutionEnd = solution[solution.length - 1].t;
  const solutionWindow = frameStats(probe.frames, phaseEnd, solutionEnd);

  return {
    cpu,
    memorizeSeconds,
    memorize: {
      configuredMs,
      actualMs: round(phaseEnd - phaseStart),
      errorMs: round(phaseEnd - phaseStart - configuredMs),
      firstValue: memorize[0].v,
      lastValue: memorize[memorize.length - 1].v,
      updates: memorize.length,
      gaps: gapStats(memorize.map((sample) => sample.t)),
      backwardsSteps: monotonicBreaks(memorize, countdownValue, "down"),
      skippedSeconds: skippedSeconds(memorize),
      reachedZero: Boolean(zeroSample),
      // The display's own accuracy, free of what the next phase costs to paint.
      displayToZeroMs: zeroSample ? round(zeroSample.t - phaseStart) : null,
      displayErrorMs: zeroSample ? round(zeroSample.t - phaseStart - configuredMs) : null,
      displayZeroToPhaseEndMs: zeroSample ? round(phaseEnd - zeroSample.t) : null,
      worstGapAtMs: worstGapOffset(memorize, phaseStart),
      frames: memorizeWindow,
      longTasks: longTaskStats(probe.longTasks, phaseStart, phaseEnd),
    },
    solution: {
      windowMs: round(solutionEnd - phaseEnd),
      firstValue: solution[0].v,
      lastValue: solution[solution.length - 1].v,
      updates: solution.length,
      // Measured between two displayed values, so no mount or discovery latency
      // lands in it: purely whether the count-up advances at real time.
      driftMs: round(
        (countupValue(solution[solution.length - 1].v) - countupValue(solution[0].v)) * 1000 -
          (solutionEnd - solution[0].t),
      ),
      gaps: gapStats(solution.map((sample) => sample.t)),
      backwardsSteps: monotonicBreaks(solution, countupValue, "up"),
      frames: solutionWindow,
      longTasks: longTaskStats(probe.longTasks, phaseEnd, solutionEnd),
    },
    samples: { memorize, solution },
  };
}

function writeScreencast(frames, probe, outDir, name) {
  if (!frames.length) return [];
  const toPerfNow = (epochSeconds) => epochSeconds * 1000 - probe.origin.dateNow + probe.origin.perfNow;
  const phaseEnd = probe.memorizeGoneAt ?? probe.solution[0]?.t ?? Infinity;
  const kept = frames.filter((frame) => {
    const t = toPerfNow(frame.timestamp);
    return t >= phaseEnd - SCREENCAST_TAIL_MS && t <= phaseEnd;
  });
  const dir = join(outDir, name);
  mkdirSync(dir, { recursive: true });
  return kept.map((frame, index) => {
    const offset = Math.round(phaseEnd - toPerfNow(frame.timestamp));
    const file = join(dir, `${String(index).padStart(3, "0")}-minus${String(offset).padStart(4, "0")}ms.png`);
    writeFileSync(file, Buffer.from(frame.data, "base64"));
    return file;
  });
}

const pad = (text, width) => String(text).padEnd(width);
const padStart = (text, width) => String(text).padStart(width);

function printTable(label, results) {
  const header = [
    pad("cpu", 5),
    pad("dur", 5),
    padStart("actual ms", 10),
    padStart("err ms", 8),
    padStart("disp err", 9),
    padStart("zero->end", 10),
    padStart("gap p50", 8),
    padStart("gap p95", 8),
    padStart("gap max", 8),
    padStart("max at", 8),
    padStart("fps", 6),
    padStart("skips", 6),
    padStart("back", 5),
    padStart("LT ms", 7),
  ].join(" ");
  console.log(`\n${label}`);
  console.log(header);
  console.log("-".repeat(header.length));
  for (const run of results) {
    console.log(
      [
        pad(`${run.cpu}x`, 5),
        pad(`${run.memorizeSeconds}s`, 5),
        padStart(run.memorize.actualMs, 10),
        padStart(run.memorize.errorMs, 8),
        padStart(run.memorize.displayErrorMs ?? "never", 9),
        padStart(run.memorize.displayZeroToPhaseEndMs ?? "never", 10),
        padStart(run.memorize.gaps.p50, 8),
        padStart(run.memorize.gaps.p95, 8),
        padStart(run.memorize.gaps.max, 8),
        padStart(run.memorize.worstGapAtMs ?? "-", 8),
        padStart(run.memorize.frames.fps ?? "-", 6),
        padStart(run.memorize.skippedSeconds.length, 6),
        padStart(run.memorize.backwardsSteps.length, 5),
        padStart(run.memorize.longTasks.totalMs, 7),
      ].join(" "),
    );
  }
  console.log("\nplacement count-up");
  const countupHeader = [pad("cpu", 5), pad("dur", 5), padStart("drift ms", 9), padStart("gap p50", 8), padStart("gap p95", 8), padStart("gap max", 8), padStart("fps", 6), padStart("back", 5)].join(" ");
  console.log(countupHeader);
  console.log("-".repeat(countupHeader.length));
  for (const run of results) {
    console.log(
      [
        pad(`${run.cpu}x`, 5),
        pad(`${run.memorizeSeconds}s`, 5),
        padStart(run.solution.driftMs, 9),
        padStart(run.solution.gaps.p50, 8),
        padStart(run.solution.gaps.p95, 8),
        padStart(run.solution.gaps.max, 8),
        padStart(run.solution.frames.fps ?? "-", 6),
        padStart(run.solution.backwardsSteps.length, 5),
      ].join(" "),
    );
  }
}

const args = parseArgs(process.argv.slice(2));

if (args.hiddenTab) {
  const check = await runHiddenTabCheck({ base: args.base, cpu: 4, memorizeSeconds: 2, awaySeconds: 20 });
  console.log(JSON.stringify(check, null, 2));
  if (check.framesWhileHidden > 0) {
    console.log("\nINCONCLUSIVE: the page kept getting frames while hidden, so the round never stalled.");
    process.exit(0);
  }
  if (check.inconclusive) {
    console.log(`\nINCONCLUSIVE: ${check.inconclusive}. The clamp is covered in jest instead.`);
    process.exit(0);
  }
  const overreported = check.reportedMemorizeSeconds - check.memorizeSeconds;
  console.log(
    `\n${overreported <= 0.05 ? "PASS" : "FAIL"}: ${check.awaySeconds}s hidden across a ${check.memorizeSeconds}s round reported ${check.reportedMemorizeSeconds}s of memorizing`,
  );
  process.exit(overreported <= 0.05 ? 0 : 1);
}

const results = [];

for (const cpu of args.cpus) {
  for (const memorizeSeconds of args.durations) {
    const wantsScreencast = args.screencast && cpu === 4 && memorizeSeconds === 5;
    const { probe, frames } = await runOnce({
      base: args.base,
      cpu,
      memorizeSeconds,
      screencastDir: wantsScreencast ? args.screencast : null,
    });
    const analysed = analyse(probe, { cpu, memorizeSeconds });
    if (wantsScreencast) {
      analysed.screencast = writeScreencast(frames, probe, args.screencast, `${args.label}-cpu${cpu}x-${memorizeSeconds}s`);
      console.log(`screencast frames: ${analysed.screencast.length} in ${join(args.screencast, `${args.label}-cpu${cpu}x-${memorizeSeconds}s`)}`);
    }
    results.push(analysed);
    console.log(
      `${cpu}x ${memorizeSeconds}s  actual ${analysed.memorize.actualMs}ms (err ${analysed.memorize.errorMs}ms)  updates ${analysed.memorize.updates}  gap p95 ${analysed.memorize.gaps.p95}ms  skips ${analysed.memorize.skippedSeconds.length}`,
    );
  }
}

printTable(`${args.label}  ${MOBILE.width}x${MOBILE.height} memorize countdown`, results);

if (args.out) {
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, JSON.stringify({ label: args.label, profile: MOBILE, base: args.base, results }, null, 2));
  console.log(`\nreport: ${args.out}`);
}
