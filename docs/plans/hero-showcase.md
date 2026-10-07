# Hero showcase: a guided walk through a real position

Branch: `feat/brain-lab-landing` (PR 42). Status: approved after review of a throwaway mock.

## What changes for the visitor

The hero card stops showing a made-up, motionless eight-piece position. It shows a real, famous one and walks through it from White's side, then blanks and rebuilds, on a loop of about 38 seconds.

- Position: Deep Fritz (White) against Vladimir Kramnik, Game 2 of the Bonn match, 27 November 2006, after 34.Nxf8, Black to move. 14 pieces.
- Study: six groups circled one at a time. Each circle stays while the next is drawn.
- White threats: the knight on f8, the queen on e4, then Qh7 as mate. Arrows show what each piece attacks. A one-line thought follows each step.
- Finish: 34...Qe3 (Black misses the mate), 35.Qh7#.
- Rebuild: the board goes blank, then each group fades back in.
- Click any piece to see where it can move or capture, either colour. Click it again, or press Escape, to resume.
- The stats row under the card replaces "0-100% accuracy reading" with the live "games played" count. While the count is unavailable it keeps the accuracy reading, so the row never has a hole.

## Approved layout (the "shorter, larger names" card)

Top row: live dot and `Man vs machine · Game 2` on the left, `Bonn · 27 November 2006` on the right. Second row: the matchup as a left-aligned 20px title, white swatch `Deep Fritz`, `vs`, black swatch `Vladimir Kramnik`. Then the board, then phase tag with step counter, the caption, the thought bubble, and one row holding Back, Pause or Play, Next and the step bar. No readout row or footer inside the card. Everything is left-aligned. Card height must not change from step to step.

Reference mock (throwaway, scratch dir, not in the repo):
`/private/tmp/claude-501/-Users-bingcheng-ai-projects-memory-chess/95c00692-73a4-49f8-9f20-7aeb671552f8/scratchpad/proto/` holds `template.html` (the timeline code, all CSS and the exact caption text), `story2.mjs` (the chess.js check that produced the data) and `data.json`.

## Shape of the code

One typed data module describes the tour. A pure function turns it into a list of steps. One component draws a step. A small clock advances the step.

| Piece | File | Notes |
|---|---|---|
| Showcase data | `src/lib/home/showcase.ts` | FEN, game facts, six groups, three threat steps, the finish, reach table. Types make an unknown square or a group with no pieces a type error where practical. |
| Step list | `src/lib/home/showcaseTour.ts` | Pure: showcase in, `ShowcaseStep[]` out. Discriminated by phase (`study`, `threat`, `finish`, `rebuild`). Durations live here. |
| Renderer | `src/components/home/ShowcaseBoard.tsx` | Client component. One element per piece, moved with `transform`. Overlay is one SVG in board units like `MicroscopeOverlay`. |
| Clock | `src/components/home/useShowcaseClock.ts` | Autoplay, pause off screen (IntersectionObserver), no autoplay under reduced motion, explore pauses it. |
| Hero | `src/components/home/LabHero.tsx` | Swaps `StaticBoard` for `ShowcaseBoard`. Deletes `SpecimenCountdown` and the old readout. |
| Styles | `src/components/home/lab.css` or `lab-instruments.css` | Existing `--lab-*` tokens only. No new colours. |
| Copy | `messages/en.json` under `home.lab` | The lab is English-only (`LAB_LOCALES = ["en"]`), so no other catalogue is touched. |

Leave `SPECIMEN`, `SPECIMEN_RECALL`, `MICROSCOPE_PHASES` and the Microscope section alone. They explain one round with a hand-made position and their copy counts those eight pieces.

The reach table (what each piece attacks, its legal moves, which of them check or mate) is generated from chess.js by a script and committed, so chess.js stays out of the client bundle. A test regenerates it and fails if the committed copy is stale.

## Checks that must pass

1. A test replays the game record in chess.js and asserts every claim a caption makes: the final position equals the FEN, Black is to move, all 14 pieces sit in exactly one group, Nf8 and Qe4 both attack h7, Qh7 is mate, 22 of Black's 26 legal moves allow Qh7#, Kg8, Qg1+, g6 and g5 do not, 34...Qe3 35.Qh7# is checkmate, g8 is covered and Nf8 protects the queen. `story2.mjs` already makes these assertions.
2. A test on the step list: phases in order, six study steps with circles accumulating, durations sum to the figure shown in the plan, rebuild last.
3. A render test: the hero shows the matchup, the date, and the stats row with the live count, falls back to the accuracy reading when the count is missing.
4. `npm run validate`, lint and the type check pass.
5. In a real browser at about 1280px and 390px: card height identical on every step, no console errors, no horizontal scroll, circles and arrows land on the right squares, click-to-inspect works and resumes, reduced motion shows the full position with manual controls and no autoplay.

## Out of scope

Translating the captions, the Microscope section, the calibration board, any change to the game itself.
