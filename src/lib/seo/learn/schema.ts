import type { Square } from "chess.js";
import type { PhotoCredit } from "@/lib/articles/schema";
import type { DashboardTileId } from "@/lib/lab/dashboard";
import type { LearnPosition } from "./positions";
import GUIDE_CHROME from "./guideChrome";

export const LEARN_GROUPS = [
  {
    id: "foundations",
    label: GUIDE_CHROME.groups["foundations"],
    description: "How to improve from scratch and what to think about on every move.",
    status: "live",
    placement: "path",
  },
  {
    id: "board-vision",
    label: GUIDE_CHROME.groups["board-vision"],
    description: "See every piece, read squares at a glance, and stop dropping material.",
    status: "live",
    placement: "path",
  },
  {
    id: "visualization",
    label: GUIDE_CHROME.groups["visualization"],
    description: "Hold a position in your head and move pieces there without losing it.",
    status: "live",
    placement: "path",
  },
  {
    id: "memory",
    label: GUIDE_CHROME.groups["memory"],
    description: "Recall positions square by square and learn shapes worth remembering.",
    status: "live",
    placement: "path",
  },
  {
    id: "practice",
    label: GUIDE_CHROME.groups["practice"],
    description: "Short routines, puzzle counts and how to learn from your own games.",
    status: "live",
    placement: "path",
  },
  {
    id: "science",
    label: GUIDE_CHROME.groups["science"],
    description: "What de Groot, Chase and Simon and later research found, written for players.",
    status: "planned",
    placement: "path",
  },
  {
    id: "using-memory-chess",
    label: GUIDE_CHROME.groups["using-memory-chess"],
    description: "How a round is scored, what each preset tests and what your dashboard figures mean.",
    status: "planned",
    placement: "path",
  },
  {
    id: "compare",
    label: GUIDE_CHROME.groups["compare"],
    description: "What each memory and visualization trainer offers, read from its own pages and dated.",
    status: "live",
    placement: "shelf",
  },
] as const satisfies readonly {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly status: "live" | "planned";
  readonly placement: "path" | "shelf";
}[];

type WithLabel<T> = T extends unknown ? Omit<T, "label"> & { readonly label: string } : never;

export type LearnGroup = WithLabel<(typeof LEARN_GROUPS)[number]>;
export type LearnGroupId = LearnGroup["id"];

export type LearnLevel = keyof typeof GUIDE_CHROME.levels;

export type InlineLink = { readonly text: string; readonly href: `/${string}` };

export type Rich = string | readonly (string | InlineLink)[];

export type LearnMeta = {
  readonly slug: string;
  /** The <title>, 60 characters or fewer. */
  readonly title: string;
  readonly h1: string;
  /** The English `<title>` and share title when they differ from `title`. English-only, so a translation never carries it. */
  readonly searchTitle?: string;
  /** The meta description and the hub card text, 160 characters or fewer. */
  readonly description: string;
  readonly group: LearnGroupId;
  readonly level: LearnLevel;
  readonly publishedAt: string;
  readonly updatedAt: string;
  /** What a reader would type, each ending in "?" and none repeating an FAQ question. The search ranks these highest. */
  readonly questions: readonly [string, string, ...string[]];
  readonly keywords: { readonly primary: string; readonly secondary: readonly string[] };
  readonly featured?: true;
  /** A page to practise on, linked under the lede. English-only: it is not in the translated text, so a translation stays valid. */
  readonly practice?: { readonly href: `/${string}`; readonly label: string };
};

export type LearnIntro = {
  readonly quickAnswer: string;
  readonly takeaways: readonly string[];
  readonly audience: readonly string[];
};

/** `blindfold` opens the round with the position shown as notation instead of on the board. */
export type GameSetup = { readonly pieceCount: number; readonly memorizeTime: number; readonly blindfold?: true };

export type BoardArrow = { readonly from: Square; readonly to: Square; readonly kind: "attack" | "defend" | "pin" };
export type BoardMark = { readonly square: Square; readonly kind: "ring" };

export type Drill = {
  readonly title: string;
  readonly description: Rich;
  readonly duration: string;
  readonly goal: string;
  /** A drill played on the site. A drill done at a real board has none and renders no button. */
  readonly play?: GameSetup & { readonly label: string };
};

