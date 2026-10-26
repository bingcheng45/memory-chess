import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { IntroReplayLink } from "@/components/home/intro/IntroReplayLink";
import { HOME_INTRO } from "@/lib/home/intro/introGate";
import { LOCALES } from "@/i18n/routing";
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { LAB_SECTIONS } from "./SectionHeading";
import { LabHeroPlays } from "./LabHeroPlays";
import { ShowcaseBoard } from "./ShowcaseBoard";
import { QUICK_START_HREF } from "./links";

const BOARD_GAME_GUIDE = "/learn/how-to-play-memory-chess-board-game";

function range(min: number, max: number, unit = ""): string {
  return `${min}–${max}${unit}`;
}

export function LabHero({ initialPlays }: { readonly initialPlays?: number }) {
  const t = useTranslations("home");
  const lab = useTranslations("home.lab");

  const facts = [
    { value: range(MEMORIZE_SECONDS_RANGE.min, MEMORIZE_SECONDS_RANGE.max, "s"), label: lab("hero.facts.study") },
    { value: range(PIECE_COUNT_RANGE.min, PIECE_COUNT_RANGE.max), label: lab("hero.facts.pieces") },
    { value: String(LOCALES.length), label: lab("hero.facts.languages", { count: LOCALES.length }) },
  ];

  return (
    <section className="lab-hero">
      <div className="lab-wrap">
        <div>
          <div className="lab-eyebrow">
            <span className="lab-tag lab-tag-accent">{lab("tags.free")}</span>
            <span>{lab("hero.platforms")}</span>
          </div>
          <h1>
            <span className="lab-seo-title">{t("hero.title")}</span>{" "}
            <span className="lab-display">{lab.rich("hero.display", { em: (chunks) => <em>{chunks}</em> })}</span>
          </h1>
          <p className="lab-lede">{lab("hero.lede")}</p>
          <div className="lab-cta-row">
            <Link className="lab-btn lab-btn-primary" href={QUICK_START_HREF}>
              {lab("index.play")}
            </Link>
            <a className="lab-btn lab-btn-secondary" href={`#${LAB_SECTIONS.calibrate.anchor}`}>
              {lab("hero.secondaryCta")}
            </a>
          </div>
          {HOME_INTRO && <IntroReplayLink />}
          <p className="lab-subtle-links">
            <span>
              {lab.rich("hero.settingsLink", {
                label: t("cta.chooseSettings"),
                link: (chunks) => <Link href="/game">{chunks}</Link>,
              })}
            </span>{" "}
            <span>
              {t.rich("hero.freeToPlay", {
                link: (chunks) => <Link href="/leaderboard" prefetch={false}>{chunks}</Link>,
              })}
            </span>{" "}
            <span>
              {lab.rich("hero.dailyLink", {
                link: (chunks) => <Link href="/daily" prefetch={false}>{chunks}</Link>,
              })}
            </span>{" "}
            <span>
              {t.rich("hero.boardGame", {
                link: (chunks) => (
                  <EnglishOnlyLink href={BOARD_GAME_GUIDE} prefetch={false}>
                    {(suffix) => (
                      <>
                        {chunks}
                        {suffix}
                      </>
                    )}
                  </EnglishOnlyLink>
                ),
              })}
            </span>
          </p>
          <div className="lab-facts">
            <LabHeroPlays initialPlays={initialPlays} />
            {facts.map((fact) => (
              <div key={fact.label}>
                <b>{fact.value}</b>
                {fact.label}
              </div>
            ))}
          </div>
        </div>

        <ShowcaseBoard />
      </div>
    </section>
  );
}
