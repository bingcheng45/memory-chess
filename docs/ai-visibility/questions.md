# Fixed question set

These 43 searches are the fixed set for the monthly AI-visibility check. Run them exactly as written, on the engine named in each row. [README.md](README.md) explains how to run them and how to score a row.

Each row is one question on one engine. The set holds 29 distinct question strings, and 13 of them run on two or three engines, so the set has 43 rows. The research file says "36 distinct questions", but counting the exact wording gives 29. The plan's "4 of 43" counts rows, not questions. Keep the row numbers stable so months can be compared row by row.

## Engines

- **Google** means google.com with `hl=en`. The answer surface is the AI Overview at the top of the results.
- **Bing** means bing.com. The answer surface is the Copilot answer box at the top of the results. Do not open Bing "AI Mode".
- **WebSearch** means Claude's own WebSearch tool, used as a stand-in for a chatbot that searches the web. The answer surface is the summary the tool returns.

## Baseline, 20 October 2026

Source: the research file `aivis/2-landscape.md`, section A, run on 2026-10-20 (read-only, nothing signed in to). The cells below restate that file and add nothing to it.

Column meanings:

- **AI names MC.** "yes" when the AI answer names Memory Chess or cites thememorychess.com. "no" when an AI answer showed and did not. "no box" when no AI answer showed.
- **MC organic.** Organic rank of a thememorychess.com page, or "-" when absent from the results read.
- **Named in the AI answer.** The rivals and sources the AI answer named or cited. For "no box" rows the top organic results are listed instead, marked "org".

| # | Question | Engine | AI names MC | MC organic | Named in the AI answer |
|---|---|---|---|---|---|
| 1 | best app to train chess memory | Google | no | - | Chessable (via chessiverse), "Chess Memory (by GetNextApp)" Play Store app, Lotus Chess, Chess Prep Pro |
| 2 | best app to train chess memory and visualization | Bing | no | #1, but the old host memory-chess.vercel.app | chessendings.com/best-chess-training-tools, chessvisualization.com; names ChessAtlas, Chessbook, ChessVis, DarkSquares |
| 3 | best app to train chess visualization | Google | no | - | Blindfold Chess Trainer (Dawikk), Chessvis (chessvis.com), "Chess Visualization Game" (Android), Chess Mind AI |
| 4 | best app to train chess visualization | WebSearch | no | n/a | Chessvis (iOS), Chess Notation Trainer Pro, Blindfold Chess: Train & Play, DarkSquares, skich.app blind chess trainer, Chessable courses |
| 5 | best chess visualization trainer | Google | **yes** | - | Memory Chess (cover-and-move drills, cited to thememorychess.com), DarkSquares (via ChessAtlas), Visualwize/ChessFox, chess-trainer.com, Chessis Coordinate Trainer |
| 6 | best chess visualization trainer | Bing | no box | - | org: chessatlas.net, chessendings.com, chess-trainer.com, darksquares.net, chessvisual.com, worldmetrics.org |
| 7 | best chess visualization trainers websites free | WebSearch | no | n/a | Lichess-hosted ChessFactor videos, Blindfold Chess: Train & Play, Chessvis, Blindfold Chess (Romir Patney) |
| 8 | how to improve chess visualization | Google | no | - | Lichess coordinate trainer, Chessfactor, Chess.com guide, Reddit, Don't Move Until You See It |
| 9 | how to improve chess visualization | Bing | no | - | Chess.com (blog/Alimpic, blog/damafe), chesschampion.com, chesstournamentguide.com, nextlevelchess.com |
| 10 | how to improve chess visualization | WebSearch | no | n/a | ChessFactor / IM Alex Astaneh video series on Lichess, chessentials.com |
| 11 | chess visualization exercises for beginners | Google | no box | #2 (/learn/chess-visualization-exercises) | org: Reddit, Memory Chess, nextlevelchess.com, chessworld.net, listudy.org, dontmoveuntilyousee.it |
| 12 | chess visualization exercises for beginners | Bing | no box | #5 (/learn/chess-visualization-exercises) | org: chess.com blog, darksquares.net, masterinchess.com, chessworld.net, Memory Chess |
| 13 | memory chess game online | Google | no box | #1 (/), #5 (/game) | org: Memory Chess, toytheater.com (dice-and-colour game), brainplay.com, culinaryschools.org |
| 14 | memory chess game online | Bing | no box | #4 (/game), #8 (/) | org: brainplay, toytheater, friv, Memory Chess |
| 15 | memory chess game online recreate position from memory | WebSearch | no (see note 1) | n/a | Product Hunt "Memory Chess" (hunted.space), chessO iOS app, a Chess.com blog tip, de Groot background |
| 16 | chess memory game | Bing | no box | #1 (/game), #3 (/) | org: shopping ads for wooden toys, then Memory Chess, brainplay, friv, toytheater |
| 17 | chess memory test | Google | no box | #1 (/) | org: Memory Chess, chessworld.net, chessigma.com, thistools.app (a listing of Memory Chess) |
| 18 | chess memory test | Bing | no box | #1 (/), #2 (/game) | org: Memory Chess, chess.com forum, brainplay, chessworld.net |
| 19 | chess memory test online | WebSearch | no | n/a | blindfoldchess.net de Groot test, ChessBase digit test, itch.io "Memory Chess" (dice/colour game) |
| 20 | chess board memorization exercise | Google | **yes** | #1 (/), also /learn | "MemoryChess" cited first ("Memory Chess Trainer" in the flash-drill step), ChessWorld.net, ChessDojo YouTube |
| 21 | chess board memorization exercise | Bing | no | #1 (/), also /game | blindfold-chess.online, PurposeGames chess board quiz, Lichess coordinate training, chess2brain.com, chessboardmagic.com |
| 22 | chess memory training exercises | Bing | **yes** | - | "Memory Chess v2.0.0" (cites /learn/working-memory-exercises-for-chess and /), darksquares.net, chessworld.net |
| 23 | chess memory training exercises | Google | no | #1 (/), also /learn | ChessWorld.net |
| 24 | how do grandmasters remember chess positions | Google | no | - | YouTube (Versatile), TikTok/Chess.com, Reddit ELI5, Quora, ChessMood |
| 25 | how do grandmasters remember chess positions | Bing | no box | - | org: historysgambit.com, chess.com blogs, darksquares.net |
| 26 | how to remember a chess position | Google | no | - | "Shingan Chess" (blindfold-chess.online), ChessWorld.net, Remote Chess Academy |
| 27 | how to remember a chess position | Bing | **yes** | - | "Memory Chess and Position Memory Training" (cites thememorychess.com), blindfold-chess.online, darksquares.net, chess.com |
| 28 | blindfold chess training for beginners | Google | no | #2 (/learn/blindfold-chess-training-for-beginners) | darksquares.net ("first full blindfold game in 2 to 4 months") |
| 29 | blindfold chess training for beginners | Bing | no | #1 (/learn/blindfold-chess-training-for-beginners) | localchess.online, chess.com, darksquares.net, chessworld.net |
| 30 | how long does it take to learn blindfold chess | Bing | no | #8 (/learn/blindfold-chess-training-for-beginners) | darksquares.net ("2 to 4 months of daily 15-minute practice"), lichess forum |
| 31 | lichess vs chess.com for visualization training | Google | no box | - | org: general Lichess vs Chess.com Reddit, forum, and Medium pages |
| 32 | lichess vs chess.com for visualization training | Bing | no box | - | org: discusschess.com, chess.com forums, firechess.com, a Lichess study |
| 33 | lichess coordinate trainer alternatives | Bing | no box | - | org: auditchess.com, lichess.org/training/coordinate, chessnotate.com, worldmetrics |
| 34 | chessable visualization course free alternative | Bing | no box | - | org: chessatlas.net, Reddit, trychessmate.com, auditchess.com, alternativeto.net |
| 35 | darksquares alternative | Bing | no | - | alternativeto.net/software/darksquares, saashub.com, darksquares.net, chessatlas.net (see note 4) |
| 36 | is chess good for memory | Google | no | - | Chess.com, Instagram, YouTube, Healthline |
| 37 | is chess good for memory | Bing | no | - | Chess.com, helpdementia.com, UChicago, aa-chess.com |
| 38 | adriaan de groot chess memory experiment | Google | no box | - | org: blindfoldchess.net, wired.com, chessbase.com, wikipedia |
| 39 | adriaan de groot chess experiment | Bing | no box | - | Wikipedia panel; org: wikipedia, blindfold-chess.online, chessprogramming |
| 40 | chess position recall training app | Bing | no box | - | org: ChessRecall, recallchess.app, repertree, chessmind.ai, chessworld memory trainer |
| 41 | how to calculate more moves ahead in chess | Bing | not recorded (see note 2) | - | Chess.com blogs, chessmind.ai, tactical-chess.com, chesslab.academy, thechessworld.com |
| 42 | chess memory game for kids online free | Bing | not recorded (see note 2) | - | chesskid.com, toytheater, brainplay (dice game), culinaryschools |
| 43 | chess brain training for seniors memory | Bing | n/a (see note 3) | n/a | The results page returned blank and was not retried |

