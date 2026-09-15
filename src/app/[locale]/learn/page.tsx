import type { Metadata } from "next";
import LearnHubPageContent from "@/components/learn/LearnHubPageContent";
import { EN_LEARN_GOALS, EN_LEARN_PAGES } from "@/lib/seo/learn";
import { LEARN_HUB_COPY } from "@/lib/seo/learn/copy";

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

export default function LearnHubPage() {
  return <LearnHubPageContent allPages={EN_LEARN_PAGES} goals={EN_LEARN_GOALS} />;
}
