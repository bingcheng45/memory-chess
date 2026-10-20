import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import LearnGuidePage from '@/components/learn/LearnGuidePage';
import type { TitleLookup } from '@/components/learn/LearnBlockView';
import type { Locale } from '@/i18n/routing';
import { ARTICLES, getArticle } from '@/lib/articles';
import { servesArticlesIn } from '@/lib/articles/articleLocales';
import { buildLearnPageMetadata } from '@/lib/seo/learnMetadata';
import { EN_LEARN_PAGES, LEARN_SLUGS, type LearnPage } from '@/lib/seo/learn';
import { guideLocalesOf } from '@/lib/seo/learn/links';
import { loadGuide, type LocalizedGuide } from '@/lib/seo/learn/load';

type LearnGuideRouteProps = {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
};

// Next 15.5 prerenders nothing for this route if any locale gets an empty
// list, so every locale returns the same full list and Next dedupes it.
export function generateStaticParams() {
  return LEARN_SLUGS.flatMap((slug) => guideLocalesOf(slug).map((locale) => ({ locale, slug })));
}

async function servedGuide(slug: string, locale: string): Promise<LocalizedGuide> {
  const guide = await loadGuide(slug, locale);
  if (!guide) notFound();
  return guide;
}

const titleOf = (slug: string, titles: ReadonlyMap<string, string>) => {
  const title = titles.get(slug);
  if (title === undefined) throw new Error(`No page for ${slug}`);
  return title;
};

async function titlesIn(locale: Locale): Promise<TitleLookup> {
  const [guides, articles] = await Promise.all([
    Promise.all(EN_LEARN_PAGES.map(async ({ meta }) => [meta.slug, (await loadGuide(meta.slug, locale))?.page.meta.title ?? meta.title] as const)),
    Promise.all(
      ARTICLES.map(async (english) => [english.slug, (servesArticlesIn(locale) ? await getArticle(english.slug, locale) : english)?.title ?? english.title] as const),
    ),
  ]);
  const guideTitles = new Map(guides);
  const articleTitles = new Map(articles);
  return { guide: (slug) => titleOf(slug, guideTitles), article: (slug) => titleOf(slug, articleTitles) };
}

function siblingsOf(page: LearnPage): LearnPage[] {
  const named = new Set(page.end.flatMap((block) => (block.kind === 'furtherReading' ? block.items.map((item) => item.slug) : [])));
  return EN_LEARN_PAGES.filter(
    (other) => other.group.id === page.group.id && other.meta.slug !== page.meta.slug && !named.has(other.meta.slug),
  );
}

export async function generateMetadata({ params }: LearnGuideRouteProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const { page } = await servedGuide(slug, locale);

  return buildLearnPageMetadata(page, locale);
}

export default async function LearnGuideRoute({ params }: LearnGuideRouteProps) {
  const { slug, locale: requested } = await params;
  setRequestLocale(requested);
  const guide = await servedGuide(slug, requested);
  const titles = await titlesIn(guide.locale);

  return (
    <LearnGuidePage
      guide={guide}
      siblingSlugs={siblingsOf(guide.page).map((sibling) => sibling.meta.slug)}
      titles={titles}
    />
  );
}
