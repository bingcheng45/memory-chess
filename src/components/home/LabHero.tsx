"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LOCALES } from "@/i18n/routing";
import { formatNumber } from "@/lib/utils";
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { LAB_SECTIONS } from "./SectionHeading";
import { ShowcaseBoard } from "./ShowcaseBoard";
import { QUICK_START_HREF } from "./links";
import type { TotalPlays } from "./useLabEffects";

/** Stands in for the count while it loads or when it cannot be read. */
const PLAYS_PENDING = "–";
// Any count that takes the general plural in every catalogue, so the label reads naturally with no number known.
const GENERAL_COUNT = 100;

function range(min: number, max: number, unit = ""): string {
  return `${min}–${max}${unit}`;
}

export function LabHero({ totalPlays }: { totalPlays: TotalPlays }) {
  const t = useTranslations("home");
  const lab = useTranslations("home.lab");

  const plays = totalPlays.status === "known" ? totalPlays.plays : null;
  const facts = [
    { value: range(MEMORIZE_SECONDS_RANGE.min, MEMORIZE_SECONDS_RANGE.max, "s"), label: lab("hero.facts.study") },
    { value: range(PIECE_COUNT_RANGE.min, PIECE_COUNT_RANGE.max), label: lab("hero.facts.pieces") },
    { value: String(LOCALES.length), label: lab("hero.facts.languages") },
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
          <p className="lab-subtle-links">
            {lab.rich("hero.settingsLink", {
              label: t("cta.chooseSettings"),
              link: (chunks) => <Link href="/game">{chunks}</Link>,
            })}{" "}
            {t.rich("hero.freeToPlay", {
              link: (chunks) => <Link href="/leaderboard">{chunks}</Link>,
            })}
          </p>
          <div className="lab-facts">
            <div className="lab-fact-lead" data-status={totalPlays.status} aria-busy={totalPlays.status === "loading"}>
              <b>{plays === null ? PLAYS_PENDING : formatNumber(plays)}</b>
              {lab("hero.facts.plays", { count: plays ?? GENERAL_COUNT })}
            </div>
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
