import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AboutCommunityInvite } from "@/components/community/AboutCommunityInvite";
import { AboutFacts } from "@/components/community/AboutFacts";
import { TrustPage } from "@/components/lab-paper/TrustPage";
import { loadPage, servedPageLocale } from "@/lib/pages/load";
import { aboutSchema } from "@/lib/seo/aboutSchema";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getTotalPlays } from "@/lib/services/totalPlays";

export const revalidate = 3600;

type PageProps = { readonly params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return pageMetadata("about", servedPageLocale("about", (await params).locale));
}

export default async function AboutPage({ params }: PageProps) {
  const locale = servedPageLocale("about", (await params).locale);
  setRequestLocale(locale);
  const [page, plays] = await Promise.all([loadPage("about", locale), getTotalPlays()]);
  return (
    <>
      <TrustPage
        name="about"
        locale={locale}
        page={page}
        before={<AboutFacts plays={plays} />}
        after={<AboutCommunityInvite />}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema(locale, page.text.title)) }} />
    </>
  );
}
