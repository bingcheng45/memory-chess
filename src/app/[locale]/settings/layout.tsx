import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/alternates';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates('/settings', locale),
    /**
     * Settings is the one page kept out of the sitemap, and until now it said
     * nothing about that to a crawler, so it was indexable and simply unlisted
     * -- an invitation to index twenty-four near-identical pages of controls
     * that would compete with the pages meant to be found.
     *
     * It holds no content of its own: every word is a label on a control, and
     * the values behind them live in the visitor's own browser. `follow` is
     * kept so the links out of it still carry.
     */
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
