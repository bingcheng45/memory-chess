import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getMessages, getTranslations } from 'next-intl/server';
import { buildAlternates, localizedPath } from '@/lib/seo/alternates';
import ArticlesMessagesProvider from '@/components/articles/ArticlesMessagesProvider';
import TileArticlesProvider from '@/components/game/TileArticlesProvider';
import GameReference from '@/components/reference/GameReference';
import { getTileArticles } from '@/lib/articles';
import { tileGroupOf } from '@/lib/articles/messageScope';
import { gameConfigPrefillScript } from '@/lib/game/configPrefill';

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
  const [tileArticles, messages] = await Promise.all([getTileArticles(locale), getMessages({ locale })]);

  return (
    <>
      {/* The root layout sends no articles strings, and the result screen ends with the article tile. */}
      <ArticlesMessagesProvider articles={tileGroupOf(messages)}>
        <TileArticlesProvider articles={tileArticles}>{children}</TileArticlesProvider>
      </ArticlesMessagesProvider>
      {/* Runs once the form above is parsed and before hydration, so a
          returning player's saved settings are what first paints. */}
      <script dangerouslySetInnerHTML={{ __html: gameConfigPrefillScript() }} />
      <GameReference locale={locale} />
    </>
  );
}
