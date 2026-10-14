import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { TrustPage } from "@/components/lab-paper/TrustPage";
import { loadPage, servedPageLocale } from "@/lib/pages/load";
import { pageMetadata } from "@/lib/seo/pageMetadata";

type PageProps = { readonly params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return pageMetadata("terms", servedPageLocale("terms", (await params).locale));
}

export default async function TermsPage({ params }: PageProps) {
  const locale = servedPageLocale("terms", (await params).locale);
  setRequestLocale(locale);
  return <TrustPage name="terms" locale={locale} page={await loadPage("terms", locale)} />;
}
