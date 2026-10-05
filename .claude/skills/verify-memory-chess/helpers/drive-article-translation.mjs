import { readFileSync } from "node:fs";

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
const LOCALE = process.env.ARTICLE_LOCALE ?? "de";
const SLUG = process.env.ARTICLE_SLUG ?? "magnus-carlsen";
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false };
const PHONE = { width: 375, height: 812, deviceScaleFactor: 2, mobile: true };

const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const local = json(`messages/${LOCALE}.json`);
const english = json("messages/en.json");
const translated = json(`src/lib/articles/translations/${LOCALE}/${SLUG}.json`).text;

const q = (value) => JSON.stringify(value);
const CARD = "main a[data-article-card]";
const BODY = "[data-article-body]";
const TYPING = `document.querySelector(${q(BODY)})?.dataset.articleTyping`;
const LANG = "document.documentElement.lang";
const LIKE = `button[aria-label=${q(local.articles.like.button)}]`;
const SHOW_ALL = local.articles.page.showAll;
const LIST_PATH = `/${LOCALE}/articles`;
const ARTICLE_PATH = `${LIST_PATH}/${SLUG}`;
const ENGLISH_PATH = `/articles/${SLUG}`;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function watchNetwork(page) {
  const requests = new Map();
  const failed = [];
  const targets = [];
  page.on((method, params) => {
    if (method === "Network.requestWillBeSent") {
      requests.set(params.requestId, { url: params.request.url, method: params.request.method, body: params.request.postData });
    }
    if (method === "Network.responseReceived" && requests.has(params.requestId)) {
      requests.get(params.requestId).status = params.response.status;
    }
    if (method === "Network.loadingFailed" && requests.has(params.requestId)) {
      failed.push(requests.get(params.requestId).url);
    }
    if (method === "Target.targetCreated" && params.targetInfo.type === "page") targets.push(params.targetInfo.url);
  });
  return {
    likes: () => [...requests.values()].filter((request) => /\/api\/articles\/.+\/stats$/.test(request.url) && request.body?.includes('"like"')),
    google: () => [...requests.values()].filter((request) => GOOGLE.test(request.url)).length,
    googleBlocked: () => failed.filter((url) => GOOGLE.test(url)).length,
    newPages: () => targets,
  };
}

function listFacts(page) {
  return page.eval(`(() => {
    const cards = [...document.querySelectorAll(${q(CARD)})];
    const note = document.querySelector("[data-translation-note]");
    const navLink = [...document.querySelectorAll('nav[aria-label="Main"] a')].find((a) => a.getAttribute("href") === ${q(LIST_PATH)});
    return {
      lang: document.documentElement.lang,
      h1: document.querySelector("h1").textContent,
      title: document.title,
      slugs: cards.map((card) => card.getAttribute("data-article-card")),
      slugsByViews: cards
        .map((card) => ({ slug: card.getAttribute("data-article-card"), rank: Number(getComputedStyle(card.closest("li")).getPropertyValue("--rank-views")) }))
        .sort((a, b) => a.rank - b.rank)
        .map((card) => card.slug),
      hrefs: cards.map((card) => card.getAttribute("href")),
      firstDate: cards[0]?.querySelector("time")?.textContent,
      note: note?.textContent ?? null,
      noteHref: note?.querySelector("a")?.getAttribute("href") ?? null,
      noteHreflang: note?.querySelector("a")?.getAttribute("hreflang") ?? null,
      navArticles: navLink ? { text: navLink.textContent, current: navLink.getAttribute("aria-current") } : null,
      sortLabels: [...document.querySelectorAll("[data-sort-option]")].map((button) => button.textContent),
      fitsWidth: document.documentElement.scrollWidth <= innerWidth,
    };
  })()`);
}

