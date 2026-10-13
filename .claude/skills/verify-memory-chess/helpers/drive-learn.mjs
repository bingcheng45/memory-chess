// Drives /learn and two guides at a phone and a desktop width: screenshots, horizontal overflow, console errors,
// JSON-LD types, layout shift, and the contents rail following the reader. Run through cdp.mjs.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const WIDTHS = [
  { name: "390", width: 390, height: 844, mobile: true },
  { name: "1440", width: 1440, height: 900, mobile: false },
];
const GUIDES = ["how-to-stop-blundering-in-chess", "20-minute-daily-chess-study-plan"];
const KNOWN_NOISE = /supabase|leaderboard|game-stats|Failed to load resource/i;

async function fullShot(page, evidenceDir, name) {
  const { data } = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  const file = join(evidenceDir, name);
  writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

async function measure(page) {
  return page.eval(`(() => {
    const types = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .flatMap((s) => (JSON.parse(s.textContent)["@graph"] ?? []).map((n) => n["@type"]));
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      h1: [...document.querySelectorAll("h1")].map((h) => h.textContent),
      jsonLd: types,
      cls: window.__cls ?? null,
    };
  })()`);
}

const TRACK_CLS = `window.__cls = 0; new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });`;

export default async function drive(page, { baseUrl, evidenceDir }) {
  const errors = [];
  await page.send("Runtime.enable");
  page.on((method, params) => {
    if (method === "Runtime.exceptionThrown") errors.push(params.exceptionDetails?.exception?.description ?? params.exceptionDetails?.text);
    if (method === "Runtime.consoleAPICalled" && params.type === "error") {
      errors.push(params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    }
  });

  const report = {};
  for (const size of WIDTHS) {
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: size.width,
      height: size.height,
      deviceScaleFactor: 1,
      mobile: size.mobile,
    });
    for (const path of ["/learn", ...GUIDES.map((slug) => `/learn/${slug}`)]) {
      await page.goto(baseUrl + path);
      await page.eval(TRACK_CLS);
      await page.sleep(800);
      const key = `${path} @${size.name}`;
      const label = path === "/learn" ? "hub" : path.split("/").at(-1);
      await page.screenshot(`${label}-${size.name}-top.png`);
      const result = await measure(page);
      if (path !== "/learn") {
        const tracked = [];
        for (const fraction of [0.3, 0.6]) {
          await page.eval(`window.scrollTo(0, document.documentElement.scrollHeight * ${fraction})`);
          await page.sleep(400);
          tracked.push(
            await page.eval(`({
              current: document.querySelector('[data-toc][aria-current="location"]')?.dataset.toc ?? null,
              read: getComputedStyle(document.querySelector(".lg-page")).getPropertyValue("--lg-read"),
            })`),
          );
        }
        await page.screenshot(`${label}-${size.name}-mid.png`);
        result.rail = tracked;
      }
      await fullShot(page, evidenceDir, `${label}-${size.name}-full.png`);
      report[key] = result;
      if (result.overflow > 0) throw new Error(`${key} overflows by ${result.overflow}px`);
    }
  }

  const unexpected = errors.filter((text) => !KNOWN_NOISE.test(text));
  writeFileSync(join(evidenceDir, "learn-report.json"), JSON.stringify({ report, errors }, null, 2));
  if (unexpected.length > 0) throw new Error(`console errors: ${unexpected.join(" | ")}`);
  return report;
}
