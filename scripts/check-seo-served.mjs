#!/usr/bin/env node
/**
 * Reads what a crawler gets, so run it against `next start`, a preview or
 * production, never a dev server.
 *
 * Usage: node scripts/check-seo-served.mjs [baseUrl]   (default http://localhost:3103)
 */
import { readFileSync } from "node:fs";

const BASE = (process.argv[2] ?? "http://localhost:3103").replace(/\/$/, "");
const SITE = "https://thememorychess.com";
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const SOCIAL_IMAGE = `${SITE}/social/v2/memory-chess-1200x630.jpg`;
const MAX_TITLE = 64;
const GUIDES_DIR = new URL("../src/lib/seo/learn/guides/", import.meta.url);
const TITLE_SUFFIX = " | Memory Chess";

const guideField = (source, field) => {
  const match = source.match(new RegExp(`^    ${field}:\\s*("(?:[^"\\\\]|\\\\.)*")`, "m"));
  return match ? JSON.parse(match[1]) : undefined;
};
const guideSearchMeta = (slug) => {
  const source = readFileSync(new URL(`${slug}.ts`, GUIDES_DIR), "utf8");
  return {
    title: `${guideField(source, "searchTitle") ?? guideField(source, "title")}${TITLE_SUFFIX}`,
    description: guideField(source, "searchDescription") ?? guideField(source, "description"),
  };
};
const GUIDE_SLUGS = [
  "chess-calculation-exercises-for-beginners",
  "chess-pattern-recognition-drills",
  "chess-memory-training",
  "blindfold-chess-training-for-beginners",
  "chess-visualization-exercises",
  "chess-coordinates-practice",
  "how-to-play-memory-chess-board-game",
  "how-to-stop-blundering-in-chess",
];

const GAME_TITLE = "Chess Memory Game: Rebuild the Position | Memory Chess";
const GAME_DESCRIPTION =
  "Start a chess memory game in one tap. Memorize a position, rebuild it square by square, and see your accuracy. Pick 2 to 32 pieces and 1 to 60 seconds.";

const TRIMMED_TITLES = {
  "/articles/adriaan-de-groot": "De Groot's 1944 chess memory test, in numbers | Memory Chess",
  "/articles/magnus-carlsen": "How Magnus Carlsen names a game from one position | Memory Chess",
  "/articles/judit-polgar": "How Judit Polgár played blindfold chess at seven | Memory Chess",
  "/de/game": "Memory Chess online spielen",
  "/leaderboard": "Memory Chess Leaderboard",
};

const ANCHORS = [
  ["/game", "/learn/chess-visualization-exercises", "chess visualization exercises"],
  ["/game", "/learn/blindfold-chess-training-for-beginners", "blindfold chess training plan"],
  ["/game", "/learn/chess-memory-training", "chess memory training ladder"],
  ["/game", "/learn/how-to-see-the-whole-board-in-chess", "see the whole board"],
  ["/articles/judit-polgar", "/learn/blindfold-chess-training-for-beginners", "train blindfold chess in four stages"],
  ["/articles/adriaan-de-groot", "/learn/chess-memory-training", "chess memory training"],
  ["/articles/adriaan-de-groot", "/learn/how-to-see-the-whole-board-in-chess", "how to see the whole board"],
  ["/articles/magnus-carlsen", "/learn/chess-pattern-recognition-drills", "pattern recognition drills"],
  ["/articles/magnus-carlsen", "/learn/chess-visualization-exercises", "visualization exercises"],
  ["/learn/blindfold-chess-training-for-beginners", "/articles/judit-polgar", "How Judit Polgár played blindfold chess at age seven"],
  ["/learn/chess-memory-training", "/articles/adriaan-de-groot", "Adriaan de Groot's 1944 test of chess memory, by the numbers"],
  ["/learn/chess-pattern-recognition-drills", "/articles/magnus-carlsen", "How Magnus Carlsen names a famous game from one position"],
  ["/learn/chess-calculation-exercises-for-beginners", "/learn/how-to-stop-blundering-in-chess", null],
  ["/learn/chess-visualization-exercises", "/learn/how-to-see-the-whole-board-in-chess", null],
  ["/learn/chess-visualization-exercises", "/learn/blindfold-chess-training-for-beginners", "blindfold chess training"],
  ["/learn/how-to-see-the-whole-board-in-chess", "/learn/blindfold-chess-training-for-beginners", "blindfold chess training"],
  ["/learn/how-to-get-better-at-chess-for-beginners", "/learn/20-minute-daily-chess-study-plan", null],
  ["/learn/chess-pattern-recognition-drills", "/learn/how-many-chess-puzzles-a-day", null],
  ["/", "/daily", "today's daily board"],
  ["/de", "/de/daily", null],
];

const decode = (text) =>
  text
    .replace(/<!-- -->/g, "")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

const cache = new Map();
async function fetchPage(path) {
  if (!cache.has(path)) {
    const response = await fetch(`${BASE}${path}`, { headers: { "user-agent": UA }, redirect: "manual" });
    cache.set(path, { response, html: await response.text() });
  }
  return cache.get(path);
}

const titleOf = (html) => decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
const metaOf = (html, key) =>
  decode(
    html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`))?.[1] ??
      html.match(new RegExp(`<meta content="([^"]*)" (?:property|name)="${key}"`))?.[1] ??
      "",
  );
