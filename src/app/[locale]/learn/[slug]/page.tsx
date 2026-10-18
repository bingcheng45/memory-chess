import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LearnGuidePage from '@/components/learn/LearnGuidePage';
import { DEFAULT_LOCALE } from '@/i18n/routing';
import { ARTICLES } from '@/lib/articles';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { EN_LEARN_PAGES, LEARN_SLUGS, findLearnPage, type LearnPage } from '@/lib/seo/learn';

type LearnGuideRouteProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

// Next 15.5 prerenders nothing for this route if any locale gets an empty
// list, so every locale returns the English params and Next dedupes them.
export function generateStaticParams() {
  return LEARN_SLUGS.map((slug) => ({ locale: DEFAULT_LOCALE, slug }));
}

const titleOf = (slug: string, entries: readonly { slug: string; title: string }[]) => {
  const entry = entries.find((candidate) => candidate.slug === slug);
  if (!entry) throw new Error(`No page for ${slug}`);
  return entry.title;
};

const TITLES = {
  guide: (slug: string) => titleOf(slug, EN_LEARN_PAGES.map(({ meta }) => meta)),
  article: (slug: string) => titleOf(slug, ARTICLES),
};

function siblingsOf(page: LearnPage): LearnPage[] {
  const named = new Set(page.end.flatMap((block) => (block.kind === 'furtherReading' ? block.items.map((item) => item.slug) : [])));
  return EN_LEARN_PAGES.filter(
    (other) => other.group.id === page.group.id && other.meta.slug !== page.meta.slug && !named.has(other.meta.slug),
  );
}

export async function generateMetadata({
  params,
}: LearnGuideRouteProps): Promise<Metadata> {
  const page = findLearnPage((await params).slug);

  if (!page) {
    notFound();
  }

  return buildLearnPageMetadata(page);
}

export default async function LearnGuideRoute({
  params,
}: LearnGuideRouteProps) {
  const page = findLearnPage((await params).slug);

  if (!page) {
    notFound();
  }

  return <LearnGuidePage page={page} siblings={siblingsOf(page)} titles={TITLES} />;
}
