import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LearnArticleRich from '@/components/learn/LearnArticleRich';
import { DEFAULT_LOCALE } from '@/i18n/routing';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { EN_LEARN_GOALS, EN_LEARN_PAGES, LEARN_SLUGS } from '@/lib/seo/learn';

type LearnArticlePageProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

export function generateStaticParams({
  params,
}: {
  params: { locale: string };
}) {
  return params.locale === DEFAULT_LOCALE
    ? LEARN_SLUGS.map((slug) => ({ slug }))
    : [];
}

function findPage(slug: string) {
  return EN_LEARN_PAGES.find((entry) => entry.slug === slug);
}

export async function generateMetadata({
  params,
}: LearnArticlePageProps): Promise<Metadata> {
  const page = findPage((await params).slug);

  if (!page) {
    notFound();
  }

  return buildLearnPageMetadata(page);
}

export default async function LearnArticlePage({
  params,
}: LearnArticlePageProps) {
  const page = findPage((await params).slug);

  if (!page) {
    notFound();
  }

  return (
    <LearnArticleRich
      page={page}
      goals={EN_LEARN_GOALS}
      allPages={EN_LEARN_PAGES}
    />
  );
}
