/**
 * Goal ids and their hrefs. The visible label, description and accent live in
 * the `learnArticle.goals` messages -- see EN_LEARN_GOALS in ./index.
 */
export const LEARN_GOAL_IDS = [
  "reduce-blunders",
  "visualization",
  "memory",
  "routine",
] as const;

export const LEARN_GOAL_HREFS: Record<(typeof LEARN_GOAL_IDS)[number], string> = {
  "reduce-blunders": "/learn/how-to-stop-blundering-in-chess",
  visualization: "/learn/chess-visualization-exercises",
  memory: "/learn/chess-memory-training",
  routine: "/learn/20-minute-daily-chess-study-plan",
};

export type LearnGoalId = (typeof LEARN_GOAL_IDS)[number];

export type LearnFaq = {
  question: string;
  answer: string;
};

/** The round a drill is played as. Absent for drills done away from the game. */
export type LearnGameSetup = {
  pieceCount: number;
  memorizeTime: number;
};

export type LearnDrillCard = {
  title: string;
  description: string;
  duration: string;
  goal: string;
  ctaLabel: string;
  setup?: LearnGameSetup;
};

export function gameHref(setup?: LearnGameSetup): string {
  return setup
    ? `/game?pieceCount=${setup.pieceCount}&memorizeTime=${setup.memorizeTime}`
    : "/game";
}

export type LearnComparisonRow = {
  label: string;
  struggling: string;
  stronger: string;
};

export type LearnPlanStep = {
  label: string;
  duration: string;
  detail: string;
};

export type LearnSource = {
  title: string;
  url: string;
  note?: string;
};

export type LearnRelatedArticle = {
  slug: string;
  reason: string;
};

export type LearnTableOfContentsItem = {
  id: string;
  label: string;
};

/** One piece of a section. A section uses only the kinds it needs, in its own order. */
export type LearnBlock =
  | { kind: "paragraphs"; paragraphs: string[] }
  | { kind: "steps"; ordered: boolean; items: string[] }
  | { kind: "callout"; title: string; body: string }
  | { kind: "drills"; drills: LearnDrillCard[] }
  | {
      kind: "comparison";
      columns: [string, string, string];
      rows: LearnComparisonRow[];
    }
  | { kind: "plan"; steps: LearnPlanStep[] };

export type LearnSection = {
  id: string;
  title: string;
  eyebrow?: string;
  summary?: string;
  blocks: LearnBlock[];
};

/** A guide owns its page: its sections, their order, and its own dates. */
export type LearnGuide = {
  slug: string;
  goal: LearnGoalId;
  title: string;
  h1: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  ctaLabel: string;
  quickAnswer: string;
  keyTakeaways?: string[];
  whoThisIsFor?: string[];
  timeToRead: string;
  difficulty: "Beginner" | "Beginner to Intermediate";
  featured?: boolean;
  publishedAt: string;
  updatedAt: string;
  sections: LearnSection[];
  faq: LearnFaq[];
  relatedArticles: LearnRelatedArticle[];
  sources: LearnSource[];
};

/** A guide plus what the page derives from it. */
export type LearnPageContent = LearnGuide & {
  ctaHref: string;
  tableOfContents: LearnTableOfContentsItem[];
};

// A named person with a page behind the name. The guides used to credit a
// pseudonymous "Editorial Team" whose JSON-LD id resolved to /learn, which
// says nothing about who writes.
export const LEARN_AUTHOR = {
  name: "Bing Cheng",
  url: "https://thememorychess.com/about",
  id: "https://thememorychess.com/about#bing-cheng",
} as const;
