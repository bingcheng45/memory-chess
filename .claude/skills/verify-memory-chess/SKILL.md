---
name: verify-memory-chess
description: "Drive the real Memory Chess web app (Next.js 15, thememorychess.com) and capture proof that a feature works. Use whenever a change to this repo needs runtime verification: game rounds on /game, the leaderboard, Learn pages, language switching, the contact form, or the server-rendered HTML a non-JS crawler sees. Reach for it before declaring any user-facing change done; Jest here is DOM-level only and does not drive the real app."
---

# Verify Memory Chess

Memory Chess is a Next.js 15 App Router web app. The user's surface is the browser. This skill launches a production build locally, drives it over raw Chrome DevTools Protocol, and captures evidence. There is no Playwright, Cypress, or Puppeteer in this repo and you must not add dependencies to `package.json`; the helpers here need only Node 22+ (built-in `fetch` and `WebSocket`), `curl`, and a local Google Chrome (default `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, override with `CHROME_BIN`). On a clean machine that is the whole driver setup: nothing to install.

All commands below run from the repo root. `PORT` defaults to 4517 everywhere; never use 3000, which this project reserves for manual runs. The feature recipes live in [`features/README.md`](features/README.md); read that index before driving anything.

## Launch

```bash
npm run build
.claude/skills/verify-memory-chess/helpers/serve.sh start 4517
```

`npm run build` runs the message and Learn-prose validators first and fails the build if they fail. `serve.sh start` refuses a port that is already in use, starts `next start` detached in the background, records the server's pid and start time in `.verify/server-<port>.pid` with its log in `.verify/server-<port>.log`, and returns once `http://127.0.0.1:<port>/` answers. A start that never answers kills what it spawned and removes the pid file, so an existing pid file always names a server that answered on its port. Teardown is `serve.sh stop 4517`, which signals only the process group of the pid it recorded, and only after checking that pid is still the server it started.

Verification works without any env vars. `.env.local` is not committed; without it the Supabase-backed leaderboard and games-played counter degrade gracefully (see Evidence) and the contact form's Google Sheets write fails with a 500. Never copy secrets from a checkout's `.env.local` into any committed file.

## Doctor

```bash
.claude/skills/verify-memory-chess/helpers/doctor.sh 4517
```

Read-only. Confirms something listens on the port, that the listener is the server this checkout's `serve.sh` recorded in `.verify/server-<port>.pid` (the recorded pid must be alive and still be the same process instance, checked by start time, so a reused pid never passes), and that `/` answers 200 with "Memory Chess" in the body. A server this checkout's `serve.sh` did not start fails the check even when it was launched from the same directory; another agent may own it, so refuse to drive it. Run doctor first whenever anything looks off, and before reusing a server from an earlier step.

## Drive

Run the cheap layer first: `npx jest` covers the stores, utilities, and SEO structure in seconds (baseline: 29 suites, 151 tests, green). Drive the browser for what Jest cannot see, which is everything below.

```bash
node .claude/skills/verify-memory-chess/helpers/cdp.mjs <drive-script.mjs> \
  --evidence .verify-evidence/<run-name> [--base http://127.0.0.1:4517]
```

`cdp.mjs` launches its own headless, muted Chrome with a throwaway profile, connects over CDP, runs your drive script, prints `PASS`/`FAIL` plus the script's return value, and always kills the Chrome it launched. A drive script default-exports `async (page, { baseUrl, evidenceDir }) => result` with this `page` API: `goto(url)`, `eval(expr)`, `waitFor(expr, timeoutMs)`, `click(selector, text?)` (with `text`, prefers an exact trimmed match over a substring match; `clickText` is the same call), `screenshot(name)`, `sleep(ms)`.

A complete worked example, a full game round, ships as [`helpers/drive-game-round.mjs`](helpers/drive-game-round.mjs):

```bash
node .claude/skills/verify-memory-chess/helpers/cdp.mjs \
  .claude/skills/verify-memory-chess/helpers/drive-game-round.mjs \
  --evidence .verify-evidence/game-round --base http://127.0.0.1:4517
```

Stable handles in this app, in order of preference:

- `aria-label` attributes: board squares ("e4", or "e4 with white king" when occupied), piece palette ("Select white pieces", "Select white king"), the language switcher.
- `data-coordinate="e4"` on every board square; interactive squares also carry `role="button"`.
- Visible English button text ("Start Training", "Skip", "Submit", "Try Again"). English is the bare-URL locale, so drive English routes unless the feature under test is localization itself.
- There are no `data-testid` hooks in the app; do not invent selectors from Tailwind classes, they churn.

