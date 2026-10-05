import { writeFileSync } from "node:fs";

const BLOCKED_HOSTS = [
  "*google-analytics.com*",
  "*googletagmanager.com*",
  "*/g/collect*",
  "*/ccm/collect*",
  "*doubleclick.net*",
  "*googlesyndication.com*",
  "*adservice.google*",
];
const GOOGLE = /google-analytics\.com|googletagmanager\.com|\/g\/collect|\/ccm\/collect|doubleclick\.net|googlesyndication\.com|adservice\.google/;
const LOCALES = (process.env.RAIL_LOCALES ?? "fr,ru,en,hi").split(",");
const FLIGHT_LOCALES = (process.env.RAIL_FLIGHT_LOCALES ?? "en,fr").split(",").filter(Boolean);
const SLUG = process.env.ARTICLE_SLUG ?? "magnus-carlsen";
const RAIL_VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1440, height: 800 },
  { width: 1440, height: 720 },
  { width: 1280, height: 720 },
  { width: 821, height: 900 },
];
const STACKED_VIEWPORT = { width: 820, height: 900 };
const FLIGHT_VIEWPORTS = [RAIL_VIEWPORTS[0], RAIL_VIEWPORTS[2]];
const SCREENSHOT_LOCALE = "fr";
const RAIL_GAP_PX = 20;
const SCROLL_STEP_PX = 100;
const TOLERANCE_PX = 0.5;
const STACKED_SCROLL_PX = 600;

const q = (value) => JSON.stringify(value);
const RAIL = "[data-article-rail]";
const RAIL_MEASURED = `getComputedStyle(document.querySelector(${q(RAIL)})).getPropertyValue("--rail-height") !== ""`;
const FLOWN_PARTS = { "article-portrait": "portrait", "article-title": "title", "article-date": "date" };

const WATCH_FIRST_PAINT = `(() => {
  const watch = { framesUnmeasured: 0, before: null, after: null, shifts: [] };
  window.__rail = watch;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const rail = document.querySelector(${q(RAIL)});
      watch.shifts.push({ value: entry.value, movedTheRail: entry.sources.some((moved) => Boolean(rail && moved.node && rail.contains(moved.node))) });
    }
  }).observe({ type: "layout-shift", buffered: true });
  const sample = () => {
    const rail = document.querySelector(${q(RAIL)});
    if (rail) {
      const offset = rail.getBoundingClientRect().top - rail.closest("article").getBoundingClientRect().top;
      if (rail.style.getPropertyValue("--rail-height") === "") {
        watch.framesUnmeasured += 1;
        watch.before = offset;
      } else {
        watch.after = offset;
        return;
      }
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
})()`;

const SCAN = `(() => {
  const rail = document.querySelector(${q(RAIL)});
  const footer = document.querySelector("body > footer");
  const article = rail.closest("article");
  const end = document.documentElement.scrollHeight - innerHeight;
  const rows = [];
  for (let y = 0; ; y = Math.min(y + ${SCROLL_STEP_PX}, end)) {
    scrollTo(0, y);
    const box = rail.getBoundingClientRect();
    rows.push({ scrollY, top: box.top, bottom: box.bottom, footerTop: footer.getBoundingClientRect().top, articleBottom: article.getBoundingClientRect().bottom });
    if (y >= end) break;
  }
  scrollTo(0, 0);
  const style = getComputedStyle(rail);
  return { viewportHeight: innerHeight, railHeight: rows[0].bottom - rows[0].top, position: style.position, pageEnd: end, rows };
})()`;

const STACKED = `(() => {
  const rail = document.querySelector(${q(RAIL)});
  const style = getComputedStyle(rail);
  const tops = () => ["figure", "article header h1", ${q(`${RAIL} > section`)}, "[data-article-body]"].map((selector) => document.querySelector(selector).getBoundingClientRect().top);
  const atTop = tops();
  scrollTo(0, ${STACKED_SCROLL_PX});
  const scrolled = tops();
  scrollTo(0, 0);
  return { display: style.display, position: style.position, order: ["portrait", "heading", "fact file", "body"], topsAtScroll0: atTop, portraitTopAfterScrolling: scrolled[0] };
})()`;

