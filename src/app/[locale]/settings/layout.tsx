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
  };
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