function articleFacts(page) {
  return page.eval(`(() => {
    const note = document.querySelector("[data-translation-note]");
    const before = note?.previousElementSibling;
    const body = document.querySelector(${q(BODY)});
    const drill = document.querySelector("a[data-article-drill]");
    return {
      path: location.pathname,
      lang: document.documentElement.lang,
      h1: document.querySelector("h1").textContent,
      date: document.querySelector("header time").textContent,
      note: note?.textContent ?? null,
      noteHref: note?.querySelector("a")?.getAttribute("href") ?? null,
      noteHreflang: note?.querySelector("a")?.getAttribute("hreflang") ?? null,
      noteFollowsAuthorshipNote: Boolean(before?.hasAttribute("data-authorship-note") && !before.hasAttribute("data-translation-note")),
      factLabels: [...document.querySelectorAll("dl dt")].map((dt) => dt.textContent),
      typing: body.dataset.articleTyping,
      bodyLength: body.textContent.length,
      bodyIsTheTranslation: body.textContent === ${q(translated.sections.map((section) => section.heading + section.paragraphs.join("")).join(""))},
      bodyFont: getComputedStyle(body).fontFamily,
      drill: drill.getAttribute("href"),
      drillLabel: drill.getAttribute("aria-label"),
      fitsWidth: document.documentElement.scrollWidth <= innerWidth,
    };
  })()`);
}

async function chooseLanguage(page, code) {
  const option = `[role="menu"] [role="menuitemradio"][lang=${q(code)}]`;
  await page.click('button[aria-haspopup="menu"]');
  await page.waitFor(`Boolean(document.querySelector(${q(option)}))`);
  const enabled = await page.eval(
    `[...document.querySelectorAll('[role="menu"] [role="menuitemradio"]')].filter((item) => !item.disabled).map((item) => item.lang)`,
  );
  await page.click(option);
  return enabled;
}

async function driveList(page, baseUrl, result) {
  await page.goto(`${baseUrl}${LIST_PATH}`);
  await page.waitFor(`document.querySelectorAll(${q(CARD)}).length > 0`);
  const list = await listFacts(page);
  check(list.lang === LOCALE, `list lang is ${list.lang}`);
  check(list.h1 === local.articles.list.heading, `list h1 is ${list.h1}`);
  check(list.hrefs.every((href) => href.startsWith(`${LIST_PATH}/`)), `card hrefs are ${list.hrefs}`);
  check(list.note?.includes(local.articles.page.translationNote), `list note is ${list.note}`);
  check(list.noteHref === "/articles" && list.noteHreflang === "en", `list note links to ${list.noteHref}`);
  check(list.navArticles?.text === local.common.nav.articles, `the nav link reads ${q(list.navArticles)}`);
  check(q(list.sortLabels) === q(Object.values(local.articles.sort.options)), `sort labels are ${list.sortLabels}`);
  await page.screenshot(`${LOCALE}-list-1440x900.png`);

  await page.click('[data-sort-option="views"]');
  await page.sleep(900);
  const sorted = { order: (await listFacts(page)).slugs, search: await page.eval("location.search") };
  check(q(sorted.order) === q(list.slugsByViews), `most viewed order is ${sorted.order}, the ranks say ${list.slugsByViews}`);
  check(sorted.search === "?sort=views", `sort wrote ${sorted.search}`);
  await page.click('[data-sort-option="newest"]');
  await page.sleep(900);
  Object.assign(result, { list, sortedByViews: sorted });
}

async function driveCardClick(page, network, result) {
  await page.eval(`(() => {
    window.__transitions = 0;
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => { window.__transitions += 1; return start(update); };
  })()`);
  await page.click(`${CARD}[data-article-card="${SLUG}"]`);
  await page.waitFor(`location.pathname === ${q(ARTICLE_PATH)} && ${TYPING} === "typing"`);
  await page.waitFor(`[...document.querySelectorAll("button")].some((button) => button.textContent === ${q(SHOW_ALL)})`);
  const typed = await page.eval(`document.querySelector(".article-caret")?.previousElementSibling?.textContent ?? ""`);
  const firstBlocks = [translated.sections[0].heading, ...translated.sections[0].paragraphs];
  result.flight = { transitions: await page.eval("window.__transitions"), typedPrefix: typed };
  check(result.flight.transitions === 1, `the card click started ${result.flight.transitions} view transitions`);
  check(typed.length > 0 && firstBlocks.some((text) => text.startsWith(typed)), `typed text ${q(typed)} is not the start of a translated block`);
  await page.screenshot(`${LOCALE}-article-typing-1440x900.png`);
  await page.click("button", SHOW_ALL);
  await page.waitFor(`${TYPING} === "done"`);

  result.article = await articleFacts(page);
  check(result.article.bodyIsTheTranslation, "the body after Show all text is not the translated body");
  check(result.article.lang === LOCALE && result.article.h1 === translated.title, `article is ${result.article.lang} ${result.article.h1}`);
  check(result.article.note?.includes(local.articles.page.translationNote), `article note is ${result.article.note}`);
  check(result.article.noteHref === ENGLISH_PATH && result.article.noteHreflang === "en", `article note links to ${result.article.noteHref}`);
  check(result.article.noteFollowsAuthorshipNote, "the translation note is not directly under the authorship note");
  check(result.article.drill.startsWith(`/${LOCALE}/game?`), `the drill links to ${result.article.drill}`);

  await page.click(LIKE);
  await page.waitFor(`document.querySelector(${q(LIKE)}).getAttribute("aria-pressed") === "true"`);
  await page.sleep(600);
  result.like = network.likes();
  check(result.like.length === 1 && result.like[0].status === 200, `like calls: ${q(result.like)}`);
  await page.click(LIKE);
  await page.sleep(600);
}

