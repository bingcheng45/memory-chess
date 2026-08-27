import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LearnArticleRich from '@/components/learn/LearnArticleRich';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { getLearnPage, getLearnPages, getLearnGoals, isLearnSlug, LEARN_SLUGS } from '@/lib/seo/learn';

type LearnArticlePageProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

/**
 * Slugs are language-neutral, so the same 16 params apply to every locale and
 * Next fans them out across the [locale] segment itself.
 */
export function generateStaticParams() {
  return LEARN_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: LearnArticlePageProps): Promise<Metadata> {
  const { slug, locale } = await params;

  if (!isLearnSlug(slug)) {
    notFound();
  }

  const page = await getLearnPage(slug, locale);

  if (!page) {
    notFound();
  }

  return buildLearnPageMetadata(page, locale);
}

export default async function LearnArticlePage({
  params,
}: LearnArticlePageProps) {
  const { slug, locale } = await params;
  const [allPages, goals] = await Promise.all([
    getLearnPages(locale),
    getLearnGoals(locale),
  ]);
  const page = allPages.find((entry) => entry.slug === slug);

  if (!page) {
    notFound();
  }

  return (
    <LearnArticleRich
      page={page}
      goals={goals}
      allPages={allPages}
      locale={locale}
    />
  );
}
