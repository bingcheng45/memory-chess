# Learn guide content rubric

Every editor and reviewer of a Learn guide reads this file. Reviewers never edit it, and editors never edit it.

## What a guide is for

A reader arrives from a search with one question. The guide answers it in the first screen, then teaches one skill well enough to practise it today, then sends the reader to play a Memory Chess round that trains it. The guide is judged on whether that reader leaves better at chess, not on its length.

## Ground rules for every change

1. **Edit only the guide's own file**, `src/lib/seo/learn/guides/<slug>.ts`, plus `src/lib/seo/learn/__tests__/guideFacts.test.ts` when a stated chess position changes. Never run `scripts/learn/migrate-guides.mjs`. Never edit this rubric, other guides, components or schema.
2. **Keep** the slug, the group and the `LearnDocument` shape. The types in `src/lib/seo/learn/schema.ts` are the template.
3. **Chess facts must be true.** Every position a guide states or draws is replayed by `guideFacts.test.ts`. A new board or stated position needs its entry there, and the test must pass.
4. **Game facts must match the code.** Presets, piece counts, study times, scoring and dashboard figures come from `src/lib/game/*`, `src/lib/lab/*` and `src/lib/reference/facts.ts`. Do not invent a feature.
5. **No invented evidence.** No made-up studies, percentages, ratings or quotes. A source must be a real, reachable page that says what the guide says it says. When unsure, remove the claim.
6. **Voice.** Plain, direct, second person, present tense. Short declarative sentences. No long dashes, no "not X, but Y", no colon-then-reveal, no stock phrases ("worth noting", "in today's world", "let's dive in", "game-changer", "unlock"), no rhetorical questions as headings unless it is the reader's real query, no exclamation marks.
7. **Do not pad.** Cutting is an improvement. A shorter guide that answers better wins.

## Lens 1: critical writer

Approve only when all of these hold:
- The quick answer answers the h1 directly in 2 to 3 sentences, with no wind-up.
- Every section earns its place and says something the reader could not guess. Delete filler sections.
- Each paragraph holds one idea, 2 to 5 sentences. Examples are concrete: real squares, real piece counts, real minutes.
- Terms are defined once and used the same way throughout (for example "loose piece", "rebuild").
- Claims are specific and true. Hedges only where the truth is uncertain.
- The guide reads as written by a strong coach, not a template. No repeated sentence frames.
- Drill instructions can be followed without rereading: what to set up, what to do, how to know it worked.

## Lens 2: SEO

Approve only when all of these hold:
- The guide matches the search intent of `keywords.primary` and owns it. No sibling guide targets the same primary keyword or answers the same main question (check `node scripts/learn/guide-report.mjs --all` and the siblings).
- `title` is 49 characters or fewer (the site appends " | Memory Chess" and the full title must fit 64), keeps any title pinned in `src/lib/seo/__tests__/crossLinks.test.ts`, and contains the primary keyword or its natural form. `description` is 120 to 160 characters, says what the reader gets, and contains the primary keyword naturally. `h1` reads naturally and matches the intent.
- The quick answer works as a featured snippet: self-contained, 40 to 60 words, answers the query.
- Section headings are descriptive and specific to this guide, phrased the way a reader would search where it fits. None is shared with another guide (`headingsSharedWithOtherGuides` is empty).
- `meta.questions` are real queries a reader types, 2 to 6, each answered on the page. FAQ answers are self-contained, 30 to 70 words, and do not repeat the quick answer.
- Internal links: 3 to 6 links to other Learn guides or articles, with descriptive anchor text, placed where they help. No link to a missing slug.
- No sentence of 6 or more words is shared with another guide (`sentencesSharedWithOtherGuides` is empty).
- Sources, where claims need them, are authoritative and real.
- Do not chase a word count. Length follows intent.

## Lens 3: readability and visuals

Approve only when all of these hold:
- A reader on a phone can skim the headings, takeaways and lists and get the method.
- Average sentence length under 16 words. No sentence over 28 words (`learnPages.test.ts` enforces it).
- No paragraph over 5 sentences. Steps are numbered lists. Comparisons are tables.
- Visuals are used minimally and only when they explain something faster than words: a `board` for a position the text discusses, a `table` for a comparison, a `plan` for a timed routine. Roughly one visual per 400 to 600 words at most. No decorative visual.
- Every visual has a caption that states its point in one sentence. Every board's position is in `guideFacts.test.ts`.
- The page flows: answer, method, practice, play. The game CTA sits where the reader is ready to try it.

## Verification an editor runs before handing back

```bash
node scripts/learn/guide-report.mjs <slug>
npx jest src/lib/seo src/components/learn --testPathIgnorePatterns=/node_modules/
npx tsc --noEmit
```

All three must pass or report cleanly. Commit with `docs(learn): <what improved> in <slug>` and the attribution line.

## How reviewers decide

Each reviewer reads the guide file, the report output and the diff since the guide's start of review. A reviewer returns `approve: true` only when no **blocking** issue remains under their lens. A blocking issue breaks a rule above or makes the guide worse for the reader. A **nit** is a preference and never blocks. Reviewers name the exact text, the problem, and a concrete fix.