const firstHeading = (html) => {
  const match = html.match(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/);
  return match ? [match[1], decode(match[2].replace(/<[^>]+>/g, "")).trim()] : [null, ""];
};
const textOf = (fragment) => decode(fragment.replace(/<[^>]+>/g, "")).trim();
const ctaLabelOf = (body) => textOf(body.match(/<b>([\s\S]*?)<\/b>/)?.[1] ?? "");
const hasAnchor = (html, href, anchor) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].some(
    ([, attributes, body]) =>
      attributes.includes(`href="${href}"`) &&
      (anchor === null || textOf(body) === anchor || ctaLabelOf(body) === anchor),
  );
const jsonLdTypes = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, json]) => {
    const data = JSON.parse(json);
    return (data["@graph"] ?? [data]).map((node) => [node["@type"]].flat().join("+"));
  });

const rows = [];
const check = (name, ok, detail = "") => rows.push({ name, ok, detail });

const game = await fetchPage("/game");
check("/game title", titleOf(game.html) === GAME_TITLE, titleOf(game.html));
check("/game description (151 chars)", metaOf(game.html, "description") === GAME_DESCRIPTION, `${metaOf(game.html, "description").length} chars`);
const [level, text] = firstHeading(game.html);
check("/game first heading is the h1 'Memory chess game'", level === "h1" && text === "Memory chess game", `${level} "${text}"`);

for (const path of ["/game", "/leaderboard", "/contact-us", "/about", "/terms", "/privacy", "/changelog"]) {
  const { html } = await fetchPage(path);
  check(`${path} og:image`, metaOf(html, "og:image") === SOCIAL_IMAGE, metaOf(html, "og:image"));
  check(`${path} twitter:card`, metaOf(html, "twitter:card") === "summary_large_image", metaOf(html, "twitter:card"));
}

check("/de og:url", metaOf((await fetchPage("/de")).html, "og:url") === `${SITE}/de`, metaOf((await fetchPage("/de")).html, "og:url"));
check("/ og:url", metaOf((await fetchPage("/")).html, "og:url") === SITE, metaOf((await fetchPage("/")).html, "og:url"));

await fetch(`${BASE}/learn`, { headers: { "user-agent": UA } });
const learnAgain = await fetch(`${BASE}/learn`, { headers: { "user-agent": UA } });
// next start sends x-nextjs-prerender twice; Vercel answers from its own cache, named in x-vercel-cache.
const prerender = learnAgain.headers.get("x-nextjs-prerender");
const cacheState = learnAgain.headers.get("x-nextjs-cache") ?? learnAgain.headers.get("x-vercel-cache");
check(
  "/learn prerendered and cached",
  prerender?.split(",").every((value) => value.trim() === "1") && ["HIT", "PRERENDER", "STALE"].includes(cacheState),
  `x-nextjs-prerender=${prerender} cache=${cacheState}`,
);

for (const slug of GUIDE_SLUGS) {
  const { html } = await fetchPage(`/learn/${slug}`);
  const expected = guideSearchMeta(slug);
  const title = titleOf(html);
  check(`/learn/${slug} title`, title === expected.title && title.length <= MAX_TITLE, `"${title}" (${title.length})`);
  const description = metaOf(html, "description");
  check(`/learn/${slug} description`, description === expected.description, `${description.length} chars`);
}

for (const [path, expected] of Object.entries(TRIMMED_TITLES)) {
  const title = titleOf((await fetchPage(path)).html);
  check(`${path} title`, title === expected && title.length <= MAX_TITLE, `"${title}" (${title.length})`);
}

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const guides = [...sitemap.matchAll(/<loc>https:\/\/thememorychess\.com(\/learn\/[^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap lists guides", guides.length > 0, `${guides.length} guides`);
for (const path of guides) {
  const { html } = await fetchPage(path);
  const closing = html.lastIndexOf('data-cta-kind="game"');
  const lastSection = Math.max(
    ...[...html.matchAll(/<section id="([^"]+)"/g)].filter((m) => m[1] !== "faq").map((m) => m.index),
  );
  check(`${path} closing play link after the last section`, closing > lastSection && lastSection > 0);
}

for (const [source, href, anchor] of ANCHORS) {
  const { html } = await fetchPage(source);
  check(`${source} -> ${href}${anchor ? ` "${anchor}"` : ""}`, hasAnchor(html, href, anchor));
}

for (const [path, types] of [
  ["/", ["Organization", "WebSite", "SoftwareApplication+WebApplication", "VideoObject", "FAQPage"]],
  ["/daily", ["WebPage", "BreadcrumbList"]],
  ["/de/daily", ["WebPage", "BreadcrumbList"]],
]) {
  const found = jsonLdTypes((await fetchPage(path)).html);
  check(`${path} JSON-LD has ${types.join(", ")}`, types.every((type) => found.includes(type)), found.join(", "));
}

const leaderboardDescription = metaOf((await fetchPage("/leaderboard")).html, "description");
check("/leaderboard description 120 to 155 chars", leaderboardDescription.length >= 120 && leaderboardDescription.length <= 155, `${leaderboardDescription.length} chars`);

const contactUrls = [...sitemap.matchAll(/<loc>([^<]*\/contact-us)<\/loc>/g)].map((m) => m[1]);
check("sitemap lists /contact-us once, in English", contactUrls.join() === `${SITE}/contact-us`, contactUrls.join(" "));

for (const row of rows) console.log(`${row.ok ? "PASS" : "FAIL"}  ${row.name}${row.detail ? `  [${row.detail}]` : ""}`);
const failed = rows.filter((row) => !row.ok).length;
console.log(`${rows.length - failed}/${rows.length} passed`);
process.exitCode = failed === 0 ? 0 : 1;
