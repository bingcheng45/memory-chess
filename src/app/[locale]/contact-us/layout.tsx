import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { buildAlternates, localizedPath } from '@/lib/seo/alternates';
import { socialMetadata } from '@/lib/seo/brand';
import ContactReference from '@/components/reference/ContactReference';
import { LabPaperHeader } from '@/components/lab-paper/LabPaperHeader';
import { LAB_PAPER_CLASS } from '@/components/lab-paper/shell';
import '@/components/lab-paper/lab-reading.css';
import './contact.css';

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
    ...socialMetadata({
      title: t('socialTitle'),
      description: t('socialDescription'),
      url: `${siteUrl}${localizedPath('/contact-us', locale)}`,
    }),
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
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <main className="lab-wrap lab-read">
        {children}
        <ContactReference locale={locale} />
      </main>
    </div>
  );
}
