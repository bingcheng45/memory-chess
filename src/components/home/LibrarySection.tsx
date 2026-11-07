import { useLocale, useTranslations } from "next-intl";
import { englishOnlyLinkSuffix } from "@/lib/seo/englishOnly";
import { NextLink } from "./HomeLinks";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

export const LIBRARY_GUIDES = [
  { id: "vision", slug: "how-to-see-the-whole-board-in-chess" },
  { id: "visualization", slug: "chess-visualization-exercises" },
  { id: "calculation", slug: "chess-calculation-exercises-for-beginners" },
  { id: "memory", slug: "chess-memory-training" },
  { id: "blindfold", slug: "blindfold-chess-training-for-beginners" },
] as const;

const BLUNDER_GUIDE = "how-to-stop-blundering-in-chess";

export function LibrarySection() {
  const t = useTranslations("home.lab.library");
  const learn = useTranslations("home.learn");
  const suffix = englishOnlyLinkSuffix(useLocale());

  return (
    <section className="lab-sec" id={LAB_SECTIONS.library.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="library" title={t("title")} lede={t("lede")} />
        <div className="lab-lib">
          {LIBRARY_GUIDES.map(({ id, slug }, index) => (
            <NextLink key={id} href={`/learn/${slug}`} hrefLang="en" prefetch={false}>
              <span className="lab-k">{t("ref", { number: String(index + 1) })}</span>
              <h3>
                {t(`${id}.title`)}
                {suffix}
              </h3>
              <p>{t(`${id}.body`)}</p>
              <span className="lab-go">{t("read")} →</span>
            </NextLink>
          ))}
        </div>
        <div className="lab-lib-more">
          <NextLink href="/learn" hrefLang="en" className="lab-btn lab-btn-secondary" prefetch={false}>
            {learn("browseCta")}
            {suffix}
          </NextLink>
          <NextLink href={`/learn/${BLUNDER_GUIDE}`} hrefLang="en" className="lab-btn lab-btn-secondary" prefetch={false}>
            {t("blundering")}
            {suffix}
          </NextLink>
        </div>
      </div>
    </section>
  );
}
