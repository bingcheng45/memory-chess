import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecallDataPage } from "@/components/data/RecallDataPage";
import { RECALL_DATA, RECALL_PATH } from "@/lib/data/recall";
import { localizedPath, localizedUrl } from "@/lib/seo/alternates";
import { socialMetadata, titleNamingBrandOnce } from "@/lib/seo/brand";
import { robotsFor } from "@/lib/seo/englishOnly";

type PageProps = { readonly params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "data.meta" });
  const rounds = RECALL_DATA.totalRounds;
  const robots = robotsFor(RECALL_PATH, locale);

  return {
    title: titleNamingBrandOnce(t("title", { rounds })),
    description: t("description", { rounds }),
    alternates: { canonical: localizedPath(RECALL_PATH, locale) },
    ...(robots ? { robots } : {}),
    ...socialMetadata({
      title: t("socialTitle"),
      description: t("socialDescription", { rounds }),
      url: localizedUrl(RECALL_PATH, locale),
    }),
  };
}

export default async function DataPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <RecallDataPage data={RECALL_DATA} locale={locale} />;
}