const FLY = `(async () => {
  let flight = null;
  const start = document.startViewTransition.bind(document);
  document.startViewTransition = (update) => (flight = start(update));
  document.querySelector(${q(`main a[data-article-card="${SLUG}"]`)}).click();
  if (!flight) return null;
  await flight.ready;
  const groups = document.getAnimations().filter((animation) => /^::view-transition-group\\(article-/.test(animation.effect.pseudoElement ?? ""));
  for (const animation of groups) {
    animation.pause();
    animation.currentTime = animation.effect.getComputedTiming().endTime;
  }
  const landing = Object.fromEntries(groups.map((animation) => {
    const style = getComputedStyle(document.documentElement, animation.effect.pseudoElement);
    const matrix = new DOMMatrixReadOnly(style.transform);
    const name = animation.effect.pseudoElement.match(/\\((.+)\\)/)[1];
    return [name, { x: matrix.m41, y: matrix.m42, width: parseFloat(style.width), height: parseFloat(style.height) }];
  }));
  for (const animation of groups) animation.play();
  await flight.finished;
  return landing;
})()`;

const ARRIVED = `(() => {
  const rail = document.querySelector(${q(RAIL)});
  const part = (name) => {
    const box = document.querySelector('article [data-flight="' + name + '"]').getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  };
  return { path: location.pathname, scrollY, railPosition: getComputedStyle(rail).position, railTop: getComputedStyle(rail).top, portrait: part("portrait"), title: part("title"), date: part("date") };
})()`;

const pathOf = (locale, tail = "") => `${locale === "en" ? "" : `/${locale}`}/articles${tail}`;
const near = (a, b) => Math.abs(a - b) <= TOLERANCE_PX;

async function open(page, url, viewport) {
  await page.send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 1, mobile: false });
  await page.goto(url);
  await page.eval("document.fonts.ready.then(() => true)");
}

function reachedParts(rows, railHeight, viewportHeight) {
  const seen = rows
    .map((row) => [Math.max(0, -row.top), Math.min(railHeight, viewportHeight - row.top)])
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0]);
  let reached = 0;
  for (const [from, to] of seen) {
    if (from > reached + TOLERANCE_PX) break;
    reached = Math.max(reached, to);
  }
  return reached;
}

function judgeRail(label, scan) {
  const { rows, railHeight, viewportHeight } = scan;
  const fits = railHeight + 2 * RAIL_GAP_PX <= viewportHeight;
  const pinTop = fits ? RAIL_GAP_PX : viewportHeight - railHeight - RAIL_GAP_PX;
  const expectedTop = (row) => Math.min(Math.max(rows[0].top - row.scrollY, pinTop), row.articleBottom - railHeight);
  const pinned = rows.filter((row) => near(row.top, pinTop));
  const released = (row) => near(row.bottom, row.articleBottom);
  const clipped = rows.filter((row) => row.top < -TOLERANCE_PX && row.bottom < viewportHeight - RAIL_GAP_PX - TOLERANCE_PX && !released(row));
  const reached = reachedParts(rows, railHeight, viewportHeight);
  const problems = [
    scan.position !== "sticky" && `the rail is ${scan.position}`,
    rows.some((row) => row.bottom > row.footerTop + TOLERANCE_PX) && "the rail overlaps the footer",
    clipped.length > 0 && `the rail is cut off above the viewport at scrollY ${clipped.map((row) => row.scrollY)}`,
    !near(reached, railHeight) && `only the first ${reached}px of the ${railHeight}px rail can be scrolled into view`,
    pinned.length === 0 && `the rail never pins at ${pinTop}px`,
    rows.some((row) => !near(row.top, expectedTop(row))) && "the rail leaves the path natural place, pin, end of article",
  ].filter(Boolean);
  return {
    summary: {
      railHeight,
      viewportHeight,
      fits,
      pinsWith: fits ? `top at ${RAIL_GAP_PX}px` : `bottom ${RAIL_GAP_PX}px above the viewport bottom`,
      pinnedTop: pinned[0]?.top ?? null,
      pinnedBottom: pinned[0]?.bottom ?? null,
      pinnedFromScrollY: pinned[0]?.scrollY ?? null,
      pinnedSteps: pinned.length,
      steps: rows.length,
      smallestGapToFooter: Math.min(...rows.map((row) => row.footerTop - row.bottom)),
      reachedPx: reached,
      pass: problems.length === 0,
    },
    problems: problems.map((problem) => `${label}: ${problem}`),
  };
}

