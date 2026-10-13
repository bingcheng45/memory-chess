# Learn revamp: the Learn document template

Every Learn guide becomes one typed data file in this shape. One renderer turns it into a page. No guide gets its own component. The types below are the proposal for `src/lib/seo/learn/schema.ts`. They replace `LearnGuide`, `LearnSection`, `LearnBlock` and the separate `positions` export.

The template is a redesign of today's `LearnGuide`, not an extension. Today a guide's chess positions live in a second export that only a test reads, the related-guides list is called `relatedArticles`, the read time is typed by hand, and a section may hold an FAQ-shaped block nowhere. The new shape fixes each of those in the type.

## The shape

```ts
import type { Square } from "chess.js";
import type { PhotoCredit } from "@/lib/articles/schema";
import type { DashboardTileId } from "@/lib/lab/dashboard";
import type { PositionClaim } from "./positions";

// ---- Identifiers -----------------------------------------------------------

/** A live guide slug. Generated from the guide registry, so a typo fails to compile. */
export type GuideSlug = (typeof LEARN_GUIDES)[number]["meta"]["slug"];
/** A live article slug, from the article registry. */
export type ArticleSlug = (typeof ARTICLES)[number]["slug"];

export const LEARN_GROUPS = [
	{ id: "foundations", label: "Start here", status: "live" },
	{ id: "board-vision", label: "Board vision and blunders", status: "live" },
	{ id: "visualization", label: "Visualization and calculation", status: "live" },
	{ id: "memory", label: "Memory and patterns", status: "live" },
	{ id: "practice", label: "Practice and review", status: "live" },
	{ id: "science", label: "The science of chess memory", status: "planned" },
	{ id: "using-memory-chess", label: "Using Memory Chess", status: "planned" },
] as const;
export type LearnGroupId = (typeof LEARN_GROUPS)[number]["id"];

export type LearnLevel = "beginner" | "improver" | "intermediate";

/** A question in the reader's words, ending with "?". Parsed by `question()`, which throws otherwise. */
export type Question = string & { readonly __brand: "Question" };

/** An ISO date, "2026-09-15". */
export type IsoDate = string & { readonly __brand: "IsoDate" };

// ---- Inline text -----------------------------------------------------------

/** A link inside running text. `href` is a site path; `learnLinks.test.ts` checks it resolves. */
export type InlineLink = { readonly text: string; readonly href: `/${string}` };
/** Plain text, or text with links in it. Plain strings cover the common case. */
export type Rich = string | readonly (string | InlineLink)[];

// ---- Metadata --------------------------------------------------------------

export type LearnMeta = {
	readonly slug: string;
	/** The <title>. 60 characters or fewer. */
	readonly title: string;
	readonly h1: string;
	/** The meta description and the hub card text. 160 characters or fewer. */
	readonly description: string;
	readonly group: LearnGroupId;
	readonly level: LearnLevel;
	readonly publishedAt: IsoDate;
	readonly updatedAt: IsoDate;
	/** What a reader would type. The search ranks these highest. 2 to 6, distinct from the FAQ questions. */
	readonly questions: readonly [Question, Question, ...Question[]];
	readonly keywords: { readonly primary: string; readonly secondary: readonly string[] };
	readonly featured?: true;
};

/** The answer-first block above the fold. */
export type LearnIntro = {
	readonly quickAnswer: string;
	readonly takeaways: readonly string[];
	readonly audience: readonly string[];
};

// ---- Body blocks -----------------------------------------------------------

export type GameSetup = { readonly pieceCount: number; readonly memorizeTime: number };

export type BoardArrow = { readonly from: Square; readonly to: Square; readonly kind: "attack" | "defend" | "pin" };
export type BoardMark = { readonly square: Square; readonly kind: "ring" | "correct" | "wrong" };

export type Drill = {
	readonly title: string;
	readonly description: Rich;
	readonly duration: string;
	readonly goal: string;
	/** A drill played on the site. Absent for a drill done at a real board, which then renders no button. */
	readonly play?: GameSetup & { readonly label: string };
};

export type BodyBlock =
	| { readonly kind: "prose"; readonly paragraphs: readonly [Rich, ...Rich[]] }
	| { readonly kind: "list"; readonly ordered: boolean; readonly items: readonly [Rich, ...Rich[]] }
	| { readonly kind: "takeaway"; readonly title: string; readonly body: string }
	| {
			readonly kind: "board";
			readonly id: string;
			/** The position as drawn. A test replays `claims` against it with chess.js. */
			readonly fen: string;
			readonly arrows?: readonly BoardArrow[];
			readonly marks?: readonly BoardMark[];
			/** One sentence that says what to see. Also the board's accessible name. */
			readonly caption: string;
			readonly claims: readonly PositionClaim[];
			readonly orientation?: "white" | "black";
	  }
	| {
			readonly kind: "image";
			readonly src: `/images/learn/${string}`;
			readonly width: number;
			readonly height: number;
			readonly alt: string;
			readonly caption: string;
			readonly credit: PhotoCredit | "own";
	  }
	| { readonly kind: "drills"; readonly drills: readonly [Drill, ...Drill[]] }
	| {
			readonly kind: "table";
			readonly caption?: string;
			readonly columns: readonly [string, string, ...string[]];
			/** `cells.length` is `columns.length - 1`. Checked by `learnTemplate.test.ts`. */
			readonly rows: readonly { readonly label: string; readonly cells: readonly string[] }[];
	  }
	| { readonly kind: "plan"; readonly steps: readonly { readonly label: string; readonly duration: string; readonly detail: string }[] }
	| CtaBlock;

// ---- Calls to action -------------------------------------------------------

export type CtaTarget =
	| ({ readonly kind: "game"; readonly label: string } & GameSetup)
	| { readonly kind: "article"; readonly slug: ArticleSlug; readonly label: string }
	| { readonly kind: "stat"; readonly tile: DashboardTileId; readonly label: string };

/** `why` is written per guide. A shared sentence would trip the AdSense repeated-sentence rule. */
export type CtaBlock = { readonly kind: "cta"; readonly target: CtaTarget; readonly why: string };

// ---- End blocks ------------------------------------------------------------

export type FurtherItem =
	| { readonly kind: "guide"; readonly slug: GuideSlug; readonly reason: string }
	| { readonly kind: "article"; readonly slug: ArticleSlug; readonly reason: string };

export type EndBlock =
	| CtaBlock
	| { readonly kind: "faq"; readonly items: readonly [{ question: Question; answer: string }, ...{ question: Question; answer: string }[]] }
	| { readonly kind: "furtherReading"; readonly items: readonly [FurtherItem, ...FurtherItem[]] }
	| { readonly kind: "sources"; readonly items: readonly [{ title: string; url: `https://${string}`; note?: string }, ...{ title: string; url: `https://${string}`; note?: string }[]] };

