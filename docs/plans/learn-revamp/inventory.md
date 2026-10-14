# Learn revamp: content inventory and topic groups

This file lists every Learn guide and article as they stand on `feat/brain-lab-landing`, proposes the topic groups the new hub uses, and names the gaps. The counts come from the guide and article source files, not from the rendered pages.

To regenerate the numbers, run the scripts in [`tools/`](tools/) from the repo root:

```bash
node docs/plans/learn-revamp/tools/extract-guides.cjs "$PWD" /tmp/guides.json
node docs/plans/learn-revamp/tools/article-words.cjs "$PWD" /tmp/articles.json
```

Word counts include the h1, description, quick answer, takeaways, audience lines, every block's text and the FAQ. They leave out the shared page chrome.

## What exists today

- 14 guides under `/learn/<slug>`, defined in `src/lib/seo/learn/guides/*.ts` and ordered in `guides/index.ts`. The brief said 15. The 15th and 16th URLs are retired guides that now redirect (`chess-board-vision-drills` and `working-memory-exercises-for-chess`, in `src/lib/seo/learn/retired.ts`).
- 3 articles under `/articles/<slug>`, defined in `src/lib/articles/entries/*.ts`. All three are about a person and translated into 23 locales. Learn is English-only.
- The hub groups guides by 4 goals (`reduce-blunders`, `visualization`, `memory`, `routine`) in `src/lib/seo/learn/schema.ts`.
- Learn is the last main section still drawn in the old dark editorial shell (`EditorialPageShell`). Home, Play, Articles, Leaderboard, Dashboard, About and Changelog use Lab Paper. `/learn` is not in `LAB_PAPER_ROUTES` (`src/lib/lab-paper/routes.ts`). Matching "our existing designs" therefore means moving Learn onto Lab Paper. See the reference screenshots `learn-1440.png` against `articles-1440.png`.

### Guides

Read time "today" is the hand-typed `timeToRead`. "Derived" is words divided by 220 words a minute. Every hand-typed value is higher than the derived one, by up to 4 minutes on `why-puzzle-rating-doesnt-transfer-to-games` (825 words, labelled 8 minutes). The template derives the value instead of storing it.

