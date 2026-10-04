import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticlePage from "@/components/articles/ArticlePage";
import { typingRateFor } from "@/components/articles/typingPace";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { ARTICLE_SLUGS, getArticle, getNextArticle, type Article } from "@/lib/articles";
import { countsFor } from "@/lib/articles/stats";
import { servesArticlesIn } from "@/lib/articles/translatedLocales";
import { buildArticleMetadata } from "@/lib/seo/articleMetadata";
import { getArticleStats } from "@/lib/services/articleStatsService";

export const revalidate = 300;

type ArticleRouteProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return servesArticlesIn(params.locale) ? ARTICLE_SLUGS.map((slug) => ({ slug })) : [];
}

type ServedArticle = { article: Article; english: Article; locale: Locale };

async function servedArticle(slug: string, locale: string): Promise<ServedArticle> {
  if (!servesArticlesIn(locale)) notFound();
  const [article, english] = await Promise.all([getArticle(slug, locale), getArticle(slug, DEFAULT_LOCALE)]);
  if (!article || !english) notFound();

  return { article, english, locale };
}

export async function generateMetadata({ params }: ArticleRouteProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const { article } = await servedArticle(slug, locale);

  return buildArticleMetadata(article, locale);
}

export default async function ArticleRoute({ params }: ArticleRouteProps) {
  const { slug, locale: requested } = await params;
  setRequestLocale(requested);
  const { article, english, locale } = await servedArticle(slug, requested);
  const [stats, nextArticle] = await Promise.all([
    getArticleStats([article.slug]),
    getNextArticle(article.slug, locale),
  ]);

  return (
    <ArticlePage
      article={article}
      nextArticle={nextArticle}
      counts={countsFor(stats, article.slug)}
      charsPerSecond={typingRateFor(english.sections, article.sections)}
    />
  );
}
