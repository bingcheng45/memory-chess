import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TrustPage } from "@/components/lab-paper/TrustPage";
import { loadPage, servedPageLocale } from "@/lib/pages/load";
import { pageMetadata } from "@/lib/seo/pageMetadata";

type PageProps = { readonly params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return pageMetadata("privacy", servedPageLocale("privacy", (await params).locale));
}

export default async function PrivacyPage({ params }: PageProps) {
  const locale = servedPageLocale("privacy", (await params).locale);
  setRequestLocale(locale);
  return <TrustPage name="privacy" locale={locale} page={await loadPage("privacy", locale)} />;
}
