#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const MOBILE = {
  width: 412,
  height: 823,
  deviceScaleFactor: 1.75,
  mobile: true,
  userAgent:
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
};
const SLOW_4G = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const CPU_SLOWDOWN = 4;

function parseArgs(argv) {
  const args = { urls: [], runs: 5, out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--runs") args.runs = Number(argv[++i]);
    else if (argv[i] === "--out") args.out = argv[++i];
    else args.urls.push(argv[i]);
  }
  if (!args.urls.length) {
    console.error("usage: node scripts/measure-lcp.mjs <url>... [--runs 5] [--out file.json]");
    process.exit(2);
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
  const profile = mkdtempSync(join(tmpdir(), "measure-lcp-"));
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
      on(method, fn) {
        listeners.set(`*${method}`, fn);
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
      listeners.get(`*${msg.method}`)?.(msg.params);
      const once = listeners.get(msg.method);
      if (once) {
        listeners.delete(msg.method);
        once(msg.params);
      }
    };
  });
}

const OBSERVER = `
  window.__lcp = [];
  window.__fcp = null;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      const el = e.element;
      window.__lcp.push({
        time: Math.round(e.startTime),
        size: e.size,
        url: e.url || null,
        tag: el ? el.tagName.toLowerCase() : null,
        text: el ? (el.textContent || "").trim().slice(0, 60) : null,
        classes: el ? String(el.className).slice(0, 120) : null,
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (e.name === "first-contentful-paint") window.__fcp = Math.round(e.startTime);
  }).observe({ type: "paint", buffered: true });
`;

async function measureOnce(url) {
  const { proc, profile, wsUrl } = await launchChrome();
  try {
    const cdp = await connect(wsUrl);
    await Promise.all([cdp.send("Page.enable"), cdp.send("Network.enable"), cdp.send("Runtime.enable")]);
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", SLOW_4G);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });
    await cdp.send("Emulation.setDeviceMetricsOverride", MOBILE);
    await cdp.send("Emulation.setUserAgentOverride", { userAgent: MOBILE.userAgent });
    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVER });

    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url });
    await Promise.race([loaded, sleep(60_000)]);
    await sleep(3_000);

    const { result } = await cdp.send("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const res = performance.getEntriesByType("resource")
          .filter((r) => /\\.(woff2|css)(\\?|$)/.test(r.name) || r.initiatorType === "link")
          .map((r) => ({ name: r.name.replace(location.origin, "").slice(0, 90), type: r.initiatorType, start: Math.round(r.startTime), end: Math.round(r.responseEnd), kb: Math.round((r.transferSize || 0) / 1024) }));
        return {
          ttfb: Math.round(nav.responseStart),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
          load: Math.round(nav.loadEventEnd),
          fcp: window.__fcp,
          lcp: window.__lcp.at(-1) || null,
          lcpCandidates: window.__lcp,
          fontsAndCss: res,
        };
      })()`,
    });
    return result.value;
  } finally {
    const exited = new Promise((r) => proc.once("exit", r));
    proc.kill();
    await Promise.race([exited, sleep(5_000)]);
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {}
  }
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

const args = parseArgs(process.argv.slice(2));
const report = { profile: { ...MOBILE, network: "slow 4G 150ms 1.6Mbps", cpuSlowdown: CPU_SLOWDOWN, cache: "disabled" }, urls: {} };
for (const url of args.urls) {
  const runs = [];
  for (let i = 0; i < args.runs; i++) runs.push(await measureOnce(url));
  const lcps = runs.map((r) => r.lcp?.time).filter((t) => t != null);
  report.urls[url] = { medianLcp: median(lcps), medianFcp: median(runs.map((r) => r.fcp).filter((t) => t != null)), lcps, lcpElement: runs.at(-1).lcp, runs };
  const last = runs.at(-1);
  console.log(`${url}\n  LCP median ${median(lcps)}ms runs [${lcps.join(", ")}]  FCP median ${report.urls[url].medianFcp}ms  TTFB ${last.ttfb}ms`);
  console.log(`  LCP element: <${last.lcp?.tag}> "${last.lcp?.text}" ${last.lcp?.url ?? ""}`);
  const fonts = last.fontsAndCss.filter((r) => /woff2/.test(r.name));
  const css = last.fontsAndCss.filter((r) => /\.css/.test(r.name));
  console.log(`  fonts ${fonts.length} (${fonts.reduce((a, r) => a + r.kb, 0)} KB, last done ${Math.max(0, ...fonts.map((r) => r.end))}ms)  css ${css.length} (last done ${Math.max(0, ...css.map((r) => r.end))}ms)`);
}
if (args.out) {
  mkdirSync(join(args.out, ".."), { recursive: true });
  writeFileSync(args.out, JSON.stringify(report, null, 2));
  console.log(`report: ${args.out}`);
}
