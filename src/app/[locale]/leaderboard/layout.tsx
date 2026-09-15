import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { localizedPath } from '@/lib/seo/alternates';
import { robotsFor } from '@/lib/seo/englishOnly';
import LeaderboardReference from '@/components/reference/LeaderboardReference';

const siteUrl = 'https://thememorychess.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'leaderboard.meta' });

  return {
    title: t('title'),
    description: t('description'),
    // Translated boards are served to readers but indexed only in English, so
    // no locale advertises another and each canonical points at itself.
    alternates: { canonical: localizedPath('/leaderboard', locale) },
    robots: robotsFor('/leaderboard', locale),
    openGraph: {
      title: t('socialTitle'),
      description: t('socialDescription'),
      url: `${siteUrl}${localizedPath('/leaderboard', locale)}`,
    },
    twitter: {
      title: t('socialTitle'),
      description: t('socialDescription'),
    },
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

  return (
    <>
      {children}
      <LeaderboardReference locale={locale} />
    </>
  );
}
