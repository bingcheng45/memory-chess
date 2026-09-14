import {
  buildGuide,
  LEARN_GOAL_HREFS,
  LEARN_GOAL_IDS,
  type LearnArticleChrome,
  type LearnGoalId,
  type LearnPageContent,
} from "./schema";
import { EN_GUIDES } from "./content.en";
import enMessages from "../../../../messages/en.json";

export * from "./schema";

export type LearnGoal = {
  id: LearnGoalId;
  label: string;
  description: string;
  accent: string;
  href: string;
};

/**
 * Chrome from a plain messages object rather than the request-scoped
 * translator. Keeps the English article set buildable without a next-intl
 * request context, which is what makes it testable and what the sitemap and
 * generateStaticParams use.
 */
type LearnArticleMessages = (typeof enMessages)["learnArticle"];

export function chromeFromMessages(
  messages: LearnArticleMessages,
): LearnArticleChrome {
  return {
    faqLabel: messages.faqLabel,
    whatChangesTitle: messages.whatChangesTitle,
    startHereSummary: messages.startHereSummary,
    drillsSummary: messages.drillsSummary,
    comparisonColumns: [
      messages.comparisonColumns.situation,
      messages.comparisonColumns.before,
      messages.comparisonColumns.after,
    ],
    mistakesTitle: messages.mistakesTitle,
    whatToDoInsteadTitle: messages.whatToDoInsteadTitle,
    planSummary: messages.planSummary,
    goalAccent: Object.fromEntries(
      LEARN_GOAL_IDS.map((id) => [id, messages.goals[id].accent]),
    ) as Record<LearnGoalId, string>,
  };
}

/** English article set, resolved eagerly and without a request context. */
export const EN_LEARN_PAGES: LearnPageContent[] = EN_GUIDES.map((guide) =>
  buildGuide(guide, chromeFromMessages(enMessages.learnArticle)),
);

/** English goals, same rationale as EN_LEARN_PAGES. */
export const EN_LEARN_GOALS: LearnGoal[] = LEARN_GOAL_IDS.map((id) => ({
  id,
  label: enMessages.learnArticle.goals[id].label,
  description: enMessages.learnArticle.goals[id].description,
  accent: enMessages.learnArticle.goals[id].accent,
  href: LEARN_GOAL_HREFS[id],
}));

/** Slugs, needed by the sitemap and generateStaticParams. */
export const LEARN_SLUGS = EN_GUIDES.map((guide) => guide.slug);

export function isLearnSlug(slug: string): boolean {
  return LEARN_SLUGS.includes(slug);
}
