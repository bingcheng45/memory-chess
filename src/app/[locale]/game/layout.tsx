import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { buildAlternates, localizedPath } from '@/lib/seo/alternates';
import GameReference from '@/components/reference/GameReference';

const siteUrl = 'https://thememorychess.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'game.meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates('/game', locale),
    openGraph: {
      title: t('socialTitle'),
      description: t('socialDescription'),
      url: `${siteUrl}${localizedPath('/game', locale)}`,
    },
    twitter: {
      title: t('socialTitle'),
      description: t('socialDescription'),
    },
  };
}

export default async function GameLayout({
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
      <GameReference locale={locale} />
    </>
  );
}
