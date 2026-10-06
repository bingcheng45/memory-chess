"use client";

import { useTranslations } from "next-intl";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

export const LIBRARY_GUIDES = [
  { id: "vision", slug: "how-to-see-the-whole-board-in-chess" },
  { id: "visualization", slug: "chess-visualization-exercises" },
  { id: "calculation", slug: "chess-calculation-exercises-for-beginners" },
  { id: "memory", slug: "chess-memory-training" },
] as const;

export function LibrarySection() {
  const t = useTranslations("home.lab.library");
  const learn = useTranslations("home.learn");

  return (
    <section className="lab-sec lab-sec-tight" id={LAB_SECTIONS.library.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="library" title={t("title")} lede={t("lede")} />
        <div className="lab-lib">
          {LIBRARY_GUIDES.map(({ id, slug }, index) => (
            <EnglishOnlyLink key={id} href={`/learn/${slug}`}>
              {(suffix) => (
                <>
                  <span className="lab-k">{t("ref", { number: String(index + 1).padStart(2, "0") })}</span>
                  <h3>
                    {t(`${id}.title`)}
                    {suffix}
                  </h3>
                  <p>{t(`${id}.body`)}</p>
                  <span className="lab-go">{t("read")} →</span>
                </>
              )}
            </EnglishOnlyLink>
          ))}
        </div>
        <div className="lab-lib-more">
          <EnglishOnlyLink href="/learn" className="lab-btn lab-btn-secondary">
            {(suffix) => (
              <>
                {learn("browseCta")}
                {suffix}
              </>
            )}
          </EnglishOnlyLink>
          <EnglishOnlyLink
            href="/learn/how-to-get-better-at-chess-for-beginners"
            className="lab-btn lab-btn-secondary"
          >
            {(suffix) => (
              <>
                {learn("beginnerCta")}
                {suffix}
              </>
            )}
          </EnglishOnlyLink>
        </div>
      </div>
    </section>
  );
}
