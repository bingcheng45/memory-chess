const BLOCKED_HOSTS = [
  "*google-analytics.com*",
  "*googletagmanager.com*",
  "*/g/collect*",
  "*/ccm/collect*",
  "*doubleclick.net*",
  "*googlesyndication.com*",
  "*adservice.google*",
];
const CARD = "main a[data-article-card]";
const LIKE = 'button[aria-label="Like this article"]';
const SORT_BUTTON = '[role="group"][aria-label="Sort articles"] button';
const STATS_PATH = /\/api\/articles\/([^/]+)\/stats$/;

const CARDS = `[...document.querySelectorAll(${JSON.stringify(CARD)})].map((card) => {
  const count = (word) => {
    const found = card.textContent.match(new RegExp("([\\\\d,]+) " + word + "s?"));
    return found ? Number(found[1].replaceAll(",", "")) : 0;
  };
  return { slug: card.getAttribute("data-article-card"), views: count("view"), likes: count("like") };
})`;

const LIKE_STATE = `(() => {
  const button = document.querySelector(${JSON.stringify(LIKE)});
  const number = button.textContent.replaceAll(",", "").match(/\\d+/);
  return {
    pressed: button.getAttribute("aria-pressed") === "true",
    likes: number ? Number(number[0]) : 0,
    height: Math.round(button.getBoundingClientRect().height),
    said: [...document.querySelectorAll("[aria-live]")].map((node) => node.textContent.trim()).filter(Boolean),
  };
})()`;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function byCount(cards, key) {
  return [...cards].sort((a, b) => b[key] - a[key]).map((card) => card.slug);
}

function watchStatsCalls(page) {
  const calls = new Map();
  page.on((method, params) => {
    if (method === "Network.requestWillBeSent" && STATS_PATH.test(new URL(params.request.url).pathname)) {
      const [, slug] = new URL(params.request.url).pathname.match(STATS_PATH);
      calls.set(params.requestId, { slug, event: JSON.parse(params.request.postData).event });
    }
    if (method === "Network.responseReceived" && calls.has(params.requestId)) {
      calls.get(params.requestId).status = params.response.status;
    }
  });
  return {
    of: (slug, event) => [...calls.values()].filter((call) => call.slug === slug && call.event === event),
    all: () => [...calls.values()],
  };
}

async function answered(page, read, count) {
  const deadline = Date.now() + 10_000;
  while (read().length < count || read().some((call) => call.status === undefined)) {
    if (Date.now() > deadline) throw new Error(`waited for ${count} answered calls, saw ${JSON.stringify(read())}`);
    await page.sleep(100);
  }
  return read();
}

async function sortBy(page, label, key, cards) {
  await page.click(SORT_BUTTON, label);
  await page.sleep(800);
  const order = (await page.eval(CARDS)).map((card) => card.slug);
  const search = await page.eval("location.search");
  check(JSON.stringify(order) === JSON.stringify(byCount(cards, key)), `${label} order is ${order}`);
  check(search === `?sort=${key}`, `${label} wrote ${search}`);
  return { order, search };
}

async function openArticle(page, baseUrl, slug) {
  await page.goto(`${baseUrl}/articles/${slug}`);
  await page.waitFor(`Boolean(document.querySelector(${JSON.stringify(LIKE)}))`);
}

export default async function drive(page, { baseUrl }) {
  await page.send("Network.enable");
  await page.send("Network.setBlockedURLs", { urls: BLOCKED_HOSTS });
  const calls = watchStatsCalls(page);

  await page.goto(`${baseUrl}/articles`);
  await page.waitFor(`document.querySelectorAll(${JSON.stringify(CARD)}).length > 0`);
  const cards = await page.eval(CARDS);
  const hasCounts = cards.some((card) => card.views > 0 || card.likes > 0);
  const hasSortControl = await page.eval(`Boolean(document.querySelector(${JSON.stringify(SORT_BUTTON)}))`);
  await page.screenshot("1-list.png");
  check(hasSortControl === (hasCounts && cards.length > 1), `sort control shown: ${hasSortControl}, counts: ${hasCounts}`);

  const sorted = hasSortControl
    ? { views: await sortBy(page, "Most viewed", "views", cards), likes: await sortBy(page, "Most liked", "likes", cards) }
    : null;
  if (sorted) await page.screenshot("2-sorted-by-likes.png");

  const { slug } = cards[0];
  await page.click(`${CARD}[data-article-card="${slug}"]`);
  await page.waitFor(`location.pathname === "/articles/${slug}" && Boolean(document.querySelector(${JSON.stringify(LIKE)}))`);
  const [view] = await answered(page, () => calls.of(slug, "view"), 1);

  await openArticle(page, baseUrl, slug);
  await page.sleep(1500);
  check(calls.of(slug, "view").length === 1, "a reload in the same tab sent a second view");

  const atRest = await page.eval(LIKE_STATE);
  await page.click(LIKE);
  const [like] = await answered(page, () => calls.of(slug, "like"), 1);
  await page.sleep(300);
  const afterLike = await page.eval(LIKE_STATE);
  await page.screenshot("3-after-like.png");

  if (like.status !== 200) {
    check(!afterLike.pressed && afterLike.said.length === 1, `a failed like left ${JSON.stringify(afterLike)}`);
    return { mode: "stats unavailable", cards, view, like, afterLike, calls: calls.all() };
  }
  check(afterLike.pressed && afterLike.likes >= 1, `a like left ${JSON.stringify(afterLike)}`);
  check(afterLike.height >= 44, `the like button is ${afterLike.height}px tall`);

  await page.click(LIKE);
  const [unlike] = await answered(page, () => calls.of(slug, "unlike"), 1);
  await page.sleep(300);
  const afterUnlike = await page.eval(LIKE_STATE);
  check(unlike.status === 200 && !afterUnlike.pressed, `an unlike left ${JSON.stringify(afterUnlike)}`);
  check(afterUnlike.likes === afterLike.likes - 1, `the count went ${afterLike.likes} to ${afterUnlike.likes}`);

  await openArticle(page, baseUrl, slug);
  const afterReload = await page.eval(LIKE_STATE);
  check(!afterReload.pressed, "the button is pressed again after a reload");

  return { mode: "stats recorded", cards, sorted, view, atRest, afterLike, afterUnlike, calls: calls.all() };
}