## Evidence

Evidence goes in `.verify-evidence/<run-name>/` at the repo root. It is gitignored along with `.verify/`; never delete it during cleanup. A proof captures the action and the resulting state, not just a final screen: screenshot each phase you pass through, and pair what the screen shows with a second, independent read of the same fact. For a game round that second read is the persisted store in `localStorage["memory-chess-storage"]` (`state.gameState`), whose skill rating and configuration the submit updates. Exercise the real user path through clicks; never call store actions or internal setters from `eval`.

### What a non-JS crawler sees

This app was rejected by Google AdSense because `/game` server-rendered 8 words and `/leaderboard` 17 while both looked fine in a browser. Any change touching pages, layouts, or client/server component boundaries must therefore also assert the server-rendered floor, not just the rendered browser state:

```bash
.claude/skills/verify-memory-chess/helpers/ssr-words.sh http://127.0.0.1:4517/game 150
```

`ssr-words.sh` curls the route exactly as a non-JS crawler would, strips `<script>`, `<style>`, and all tags, prints `words=<count>` plus the surviving text, and exits 1 if the count is under the floor. Save its output into the evidence directory (`... | tee .verify-evidence/<run>/game.ssr.txt`). Use it for a quick look at one route.

### The AdSense gate

The site was rejected twice for "Low value content". Any change that adds, removes, or reshapes a page, a sitemap entry, a layout, or translated copy must pass the whole-site audit before it is done:

```bash
npm run audit:adsense -- --base http://127.0.0.1:4517 --out .verify-evidence/<run>/adsense
```

It reads `/sitemap.xml`, fetches every listed URL as a non-JS reviewer would, and applies one rule per Google policy item: HTTP 200, listed pages are indexable and self-canonical, at least 300 main-content words (header, nav, and footer excluded; `WORD_FLOOR_EXCEPTIONS` names each short page and why), no text shipped at opacity 0, no loading or placeholder text, one `h1` with a title and description, links to privacy, about, terms, and contact, at most one ad unit, titles and descriptions unique within a language, no two pages of a language sharing more than half their 5-word shingles, no 8-word sentence on more than three pages of a language, hreflang pointing only at listed URLs, no broken internal links, and `ads.txt` naming the publisher. It prints a table per rule and every failing page, writes `audit.json` under `--out`, and exits 1 on any failure.

When a rule fails, fix the page. Change a rule only when the rule is wrong about what Google asks for, in its own commit that says why. Editorial prose (Learn, the changelog, about, privacy, terms) is English-only with one URL each; the route list in `src/lib/seo/englishOnly.ts` drives the redirects, the sitemap, and the footer links, so a new editorial route goes there rather than into the message catalogues.

A local build proves the leaderboard only against fixture rows. After a deploy, confirm production serves real rankings to a non-JS reader:

```bash
curl -s https://thememorychess.com/leaderboard | grep -o '<tr' | wc -l
```

Expect well over 40 rows across the four boards. A count near zero means the page was built or revalidated while Supabase failed, and a crawler is reading the unavailable state.

### Without Supabase credentials

`/api/leaderboard` returns `{ data: [], error }` and `/api/game-stats` errors; the UI shows the "Leaderboard Temporarily Unavailable" state and hides the games-played counter. That is the expected passing state for an unconfigured run, and the graceful-degradation path is itself worth asserting. With credentials present in `.env.local`, expect real rows and assert content instead.

## Cleanup

```bash
.claude/skills/verify-memory-chess/helpers/serve.sh stop 4517
rm -rf .verify
```

`cdp.mjs` already tears down its own Chrome and profile on both pass and fail. Kill only what you started: `serve.sh stop` signals only the recorded pid's process group, never by name, and when the recorded pid is dead or was reused by another process it reports the record as stale and clears it without signalling anything. `.verify-evidence/` survives cleanup; after cleanup, confirm your evidence files still exist there. Run cleanup after failed attempts too, so broken runs do not strand a port.

## Helpers

All in [`helpers/`](helpers/), invocations shown above. The four run directly; `drive-game-round.mjs` is a module `cdp.mjs` imports, so it carries no shebang and is not executable: `serve.sh` (launch and teardown), `doctor.sh` (health check), `cdp.mjs` (browser driver), `drive-game-round.mjs` (worked drive script), `ssr-words.sh` (non-JS crawler word floor).

## Maintenance

Keep [`features/`](features/) honest as the app changes; `/maintain-verification-skill` is the loop for that.
