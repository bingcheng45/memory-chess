import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AboutCommunityInvite } from "@/components/community/AboutCommunityInvite";
import { TrustPage } from "@/components/lab-paper/TrustPage";
import { loadPage, servedPageLocale } from "@/lib/pages/load";
import { pageMetadata } from "@/lib/seo/pageMetadata";

type PageProps = { readonly params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return pageMetadata("about", servedPageLocale("about", (await params).locale));
}

export default async function AboutPage({ params }: PageProps) {
  const locale = servedPageLocale("about", (await params).locale);
  setRequestLocale(locale);
  return <TrustPage name="about" locale={locale} page={await loadPage("about", locale)} after={<AboutCommunityInvite />} />;
}