// ---- The document ----------------------------------------------------------

export type LearnSection = {
	/** The fragment id and the table-of-contents anchor. */
	readonly id: string;
	/** The section's h2. Unique to this guide; see seo.md on heading templates. */
	readonly heading: string;
	/** One sentence under the h2. Used by 6 sections in 5 guides today. */
	readonly summary?: string;
	readonly blocks: readonly [BodyBlock, ...BodyBlock[]];
};

export type LearnDocument = {
	readonly meta: LearnMeta;
	readonly intro: LearnIntro;
	readonly sections: readonly [LearnSection, ...LearnSection[]];
	/** In render order. At most one of each of faq, furtherReading and sources. */
	readonly end: readonly EndBlock[];
	/** Positions the prose states without drawing them. The facts test replays these too. */
	readonly facts: readonly LearnPosition[];
};

export type LearnBlock = BodyBlock | EndBlock;
```

### What the page derives instead of storing

These are computed by one function, `toPage(doc)`, as `toPage` in `src/lib/seo/learn/index.ts` does today:

- `readingMinutes`: words in `intro`, `sections` and the FAQ, divided by 220, at least 3.
- `tableOfContents`: one entry per section, plus the FAQ when present.
- `primaryCta`: the first `cta` block with a `game` target in `end`, or else the first drill with `play`. A guide with neither is a test failure, because every guide should end on something to do.
- `searchEntry`: the record `search.md` indexes, built from `meta`, the section headings and the prose.
- `articleSection` for JSON-LD: the group label.

## One renderer

`LearnBlockView` is a single `switch (block.kind)` with a `never` default, so a new block kind does not compile until the renderer handles it. The page component maps `sections` to `<section id><h2>` plus blocks, then maps `end`. Layout variants change the CSS and the page frame around the blocks. They do not fork block markup, and no guide imports a component of its own.

The prototype renderer `learn-proto/render.js` (scratch, not committed) implements this switch for every kind above, and `learn-proto/shell.html?guide=<slug>` renders any of the 14 converted guides through it.

## How today's guides map onto it

`tools/build-content.cjs` converts all 14 guides mechanically. Run it from the repo root after the two extract commands in `inventory.md`:

```bash
node docs/plans/learn-revamp/tools/build-content.cjs "$PWD" /tmp/guides.json /tmp/articles.json /tmp/content.js
```

 Nothing in the conversion needs judgement except where boards go, so the codemod can do the migration and a person places diagrams afterwards.

| Today | Template | Change |
|---|---|---|
| `goal: LearnGoalId` (4 goals) | `meta.group: LearnGroupId` (5 live, 2 planned) | New grouping, see `inventory.md` |
| `difficulty: "Beginner" \| "Beginner to Intermediate"` | `meta.level: "beginner" \| "improver" \| "intermediate"` | Enum with room above |
| `timeToRead: "7 min read"` | derived `readingMinutes` | Stops the drift in `inventory.md` |
| `primaryKeyword`, `secondaryKeywords` | `meta.keywords` | Same data |
| none | `meta.questions` | New, authored per guide |
| `quickAnswer`, `keyTakeaways`, `whoThisIsFor` | `intro` | Same data |
| `sections[].title`, `eyebrow`, `summary` | `sections[].heading`, `summary` | No guide sets `eyebrow`, so it goes. `summary` stays |
| `paragraphs` with one optional `link` | `prose` with `Rich` paragraphs | Any number of links, anywhere |
| `steps` | `list` | Rename |
| `callout` | `takeaway` | Rename |
| `drills[].setup`, `ctaLabel` | `drills[].play` | A drill at a real board has no `play`, so no dead `ctaLabel` |
| `comparison` with fixed `struggling` and `stronger` | `table` with any column count | Today's three columns become `columns` plus two `cells` |
| `plan` | `plan` | Same |
| `export const positions` in each guide file | `board` blocks, or `facts` for undrawn ones | The checked position and the drawn diagram are one value |
| `faq`, `sources` (top level) | `end` blocks | Same data |
| `relatedArticles` (holds guide slugs) | `furtherReading` items of kind `guide` | Name says what it holds |
| `furtherReading` (article slugs) | `furtherReading` items of kind `article`, or a `cta` with an `article` target | One list for both |
| `ctaLabel`, derived `ctaHref` | `cta` block with a `game` target | Explicit and movable |
| none | `cta` with a `stat` target, `image`, `board` | New kinds |

Example. The first section of `how-to-stop-blundering-in-chess` after conversion, with the board placed by hand:

```ts
{
	id: "puzzle-vs-game",
	heading: "Why pieces drop in games and not in puzzles",
	blocks: [
		{ kind: "prose", paragraphs: [
			"A puzzle tells you two things before you look. There is a tactic, and it is your move. ...",
			// three more paragraphs, unchanged
		] },
		{
			kind: "board",
			id: "phantom-defender",
			fen: "4k3/8/2n5/1B2P3/8/8/8/6K1 b - - 0 1",
			arrows: [{ from: "b5", to: "e8", kind: "pin" }, { from: "c6", to: "e5", kind: "attack" }],
			marks: [{ square: "c6", kind: "ring" }],
			caption: "The knight on c6 seems to guard e5, but the bishop on b5 pins it to the king on e8.",
			claims: [
				{ kind: "occupant", square: "d7", piece: null },
				{ kind: "attacks", from: "c6", squares: ["e5"] },
				{ kind: "illegal", move: "Nxe5" },
			],
		},
		{ kind: "prose", paragraphs: ["The second is the forgotten piece, ...", "The third is the abandoned job. ..."] },
		{ kind: "board", id: "abandoned-job-after-d4", fen: "6k1/8/8/8/3P4/2N5/8/6K1 b - - 0 1", /* ... */ },
	],
}
```

The full converted documents for all 14 guides are in `learn-proto/content.js` as `DOCS`. Two are curated by hand: `how-to-stop-blundering-in-chess` (3 boards, a stat CTA) and `20-minute-daily-chess-study-plan` (plan, drills, a source, a stat CTA). The stat CTA copy in both is new and marked `_protoCopy`.

## Rules the types cannot hold

A test file, `learnTemplate.test.ts`, checks each of these over every guide:

- `meta.title` is 60 characters or fewer, `meta.description` 160 or fewer. All 14 titles pass today. 4 descriptions do not and need trimming first: `how-to-get-better-at-chess-for-beginners` (170), `how-many-chess-puzzles-a-day` (169), `chess-pattern-recognition-drills` (168), `chess-visualization-exercises` (162).
- Every `questions` entry ends with "?" and does not repeat an FAQ question.
- Every `InlineLink.href`, `FurtherItem.slug` and article `cta` resolves to a live page. `crossLinks.test.ts` already does this for today's two lists.
- Every `board` replays: its `fen` is legal and every claim holds. `guideFacts.test.ts` moves onto `board.claims` and `facts`.
- Every `table` row has `columns.length - 1` cells.
- Each guide has a `game` CTA or a drill with `play`.
- `end` holds at most one `faq`, one `furtherReading` and one `sources`.
- No `cta.why` sentence of 5 or more words appears in more than three guides (the AdSense rule, run at build time instead of after deploy).

## Writing a new guide

1. Pick the group. If none fits, add a `planned` group to `LEARN_GROUPS` and set it live.
2. Write `meta.questions` first, in the words a reader would type. They drive the search and keep the guide on topic.
3. Write the answer in `intro.quickAnswer` before any section.
4. Draw every position the prose states as a `board`, or list it in `facts` when a picture would not help. Give each a `claims` list.
5. End with something to do: a `game` CTA at the least, and a `stat` CTA when the guide trains a figure the dashboard shows.
