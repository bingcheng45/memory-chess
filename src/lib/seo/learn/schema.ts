export const PUBLISHED_AT = "2026-03-06T00:00:00.000Z";
export const UPDATED_AT = "2026-08-17T00:00:00.000Z";

/**
 * Goal ids and their hrefs are language-neutral. The visible label,
 * description and accent live in the `learnArticle.goals` messages so they can
 * follow the locale -- see getLearnGoals() in ./index.
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

export type LearnDrillCard = {
  title: string;
  description: string;
  duration: string;
  goal: string;
  ctaLabel: string;
  href: "/game";
};

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
  note: string;
};

export type LearnRelatedArticle = {
  slug: string;
  reason: string;
};

export type LearnContentSection = {
  id: string;
  title: string;
  eyebrow?: string;
  summary?: string;
  paragraphs?: string[];
  bullets?: string[];
  orderedBullets?: string[];
  callout?: {
    title: string;
    body: string;
  };
  drillCards?: LearnDrillCard[];
  comparisonRows?: LearnComparisonRow[];
  comparisonColumns?: [string, string, string];
  planSteps?: LearnPlanStep[];
};

export type LearnTableOfContentsItem = {
  id: string;
  label: string;
};

export type LearnPageContent = {
  slug: string;
  goal: LearnGoalId;
  title: string;
  h1: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  painPoint: string;
  ctaLabel: string;
  ctaHref: "/game";
  publishedAt: string;
  updatedAt: string;
  reviewedBy: string;
  quickAnswer: string;
  keyTakeaways: string[];
  whoThisIsFor: string[];
  timeToRead: string;
  difficulty: "Beginner" | "Beginner to Intermediate";
  featured: boolean;
  tableOfContents: LearnTableOfContentsItem[];
  contentSections: LearnContentSection[];
  faq: LearnFaq[];
  relatedArticles: LearnRelatedArticle[];
  relatedDrills: LearnDrillCard[];
  sources: LearnSource[];
};

export type BuildGuideInput = {
  slug: string;
  goal: LearnGoalId;
  title: string;
  h1: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  painPoint: string;
  ctaLabel: string;
  quickAnswer: string;
  keyTakeaways: string[];
  whoThisIsFor: string[];
  timeToRead: string;
  difficulty: LearnPageContent["difficulty"];
  featured?: boolean;
  introParagraphs: string[];
  startHereTitle: string;
  startHereSteps: string[];
  drillSectionTitle: string;
  drillCards: LearnDrillCard[];
  comparisonTitle: string;
  comparisonSummary: string;
  comparisonRows: LearnComparisonRow[];
  mistakes: string[];
  mistakesCallout: string;
  planTitle: string;
  planSteps: LearnPlanStep[];
  faq: LearnFaq[];
  relatedArticles: LearnRelatedArticle[];
  relatedDrills?: LearnDrillCard[];
  sources?: LearnSource[];
};

// A named person with a page behind the name. The guides used to credit a
// pseudonymous "Editorial Team" whose JSON-LD id resolved to /learn, which
// says nothing about who writes.
const EDITORIAL_REVIEWER = "Bing Cheng";

const CHESS_MEMORY_SOURCE: LearnSource = {
  title: "Templates in Chess Memory: A Mechanism for Recalling Several Boards",
  url: "https://doi.org/10.1006/cogp.1996.0011",
  note: "Gobet and Simon's research on how skilled players use chunks and templates to encode chess positions.",
};

const CHESS_RECOGNITION_SOURCE: LearnSource = {
  title: "Recognition and Look-Ahead Search in Time-Constrained Expert Chess",
  url: "https://doi.org/10.1111/j.1467-9280.1996.tb00666.x",
  note: "Research comparing recognition and calculation in time-constrained grandmaster play.",
};

const RETRIEVAL_PRACTICE_SOURCE: LearnSource = {
  title: "Test-Enhanced Learning: Taking Memory Tests Improves Retention",
  url: "https://doi.org/10.1111/j.1467-9280.2006.01693.x",
  note: "Experimental research showing that active recall can improve later retention more than repeated study.",
};

const SPACED_PRACTICE_SOURCE: LearnSource = {
  title: "Distributed Practice in Verbal Recall Tasks",
  url: "https://doi.org/10.1037/0033-2909.132.3.354",
  note: "A quantitative review of how spacing practice affects long-term retention.",
};

const GOAL_SOURCES: Record<LearnGoalId, LearnSource[]> = {
  "reduce-blunders": [CHESS_RECOGNITION_SOURCE, CHESS_MEMORY_SOURCE],
  visualization: [CHESS_MEMORY_SOURCE, CHESS_RECOGNITION_SOURCE],
  memory: [CHESS_MEMORY_SOURCE, RETRIEVAL_PRACTICE_SOURCE],
  routine: [SPACED_PRACTICE_SOURCE, RETRIEVAL_PRACTICE_SOURCE],
};

/**
 * Section headings, callout titles and column labels that are identical across
 * all 16 articles. They used to be hardcoded English inside buildGuide, which
 * left them untranslated no matter what the article content said.
 */
