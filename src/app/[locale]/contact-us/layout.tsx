import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { buildAlternates, localizedPath } from '@/lib/seo/alternates';
import ContactReference from '@/components/reference/ContactReference';

const siteUrl = 'https://thememorychess.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact.meta' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: buildAlternates('/contact-us', locale),
    openGraph: {
      title: t('socialTitle'),
      description: t('socialDescription'),
      url: `${siteUrl}${localizedPath('/contact-us', locale)}`,
    },
    twitter: {
      title: t('socialTitle'),
      description: t('socialDescription'),
    },
  };
}

export default async function ContactLayout({
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
      <ContactReference locale={locale} />
    </>
  );
}