function judgeStacked(label, stacked) {
  const rising = stacked.topsAtScroll0.every((top, index, tops) => index === 0 || top > tops[index - 1]);
  const scrolledAway = near(stacked.portraitTopAfterScrolling, stacked.topsAtScroll0[0] - STACKED_SCROLL_PX);
  return [
    stacked.position === "sticky" && "the rail is sticky",
    stacked.display !== "contents" && `the rail is display ${stacked.display}`,
    !rising && `the order is not portrait, heading, fact file, body: ${stacked.topsAtScroll0}`,
    !scrolledAway && "the portrait does not scroll with the page",
  ]
    .filter(Boolean)
    .map((problem) => `${label}: ${problem}`);
}

async function driveRails(page, baseUrl, result, problems) {
  for (const locale of LOCALES) {
    const url = `${baseUrl}${pathOf(locale, `/${SLUG}`)}`;
    result.rails[locale] = {};
    for (const viewport of RAIL_VIEWPORTS) {
      const size = `${viewport.width}x${viewport.height}`;
      await open(page, url, viewport);
      await page.waitFor(RAIL_MEASURED);
      const scan = await page.eval(SCAN);
      const { summary, problems: found } = judgeRail(`${locale} ${size}`, scan);
      result.rails[locale][size] = { ...summary, rows: scan.rows.map((row) => [row.scrollY, row.top, row.bottom, row.footerTop]) };
      problems.push(...found);
      if (locale === SCREENSHOT_LOCALE) {
        await page.eval(`scrollTo(0, ${Math.round(scan.pageEnd / 2)})`);
        await page.screenshot(`rail-${locale}-${size}-mid.png`);
      }
    }
    await open(page, url, STACKED_VIEWPORT);
    result.stacked[locale] = await page.eval(STACKED);
    problems.push(...judgeStacked(`${locale} ${STACKED_VIEWPORT.width}x${STACKED_VIEWPORT.height}`, result.stacked[locale]));
  }
}

async function driveFirstPaint(page, baseUrl, result, problems) {
  const { identifier } = await page.send("Page.addScriptToEvaluateOnNewDocument", { source: WATCH_FIRST_PAINT });
  for (const locale of LOCALES) {
    await open(page, `${baseUrl}${pathOf(locale, `/${SLUG}`)}`, RAIL_VIEWPORTS[2]);
    await page.waitFor("window.__rail.after !== null");
    await page.sleep(300);
    const watch = await page.eval("window.__rail");
    const shiftFromTheRail = watch.shifts.filter((shift) => shift.movedTheRail).reduce((sum, shift) => sum + shift.value, 0);
    result.firstPaint[locale] = {
      framesBeforeTheHeightArrived: watch.framesUnmeasured,
      railBelowArticleTopBefore: watch.before,
      railBelowArticleTopAfter: watch.after,
      layoutShiftFromTheRail: shiftFromTheRail,
      layoutShiftOfThePage: watch.shifts.reduce((sum, shift) => sum + shift.value, 0),
    };
    if (watch.before === null) problems.push(`${locale}: the rail was never painted before its height arrived, so the first paint is unproven`);
    else if (watch.before !== watch.after) problems.push(`${locale}: the rail moved ${watch.after - watch.before}px in the article when its height arrived`);
    if (shiftFromTheRail > 0) problems.push(`${locale}: the rail caused a layout shift of ${shiftFromTheRail}`);
  }
  await page.send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
}

