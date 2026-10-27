import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { LabReadingPage, LabReadingSection } from "@/components/lab-paper/LabReadingPage";
import { playHref } from "@/lib/game/roundLink";
import { DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS } from "@/lib/data/recall";
import { socialMetadata, titleNamingBrandOnce } from "@/lib/seo/brand";
import { BLINDFOLD_GUIDE_PATH, BLINDFOLD_PAGE_COPY as copy, BLINDFOLD_PATH, BOARD_GAME_RULES_PATH } from "@/lib/seo/blindfold/copy";

const SITE_URL = "https://thememorychess.com";

export function generateMetadata(): Metadata {
  return {
    title: titleNamingBrandOnce(copy.meta.title),
    description: copy.meta.description,
    alternates: { canonical: BLINDFOLD_PATH },
    ...socialMetadata({ title: copy.meta.socialTitle, description: copy.meta.socialDescription, url: `${SITE_URL}${BLINDFOLD_PATH}` }),
  };
}

const START_HREF = playHref(DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS, "blindfold_page", true);
const CHOOSE_HREF = "/game?mode=blindfold";

export default function BlindfoldPage() {
  setRequestLocale(DEFAULT_LOCALE);

  return (
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
          <Link className="lab-btn lab-btn-secondary" href={CHOOSE_HREF}>
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
      <LabReadingSection title="Keep going">
        <p>
          {copy.guide.before}
          <Link href={BLINDFOLD_GUIDE_PATH}>{copy.guide.anchor}</Link>
          {copy.guide.after}
        </p>
        <p>
          {copy.rules.before}
          <Link href={BOARD_GAME_RULES_PATH}>{copy.rules.anchor}</Link>
          {copy.rules.after}
        </p>
      </LabReadingSection>
    </LabReadingPage>
  );
}
