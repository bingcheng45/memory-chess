import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { textOf, withText } from "./articleText";
import { formatArticleDate } from "./format";
import { ARTICLES, ARTICLE_SLUGS } from "./registry";
import type { Article, ArticleSummary } from "./schema";
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

async function inLocale(english: Article, locale: Locale): Promise<Article> {
  if (locale === DEFAULT_LOCALE) return english;
  return withText(english, await loadArticleText(english.slug, locale, textOf(english)));
}

/**
 * The article in `locale`, or `undefined` for an unknown slug. English is the
 * entry itself. Any other locale throws unless it has a reviewed translation of
 * the current English text, so a page never mixes languages.
 */
export async function getArticle(slug: string, locale: Locale): Promise<Article | undefined> {
  const english = ARTICLES.find((article) => article.slug === slug);
  return english && inLocale(english, locale);
}

export async function getArticleSummaries(locale: Locale): Promise<readonly ArticleSummary[]> {
  const articles = await Promise.all(ARTICLES.map((english) => inLocale(english, locale)));
  return articles.map((article) => summarize(article, locale));
}

export async function getNextArticle(slug: string, locale: Locale): Promise<ArticleSummary | undefined> {
  const index = ARTICLE_SLUGS.indexOf(slug);
  if (index < 0 || ARTICLES.length < 2) return undefined;
  return summarize(await inLocale(ARTICLES[(index + 1) % ARTICLES.length], locale), locale);
}