async function driveFlights(page, baseUrl, result, problems) {
  for (const locale of FLIGHT_LOCALES) {
    for (const viewport of FLIGHT_VIEWPORTS) {
      const label = `${locale} ${viewport.width}x${viewport.height}`;
      await open(page, `${baseUrl}${pathOf(locale)}`, viewport);
      await page.waitFor(`document.querySelectorAll("main a[data-article-card]").length > 0`);
      const landing = await page.eval(FLY);
      await page.waitFor(`location.pathname === ${q(pathOf(locale, `/${SLUG}`))} && ${RAIL_MEASURED}`);
      const arrived = await page.eval(ARRIVED);
      const offsets = Object.fromEntries(
        Object.entries(FLOWN_PARTS).map(([name, part]) => [
          part,
          landing?.[name] ? Object.fromEntries(Object.keys(arrived[part]).map((side) => [side, landing[name][side] - arrived[part][side]])) : null,
        ]),
      );
      const landed = Object.values(offsets).every((offset) => offset !== null && Object.values(offset).every((px) => Math.abs(px) <= TOLERANCE_PX));
      result.flights[label] = { landed, railPosition: arrived.railPosition, railTop: arrived.railTop, offsetsPx: offsets, article: arrived };
      if (!landed) problems.push(`${label}: the flight does not land on the article: ${q(offsets)}`);
      if (arrived.railPosition !== "sticky") problems.push(`${label}: the rail is ${arrived.railPosition} after the flight`);
    }
  }
}

export default async function drive(page, { baseUrl, evidenceDir }) {
  await page.send("Network.enable");
  await page.send("Network.setBlockedURLs", { urls: BLOCKED_HOSTS });
  await page.send("Target.setDiscoverTargets", { discover: true });
  const seen = { google: 0, googleBlocked: 0, newPages: [] };
  const googleRequests = new Set();
  page.on((method, params) => {
    if (method === "Network.requestWillBeSent" && GOOGLE.test(params.request.url)) googleRequests.add(params.requestId);
    if (method === "Network.loadingFailed" && googleRequests.has(params.requestId)) seen.googleBlocked += 1;
    if (method === "Target.targetCreated" && params.targetInfo.type === "page") seen.newPages.push(params.targetInfo.url);
  });

  const result = { slug: SLUG, railGapPx: RAIL_GAP_PX, scrollStepPx: SCROLL_STEP_PX, tolerancePx: TOLERANCE_PX, rails: {}, stacked: {}, firstPaint: {}, flights: {} };
  const problems = [];
  await driveRails(page, baseUrl, result, problems);
  await driveFirstPaint(page, baseUrl, result, problems);
  await driveFlights(page, baseUrl, result, problems);

  seen.google = googleRequests.size;
  if (seen.google !== seen.googleBlocked) problems.push(`${seen.google} Google requests, ${seen.googleBlocked} blocked`);
  if (seen.newPages.length > 0) problems.push(`a new tab was opened: ${seen.newPages}`);
  writeFileSync(`${evidenceDir}/rail.json`, JSON.stringify({ ...result, network: seen, problems }, null, 2));
  if (problems.length > 0) throw new Error(`${problems.length} rail problems:\n${problems.join("\n")}`);

  const brief = (group) => Object.fromEntries(Object.entries(group).map(([size, { railHeight, pinnedTop, pinnedBottom, pass }]) => [size, { railHeight, pinnedTop, pinnedBottom, pass }]));
  return {
    rails: Object.fromEntries(Object.entries(result.rails).map(([locale, group]) => [locale, brief(group)])),
    flights: Object.fromEntries(Object.entries(result.flights).map(([label, flight]) => [label, flight.landed])),
    network: seen,
  };
}
