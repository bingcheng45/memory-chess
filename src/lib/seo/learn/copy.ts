import type { LearnGoalId } from "./schema";

/**
 * Chrome for the Learn hub and guides. Learn is English-only (see
 * ENGLISH_ONLY_ROUTES), so this copy lives here instead of in 24 catalogues
 * that no translated page reads.
 */
export const LEARN_ARTICLE_COPY = {
  faqLabel: "FAQ",
  breadcrumbHome: "Home",
  breadcrumbLearn: "Learn",
  eyebrow: "Simple chess guide",
  updated: (date: string) => `Updated ${date}`,
  startHere: "Start here",
  whatYouWillLearn: "What you will learn",
  whoThisIsFor: "Who this is for",
  browseAllGuides: "Browse all guides",
  onThisPage: "On this page",
  aimFor: "Aim for:",
  keepLearning: "Keep learning",
  whatToLearnNext: "What to learn next",
  commonQuestions: "Common questions",
  referenceLinks: "Reference links",
};

type LearnGoalCopy = { label: string; description: string; accent: string };

export const LEARN_GOAL_COPY: Record<LearnGoalId, LearnGoalCopy> = {
  "reduce-blunders": {
    label: "Reduce blunders",
    description: "Build a faster threat-check habit and stop hanging pieces in simple positions.",
    accent: "Threat checks",
  },
  visualization: {
    label: "Improve visualization",
    description: "Hold the board in your head longer so calculation feels calmer and clearer.",
    accent: "Mental board control",
  },
  memory: {
    label: "Train memory",
    description: "Improve board recall and pattern retention without turning training into theory homework.",
    accent: "Recall and retention",
  },
  routine: {
    label: "Build a daily routine",
    description: "Use a short plan that combines drills, games, and review.",
    accent: "Consistency",
  },
};

export type LearnQuickStartId = "newToChess" | "missingThreats" | "losingPosition";

export const LEARN_HUB_COPY = {
  meta: {
    title: "Learn Chess One Clear Step at a Time",
    description:
      "Practical beginner chess guides for board vision, visualization, memory, calculation, blunder prevention, and daily practice.",
  },
  title: "Learn Chess One Clear Step at a Time",
  startBeginner: "Start the beginner guide",
  playCta: "Play Memory Chess",
  startHere: "Start here",
  pickNext: "Pick Your Next Step",
  chooseGoal: "Choose a Goal",
  readRecallPlay: "Read, recall, play",
  turnIdea: "Turn one idea into practice",
  startRound: "Start a memory round",
  eyebrow: "Learn with Memory Chess",
  heroDescription:
    "Choose what you want to improve. Each guide explains one useful idea in plain language, then gives you a short drill to try.",
  pickNextDescription:
    "Choose the sentence that sounds most like your current game. There is no perfect order, and you can change paths at any time.",
  allGuides: (count: number) => `All ${count} guides`,
  chooseGoalDescription: "Guides in each goal are listed easiest first.",
  guideNumber: (number: string) => `Guide ${number}`,
  turnIdeaDescription:
    "Read one guide, play one short round while the idea is fresh, then notice what was easy to remember and what needs another try.",
  paths: {
    newToChess: {
      label: "New to chess",
      title: "Build a simple improvement plan",
      description: "Start with the fundamentals, then turn one useful idea into a repeatable daily habit.",
    },
    missingThreats: {
      label: "Missing simple threats",
      title: "Stop blundering pieces",
      description:
        "Run a five-step scan for checks, captures, threats and loose pieces before each move, and keep a blunder tally per game.",
    },
    losingPosition: {
      label: "Losing the position in your head",
      title: "Strengthen visualization and recall",
      description:
        "Practice holding a small, accurate picture of the board before adding longer move sequences.",
    },
  } satisfies Record<LearnQuickStartId, { label: string; title: string; description: string }>,
};
