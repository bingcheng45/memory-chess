"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LOCALES } from "@/i18n/routing";
import { formatNumber } from "@/lib/utils";
import { MEMORIZE_SECONDS_RANGE, PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { SPECIMEN, SPECIMEN_STUDY_SECONDS } from "@/lib/home/specimen";
import { BoardFigure, StaticBoard } from "./BoardFigure";
import { LAB_SECTIONS } from "./SectionHeading";
import { QUICK_START_HREF } from "./links";
import { useReducedMotion } from "./useLabEffects";

const SPECIMEN_PIECES = Object.keys(SPECIMEN).length;
const TICK_MS = 100;

/** Loops the specimen's study countdown; frozen at full time under reduced motion. */
function useSpecimenCountdown(): string {
  const reduced = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const startedAt = performance.now();
    const timer = setInterval(() => {
      setElapsed(((performance.now() - startedAt) / 1000) % SPECIMEN_STUDY_SECONDS);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [reduced]);

  return (SPECIMEN_STUDY_SECONDS - (reduced ? 0 : elapsed)).toFixed(1);
}

function range(min: number, max: number, unit = ""): string {
  return `${min}–${max}${unit}`;
}

export function LabHero({ totalPlays }: { totalPlays: number | null }) {
  const t = useTranslations("home");
  const lab = useTranslations("home.lab");
  const countdown = useSpecimenCountdown();

  const facts = [
    { value: range(MEMORIZE_SECONDS_RANGE.min, MEMORIZE_SECONDS_RANGE.max, "s"), label: lab("hero.facts.study") },
    { value: range(PIECE_COUNT_RANGE.min, PIECE_COUNT_RANGE.max), label: lab("hero.facts.pieces") },
    { value: "0–100%", label: lab("hero.facts.accuracy") },
    { value: String(LOCALES.length), label: lab("hero.facts.languages") },
  ];

  return (
    <section className="lab-hero">
      <div className="lab-wrap">
        <div>
          <div className="lab-eyebrow">
            <span className="lab-tag lab-tag-blue">{lab("tags.free")}</span>
            <span className="lab-k">{lab("hero.platforms")}</span>
          </div>
          <h1>
            <span className="lab-kicker">{t("hero.title")}</span>{" "}
            <span className="lab-display">{lab.rich("hero.display", { em: (chunks) => <em>{chunks}</em> })}</span>
          </h1>
          <p className="lab-lede">{lab("hero.lede")}</p>
          <div className="lab-cta-row">
            <Link className="lab-btn lab-btn-primary" href={QUICK_START_HREF}>
              <span className="lab-dot" aria-hidden="true" />
              {t("cta.playFree")}
            </Link>
            <a className="lab-btn lab-btn-secondary" href={`#${LAB_SECTIONS.calibrate.anchor}`}>
              {lab("hero.secondaryCta")}
            </a>
          </div>
          <div className="lab-subtle-links">
            <Link href="/game">{t("cta.chooseSettings")}</Link>
            <span>
              {t.rich("hero.freeToPlay", {
                link: (chunks) => <Link href="/leaderboard">{chunks}</Link>,
              })}
            </span>
          </div>
          <div className="lab-facts">
            {facts.map((fact) => (
              <div key={fact.label}>
                <b>{fact.value}</b>
                {fact.label}
              </div>
            ))}
          </div>
        </div>

        <figure className="lab-specimen" aria-label={lab("hero.specimen.aria")}>
          <div className="lab-spec-top">
            <span className="lab-k lab-live">
              <i aria-hidden="true" />
              {lab("hero.specimen.label")}
            </span>
            <span className="lab-k lab-mono" aria-hidden="true">
              T-{countdown}s
            </span>
          </div>
          <BoardFigure>
            <StaticBoard position={SPECIMEN} />
            <div className="lab-scan" aria-hidden="true" />
          </BoardFigure>
          <div className="lab-readout">
            <div>
              <span className="lab-k">{lab("hero.specimen.pieces")}</span>
              <b>{SPECIMEN_PIECES}</b>
            </div>
            <div>
              <span className="lab-k">{lab("hero.specimen.exposure")}</span>
              <b>{SPECIMEN_STUDY_SECONDS.toFixed(1)}s</b>
            </div>
            {totalPlays !== null && (
              <div>
                <span className="lab-k">{lab("hero.specimen.plays")}</span>
                <b>{formatNumber(totalPlays)}</b>
              </div>
            )}
          </div>
        </figure>
      </div>
    </section>
  );
}
