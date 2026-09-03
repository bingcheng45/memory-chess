#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME =
  process.env.CHROME_BIN ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const DRIVE_TIMEOUT_MS = 180_000;

function parseArgs(argv) {
  const args = { base: "http://127.0.0.1:4517", evidence: null, script: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") args.base = argv[++i];
    else if (argv[i] === "--evidence") args.evidence = argv[++i];
    else args.script = argv[i];
  }
  if (!args.script || !args.evidence) {
    console.error(
      "usage: node cdp.mjs <drive-script.mjs> --evidence <dir> [--base http://127.0.0.1:4517]",
    );
    process.exit(2);
  }
  return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(label)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function poll(fn, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    let value;
    try {
      value = await fn();
    } catch {}
    if (value) return value;
    if (Date.now() > deadline) throw new Error(label);
    await sleep(200);
  }
}

async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "verify-mc-chrome-"));
  const proc = spawn(
    CHROME,
    [
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--headless=new",
      "--mute-audio",
      "--no-first-run",
      "--window-size=1280,900",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const portFile = join(profile, "DevToolsActivePort");
  try {
    const port = await poll(
      () => Number(readFileSync(portFile, "utf8").split("\n")[0]) || 0,
      15_000,
      `Chrome did not write ${portFile} within 15s`,
    );
    return { proc, profile, port };
  } catch (err) {
    proc.kill();
    throw err;
  }
}

function pageWebSocketUrl(port) {
  return poll(
    async () => {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await res.json();
      return targets.find((t) => t.type === "page")?.webSocketDebuggerUrl;
    },
    10_000,
    "no page target within 10s",
  );
}

function connect(wsUrl) {
  return new Promise((resolvePromise, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const cdp = {
      onLoad: null,
      send(method, params = {}) {
        const id = nextId++;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => pending.set(id, { res, rej }));
      },
    };
    ws.onopen = () => resolvePromise(cdp);
    ws.onerror = () => reject(new Error(`websocket error connecting ${wsUrl}`));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(`${msg.error.message}`));
        else res(msg.result);
      } else if (msg.method === "Page.loadEventFired") {
        cdp.onLoad?.();
      }
    };
  });
}

function makePage(cdp, evidenceDir) {
  let loadResolve = null;
  cdp.onLoad = () => loadResolve?.();

  const page = {
    async goto(url) {
      const loaded = new Promise((r) => (loadResolve = r));
      await cdp.send("Page.navigate", { url });
      await withTimeout(loaded, 20_000, `load event never fired for ${url}`);
    },
    async eval(expression) {
      const res = await cdp.send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(
          res.exceptionDetails.exception?.description ||
            res.exceptionDetails.text,
        );
      }
      return res.result.value;
    },
    waitFor(expression, timeoutMs = 15_000) {
      return poll(
        () => page.eval(expression),
        timeoutMs,
        `timed out after ${timeoutMs}ms on: ${expression}`,
      );
    },
    async click(selector, text) {
      const ok = await page.eval(
        `(() => {
           const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
           const text = ${JSON.stringify(text ?? null)};
           const el = text === null
             ? els[0]
             : els.find(e => e.textContent.trim() === text) ||
               els.find(e => e.textContent.includes(text));
           if (!el) return false;
           el.click();
           return true;
         })()`,
      );
      if (!ok) {
        const wanted = text === undefined ? "" : ` with text ${JSON.stringify(text)}`;
        throw new Error(`no element matches ${selector}${wanted}`);
      }
    },
    clickText(selector, text) {
      return page.click(selector, text);
    },
    async screenshot(name) {
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png",
      });
      const file = join(evidenceDir, name);
      writeFileSync(file, Buffer.from(data, "base64"));
      console.log(`evidence: ${file}`);
      return file;
    },
    sleep,
  };
  return page;
}

const args = parseArgs(process.argv.slice(2));
const evidenceDir = resolve(args.evidence);
mkdirSync(evidenceDir, { recursive: true });

const { proc, profile, port } = await launchChrome();
let exitCode = 0;
try {
  const cdp = await connect(await pageWebSocketUrl(port));
  await cdp.send("Page.enable");
  const page = makePage(cdp, evidenceDir);
  const drive = (await import(pathToFileURL(resolve(args.script)))).default;
  const result = await withTimeout(
    drive(page, { baseUrl: args.base, evidenceDir }),
    DRIVE_TIMEOUT_MS,
    `drive script exceeded ${DRIVE_TIMEOUT_MS}ms`,
  );
  console.log(`PASS ${JSON.stringify(result ?? null)}`);
} catch (err) {
  console.error(`FAIL: ${err.message}`);
  exitCode = 1;
} finally {
  proc.kill();
  rmSync(profile, { recursive: true, force: true });
}
process.exit(exitCode);