export type PlanStep = { readonly label: string; readonly duration: string; readonly detail: string };

export type BodyBlock =
  | { readonly kind: "prose"; readonly paragraphs: readonly [Rich, ...Rich[]] }
  | { readonly kind: "list"; readonly ordered: boolean; readonly items: readonly [Rich, ...Rich[]] }
  | { readonly kind: "takeaway"; readonly title: string; readonly body: string }
  | {
      readonly kind: "board";
      /** The drawn position is the checked one: guideFacts.test.ts replays its claims. */
      readonly position: LearnPosition;
      readonly arrows?: readonly BoardArrow[];
      readonly marks?: readonly BoardMark[];
      /** One sentence that says what to see. Also the board's accessible name. */
      readonly caption: string;
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
      readonly columns: readonly [string, string, ...string[]];
      readonly rows: readonly { readonly label: string; readonly cells: readonly string[] }[];
    }
  | { readonly kind: "plan"; readonly steps: readonly PlanStep[] }
  /** The wooden Memory Chess set and its Amazon link. Draws nothing while the link in `AFFILIATE` is empty. */
  | { readonly kind: "affiliate"; readonly label: string }
  /** The animated wooden-board game. The written rules must also be on the page, as the demo loads on scroll. */
  | { readonly kind: "rulesDemo"; readonly caption: string }
  | CtaBlock;

export type CtaTarget =
  | ({ readonly kind: "game"; readonly label: string } & GameSetup)
  | { readonly kind: "article"; readonly slug: string; readonly label: string }
  | { readonly kind: "stat"; readonly tile: DashboardTileId; readonly label: string };

/** `why` is written per guide: a shared sentence trips the AdSense repeated-sentence rule. */
export type CtaBlock = { readonly kind: "cta"; readonly target: CtaTarget; readonly why: string };

export type FaqItem = { readonly question: string; readonly answer: string };
export type Source = { readonly title: string; readonly url: `https://${string}`; readonly note?: string };
export type FurtherItem =
  | { readonly kind: "guide"; readonly slug: string; readonly reason: string }
  | { readonly kind: "article"; readonly slug: string; readonly reason: string };

export type EndBlock =
  | CtaBlock
  | { readonly kind: "faq"; readonly items: readonly [FaqItem, ...FaqItem[]] }
  | { readonly kind: "furtherReading"; readonly items: readonly [FurtherItem, ...FurtherItem[]] }
  | { readonly kind: "sources"; readonly items: readonly [Source, ...Source[]] };

export type LearnBlock = BodyBlock | EndBlock;

export type LearnSection = {
  readonly id: string;
  readonly heading: string;
  readonly summary?: string;
  readonly blocks: readonly [BodyBlock, ...BodyBlock[]];
  /** Positions the section's prose states without drawing them. guideFacts.test.ts replays these too. */
  readonly facts?: readonly LearnPosition[];
};

/** `url` is the product's own page; a product whose page could not be opened when checked has none. */
export type ComparedProduct = { readonly name: string; readonly url?: `https://${string}` };

export type Comparison = {
  /** The day every fact about another product on the page was read from that product's live public page. */
  readonly checkedAt: string;
  /** Written per page: says Memory Chess publishes it. */
  readonly disclosure: string;
  /** The products the page compares. Structured data lists them alphabetically. */
  readonly products?: readonly [ComparedProduct, ComparedProduct, ...ComparedProduct[]];
};

type LearnBody = {
  readonly intro: LearnIntro;
  readonly sections: readonly [LearnSection, ...LearnSection[]];
  /** In render order. At most one each of faq, furtherReading and sources. */
  readonly end: readonly EndBlock[];
};

export type LearnDocument = LearnBody &
  (
    | { readonly meta: LearnMeta & { readonly group: Exclude<LearnGroupId, "compare"> }; readonly comparison?: never }
    | { readonly meta: LearnMeta & { readonly group: "compare" }; readonly comparison: Comparison }
  );

export const LEARN_AUTHOR = {
  name: "Bing Cheng",
  url: "https://thememorychess.com/about",
  id: "https://thememorychess.com/about#bing-cheng",
} as const;

