import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { EN_LEARN_GOALS, EN_LEARN_PAGES } from "@/lib/seo/learn";

const SITE_URL = "https://thememorychess.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({
    locale: DEFAULT_LOCALE,
    namespace: "learnHub.meta",
  });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/learn" },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${SITE_URL}/learn`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function LearnHubPage() {
  return <LearnHubPageContent allPages={EN_LEARN_PAGES} goals={EN_LEARN_GOALS} />;
}