| # | Guide | Words | Read time today, derived | Level | Blocks | Positions | FAQ | Sources | Updated |
|---|---|---|---|---|---|---|---|---|---|
| 1 | [How to Get Better at Chess for Beginners](/learn/how-to-get-better-at-chess-for-beginners) | 1329 | 9 min, 6 min | Beginner | paragraphs 7, callout 2, drills 1, steps 1, plan 1 | 6 | 4 | 1 | 2026-09-15 |
| 2 | [How to Stop Blundering in Chess](/learn/how-to-stop-blundering-in-chess) | 1277 | 7 min, 6 min | Beginner | paragraphs 7, steps 1, callout 1, drills 2 | 5 | 3 | 0 | 2026-09-15 |
| 3 | [Why Puzzle Rating Doesn't Transfer to Games](/learn/why-puzzle-rating-doesnt-transfer-to-games) | 825 | 8 min, 4 min | Beginner | paragraphs 5, steps 2, drills 1 | 4 | 0 | 1 | 2026-09-15 |
| 4 | [Chess Coordinates Practice for Faster Board Awareness](/learn/chess-coordinates-practice) | 1144 | 7 min, 5 min | Beginner | paragraphs 6, steps 2, drills 1, comparison 1 | 4 | 2 | 0 | 2026-09-15 |
| 5 | [Chess Visualization Training: 2 Exercises](/learn/chess-visualization-exercises) | 1098 | 7 min, 5 min | Beginner | paragraphs 4, drills 1, steps 1, comparison 1, plan 1 | 3 | 3 | 0 | 2026-09-15 |
| 6 | [How to See the Whole Board in Chess](/learn/how-to-see-the-whole-board-in-chess) | 1090 | 6 min, 5 min | Beginner | paragraphs 7, steps 1, drills 1, comparison 1 | 5 | 2 | 0 | 2026-09-15 |
| 7 | [Chess Calculation Exercises for Beginners](/learn/chess-calculation-exercises-for-beginners) | 1215 | 8 min, 6 min | Beginner to Intermediate | paragraphs 4, steps 2, callout 1, drills 1, comparison 1 | 4 | 3 | 0 | 2026-09-15 |
| 8 | [Blindfold Chess Training: A 4-Stage Beginner Plan](/learn/blindfold-chess-training-for-beginners) | 1320 | 8 min, 6 min | Beginner to Intermediate | paragraphs 8, drills 2, steps 1, plan 1 | 1 | 3 | 0 | 2026-09-15 |
| 9 | [Chess Memory Training: A Scored Ladder](/learn/chess-memory-training) | 1512 | 9 min, 7 min | Beginner | paragraphs 5, callout 1, comparison 1, drills 1, steps 1 | 0 | 3 | 2 | 2026-10-12 |
| 10 | [Chess Pattern Recognition Drills, From Memory](/learn/chess-pattern-recognition-drills) | 1150 | 8 min, 5 min | Beginner | paragraphs 4, steps 2, drills 1 | 12 | 3 | 1 | 2026-09-15 |
| 11 | [How to Think in Chess for Beginners](/learn/how-to-think-in-chess-for-beginners) | 1078 | 6 min, 5 min | Beginner | paragraphs 6, steps 1, callout 1, drills 1, plan 1 | 4 | 3 | 0 | 2026-09-15 |
| 12 | [20-Minute Daily Chess Study Plan for Beginners](/learn/20-minute-daily-chess-study-plan) | 928 | 7 min, 4 min | Beginner | paragraphs 5, plan 1, drills 2, steps 1 | 0 | 0 | 1 | 2026-09-15 |
| 13 | [How to Analyze Chess Games for Beginners](/learn/how-to-analyze-chess-games-for-beginners) | 990 | 7 min, 5 min | Beginner | paragraphs 6, steps 3, drills 1 | 2 | 3 | 0 | 2026-09-15 |
| 14 | [How Many Chess Puzzles a Day Should Beginners Do?](/learn/how-many-chess-puzzles-a-day) | 915 | 7 min, 4 min | Beginner | paragraphs 5, comparison 1, steps 1, drills 1 | 0 | 4 | 0 | 2026-09-15 |

### How to Get Better at Chess for Beginners

- Slug: `how-to-get-better-at-chess-for-beginners`. Goal today: `routine`. Proposed group: `foundations`. Featured.
- Primary keyword: "how to get better at chess".
- Page CTA: "Play 4 pieces, 10 seconds". Drill CTAs: "Play 4 pieces, 10 seconds" (4 pieces, 10s); "Play 6 pieces, 10 seconds" (6 pieces, 10s); "Play 8 pieces, 10 seconds" (8 pieces, 10s).
- Internal links out: guide `how-to-stop-blundering-in-chess`, guide `chess-memory-training`, guide `20-minute-daily-chess-study-plan`, guide `how-to-analyze-chess-games-for-beginners`, guide `how-many-chess-puzzles-a-day`.
- Linked from: 2 guides.
- Questions it answers: "How do I get better at chess as a beginner?" "What should a beginner practise first?" "Where do beginners actually lose their games?" "When should beginners study openings?" FAQ adds: "How long before this shows up in my rating?" "Is Memory Chess enough on its own?" "Should I do puzzles too?" "What piece count should I stop at?"

### How to Stop Blundering in Chess

- Slug: `how-to-stop-blundering-in-chess`. Goal today: `reduce-blunders`. Proposed group: `board-vision`. Featured.
- Primary keyword: "how to stop blundering in chess".
- Page CTA: "Play 6 pieces with 10 seconds to look". Drill CTAs: "Play 6 pieces, 10 seconds" (6 pieces, 10s); "Take the inventory" (off the site, no link); "Replay the last move" (off the site, no link).
- Internal links out: guide `why-puzzle-rating-doesnt-transfer-to-games`, guide `how-to-see-the-whole-board-in-chess`, guide `how-to-analyze-chess-games-for-beginners`.
- Linked from: 6 guides.
- Questions it answers: "How do I stop blundering pieces?" "Why do I blunder more in games than in puzzles?" "What should I check before every move?" "What is a loose piece?" FAQ adds: "Do I have to run the whole scan on every move?" "Should I leave a square empty in a round when I am not sure?"

### Why Puzzle Rating Doesn't Transfer to Games

- Slug: `why-puzzle-rating-doesnt-transfer-to-games`. Goal today: `reduce-blunders`. Proposed group: `board-vision`.
- Primary keyword: "why puzzle rating doesn't transfer to games".
- Page CTA: "Play 12 pieces, 8 seconds". Drill CTAs: "Play 12 pieces, 8 seconds" (12 pieces, 8s).
- Internal links out: guide `how-many-chess-puzzles-a-day`, guide `how-to-stop-blundering-in-chess`, guide `chess-pattern-recognition-drills`.
- Linked from: 3 guides.
- Questions it answers: "Why is my puzzle rating higher than my game rating?" "Why can I solve puzzles but miss tactics in games?" "Do puzzle skills transfer to real games?"

### Chess Coordinates Practice for Faster Board Awareness

- Slug: `chess-coordinates-practice`. Goal today: `visualization`. Proposed group: `board-vision`.
- Primary keyword: "chess coordinates practice".
- Page CTA: "Play 4 pieces, 12 seconds". Drill CTAs: "Play 4 pieces, 12 seconds" (4 pieces, 12s); "Play 4 pieces, 12 seconds" (4 pieces, 12s).
- Internal links out: guide `chess-visualization-exercises`, guide `blindfold-chess-training-for-beginners`, guide `how-to-see-the-whole-board-in-chess`, inline `/settings`, inline `/settings`.
- Linked from: 2 guides.
- Questions it answers: "How do I learn chess coordinates fast?" "How do I know a square's colour without looking?" "Should I practise coordinates from Black's side?" "How do I read squares without counting?" FAQ adds: "Why turn the labels off if the game shows them anyway?" "Do I need to learn the board from Black's side?"

### Chess Visualization Training: 2 Exercises

- Slug: `chess-visualization-exercises`. Goal today: `visualization`. Proposed group: `visualization`. Featured.
- Primary keyword: "chess visualization exercises".
- Page CTA: "Play 6 pieces, 10 seconds". Drill CTAs: "Play 6 pieces, 10 seconds" (6 pieces, 10s).
- Internal links out: guide `blindfold-chess-training-for-beginners`, guide `chess-calculation-exercises-for-beginners`, guide `how-to-see-the-whole-board-in-chess`.
- Linked from: 4 guides, articles `magnus-carlsen`.
- Questions it answers: "How do I improve chess visualization?" "Why does the position fade two moves into a line?" "What is the cover-and-move drill?" "How long does visualization training take?" FAQ adds: "Why not just play more rounds until accuracy goes up?" "Is the 12-piece, 8-second preset a better test?" "Does the cover-and-move drill need a real board?"

### How to See the Whole Board in Chess

- Slug: `how-to-see-the-whole-board-in-chess`. Goal today: `visualization`. Proposed group: `board-vision`.
- Primary keyword: "how to see the whole board in chess".
- Page CTA: "Play 12 pieces with 8 seconds to look". Drill CTAs: "Play 12 pieces, 8 seconds" (12 pieces, 8s); "List the edge pieces" (off the site, no link).
- Internal links out: guide `chess-visualization-exercises`, guide `chess-coordinates-practice`, guide `how-to-stop-blundering-in-chess`.
- Linked from: 3 guides, articles `adriaan-de-groot`.
- Questions it answers: "How do I see the whole board?" "How do I stop tunnel vision in chess?" "Why do I miss long-range bishops and rooks?" FAQ adds: "Do I have to sweep on every move?" "What if the sweep makes me too slow?"

### Chess Calculation Exercises for Beginners

- Slug: `chess-calculation-exercises-for-beginners`. Goal today: `visualization`. Proposed group: `visualization`.
- Primary keyword: "chess calculation exercises".
- Page CTA: "Open the 8-piece, 10-second round". Drill CTAs: "Play 8 pieces, 10 seconds" (8 pieces, 10s); "Set it up at your board" (off the site, no link); "Use your last lost game" (off the site, no link).
- Internal links out: guide `chess-memory-training`, guide `how-to-think-in-chess-for-beginners`, guide `how-to-stop-blundering-in-chess`.
- Linked from: 4 guides.
- Questions it answers: "How do I calculate moves ahead?" "How many moves ahead should a beginner calculate?" "Why do I lose the board after two moves?" "Does Memory Chess teach calculation?" FAQ adds: "Why do I forget a piece that never moved?"

### Blindfold Chess Training: A 4-Stage Beginner Plan

- Slug: `blindfold-chess-training-for-beginners`. Goal today: `visualization`. Proposed group: `visualization`.
- Primary keyword: "blindfold chess training".
- Page CTA: "Play 2 pieces, 10 seconds, kings only". Drill CTAs: "Play 2 pieces, 10 seconds, kings only" (2 pieces, 10s); "Replay ten moves covered" (off the site, no link).
- Internal links out: guide `chess-visualization-exercises`, guide `chess-coordinates-practice`, guide `chess-calculation-exercises-for-beginners`, article `judit-polgar`.
- Linked from: 2 guides, articles `judit-polgar`.
- Questions it answers: "How do I start playing blindfold chess?" "Do I need to be strong to train blindfold?" "How long does each blindfold stage take?" FAQ adds: "Should I also train with the 6-piece or 12-piece presets?" "Do I need to be a strong player first?" "What if I picture the board from Black's side?"

### Chess Memory Training: A Scored Ladder

- Slug: `chess-memory-training`. Goal today: `memory`. Proposed group: `memory`. Featured.
- Primary keyword: "chess memory training".
- Page CTA: "Open the 6-piece, 10-second round". Drill CTAs: "Play 6 pieces, 10 seconds" (6 pieces, 10s); "Play 6 pieces, 6 seconds" (6 pieces, 6s); "Play 12 pieces, 8 seconds" (12 pieces, 8s).
- Internal links out: guide `chess-pattern-recognition-drills`, guide `chess-calculation-exercises-for-beginners`, guide `chess-visualization-exercises`, article `adriaan-de-groot`.
- Linked from: 4 guides, articles `adriaan-de-groot`.
- Questions it answers: "How do I train my chess memory?" "Is 6 pieces in 10 seconds a good score?" "When should I add more pieces to a round?" "Does the leaderboard care about speed?" FAQ adds: "Is 6 pieces in 10 seconds a good score for a beginner?" "Should I go straight to the 20-piece preset?"

### Chess Pattern Recognition Drills, From Memory

- Slug: `chess-pattern-recognition-drills`. Goal today: `memory`. Proposed group: `memory`.
- Primary keyword: "chess pattern recognition drills".
- Page CTA: "Open the 12-piece, 8-second round". Drill CTAs: "Start 12 pieces, 8 seconds" (12 pieces, 8s); "Try 20 pieces, 5 seconds" (20 pieces, 5s).
- Internal links out: guide `chess-memory-training`, guide `why-puzzle-rating-doesnt-transfer-to-games`, guide `how-many-chess-puzzles-a-day`, article `magnus-carlsen`.
- Linked from: 3 guides, articles `magnus-carlsen`.
- Questions it answers: "How do I train pattern recognition in chess?" "Is pattern recognition the same as memorising puzzles?" "How many patterns should I learn at once?" "What does a knight fork look like on the board?" FAQ adds: "Can Memory Chess show me real tactical patterns?"

### How to Think in Chess for Beginners

- Slug: `how-to-think-in-chess-for-beginners`. Goal today: `routine`. Proposed group: `foundations`.
- Primary keyword: "how to think in chess".
- Page CTA: "Play 6 pieces with 20 seconds to look". Drill CTAs: "Play 6 pieces, 20 seconds" (6 pieces, 20s); "Say the sentence first" (off the site, no link).
- Internal links out: guide `how-to-stop-blundering-in-chess`, guide `chess-calculation-exercises-for-beginners`, guide `how-to-analyze-chess-games-for-beginners`.
- Linked from: 1 guides.
- Questions it answers: "What should I think about before each move?" "How do I stop moving too fast?" "When should I stop thinking and move?" "How should I use my clock in a 10-minute game?" FAQ adds: "How many moves ahead should a beginner think?" "What if none of my options feels good?" "Should I use the routine in blitz?"

### 20-Minute Daily Chess Study Plan for Beginners

- Slug: `20-minute-daily-chess-study-plan`. Goal today: `routine`. Proposed group: `practice`.
- Primary keyword: "20 minute daily chess study plan".
- Page CTA: "Play 6 pieces, 10 seconds". Drill CTAs: "Play 6 pieces, 10 seconds" (6 pieces, 10s); "Play 8 pieces, 10 seconds" (8 pieces, 10s).
- Internal links out: guide `how-to-get-better-at-chess-for-beginners`, guide `how-to-analyze-chess-games-for-beginners`, guide `how-many-chess-puzzles-a-day`.
- Linked from: 3 guides.
- Questions it answers: "What is a good daily chess routine?" "How should I spend 20 minutes on chess?" "How do I study chess with little time?"

### How to Analyze Chess Games for Beginners

- Slug: `how-to-analyze-chess-games-for-beginners`. Goal today: `routine`. Proposed group: `practice`.
- Primary keyword: "how to analyze chess games for beginners".
- Page CTA: "Play 8 pieces, 10 seconds". Drill CTAs: "Play 8 pieces, 10 seconds" (8 pieces, 10s).
- Internal links out: guide `how-to-get-better-at-chess-for-beginners`, guide `20-minute-daily-chess-study-plan`, guide `chess-memory-training`, guide `how-to-stop-blundering-in-chess`.
- Linked from: 4 guides.
- Questions it answers: "How do I analyse my chess games?" "Should beginners use the engine?" "How many games a week should I review?" "Should I review my wins?" FAQ adds: "Should I use the engine at all?" "What about my wins?"

### How Many Chess Puzzles a Day Should Beginners Do?

- Slug: `how-many-chess-puzzles-a-day`. Goal today: `routine`. Proposed group: `practice`.
- Primary keyword: "how many chess puzzles a day".
- Page CTA: "Play 6 pieces, 10 seconds". Drill CTAs: "Play 6 pieces, 10 seconds" (6 pieces, 10s).
- Internal links out: guide `why-puzzle-rating-doesnt-transfer-to-games`, guide `20-minute-daily-chess-study-plan`, guide `chess-pattern-recognition-drills`.
- Linked from: 4 guides.
- Questions it answers: "How many chess puzzles should I do a day?" "Is one puzzle a day enough?" "Should I do puzzles before or after games?" "Are themed or mixed puzzles better?" FAQ adds: "Is one puzzle a day worth anything?" "Puzzles before or after games?" "Should the puzzles be themed or mixed?" "What if I enjoy doing fifty?"


### Articles

| Article | Words | Person | Drill | Links to guides | Sources |
|---|---|---|---|---|---|
| [How Judit Polgár played blindfold chess at age seven](/articles/judit-polgar) | 1138 | Judit Polgár | 6 pieces, 5s | `blindfold-chess-training-for-beginners` | 11 |
| [Adriaan de Groot's 1944 test of chess memory, by the numbers](/articles/adriaan-de-groot) | 1134 | Adriaan de Groot | 22 pieces, 5s | `chess-memory-training`, `how-to-see-the-whole-board-in-chess` | 11 |
| [How Magnus Carlsen names a famous game from one position](/articles/magnus-carlsen) | 1134 | Magnus Carlsen | 12 pieces, 5s | `chess-pattern-recognition-drills`, `chess-visualization-exercises` | 11 |

Each article has a portrait with a licence credit, a fact file, a typed-in body, one drill CTA, a "Train it with a guide" list and a numbered source list. Questions they answer: "How did Judit Polgár learn blindfold chess?", "What did de Groot's chess memory experiment find?", "How good is Magnus Carlsen's memory?", "Do strong players remember random positions better?".

### Current CTAs, in one place

- **Game.** Every guide links a round through `gameHref(setup, "guide_cta")`. The page CTA is the first drill with a `setup`. 21 drills link a round. 7 drills are done away from the site and carry a `ctaLabel` that renders nothing.
- **Article.** 3 guides link an article through `furtherReading`. Each article links back through `relatedGuides`. `src/lib/seo/__tests__/crossLinks.test.ts` checks both directions.
- **Stat.** None. No guide links to the dashboard, although several explain a figure the dashboard shows (accuracy in `how-to-stop-blundering-in-chess`, the result bands and speed in `chess-memory-training`).
- **Settings.** `chess-coordinates-practice` links `/settings` inline twice, for the board labels.

### Internal linking

Each guide links 3 to 5 other guides (`relatedArticles`, which despite its name holds guide slugs). Inbound links are uneven. `how-to-stop-blundering-in-chess` is linked from 6 guides, `how-to-think-in-chess-for-beginners` from 1. Guides link only to guides in the "What to learn next" list. The prose itself links almost nowhere: only one guide has inline links, both to `/settings`.

## Proposed topic groups

Topics will vary widely, so the groups describe what a reader wants to fix, not which drill they use. Five groups hold today's 14 guides. Two more are registered as `planned`, and the hub shows a group only once it holds a guide. A new topic either joins a group or opens a planned one; it never forces a reshuffle.

| Group id | Label | Guides | Status |
|---|---|---|---|
| `foundations` | Start here | `how-to-get-better-at-chess-for-beginners`, `how-to-think-in-chess-for-beginners` | live, 2 |
| `board-vision` | Board vision and blunders | `how-to-stop-blundering-in-chess`, `how-to-see-the-whole-board-in-chess`, `chess-coordinates-practice`, `why-puzzle-rating-doesnt-transfer-to-games` | live, 4 |
| `visualization` | Visualization and calculation | `chess-visualization-exercises`, `chess-calculation-exercises-for-beginners`, `blindfold-chess-training-for-beginners` | live, 3 |
| `memory` | Memory and patterns | `chess-memory-training`, `chess-pattern-recognition-drills` | live, 2 |
| `practice` | Practice and review | `20-minute-daily-chess-study-plan`, `how-to-analyze-chess-games-for-beginners`, `how-many-chess-puzzles-a-day` | live, 3 |
| `science` | The science of chess memory | none yet | planned |
| `using-memory-chess` | Using Memory Chess | none yet | planned |

Why these and not the four goals:

- The four goals put `how-to-get-better-at-chess-for-beginners` and `how-to-think-in-chess-for-beginners` under "Build a daily routine". A beginner looking for where to start does not look under "routine". `foundations` gives them a first stop.
- `reduce-blunders` held 2 guides while `visualization` held 5. Coordinates and the whole-board sweep are about seeing the board, so they join blunders in `board-vision`, and the visualization group keeps the three that move pieces in your head.
- `science` gives research-led pieces a home that is not a training goal. The de Groot article already reads that way, and future guides on chunking or expert memory belong there.
- `using-memory-chess` gives the product's own mechanics a home: how a round is scored, what each preset tests, what each dashboard figure means. Today that material is spread across sections of other guides, and stat CTAs need a page to land on.

The group order on the hub follows a reader's path: start, see the board, hold it in your head, remember it, then practise. Within a group, guides keep the `LEARN_GUIDES` order, easiest first.

## Gaps

- **No home for the product's own mechanics.** Scoring rules sit inside `how-to-stop-blundering-in-chess` ("What an invented piece costs") and `chess-memory-training` ("The score counts exact squares"). A stat CTA has no guide to explain the figure it points at.
- **No chess-knowledge topics.** Nothing on openings, endgames or basic tactics as subjects. `how-to-get-better-at-chess-for-beginners` defers openings on purpose. Searches like "how to learn chess openings" find nothing, which the search no-result state must handle.
- **Two thin groups.** `foundations` and `memory` each hold 2 guides. A hub layout must not look broken with 2 entries in a group.
- **Two guides have no FAQ** (`why-puzzle-rating-doesnt-transfer-to-games`, `20-minute-daily-chess-study-plan`), so they emit no FAQPage JSON-LD.
- **7 of 14 guides cite no source.** The 7 that do cite 1 or 2.
- **No images in any guide.** `public/images/learn/` holds 4 SVGs (`blunder-board.svg`, `memory-stack.svg`, `routine-path.svg`, `visualization-map.svg`) that nothing references.
- **Diagrams are checked but never drawn.** 50 positions across 11 guides are replayed by `guideFacts.test.ts`, and every one is described only in prose ("Put a White bishop on b5, a Black knight on c6 ..."). These are the cheapest diagrams the revamp can add: the data and the checks already exist.
- **Everything is beginner level.** 12 guides say Beginner and 2 say Beginner to Intermediate. A level filter has nothing to filter today.
- **Only 3 articles, all biographies.** Article CTAs from guides are limited to these three.
- **Inbound links are uneven.** `how-to-think-in-chess-for-beginners` has 1 inbound guide link.