export type LearnArticleChrome = {
  faqLabel: string;
  whatChangesTitle: string;
  trackThisWeekTitle: string;
  trackThisWeekBody: string;
  startHereSummary: string;
  drillsSummary: string;
  comparisonColumns: [string, string, string];
  mistakesTitle: string;
  whatToDoInsteadTitle: string;
  planSummary: string;
  goalAccent: Record<LearnGoalId, string>;
};

function buildTableOfContents(
  sections: LearnContentSection[],
  faq: LearnFaq[],
  faqLabel: string,
) {
  const baseItems = sections.map((section) => ({
    id: section.id,
    label: section.title,
  }));

  if (faq.length > 0) {
    baseItems.push({ id: "faq", label: faqLabel });
  }

  return baseItems;
}

export function buildGuide(
  input: BuildGuideInput,
  chrome: LearnArticleChrome,
): LearnPageContent {
  const sections: LearnContentSection[] = [
    {
      id: "what-changes",
      title: chrome.whatChangesTitle,
      eyebrow: chrome.goalAccent[input.goal],
      paragraphs: input.introParagraphs,
      callout: {
        title: chrome.trackThisWeekTitle,
        body: chrome.trackThisWeekBody,
      },
    },
    {
      id: "start-here",
      title: input.startHereTitle,
      summary: chrome.startHereSummary,
      orderedBullets: input.startHereSteps,
    },
    {
      id: "drills",
      title: input.drillSectionTitle,
      summary: chrome.drillsSummary,
      drillCards: input.drillCards,
    },
    {
      id: "comparison",
      title: input.comparisonTitle,
      summary: input.comparisonSummary,
      comparisonColumns: chrome.comparisonColumns,
      comparisonRows: input.comparisonRows,
    },
    {
      id: "mistakes",
      title: chrome.mistakesTitle,
      bullets: input.mistakes,
      callout: {
        title: chrome.whatToDoInsteadTitle,
        body: input.mistakesCallout,
      },
    },
    {
      id: "plan",
      title: input.planTitle,
      summary: chrome.planSummary,
      planSteps: input.planSteps,
    },
  ];

  return {
    slug: input.slug,
    goal: input.goal,
    title: input.title,
    h1: input.h1,
    description: input.description,
    primaryKeyword: input.primaryKeyword,
    secondaryKeywords: input.secondaryKeywords,
    painPoint: input.painPoint,
    ctaLabel: input.ctaLabel,
    ctaHref: "/game",
    publishedAt: PUBLISHED_AT,
    updatedAt: UPDATED_AT,
    reviewedBy: EDITORIAL_REVIEWER,
    quickAnswer: input.quickAnswer,
    keyTakeaways: input.keyTakeaways,
    whoThisIsFor: input.whoThisIsFor,
    timeToRead: input.timeToRead,
    difficulty: input.difficulty,
    featured: Boolean(input.featured),
    tableOfContents: buildTableOfContents(sections, input.faq, chrome.faqLabel),
    contentSections: sections,
    faq: input.faq,
    relatedArticles: input.relatedArticles,
    relatedDrills: input.relatedDrills ?? input.drillCards,
    sources: [...GOAL_SOURCES[input.goal], ...(input.sources ?? [])],
  };
}
