import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { localizedPath } from '@/lib/seo/alternates';
import { socialMetadata, titleNamingBrandOnce } from '@/lib/seo/brand';
import { robotsFor } from '@/lib/seo/englishOnly';
import LeaderboardReference from '@/components/reference/LeaderboardReference';
import { LabPaperHeader } from '@/components/lab-paper/LabPaperHeader';
import { LAB_PAPER_CLASS } from '@/components/lab-paper/shell';
import '@/components/leaderboard/leaderboard.css';

const siteUrl = 'https://thememorychess.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard.meta' });

  return {
    title: titleNamingBrandOnce(t('title')),
    description: t('description'),
    // Translated boards are served to readers but indexed only in English, so
    // no locale advertises another and each canonical points at itself.
    alternates: { canonical: localizedPath('/leaderboard', locale) },
    robots: robotsFor('/leaderboard', locale),
    ...socialMetadata({
      title: t('socialTitle'),
      description: t('socialDescription'),
      url: `${siteUrl}${localizedPath('/leaderboard', locale)}`,
    }),
  };
}

export default async function LeaderboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // One Lab Paper block holds the header, the board and the explainer, so the sticky header spans all three.
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      {children}
      <LeaderboardReference locale={locale} />
    </div>
  );
}
