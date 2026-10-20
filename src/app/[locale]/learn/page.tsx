import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import LearnHubPage from "@/components/learn/LearnHubPage";
import { EN_LEARN_PAGES, groupPages } from "@/lib/seo/learn";
import { LEARN_HUB_COPY } from "@/lib/seo/learn/copy";
import { pathStages } from "@/lib/seo/learn/path";

const SITE_URL = "https://thememorychess.com";

export function generateMetadata(): Metadata {
  const { title, description } = LEARN_HUB_COPY.meta;

  return {
    title,
    description,
    alternates: { canonical: "/learn" },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/learn`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default function LearnHub() {
  // English-only route: the bare URL is the only one served, as English.
  setRequestLocale(DEFAULT_LOCALE);
  return <LearnHubPage {...pathStages(groupPages(EN_LEARN_PAGES))} />;
}
