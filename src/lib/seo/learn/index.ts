import { getTranslations } from "next-intl/server";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import {
  buildGuide,
  LEARN_GOAL_HREFS,
  LEARN_GOAL_IDS,
  type BuildGuideInput,
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
    trackThisWeekTitle: messages.trackThisWeekTitle,
    trackThisWeekBody: messages.trackThisWeekBody,
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

/**
 * Locales with a complete translated article set.
 *
 * This gate exists for SEO, not convenience. Falling back to English is fine
 * for a reader, but advertising an hreflang for a locale that serves identical
 * English is a duplicate-content signal -- it tells Google a translation exists
 * when it does not. Learn routes only emit alternates for locales listed here,
 * and everything else canonicalises to English.
 *
 * Add a locale here in the same commit that adds its content.<locale>.ts.
 */
const TRANSLATED_LEARN_LOCALES = new Set<Locale>([]);

export function hasLearnTranslation(locale: string): boolean {
  return locale === DEFAULT_LOCALE || TRANSLATED_LEARN_LOCALES.has(locale as Locale);
}

/** Locales whose Learn content is genuinely distinct, for hreflang and sitemap. */
export function learnLocales(): Locale[] {
  return [DEFAULT_LOCALE, ...TRANSLATED_LEARN_LOCALES];
}

/**
 * Per-locale article inputs. English is bundled directly; other locales are
 * loaded on demand so a reader of one language never downloads the prose of
 * twenty-three others.
 */
async function loadGuides(locale: string): Promise<BuildGuideInput[]> {
  if (!hasLearnTranslation(locale) || locale === DEFAULT_LOCALE) {
    return EN_GUIDES;
  }

  try {
    const mod = await import(`./content.${locale}`);
    return mod.GUIDES as BuildGuideInput[];
  } catch {
    // A locale listed as translated but missing its file is a build mistake,
    // not a reader's problem -- serve English rather than erroring the page.
    return EN_GUIDES;
  }
}

async function loadChrome(locale: string): Promise<LearnArticleChrome> {
  // Section headings follow the article, not the UI. A locale without a
  // translated article set gets English chrome too -- otherwise the page reads
  // as German headings wrapped around English prose, which is worse for the
  // reader than a page that is simply, consistently English.
  const chromeLocale = hasLearnTranslation(locale) ? locale : DEFAULT_LOCALE;
  const t = await getTranslations({
    locale: chromeLocale,
    namespace: "learnArticle",
  });

  return {
    faqLabel: t("faqLabel"),
    whatChangesTitle: t("whatChangesTitle"),
    trackThisWeekTitle: t("trackThisWeekTitle"),
    trackThisWeekBody: t("trackThisWeekBody"),
    startHereSummary: t("startHereSummary"),
    drillsSummary: t("drillsSummary"),
    comparisonColumns: [
      t("comparisonColumns.situation"),
      t("comparisonColumns.before"),
      t("comparisonColumns.after"),
    ],
    mistakesTitle: t("mistakesTitle"),
    whatToDoInsteadTitle: t("whatToDoInsteadTitle"),
    planSummary: t("planSummary"),
    goalAccent: Object.fromEntries(
      LEARN_GOAL_IDS.map((id) => [id, t(`goals.${id}.accent`)]),
    ) as Record<LearnGoalId, string>,
  };
}

export async function getLearnPages(
  locale: string,
): Promise<LearnPageContent[]> {
  const [guides, chrome] = await Promise.all([
    loadGuides(locale),
    loadChrome(locale),
  ]);

  return guides.map((guide) => buildGuide(guide, chrome));
}

export async function getLearnPage(
  slug: string,
  locale: string,
): Promise<LearnPageContent | undefined> {
  const pages = await getLearnPages(locale);
  return pages.find((page) => page.slug === slug);
}

export async function getLearnGoals(locale: string): Promise<LearnGoal[]> {
  // Same reasoning as loadChrome: goal labels sit alongside article copy.
  const goalLocale = hasLearnTranslation(locale) ? locale : DEFAULT_LOCALE;
  const t = await getTranslations({
    locale: goalLocale,
    namespace: "learnArticle.goals",
  });

  return LEARN_GOAL_IDS.map((id) => ({
    id,
    label: t(`${id}.label`),
    description: t(`${id}.description`),
    accent: t(`${id}.accent`),
    href: LEARN_GOAL_HREFS[id],
  }));
}

/**
 * Slugs and publish dates, needed by the sitemap and generateStaticParams.
 * Language-neutral by design, so this never has to resolve a locale.
 */
export const LEARN_SLUGS = EN_GUIDES.map((guide) => guide.slug);

export function isLearnSlug(slug: string): boolean {
  return LEARN_SLUGS.includes(slug);
}
