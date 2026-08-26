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
const TRANSLATED_LEARN_LOCALES = new Set<Locale>(["ru", "zh-CN", "pt-BR", "es", "de", "fr", "it", "tr", "hi", "ja", "ko", "zh-TW", "pl", "nl", "sv", "id", "vi", "cs", "no", "fi", "ro"]);

export function hasLearnTranslation(locale: string): boolean {
  return locale === DEFAULT_LOCALE || TRANSLATED_LEARN_LOCALES.has(locale as Locale);
}

/** Locales whose Learn content is genuinely distinct, for hreflang and sitemap. */
export function learnLocales(): Locale[] {
  return [DEFAULT_LOCALE, ...TRANSLATED_LEARN_LOCALES];
}

/**
 * A locale's translated prose. Structural fields are deliberately absent --
 * slug, goal, difficulty, featured, drill hrefs, relatedArticles slugs and
 * source urls all come from the English guide, so a translation physically
 * cannot break routing, related links or citations.
 */
type ProseOverride = {
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
  introParagraphs: string[];
  startHereTitle: string;
  startHereSteps: string[];
  drillSectionTitle: string;
  drillCards: Array<{
    title: string;
    description: string;
    duration: string;
    goal: string;
    ctaLabel: string;
  }>;
  comparisonTitle: string;
  comparisonSummary: string;
  comparisonRows: Array<{
    label: string;
    struggling: string;
    stronger: string;
  }>;
  mistakes: string[];
  mistakesCallout: string;
  planTitle: string;
  planSteps: Array<{ label: string; duration: string; detail: string }>;
  faq: Array<{ question: string; answer: string }>;
  relatedArticles: Array<{ reason: string }>;
};

/** Overlays translated prose onto the English guide, keeping its structure. */
function mergeProse(
  guide: BuildGuideInput,
  prose: ProseOverride,
): BuildGuideInput {
  return {
    ...guide,
    title: prose.title,
    h1: prose.h1,
    description: prose.description,
    primaryKeyword: prose.primaryKeyword,
    secondaryKeywords: prose.secondaryKeywords,
    painPoint: prose.painPoint,
    ctaLabel: prose.ctaLabel,
    quickAnswer: prose.quickAnswer,
    keyTakeaways: prose.keyTakeaways,
    whoThisIsFor: prose.whoThisIsFor,
    timeToRead: prose.timeToRead,
    introParagraphs: prose.introParagraphs,
    startHereTitle: prose.startHereTitle,
    startHereSteps: prose.startHereSteps,
    drillSectionTitle: prose.drillSectionTitle,
    drillCards: guide.drillCards.map((card, i) => ({
      ...card,
      ...prose.drillCards[i],
    })),
    comparisonTitle: prose.comparisonTitle,
    comparisonSummary: prose.comparisonSummary,
    comparisonRows: prose.comparisonRows,
    mistakes: prose.mistakes,
    mistakesCallout: prose.mistakesCallout,
    planTitle: prose.planTitle,
    planSteps: prose.planSteps,
    faq: prose.faq,
    relatedArticles: guide.relatedArticles.map((entry, i) => ({
      ...entry,
      reason: prose.relatedArticles[i].reason,
    })),
    relatedDrills: guide.relatedDrills?.map((card, i) => ({
      ...card,
      ...prose.drillCards[i],
    })),
  };
}

/**
 * Per-locale article inputs. English is bundled directly; other locales load
 * their prose on demand so a reader of one language never downloads the text
 * of twenty-three others.
 */
async function loadGuides(locale: string): Promise<BuildGuideInput[]> {
  if (!hasLearnTranslation(locale) || locale === DEFAULT_LOCALE) {
    return EN_GUIDES;
  }

  try {
    const mod = await import(`./prose/${locale}.json`);
    const prose = (mod.default ?? mod) as ProseOverride[];
    return EN_GUIDES.map((guide, i) => mergeProse(guide, prose[i]));
  } catch {
    // A locale listed as translated but missing its prose file is a build
    // mistake, not a reader's problem -- serve English rather than erroring.
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
