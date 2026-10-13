# Learn revamp: search by the reader's question

Readers arrive with a question ("why do I keep hanging pieces"), not a guide title. The search matches that question to the guide that answers it, ranks by how well each guide answers it, and works with no JavaScript. It needs no new runtime dependency. With 14 guides and 3 articles the whole index fits in a few kilobytes, and a hand-written ranker of about 150 lines is easier to tune for chess words than a general library.

A reference ranker exists as throwaway prototype code in the scratch folder (`learn-proto/search.js`). The numbers below come from running it.

## Where search appears

- **Hub.** A search field at the top of `/learn`, above the grouped list. Typing filters and ranks live. The grouped list stays in the HTML underneath, so the page is complete without the search.
- **Guide pages.** A compact field in the header area or the table of contents, depending on the layout. Submitting it goes to the same results.
- **No JavaScript.** The field is a `<form method="get" action="/learn/search">` with `<input name="q">`. `/learn/search` is a server-rendered route that runs the same ranker on the server and renders the results as a plain list. It is `noindex, follow`, out of the sitemap, and its canonical is `/learn/search` without the query. With JavaScript, the hub intercepts the submit and ranks in place, and updates the URL to `/learn?q=...` with `history.replaceState` so a reload or a shared link keeps the query.

## The index

One record per guide and per article, built at build time by `toPage` (see `template.md`) and shipped as a static JSON module. Fields and weights:

