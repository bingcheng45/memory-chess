import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import ArticlePage from "@/components/articles/ArticlePage";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { ARTICLE_SLUGS, getArticle, getNextArticle } from "@/lib/articles";
import { buildArticleMetadata } from "@/lib/seo/articleMetadata";

type ArticleRouteProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return params.locale === DEFAULT_LOCALE ? ARTICLE_SLUGS.map((slug) => ({ slug })) : [];
}

export async function generateMetadata({ params }: ArticleRouteProps): Promise<Metadata> {
  const article = getArticle((await params).slug);

  if (!article) {
    notFound();
  }

  return buildArticleMetadata(article);
}

export default async function ArticleRoute({ params }: ArticleRouteProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const article = getArticle(slug);

  if (!article) {
    notFound();
  }

  return <ArticlePage article={article} nextArticle={getNextArticle(article.slug)} />;
}
