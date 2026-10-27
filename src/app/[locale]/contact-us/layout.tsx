import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { localizedPath } from '@/lib/seo/alternates';
import { socialMetadata, titleNamingBrandOnce } from '@/lib/seo/brand';
import { robotsFor } from '@/lib/seo/englishOnly';
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
  const robots = robotsFor('/contact-us', locale);

  return {
    title: titleNamingBrandOnce(t('title')),
    description: t('description'),
    // Translated contact pages are served to readers but indexed only in
    // English, so no locale advertises another and each canonical points at itself.
    alternates: { canonical: localizedPath('/contact-us', locale) },
    // An `undefined` robots key would erase the layout's own robots, so the English page carries no key at all.
    ...(robots ? { robots } : {}),
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
