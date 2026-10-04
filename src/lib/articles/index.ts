import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { textOf, withText } from "./articleText";
import adriaanDeGroot from "./entries/adriaan-de-groot";
import juditPolgar from "./entries/judit-polgar";
import magnusCarlsen from "./entries/magnus-carlsen";
import { formatArticleDate } from "./format";
import type { Article, ArticleSummary } from "./schema";
import { loadArticleText, type TranslationSource } from "./translations";

export * from "./schema";

const REGISTRY: readonly [Article, ...Article[]] = [magnusCarlsen, adriaanDeGroot, juditPolgar];

export function newestFirst(articles: readonly Article[]): Article[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function summarize(article: Article, locale: Locale): ArticleSummary {
  const { slug, publishedAt, title, description, person } = article;
  const { src, width, height, alt } = article.photo;
  return {
    slug,
    publishedAt,
    publishedLabel: formatArticleDate(publishedAt, locale),
    title,
    description,
    person,
    photo: { src, width, height, alt },
  };
}

/** The English entries, newest first. English is the source every translation is made from. */
export const ARTICLES: readonly Article[] = newestFirst(REGISTRY);

export const ARTICLE_SLUGS: readonly string[] = ARTICLES.map((article) => article.slug);

async function inLocale(english: Article, locale: Locale, source?: TranslationSource): Promise<Article> {
  if (locale === DEFAULT_LOCALE) return english;
  return withText(english, await loadArticleText(english.slug, locale, textOf(english), source));
}

/**
 * The article in `locale`, or `undefined` for an unknown slug. English is the
 * entry itself. Any other locale throws unless it has a reviewed translation of
 * the current English text, so a page never mixes languages.
 */
export async function getArticle(
  slug: string,
  locale: Locale,
  source?: TranslationSource,
): Promise<Article | undefined> {
  const english = ARTICLES.find((article) => article.slug === slug);
  return english && inLocale(english, locale, source);
}

export async function getArticleSummaries(
  locale: Locale,
  source?: TranslationSource,
): Promise<readonly ArticleSummary[]> {
  const articles = await Promise.all(ARTICLES.map((english) => inLocale(english, locale, source)));
  return articles.map((article) => summarize(article, locale));
}

export async function getNextArticle(
  slug: string,
  locale: Locale,
  source?: TranslationSource,
): Promise<ArticleSummary | undefined> {
  const index = ARTICLE_SLUGS.indexOf(slug);
  if (index < 0 || ARTICLES.length < 2) return undefined;
  return summarize(await inLocale(ARTICLES[(index + 1) % ARTICLES.length], locale, source), locale);
}

export const ARTICLES_LAST_UPDATED: string = REGISTRY.reduce(
  (latest, article) => (article.updatedAt > latest ? article.updatedAt : latest),
  REGISTRY[0].updatedAt,
);
