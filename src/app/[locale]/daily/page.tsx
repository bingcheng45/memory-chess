import { getTranslations } from "next-intl/server";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { DailyBoard } from "@/components/daily/DailyBoard";
import { DailyReference } from "@/components/daily/DailyReference";
import { languageTag, localizedUrl } from "@/lib/seo/alternates";
import { WEBSITE_ID } from "@/lib/seo/brand";

async function dailySchema(locale: string) {
  const t = await getTranslations({ locale });
  const url = localizedUrl("/daily", locale);
  const crumbs = [
    { name: "Memory Chess", item: localizedUrl("/", locale) },
    { name: t("dashboard.label.daily"), item: url },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: t("daily.meta.title"),
        description: t("daily.meta.description"),
        inLanguage: languageTag(locale),
        isPartOf: { "@id": WEBSITE_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })),
      },
    ],
  };
}

export default async function DailyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className={LAB_PAPER_CLASS}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(await dailySchema(locale)) }} />
      <LabPaperHeader />
      <main className="lab-wrap daily-main">
        <DailyBoard />
        <DailyReference locale={locale} />
      </main>
    </div>
  );
}
