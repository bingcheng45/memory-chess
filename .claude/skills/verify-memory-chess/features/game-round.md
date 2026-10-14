# Game round

The core loop on `/game`. A player picks a difficulty, memorizes a random position for a timed interval, recreates it on an empty board, submits, and gets an accuracy score. The round runs on the reducer the homepage calibration uses (`roundReducer` in `src/lib/round/round.ts`), hosted by the game store as `round`: idle (the configuration form), study, rebuild, scored (the result screen).

## Sub-features

- `round-config` picks a preset (Easy 2 pieces/10s, Medium 6/10, Hard 12/8, Grandmaster 20/5) or custom piece count and time.
- `round-memorize` shows the position with a millisecond countdown and a meter; `Done` ends it early.
- `round-place` recreates the position: pick one of the 12 palette pieces, tap squares; tapping a square with that piece, or with none selected, removes it. The eraser (`Clear board`) empties the board, and `Restart` starts a new position at the same setting. Pieces also drag (Pointer Events, mouse and touch): a palette piece onto a square places it, a placed piece onto another square moves it and replaces what stood there, and off the board removes it. A piece with every copy on the board is refused with a message over the palette, also spoken by the live region.
- `round-submit` scores at once.
- `round-result` shows accuracy, pieces correct, timings, `Try again`, `New game`, and `Submit to leaderboard`.
- `round-article-tile` ends the result screen with one article set beside the round just played, with `Read the article` and `Try that drill`. Every locale that serves the articles shows it in its own language, which today is all 24.
- `round-persist` updates the persisted skill rating and last-used configuration in localStorage.

## How to get to it (user POV)

- Open `/game` and choose `Start round`.
- Open `/game?difficulty=hard` to preselect a preset.
- Open `/game?pieceCount=6&memorizeTime=10`, which auto-starts a round.
- Choose `Try again` on a result screen.
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

- **Configure.** Choose `Easy`, then `Start round`. Run `clickText("button", "Easy")` then `clickText("button", "Start round")`. The board grid carries `data-round-phase="study"` and the controls show `Done`.
- **Read the position.** Every square is a `button[data-coordinate]` whose `aria-label` reads "e4, white king" or "e4, empty" (`game.round.squareWith` and `squareEmpty`). Collect the occupied ones. Screenshot as evidence of the position shown.
- **End study.** Run `clickText("button", "Done")`. The grid turns `data-round-phase="rebuild"` and the palette (`.lab-palette`, one button per piece, named for the piece and what is left of it, like "white king, 1 left"; a piece with none left is greyed with `data-used-up` and stays pressable, so it is not `aria-disabled`) becomes active.
- **Place each piece.** For each remembered square: `click('.lab-palette [aria-label^="white king, "]')` unless that button already has `aria-pressed="true"` (pressing it again deselects), then `click('[data-coordinate="e4"]')`. The square's `aria-label` becomes "e4, white king".
- **Submit.** Run `clickText("button", "Submit")`. The result panel with `#game-result-heading` appears.
- **Prove the score.** The page shows `100%` when every piece matched. Screenshot the result.
- **Article tile.** The tile is `section[data-article-tile]`, and the attribute holds the slug of the article it shows. It comes after the board review (`[data-result-board]`) and outside the result card. Assert its `dt` and `dd` pairs: `Your round` with the round just played and `This article's drill` with the article's drill, both in the form `6 pieces, 10 seconds`. `Read the article` is an `a` whose `href` is `/articles/<slug>`, or `/de/articles/<slug>` on `/de/game`. Read the strings of another locale from `articles.tile` in `messages/<locale>.json`.
- **Try that drill.** Run `clickText("section[data-article-tile] button", "Try that drill")`. The memorization board appears with as many pieces as the drill has, and `location.pathname + location.search` is `/game`. The second read is `state.lastSettings` in `localStorage["memory-chess-storage"]`.
- **Read the article.** Run `clickText("section[data-article-tile] a", "Read the article")`. The article opens with `[data-article-body]` at `data-article-typing="idle"`, so the whole text is there at once.
- **Which article.** The tile prefers an article this tab has not opened. To fix the choice, `goto` two of the three articles first, then play: the tile shows the third on every result screen. With all three opened it still shows one.
- **Tile language.** On `/<locale>/game` the tile's labels are that locale's `articles.tile` strings, the title is the translated one, and no English tile string shows. A text that reads `articles.tile.eyebrow` means the route did not get the tile's strings: the root layout sends no `articles` namespace, and the game layout adds the `tile` group through `ArticlesMessagesProvider`.
- **No tile.** A locale taken out of `TRANSLATED_ARTICLE_LOCALES` gets no `section[data-article-tile]` and no link to `/articles/` on its result screen. No locale is in that state today, so Jest covers it with a mocked list.
- **Second read.** `eval` `JSON.parse(localStorage.getItem("memory-chess-storage")).state.gameState` and assert `skillRating` is a number and `pieceCount`/`memorizeTime` match the preset the round was played with.

## Gotchas

- During memorization and placement the page pins itself: `<html>` and `<body>` get a `game-fixed` class (`src/app/[locale]/game/page.tsx`), making the body `position: fixed; overflow: hidden` with `touch-action` restrictions (`src/app/globals.css`). Nothing scrolls in these phases; anything you need must fit the viewport, so give Chrome a real window size (cdp.mjs uses 1280x900).
- Study auto-advances after `memorizeTime` seconds; read the position before the timer ends or use `Done` deterministically.
- Wait for `#game-result-heading` after Submit, never a fixed sleep.
- Sounds play on every phase change (`src/hooks/useRoundSounds.ts`); cdp.mjs launches Chrome with `--mute-audio`, so no action needed unless you bring your own browser.
- A feedback dialog opens 800ms after the first result screen of a day and covers the page, the tile included. Close it with Escape, or set `localStorage["memory-chess-feedback-next-eligible-at"]` to a future time before the page loads.
- The tile is not in the served HTML. Its articles ride in the page's script payload, the 12 newest at most (`MAX_TILE_ARTICLES`), and it renders only on the result screen, so `ssr-words.sh` and the audit do not see it. `/game` serves the same word count with and without it.
- The tile's article is random among the unopened ones, so a script that needs one article must open the others first. A fresh `cdp.mjs` run starts with nothing opened.
- The result screen POSTs to `/api/game-stats`; without Supabase credentials that fails silently in the console and the round still scores. Do not treat that console error as a defect.
- The board's side comes from container units, with a viewport-based size under `@supports not (width: 1cqw)` (`src/components/game/game-lab.css`). Chrome has container units, so drive `helpers/drive-no-container-units.mjs` to check the fallback: it strips them as an older browser would and fails unless the board keeps the size it had at 390x844, 1440x900 and 844x390.
- `?pieceCount=&memorizeTime=` auto-starts on load, skipping the configuration screen entirely; use it when a recipe needs to reach later phases fast, but the click-through path above is the one users take.
- A rated round (any but a review) prepends a row to `state.history`, which holds the newest 30. Each row's `facts` are what the rating read (pieces, study seconds used, rebuild seconds, accuracy) and `skillRatingChange` is what it moved. The rating's uncertainty is `state.certainty` (`rd`, `rounds`); together with `skillRating` it is the player the engine reads. Check a rating against the engine rather than a direction: a new player is provisional and moves up to 400 a round, and a perfect Easy round gains nothing 500 or more above the board, so import `ratingAfter` from `src/lib/game/rating.ts` in the drive script (Node strips its types) and recompute from the stored facts and certainty.
