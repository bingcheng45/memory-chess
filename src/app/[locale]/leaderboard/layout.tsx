import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { buildAlternates, localizedPath } from '@/lib/seo/alternates';
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
    alternates: buildAlternates('/leaderboard', locale),
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
