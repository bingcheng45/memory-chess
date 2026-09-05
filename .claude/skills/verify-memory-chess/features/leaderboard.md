# Leaderboard

`/leaderboard` shows the top 200 players per difficulty, ranked by accuracy, memorization time, and solution speed. Data comes from Supabase through `/api/leaderboard?difficulty=<tab>`; without credentials the service degrades to an explicit "temporarily unavailable" state rather than an error page.

## Sub-features

- `board-tabs` switches between Easy, Medium, Hard, and Grandmaster rankings (default tab: Medium).
- `board-rows` renders player, accuracy, times, and piece counts per entry.
- `board-degraded` shows "Leaderboard Temporarily Unavailable" when the API has no backing store.
- `board-claim` links `Claim Your Rank` back into the game.
- `board-highlight` highlights a just-submitted entry via URL params (`?player=...&difficulty=...`).

## How to get to it (user POV)

- Open `/leaderboard` from the home page footer or nav.
- Choose `View Leaderboard` on a game result screen.
- Land on `/leaderboard?player=<name>&difficulty=<tab>&...` right after `Submit to Leaderboard`.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh 4517` reports OK.
- Know which mode you are in: `ls .env.local` in the repo root. No file means degraded mode.

- **Open.** `goto(baseUrl + "/leaderboard")`, then `waitFor` the loading text "Loading leaderboard data..." to disappear: `!document.body.innerText.includes("Loading leaderboard")`.
- **Degraded mode (no `.env.local`).** Assert `document.body.innerText.includes("Leaderboard Temporarily Unavailable")`. That is the passing state; screenshot it.
- **Configured mode.** Assert the table has rows and the columns render; switch tabs with `clickText('[role="tab"]', "Hard")` and assert the request refetches (row content changes or the loading state cycles).
- **Second read.** `curl -fsS http://127.0.0.1:4517/api/leaderboard?difficulty=medium` and compare with what the page showed: `{"data":[],"error":...}` in degraded mode, populated `data` otherwise. Save the body into the evidence dir.
- **Crawler floor.** `helpers/ssr-words.sh http://127.0.0.1:4517/leaderboard 150 | tee .verify-evidence/<run>/leaderboard.ssr.txt`. This page is one of the two the AdSense rejection named; SKILL.md's Evidence section carries the measured baselines and says when this floor is expected to fail.

## Gotchas

- The fetch has a 10s timeout and the UI distinguishes timeout, parse, and service errors; a slow first request after boot can show the retry state once. Reload before concluding it is broken.
- The default tab is Medium, not Easy.
- Do not seed or clean production Supabase data from a verification run; the scripts in the repo root (`populate-leaderboard.js`, `clean-leaderboard.js`) target the live table.
