import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, localizedPath } from "@/lib/seo/alternates";

const SITE_URL = "https://thememorychess.com";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "learnHub.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates("/learn", locale),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${SITE_URL}${localizedPath("/learn", locale)}`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function LearnHubPage() {
  return <LearnHubPageContent />;
}
