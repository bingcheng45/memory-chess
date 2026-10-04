# Game round

The core loop on `/game`. A player picks a difficulty, memorizes a random position for a timed interval, recreates it on an empty board, submits, and gets an accuracy score. The page is a four-phase state machine (`GamePhase` in `src/lib/types/game.ts`): configuration, memorization, solution, result.

## Sub-features

- `round-config` picks a preset (Easy 2 pieces/10s, Medium 6/10, Hard 12/8, Grandmaster 20/5) or custom piece count and time.
- `round-memorize` shows the position with a countdown; `Skip` ends it early.
- `round-place` recreates the position: pick color, pick piece type, tap squares; tapping an occupied square removes.
- `round-submit` submits, flashes for 1s, then scores.
- `round-result` shows accuracy, pieces correct, timings, `Try Again`, `New Game`, and `Submit to Leaderboard`.
- `round-article-tile` ends the result screen with one article set beside the round just played, with `Read the article` and `Try that drill`. Only a locale in `TRANSLATED_ARTICLE_LOCALES` shows it.
- `round-persist` updates the persisted skill rating and last-used configuration in localStorage.

## How to get to it (user POV)

- Open `/game` and choose `Start Training`.
- Open `/game?difficulty=hard` to preselect a preset.
- Open `/game?pieceCount=6&memorizeTime=10`, which auto-starts a round.
- Choose `Try Again` on a result screen.
- Choose `Try that drill` on the result screen's article tile, which starts a round with that article's piece count and viewing time.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh 4517` reports OK.
- The shipped drive script covers this whole recipe; run it as the fast path and read it as the reference:

```bash
node .claude/skills/verify-memory-chess/helpers/cdp.mjs \
  .claude/skills/verify-memory-chess/helpers/drive-game-round.mjs \
  --evidence .verify-evidence/game-round --base http://127.0.0.1:4517
```

- **Configure.** Choose `Easy`, then `Start Training`. Run `clickText("button", "Easy")` then `clickText("button", "Start Training")`. The memorization board appears with a `Skip` button.
- **Read the position.** Collect `[data-coordinate]` elements whose `aria-label` contains `" with "` (occupied squares read like "e4 with white king"). Screenshot as evidence of the position shown.
- **Skip the timer.** Run `clickText("button", "Skip")`. The placement UI appears with the palette (`aria-label="Select white pieces"`).
- **Place each piece.** For each remembered square: `click('[aria-label="Select white pieces"]')` (or black), `click('[aria-label="Select white king"]')` (the piece from the memorized label), `click('[role="button"][data-coordinate="e4"]')`. The square's `aria-label` gains `" with <piece>"`.
- **Submit.** Run `clickText("button", "Submit")`. A "GAME!" flash shows for 1s, then the result panel with `#game-result-heading` appears.
- **Prove the score.** The page shows `100%` when every piece matched. Screenshot the result.
- **Article tile.** The tile is `section[data-article-tile]`, and the attribute holds the slug of the article it shows. It comes after the board review (`[data-result-board]`) and outside the result card. Assert its `dt` and `dd` pairs: `Your round` with the round just played and `This article's drill` with the article's drill, both in the form `6 pieces, 10 seconds`. `Read the article` is an `a` whose `href` is `/articles/<slug>`, or `/de/articles/<slug>` on `/de/game`. Read the strings of another locale from `articles.tile` in `messages/<locale>.json`.
- **Try that drill.** Run `clickText("section[data-article-tile] button", "Try that drill")`. The memorization board appears with as many pieces as the drill has, and `location.pathname + location.search` is `/game`. The second read is `state.lastSettings` in `localStorage["memory-chess-storage"]`.
- **Read the article.** Run `clickText("section[data-article-tile] a", "Read the article")`. The article opens with `[data-article-body]` at `data-article-typing="idle"`, so the whole text is there at once.
- **Which article.** The tile prefers an article this tab has not opened. To fix the choice, `goto` two of the three articles first, then play: the tile shows the third on every result screen. With all three opened it still shows one.
- **No tile.** On `/fr/game`, or any locale outside `TRANSLATED_ARTICLE_LOCALES`, the result screen has no `section[data-article-tile]` and no link to `/articles/`.
- **Second read.** `eval` `JSON.parse(localStorage.getItem("memory-chess-storage")).state.gameState` and assert `skillRating` is a number and `pieceCount`/`memorizeTime` match the preset the round was played with.

## Gotchas

- During memorization and placement the page pins itself: `<html>` and `<body>` get a `game-fixed` class (`src/app/[locale]/game/page.tsx`), making the body `position: fixed; overflow: hidden` with `touch-action` restrictions (`src/app/globals.css`). Nothing scrolls in these phases; anything you need must fit the viewport, so give Chrome a real window size (cdp.mjs uses 1280x900).
- Memorization auto-advances after `memorizeTime` seconds; read the position before the timer ends or use `Skip` deterministically.
- Submit has a 1s flash before the result exists; wait for `#game-result-heading`, never a fixed sleep.
- Sounds play on every phase change (`src/hooks/useSoundEffects.ts`); cdp.mjs launches Chrome with `--mute-audio`, so no action needed unless you bring your own browser.
- A feedback dialog opens 800ms after the first result screen of a day and covers the page, the tile included. Close it with Escape, or set `localStorage["memory-chess-feedback-next-eligible-at"]` to a future time before the page loads.
- The tile is not in the served HTML. Its articles ride in the page's script payload and it renders only on the result screen, so `ssr-words.sh` and the audit do not see it. `/game` serves the same word count with and without it.
- The tile's article is random among the unopened ones, so a script that needs one article must open the others first. A fresh `cdp.mjs` run starts with nothing opened.
- The result screen POSTs to `/api/game-stats`; without Supabase credentials that fails silently in the console and the round still scores. Do not treat that console error as a defect.
- `?pieceCount=&memorizeTime=` auto-starts on load, skipping the configuration screen entirely; use it when a recipe needs to reach later phases fast, but the click-through path above is the one users take.
- The store's `history` array in localStorage stays empty in real use: only `stopGame()` appends to it and no component calls that action. Do not assert on `state.history`; the persisted facts a round mutates are `state.gameState.skillRating`, `pieceCount`, and `memorizeTime`.