async function driveLanguageSwitch(page, result) {
  result.languagesOfferedOnTranslation = await chooseLanguage(page, "en");
  await page.waitFor(`location.pathname === ${q(ENGLISH_PATH)} && ${LANG} === "en"`);
  const inEnglish = await articleFacts(page);
  check(inEnglish.note === null, "the English article shows a translation note");
  check(inEnglish.factLabels[0] === english.articles.page.facts.born, "the English fact file is not English");

  result.languagesOfferedOnEnglish = await chooseLanguage(page, LOCALE);
  await page.waitFor(`location.pathname === ${q(ARTICLE_PATH)} && ${LANG} === ${q(LOCALE)}`);
  check((await articleFacts(page)).h1 === translated.title, "switching back did not show the translated article");

  await page.click("[data-translation-note] a");
  await page.waitFor(`location.pathname === ${q(ENGLISH_PATH)} && ${LANG} === "en"`);
  result.switched = [`${ARTICLE_PATH} -> ${ENGLISH_PATH} by the switcher`, `${ENGLISH_PATH} -> ${ARTICLE_PATH} by the switcher`, `${ARTICLE_PATH} -> ${ENGLISH_PATH} by the note's link`];
}

async function drivePhone(page, baseUrl, result) {
  await page.send("Emulation.setDeviceMetricsOverride", PHONE);
  await page.goto(`${baseUrl}${LIST_PATH}`);
  await page.waitFor(`document.querySelectorAll(${q(CARD)}).length > 0`);
  check((await listFacts(page)).fitsWidth, "the translated list scrolls sideways at 375");
  await page.screenshot(`${LOCALE}-list-375x812.png`);
  await page.goto(`${baseUrl}${ARTICLE_PATH}`);
  result.phoneArticle = await articleFacts(page);
  check(result.phoneArticle.fitsWidth, "the translated article scrolls sideways at 375");
  await page.screenshot(`${LOCALE}-article-375x812.png`);
}

export default async function drive(page, { baseUrl }) {
  await page.send("Network.enable");
  await page.send("Network.setBlockedURLs", { urls: BLOCKED_HOSTS });
  await page.send("Target.setDiscoverTargets", { discover: true });
  const network = watchNetwork(page);
  const result = { locale: LOCALE, slug: SLUG };

  await page.send("Emulation.setDeviceMetricsOverride", DESKTOP);
  await driveList(page, baseUrl, result);
  await driveCardClick(page, network, result);
  await driveLanguageSwitch(page, result);

  await page.goto(`${baseUrl}${ARTICLE_PATH}`);
  result.directArticle = await articleFacts(page);
  check(result.directArticle.typing === "idle", `a direct load is ${result.directArticle.typing}`);
  check(result.directArticle.fitsWidth, "the translated article scrolls sideways at 1440");
  await page.screenshot(`${LOCALE}-article-1440x900.png`);

  await drivePhone(page, baseUrl, result);

  result.googleRequests = network.google();
  result.googleBlocked = network.googleBlocked();
  result.newPages = network.newPages().length;
  check(result.googleRequests === result.googleBlocked, `${result.googleRequests} Google requests, ${result.googleBlocked} blocked`);
  check(result.newPages === 0, `a new tab was opened: ${network.newPages()}`);
  return result;
}
