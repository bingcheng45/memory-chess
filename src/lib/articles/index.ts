import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { servesArticlesIn } from "./articleLocales";
import { textOf, withText } from "./articleText";
import { loadArticleChrome } from "./chrome";
import { formatArticleDate } from "./format";
import { ARTICLES, ARTICLE_SLUGS } from "./registry";
import type { Article, ArticleSummary } from "./schema";
import { tileArticleOf, type TileArticle } from "./tile";
import { loadArticleText } from "./translations";

export * from "./schema";
export { ARTICLES, ARTICLES_LAST_UPDATED, ARTICLE_SLUGS, newestFirst } from "./registry";

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

const chromeChecks = new Map<Locale, Promise<unknown>>();

// Every page of a locale prints the same strings, so one check per process covers them all.
function chromeCheckOf(locale: Locale): Promise<unknown> {
  const started = chromeChecks.get(locale) ?? loadArticleChrome(locale);
  chromeChecks.set(locale, started);
  return started;
}

async function inLocale(english: Article, locale: Locale): Promise<Article> {
  if (locale === DEFAULT_LOCALE) return english;
  await chromeCheckOf(locale);
  return withText(english, await loadArticleText(english.slug, locale, textOf(english)));
}

/**
 * The article in `locale`, or `undefined` for an unknown slug. English is the
 * entry itself. Any other locale throws unless it has a reviewed translation of
 * the current English text, and reviewed strings for the section, so a page
 * never mixes languages.
 */
export async function getArticle(slug: string, locale: Locale): Promise<Article | undefined> {
  const english = ARTICLES.find((article) => article.slug === slug);
  return english && inLocale(english, locale);
}

export async function getArticleSummaries(locale: Locale): Promise<readonly ArticleSummary[]> {
  const articles = await Promise.all(ARTICLES.map((english) => inLocale(english, locale)));
  return articles.map((article) => summarize(article, locale));
}

/** Empty for a locale that does not serve the articles, so a translated page never shows English article text. */
export async function getTileArticles(locale: string): Promise<readonly TileArticle[]> {
  if (!servesArticlesIn(locale)) return [];
  const articles = await Promise.all(ARTICLES.map((english) => inLocale(english, locale)));
  return articles.map(tileArticleOf);
}

export async function getNextArticle(slug: string, locale: Locale): Promise<ArticleSummary | undefined> {
  const index = ARTICLE_SLUGS.indexOf(slug);
  if (index < 0 || ARTICLES.length < 2) return undefined;
  return summarize(await inLocale(ARTICLES[(index + 1) % ARTICLES.length], locale), locale);
}
