import { readdirSync } from "node:fs";

const BLOCKED_HOSTS = [
  "*google-analytics.com*",
  "*googletagmanager.com*",
  "*/g/collect*",
  "*/ccm/collect*",
  "*doubleclick.net*",
  "*googlesyndication.com*",
  "*adservice.google*",
];
const LOCALE = process.env.ARTICLE_LOCALE ?? "de";
const PREFIX = LOCALE === "en" ? "" : `/${LOCALE}`;
const SLUGS = readdirSync("src/lib/articles/entries").map((file) => file.replace(/\.ts$/, ""));
const STICKY_GATE = { width: 1440, height: 847, deviceScaleFactor: 1, mobile: false };
const RAIL_TOP_PX = 20;
const PHONE_WIDTHS = [375, 320];
const NARROW_TEXT =
  "main dt, main dd, main [data-article-card] p, main [data-article-card] h2, main figcaption *, main h1, main [data-sort-option], main [data-article-drill] span";

const SPILLS = `[...document.querySelectorAll(${JSON.stringify(NARROW_TEXT)})]
  .filter((element) => element.scrollWidth > element.clientWidth + 1)
  .map((element) => element.tagName + " " + JSON.stringify(element.textContent.slice(0, 40)) + " is " + element.scrollWidth + "px in " + element.clientWidth + "px")`;
const RAIL_HEIGHT = `Math.round(document.querySelector("[data-article-rail]").getBoundingClientRect().height)`;
const SIDEWAYS = "document.documentElement.scrollWidth - innerWidth";

async function open(page, url) {
  await page.goto(url);
  await page.eval("document.fonts.ready.then(() => true)");
}

export default async function drive(page, { baseUrl }) {
  await page.send("Network.enable");
  await page.send("Network.setBlockedURLs", { urls: BLOCKED_HOSTS });
  const articles = SLUGS.map((slug) => `${PREFIX}/articles/${slug}`);
  const problems = [];
  const rails = {};

  await page.send("Emulation.setDeviceMetricsOverride", STICKY_GATE);
  for (const path of articles) {
    await open(page, `${baseUrl}${path}`);
    rails[path] = await page.eval(RAIL_HEIGHT);
    if (RAIL_TOP_PX + rails[path] > STICKY_GATE.height) {
      problems.push(`${path}: the rail is ${rails[path]}px and sticks ${RAIL_TOP_PX}px down, which does not fit ${STICKY_GATE.height}px`);
    }
    for (const spill of await page.eval(SPILLS)) problems.push(`${path} at ${STICKY_GATE.width}: ${spill}`);
  }

  for (const width of PHONE_WIDTHS) {
    await page.send("Emulation.setDeviceMetricsOverride", { width, height: 812, deviceScaleFactor: 2, mobile: true });
    for (const path of [`${PREFIX}/articles`, ...articles]) {
      await open(page, `${baseUrl}${path}`);
      for (const spill of await page.eval(SPILLS)) problems.push(`${path} at ${width}: ${spill}`);
      const sideways = await page.eval(SIDEWAYS);
      if (sideways > 0) problems.push(`${path} at ${width}: the page scrolls ${sideways}px sideways`);
    }
  }

  await open(page, `${baseUrl}${articles[0]}`);
  await page.eval(`document.querySelector("dl").scrollIntoView({ block: "center" })`);
  await page.sleep(300);
  await page.screenshot(`${LOCALE}-fact-file-320x812.png`);

  if (problems.length > 0) throw new Error(`${problems.length} layout problems in ${LOCALE}:\n${problems.join("\n")}`);
  return { locale: LOCALE, rails };
}
