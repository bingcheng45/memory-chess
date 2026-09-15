import {
  gameHref,
  LEARN_GOAL_HREFS,
  LEARN_GOAL_IDS,
  type LearnGoalId,
  type LearnGuide,
  type LearnPageContent,
} from "./schema";
import { LEARN_GUIDES } from "./guides";
import enMessages from "../../../../messages/en.json";

export * from "./schema";

export type LearnGoal = {
  id: LearnGoalId;
  label: string;
  description: string;
  accent: string;
  href: string;
};

function toPage(guide: LearnGuide): LearnPageContent {
  const firstRound = guide.sections
    .flatMap((section) => section.blocks)
    .flatMap((block) => (block.kind === "drills" ? block.drills : []))
    .find((drill) => drill.setup)?.setup;

  return {
    ...guide,
    ctaHref: gameHref(firstRound),
    tableOfContents: [
      ...guide.sections.map((section) => ({ id: section.id, label: section.title })),
      ...(guide.faq.length > 0
        ? [{ id: "faq", label: enMessages.learnArticle.faqLabel }]
        : []),
    ],
  };
}

export const EN_LEARN_PAGES: LearnPageContent[] = LEARN_GUIDES.map(toPage);

export const EN_LEARN_GOALS: LearnGoal[] = LEARN_GOAL_IDS.map((id) => ({
  id,
  label: enMessages.learnArticle.goals[id].label,
  description: enMessages.learnArticle.goals[id].description,
  accent: enMessages.learnArticle.goals[id].accent,
  href: LEARN_GOAL_HREFS[id],
}));

/** Slugs, needed by the sitemap and generateStaticParams. */
export const LEARN_SLUGS = LEARN_GUIDES.map((guide) => guide.slug);

/** The most recent guide edit, which is when the hub last changed. */
export const LEARN_LAST_UPDATED = LEARN_GUIDES.map((guide) => guide.updatedAt).sort().at(-1)!;
