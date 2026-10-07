#!/usr/bin/env node
/**
 * Checks the served HTML of a running build against the SEO checklist: titles,
 * social tags, heading order, prerendering, closing play links and the
 * cross-links between /game, the guides and the articles.
 *
 * It reads what a crawler gets, so run it against `next start`, a preview or
 * production, never a dev server.
 *
 * Usage: node scripts/check-seo-served.mjs [baseUrl]   (default http://localhost:3103)
 */
const BASE = (process.argv[2] ?? "http://localhost:3103").replace(/\/$/, "");
const SITE = "https://thememorychess.com";
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const SOCIAL_IMAGE = `${SITE}/social-preview.png`;
const MAX_TITLE = 64;

const GAME_TITLE = "Chess Memory Game: Rebuild the Position | Memory Chess";
const GAME_DESCRIPTION =
  "Start a chess memory game in one tap. Memorize a position, rebuild it square by square, and see your accuracy. Pick 2 to 32 pieces and 2 to 32 seconds.";

const TRIMMED_TITLES = {
  "/learn/chess-calculation-exercises-for-beginners": "Chess Calculation Exercises for Beginners | Memory Chess",
  "/learn/chess-pattern-recognition-drills": "Chess Pattern Recognition Drills, From Memory | Memory Chess",
  "/learn/chess-memory-training": "Chess Memory Training: A Scored Ladder | Memory Chess",
  "/articles/adriaan-de-groot": "De Groot's 1944 chess memory test, in numbers | Memory Chess",
  "/articles/magnus-carlsen": "How Magnus Carlsen names a game from one position | Memory Chess",
  "/learn/blindfold-chess-training-for-beginners": "Blindfold Chess Training: A 4-Stage Beginner Plan | Memory Chess",
  "/learn/chess-visualization-exercises": "Chess Visualization Training: 2 Exercises | Memory Chess",
};

/** [source page, target href, anchor text] from the plan's anchor table, minus the home rows. */
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
  ["/learn/blindfold-chess-training-for-beginners", "/articles/judit-polgar", "how Judit Polgár played blindfold at seven"],
  ["/learn/chess-memory-training", "/articles/adriaan-de-groot", "de Groot's 1944 memory test"],
  ["/learn/chess-pattern-recognition-drills", "/articles/magnus-carlsen", "how Carlsen names a game from one position"],
  ["/learn/chess-calculation-exercises-for-beginners", "/learn/how-to-stop-blundering-in-chess", null],
  ["/learn/chess-visualization-exercises", "/learn/how-to-see-the-whole-board-in-chess", null],
  ["/learn/how-to-get-better-at-chess-for-beginners", "/learn/20-minute-daily-chess-study-plan", null],
  ["/learn/chess-pattern-recognition-drills", "/learn/how-many-chess-puzzles-a-day", null],
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
const hasAnchor = (html, href, anchor) =>
  [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].some(
    ([, attributes, body]) =>
      attributes.includes(`href="${href}"`) &&
      (anchor === null || decode(body.replace(/<[^>]+>/g, "")).trim() === anchor),
  );

const rows = [];
const check = (name, ok, detail = "") => rows.push({ name, ok, detail });

const game = await fetchPage("/game");
check("/game title", titleOf(game.html) === GAME_TITLE, titleOf(game.html));
check("/game description (151 chars)", metaOf(game.html, "description") === GAME_DESCRIPTION, `${metaOf(game.html, "description").length} chars`);
const [level, text] = firstHeading(game.html);
check("/game first heading is the h1 with 'chess memory game'", level === "h1" && /chess memory game/i.test(text), `${level} "${text}"`);

for (const path of ["/game", "/leaderboard", "/contact-us"]) {
  const { html } = await fetchPage(path);
  check(`${path} og:image`, metaOf(html, "og:image") === SOCIAL_IMAGE, metaOf(html, "og:image"));
  check(`${path} twitter:card`, metaOf(html, "twitter:card") === "summary_large_image", metaOf(html, "twitter:card"));
}

check("/de og:url", metaOf((await fetchPage("/de")).html, "og:url") === `${SITE}/de`, metaOf((await fetchPage("/de")).html, "og:url"));
check("/ og:url", metaOf((await fetchPage("/")).html, "og:url") === SITE, metaOf((await fetchPage("/")).html, "og:url"));

await fetch(`${BASE}/learn`, { headers: { "user-agent": UA } });
const learnAgain = await fetch(`${BASE}/learn`, { headers: { "user-agent": UA } });
check(
  "/learn prerendered and cached",
  learnAgain.headers.get("x-nextjs-prerender") === "1" && learnAgain.headers.get("x-nextjs-cache") === "HIT",
  `x-nextjs-prerender=${learnAgain.headers.get("x-nextjs-prerender")} x-nextjs-cache=${learnAgain.headers.get("x-nextjs-cache")}`,
);

for (const [path, expected] of Object.entries(TRIMMED_TITLES)) {
  const title = titleOf((await fetchPage(path)).html);
  check(`${path} title`, title === expected && title.length <= MAX_TITLE, `"${title}" (${title.length})`);
}

const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const guides = [...sitemap.matchAll(/<loc>https:\/\/thememorychess\.com(\/learn\/[^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap lists guides", guides.length > 0, `${guides.length} guides`);
for (const path of guides) {
  const { html } = await fetchPage(path);
  const closing = html.indexOf('data-learn-cta="closing-primary"');
  const lastSection = Math.max(
    ...[...html.matchAll(/<section id="([^"]+)"/g)].filter((m) => m[1] !== "faq").map((m) => m.index),
  );
  check(`${path} closing play link after the last section`, closing > lastSection && lastSection > 0);
}

for (const [source, href, anchor] of ANCHORS) {
  const { html } = await fetchPage(source);
  check(`${source} -> ${href}${anchor ? ` "${anchor}"` : ""}`, hasAnchor(html, href, anchor));
}

for (const row of rows) console.log(`${row.ok ? "PASS" : "FAIL"}  ${row.name}${row.detail ? `  [${row.detail}]` : ""}`);
const failed = rows.filter((row) => !row.ok).length;
console.log(`${rows.length - failed}/${rows.length} passed`);
process.exitCode = failed === 0 ? 0 : 1;