| Field | Source | Weight |
|---|---|---|
| `questions` | `meta.questions` plus the FAQ questions | 6 |
| `title` | `meta.title` and `meta.h1` (articles add the person's name) | 5 |
| `keywords` | `meta.keywords.primary` and `secondary` | 4 |
| `headings` | section headings | 2.5 |
| `description` | `meta.description` and `intro.quickAnswer` | 2 |
| `body` | prose, list items and drill text | 1 |

Articles score at 0.6 of a guide, because Learn search exists to send people to training. An article still wins when the query names its subject ("de groot" returns `adriaan-de-groot` alone).

Size, measured on the converted data: 62,612 bytes with the body field, 21,385 gzipped. Without the body field, 15,997 bytes, 5,311 gzipped. Ship the version without the body to the browser and keep the body field for the server route, unless testing shows body matches matter. Load the module on first focus of the field, not on page load.

## Ranking

For each query term, the ranker finds the best field match in each document and adds `weight × idf × closeness × tf/(tf + 1.2)`. That is a BM25-style score without length normalisation, which 14 documents do not need.

1. **Normalise.** Lowercase, strip accents and apostrophes, drop punctuation. Remove the phrase "memory chess" and the word "chess", which appear on every page and carry no signal.
2. **Tokenise and stem.** Split on spaces and hyphens. Drop stop words ("how", "do", "i", "to", "the", "why", "what", "should" and similar). Strip a final `-ing`, `-es` or `-s`.
3. **Synonyms.** Map each term onto its synonym ring's head, both in the query and in the index, so "hang" and "blunder" become one term. Two-word entries ("look ahead", "tunnel vision") match as a pair first.
4. **Expand.** Each query term also matches vocabulary words that start with it (only the last term, for search as you type, at 0.8) and words within a typo budget (at 0.5): 1 edit for terms of 4 to 7 letters, 2 for 8 or more, none below 4. Transpositions count as one edit.
5. **Restrict typo matches.** A typo match counts only in `questions`, `title`, `keywords` and `headings`. In prose it matched ordinary words: "stuck" matched "stick" in a description and put `chess-pattern-recognition-drills` first for "elo stuck".
6. **Coverage.** Multiply the score by the square of the share of query terms that matched, so a guide matching both words beats one matching one word strongly.
7. **Question match.** When the query has 2 or more terms and 60 percent or more of them appear in one of the guide's questions, add a bonus of 8 times that share, and return that question with the result. The two-term minimum exists because a single word matched too many questions by accident ("visualisation" matched "What if I picture the board from Black's side?").
8. **Sort** by score and return the top 8.

### Synonym rings

Kept as data next to the index, one ring per line, first entry is the head:

- blunder, hang, hanging, drop, lose piece, mistake, loose
- visualization, visualisation, visualize, visualise, mental board, picture, see ahead
- calculation, calculate, look ahead, think ahead, moves ahead, variation, line
- blindfold, without a board, no board, mental chess
- coordinates, notation, squares, algebraic, square names
- puzzle, puzzles, tactic, tactics, exercise
- memory, memorise, memorize, remember, recall
- pattern, patterns, motif, motifs, chunk, chunking, shape
- analyze, analyse, analysis, review, post mortem, study my games
- routine, plan, schedule, daily, habit, study plan
- beginner, new, novice, starter, improve, better
- rating, elo, rank
- whole board, board vision, tunnel vision, peripheral, board awareness
- think, thought process, decide, candidate moves

Add a ring when the zero-result log (below) shows a word readers use that the guides do not.

### Measured results

From the reference ranker over the 14 converted guides and 3 articles. Times are single queries in Node on this machine.

| Query | Top result | Matched question | Time |
|---|---|---|---|
| why do i keep hanging pieces | `how-to-stop-blundering-in-chess` | How do I stop blundering pieces? | 5.2 ms |
| how many puzzles a day | `how-many-chess-puzzles-a-day` | How many chess puzzles should I do a day? | 2.9 ms |
| blindfod chess (typo) | `blindfold-chess-training-for-beginners` | none | 0.9 ms |
| visualisation | `chess-visualization-exercises` | none | 0.2 ms |
| review my games | `how-to-analyze-chess-games-for-beginners` | How do I analyse my chess games? | under 1 ms |
| knight fork | `chess-pattern-recognition-drills` | What does a knight fork look like on the board? | under 2 ms |
| tunnel vision | `how-to-see-the-whole-board-in-chess` | How do I see the whole board? | under 4 ms |
| openings | `how-to-get-better-at-chess-for-beginners` | none | under 1 ms |
| de groot | `adriaan-de-groot` | none | under 1 ms |
| xyzzy | no results | | under 1 ms |

Known weak case. "elo stuck" ranks `how-to-get-better-at-chess-for-beginners` and `why-puzzle-rating-doesnt-transfer-to-games` level at a low score (0.51). Both are reasonable. Neither is a strong match, which the weak-match state below handles.

## States

- **Empty field.** Show nothing extra. The grouped list is the default view. Optionally show 3 to 5 popular questions as links (the `meta.questions` of featured guides). Each is a link to `/learn/search?q=...`, so it works without JavaScript.
- **Typing.** Results update on each input event with no debounce needed at this size. Each result shows the guide title, its group, and the matched question when there is one ("Answers: How do I stop blundering pieces?"). Highlight matched terms in the question with `<mark>`.
- **Weak match.** When the top score is under 3, label the list "Closest guides" instead of "Results", so a reader knows the match is loose.
- **No result.** Say so in one sentence that repeats the query, then offer the group list as links and a link to play a round. The query is logged (below) because it names a gap. Render this state only on the client or on `/learn/search`, never as hidden text on the hub (see the hidden-text rule in `seo.md`).
- **Server route.** `/learn/search` with an empty `q` shows the same popular questions and the group list.

## Keyboard and screen readers

- `/` focuses the field when focus is not already in a text input. `Escape` clears the field, then on a second press returns focus to where it was.
- The field is `role="combobox"` with `aria-expanded`, `aria-controls` pointing at a `role="listbox"`, and `aria-activedescendant` for the highlighted option. `ArrowDown` and `ArrowUp` move through results. `Enter` opens the highlighted result, or submits to `/learn/search` when nothing is highlighted.
- A polite live region announces the count: "4 guides match". Announce after typing pauses for 400 ms so screen readers are not flooded.
- Every result is a real link, so middle-click and open in a new tab work.

## Analytics

Two new events in the `FunnelEvent` union in `src/lib/analytics/events.ts`. They follow the file's rule of fixed ids and counts, and they add the query text, which is the point of logging search.

```ts
| {
	name: "learn_search";
	params: {
		/** Lowercased, trimmed, cut to 60 characters. */
		search_term: string;
		results: number;
		/** The top result's slug, or "none". */
		top: string;
		/** "hub", "guide" or "server". */
		surface: "hub" | "guide" | "server";
	};
  }
| {
	name: "learn_search_select";
	params: { slug: string; rank: number; matched_question: boolean; surface: "hub" | "guide" | "server" };
  }
```

- Send `learn_search` once per settled query: on submit, or when the reader stops typing for 1 second with at least 3 characters. Do not send one per keystroke.
- `search_term` is free text a reader typed. Add a line to the privacy page saying Learn search terms are sent to analytics, before the event ships. If that is not acceptable, send `results` and `top` only and log zero-result terms server-side from `/learn/search` instead.
- The report that matters is the list of terms with `results` equal to 0 or a weak top score. It names guides to write and synonym rings to add.
