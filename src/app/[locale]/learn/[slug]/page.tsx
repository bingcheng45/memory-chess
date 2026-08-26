import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LearnArticleRich from '@/components/learn/LearnArticleRich';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { findLearnPageBySlug, LEARN_PAGES } from '@/lib/seo/learnPages';

type LearnArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return LEARN_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: LearnArticlePageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!findLearnPageBySlug(slug)) {
    notFound();
  }

  return buildLearnPageMetadata(slug);
}

export default async function LearnArticlePage({
  params,
}: LearnArticlePageProps) {
  const { slug } = await params;
  const page = findLearnPageBySlug(slug);

  if (!page) {
    notFound();
  }

  return <LearnArticleRich page={page} />;
}
