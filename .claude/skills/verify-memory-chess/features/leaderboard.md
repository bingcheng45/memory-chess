# Leaderboard

`/leaderboard` shows the top 200 players per difficulty, ranked by accuracy, memorization time, and solution speed. Data comes from Supabase through `/api/leaderboard?difficulty=<tab>`; without credentials the service degrades to an explicit "temporarily unavailable" state rather than an error page.

## Sub-features

- `board-tabs` switches between Easy, Medium, Hard, and Grandmaster rankings (default tab: Medium).
- `board-rows` renders player, accuracy, times, and piece counts per entry.
- `board-degraded` shows "Leaderboard Temporarily Unavailable" when the API has no backing store.
- `board-claim` links `Claim Your Rank` back into the game.
- `board-highlight` highlights a just-submitted entry via URL params (`?player=...&difficulty=...`).
- `board-country` shows each player's flag before their name, with the country name as both the accessible name and the tooltip. `ZZ` and a row with no `country_code` both show a globe. The picker that sets it lives in the result screen's submission dialog.

## How to get to it (user POV)

- Open `/leaderboard` from the home page footer or nav.
- Choose `View leaderboard` on a game result screen.
- Land on `/leaderboard?player=<name>&difficulty=<tab>&...` right after `Submit to leaderboard`.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh 4517` reports OK.
- Know which mode you are in: `ls .env.local` in the repo root. No file means degraded mode.

- **Open.** `goto(baseUrl + "/leaderboard")`, then `waitFor` the loading text "Loading leaderboard data..." to disappear: `!document.body.innerText.includes("Loading leaderboard")`.
- **Degraded mode (no `.env.local`).** Assert `document.body.innerText.includes("Leaderboard Temporarily Unavailable")`. That is the passing state; screenshot it.
- **Configured mode.** Assert the table has rows and the columns render; switch tabs with `clickText('[role="tab"]', "Hard")` and assert the request refetches (row content changes or the loading state cycles).
- **Second read.** `curl -fsS http://127.0.0.1:4517/api/leaderboard?difficulty=medium` and compare with what the page showed: `{"data":[],"error":...}` in degraded mode, populated `data` otherwise. Save the body into the evidence dir.
- **Crawler floor.** `helpers/ssr-words.sh http://127.0.0.1:4517/leaderboard 150 | tee .verify-evidence/<run>/leaderboard.ssr.txt`. This page is one of the two the AdSense rejection named; SKILL.md's Evidence section carries the measured baselines and says when this floor is expected to fail.

## Driving it against fixture rows

`helpers/fake-supabase.mjs <rows.json> <port>` answers the PostgREST calls this app makes, so a local build can serve a known board without touching production. Point the build at it, because `NEXT_PUBLIC_*` is inlined at build time and `/leaderboard` is prerendered with `revalidate = 300`:

```bash
node .claude/skills/verify-memory-chess/helpers/fake-supabase.mjs rows.json 54322 &
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54322 NEXT_PUBLIC_SUPABASE_ANON_KEY=fixture-anon-key
rm -rf .next && npm run build
.claude/skills/verify-memory-chess/helpers/serve.sh start 4517
```

`rm -rf .next` matters. A build reuses the prerendered leaderboard from `.next/cache`, so changing the fixture without clearing it serves the previous board and every word count stays frozen at the old value.

Give the fixture enough rows to look like the real board. The AdSense audit's 300-word floor for `/leaderboard` is met by the table itself, so a seven-row fixture fails `substance` at 263 words while two dozen medium rows pass at 660. That failure is the fixture's, not the page's.

The fixture keeps every row it is sent until it stops, with the live table's defaults and checks: `skill_rating` defaults to 1000, a `daily` row needs a `daily_day` and no other row may carry one. A submission can be read back from `/api/leaderboard` and from `/leaderboard?player=<name>&difficulty=<board>`, the link the result screen gives, which refreshes the open board. A fixture row without `skill_rating` stands for a row stored before the column, and the table shows it as 1000.

```bash
SUBMIT_DIFFICULTY=Medium SUBMIT_NAMES="Rater one,Rater two" node .claude/skills/verify-memory-chess/helpers/cdp.mjs \
  .claude/skills/verify-memory-chess/helpers/drive-leaderboard-submit.mjs \
  --evidence .verify-evidence/leaderboard-submit --base http://127.0.0.1:4517
```

`drive-leaderboard-submit.mjs` plays one round per name, submits each, and returns per round the rating the result screen showed, the rating in `localStorage`, the `skill_rating` the POST carried and the response status. The three must agree.

The country drives prove a submission from its request body:

```bash
node .claude/skills/verify-memory-chess/helpers/cdp.mjs \
  .claude/skills/verify-memory-chess/helpers/drive-country-submit.mjs \
  --evidence .verify-evidence/country-submit --base http://127.0.0.1:4517
node .claude/skills/verify-memory-chess/helpers/cdp.mjs \
  .claude/skills/verify-memory-chess/helpers/drive-country-leaderboard.mjs \
  --evidence .verify-evidence/country-leaderboard --base http://127.0.0.1:4517
```

`drive-country-submit.mjs` plays a round, dismisses the first-game feedback prompt, opens the picker at four viewports asserting it stays inside each, picks Singapore with the keyboard and asserts the captured POST body. `drive-country-leaderboard.mjs` asserts the rendered flags and that the narrow table still scrolls to its date column.

## Driving it against a database without the rating column

Start the fixture with `FAKE_SUPABASE_MISSING_RATING=1` and it serves the table as it stood before migration 0004. Rows lose `skill_rating` and `daily_day`, an insert naming either gets a PostgREST `PGRST204` body, and a `daily` row breaks the old difficulty check.

```bash
FAKE_SUPABASE_MISSING_RATING=1 node .claude/skills/verify-memory-chess/helpers/fake-supabase.mjs rows.json 54322 &
node .claude/skills/verify-memory-chess/helpers/cdp.mjs \
  .claude/skills/verify-memory-chess/helpers/drive-leaderboard-submit.mjs \
  --evidence .verify-evidence/leaderboard-retry --base http://127.0.0.1:4517
```

Expect status 200 and a stored row: the service drops the rating and keeps the score. The server log carries one `the rating and daily migration (0004) is outstanding` line per retry, which is how you tell the retry apart from a plain success. With the fixture stopped altogether the submission returns 503 and the player-facing `The leaderboard is being updated.` sentence.

## Gotchas

- The fetch has a 10s timeout and the UI distinguishes timeout, parse, and service errors; a slow first request after boot can show the retry state once. Reload before concluding it is broken.
- The default tab is Medium, not Easy.
- The first-game feedback prompt opens 800ms after the result screen and stacks over the submission dialog, so a driver that lingers there finds its clicks landing on `#game-feedback`. Dismiss it with Escape before driving the dialog beneath.
- The submission dialog animates in with a transform, so a rect read the instant it mounts names a point the element has already left. Hit-test the centre before dispatching a synthetic click.
- Do not seed or clean production Supabase data from a verification run; the scripts in the repo root (`populate-leaderboard.js`, `clean-leaderboard.js`) target the live table.