Baseline score: **4 of 43** rows name Memory Chess in the AI answer (rows 5, 20, 22 and 27). Two on Google and two on Bing.

Notes:

1. Row 15 named "Memory Chess (Product Hunt launch)" with no domain, and said it found no web-based version. It does not count, because the answer did not point to thememorychess.com.
2. For rows 41 and 42 the research lists what showed but does not say whether a Copilot box was present. Memory Chess was absent from both.
3. Row 43 has no baseline. Run it from the first monthly check onward.
4. The research ran row 35 on both Bing and WebSearch and recorded one merged result. The listed sources read as a results page, so the check runs row 35 on Bing only. Memory Chess was absent from both runs, so the baseline "no" holds either way.

## Monthly results

Append one column block per month below, keyed by row number. Record "yes" or "no" for "AI names MC" and the MC organic rank. Put any change in the rivals named in the notes.

| # | 2026-10-20 AI | 2026-10-20 org |
|---|---|---|
| 1 | no | - |
| 2 | no | #1 old host |
| 3 | no | - |
| 4 | no | n/a |
| 5 | yes | - |
| 6 | no box | - |
| 7 | no | n/a |
| 8 | no | - |
| 9 | no | - |
| 10 | no | n/a |
| 11 | no box | #2 |
| 12 | no box | #5 |
| 13 | no box | #1 |
| 14 | no box | #4 |
| 15 | no | n/a |
| 16 | no box | #1 |
| 17 | no box | #1 |
| 18 | no box | #1 |
| 19 | no | n/a |
| 20 | yes | #1 |
| 21 | no | #1 |
| 22 | yes | - |
| 23 | no | #1 |
| 24 | no | - |
| 25 | no box | - |
| 26 | no | - |
| 27 | yes | - |
| 28 | no | #2 |
| 29 | no | #1 |
| 30 | no | #8 |
| 31 | no box | - |
| 32 | no box | - |
| 33 | no box | - |
| 34 | no box | - |
| 35 | no | - |
| 36 | no | - |
| 37 | no | - |
| 38 | no box | - |
| 39 | no box | - |
| 40 | no box | - |
| 41 | not recorded | - |
| 42 | not recorded | - |
| 43 | n/a | n/a |
