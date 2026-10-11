# Hero showcase and microscope: real positions, verified relations

Branch: `feat/brain-lab-landing` (PR 42).

## What the visitor sees

The hero card walks through a real, famous ending, then blanks and rebuilds it, on a loop of about 46 seconds. Section 02, "A round, under the microscope", teaches a memory technique on a second real position.

### Hero: Topalov against Shirov, Linares 1998

- Position: after 47.Kg1, Black to move, 10 pieces. Shirov is two pawns up with bishops on opposite colours.
- Study: four groups circled one at a time (White's corner, the long diagonal, Black's wall, the runner), each with the relations that tie it together drawn as arrows.
- The trap: the black king on e6 cannot step forward. Crosses on d5, e5 and f5, the c3 bishop's lines to e5 and f6. chess.js lists only Kd6, Kd7, Ke7 and Kf7.
- The game, ply by ply, one a second: 47...Bh3!!, then 48.gxh3 Kf5 49.Kf2 Ke4, then 50.Bxf6 d4 51.Be7 Kd3 52.Bc5 Kc4 53.Be7 Kb3. Captured pieces fade out. Under reduced motion each stretch shows its last board at once.
- Rebuild: blank, the groups fade back in order, then ticks on the checks (bishops on opposite colours, c3 still hits f6, four white and six black).
- Copy honesty: 48.gxh3 is not called forced. "Topalov took the bishop and resigned after 53...Kb3."
- Click any piece to see where it can move or capture. Click it again, or press Escape, to resume.

### Microscope: Kasparov against Topalov, Wijk aan Zee 1999

The final position after 44.Qa7, 11 pieces, in seven phases: Study, Anchors (the two kings), Chunk (three groups, arrows for attacks, defences, pawn chains and the blocked pawns), Encode (each group named and given a sentence), Blank, Rebuild (group by group, with one planted slip, the c3 pawn on c2), and Score (every relation re-derived on the rebuild, ticked or crossed, side counts, then the score). The calibration round reuses the phase numbers and names for its study, rebuild and scored phases.

Research is cited only for what it found: de Groot, Chase and Simon (1973), Gobet and Simon (1996). The sentence and verify steps are presented as technique.

## Shape of the code

| Piece | File | Notes |
|---|---|---|
| Relations | `src/lib/home/relations.ts` | `Relation { kind: attacks, defends, controls, chain or blocked; from; to }`, `Group { id, side, squares, relations }`, `RelationCheck`. |
| Hero data | `src/lib/home/showcase.ts` | FEN, groups, the trap, three game scenes as ply ranges, the rebuild check. |
| Game record | `src/lib/home/showcaseGame.ts` | The whole Linares game and the study ply. Read only by the generator and tests. |
| Generated | `src/lib/home/showcaseReplay.ts` | The reach table and one frame per ply (`san, from, to, captured, fen`), written by `npm run generate:showcase`. |
| Step list | `src/lib/home/showcaseTour.ts` | Pure: showcase in, steps out. Each step holds one board per beat, folded from the frames, so captures drop pieces. |
| Microscope data | `src/lib/home/specimen.ts` | FEN, anchors, groups, the slip, the recall, the checks, the phase table. |
| Overlays | `ShowcaseOverlay.tsx`, `MicroscopeOverlay.tsx`, `BoardArrow.tsx` | Draw relations from data. No hard-coded arrows. |
| Copy | `messages/en.json` under `home.lab` | The lab is English-only. |

## The lever

`src/lib/home/__tests__/relations.test.ts` replays both games in chess.js and holds every relation in the data against the board it is drawn on, every rebuild check against the recall board, the tour's piece tracking against every ply, the trap's king moves, the move numbers in the captions, and the piece counts the captions state. A wrong arrow or a wrong number fails CI instead of shipping.
