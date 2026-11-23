import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { LabReadingPage, LabReadingSection } from "@/components/lab-paper/LabReadingPage";
import { playHref } from "@/lib/game/roundLink";
import { DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS } from "@/lib/data/recall";
import { socialMetadata, titleNamingBrandOnce } from "@/lib/seo/brand";
import { localizedUrl } from "@/lib/seo/alternates";
import { webApplicationNode } from "@/lib/seo/webApplication";
import { MEMORY_TRAINER_PAGE_COPY as copy, MEMORY_TRAINER_PATH } from "@/lib/seo/memoryTrainer/copy";

const SITE_URL = "https://thememorychess.com";

export function generateMetadata(): Metadata {
  return {
    title: titleNamingBrandOnce(copy.meta.title),
    description: copy.meta.description,
    alternates: { canonical: MEMORY_TRAINER_PATH },
    ...socialMetadata({ title: copy.meta.socialTitle, description: copy.meta.socialDescription, url: `${SITE_URL}${MEMORY_TRAINER_PATH}` }),
  };
}

const SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    webApplicationNode({ path: MEMORY_TRAINER_PATH, locale: DEFAULT_LOCALE, name: copy.meta.socialTitle, description: copy.meta.description }),
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: "Memory Chess", item: localizedUrl("/", DEFAULT_LOCALE) },
        { name: copy.title, item: localizedUrl(MEMORY_TRAINER_PATH, DEFAULT_LOCALE) },
      ].map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })),
    },
  ],
};

const START_HREF = playHref(DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS, "trainer_page");

export default function ChessMemoryTrainerPage() {
  setRequestLocale(DEFAULT_LOCALE);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <LabReadingPage
        kicker={copy.kicker}
        title={copy.title}
        lede={copy.lede}
        contents={copy.sections.map(({ id, title }) => ({ id, title }))}
        notice={
          <p className="lab-lede">
            <Link className="lab-btn lab-btn-primary" href={START_HREF}>
              {copy.start.primary}
            </Link>{" "}
            <Link className="lab-btn lab-btn-secondary" href="/game">
              {copy.start.secondary}
            </Link>
          </p>
        }
      >
        {copy.sections.map(({ id, title, paragraphs }) => (
          <LabReadingSection key={id} id={id} title={title}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </LabReadingSection>
        ))}
        <LabReadingSection title="Read next">
          {copy.further.map(({ before, anchor, href, after }) => (
            <p key={href}>
              {before}
              <Link href={href}>{anchor}</Link>
              {after}
            </p>
          ))}
        </LabReadingSection>
      </LabReadingPage>
    </>
  );
}
