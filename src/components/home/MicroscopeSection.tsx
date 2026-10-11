"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { SquareName } from "@/lib/game/board";
import { squareVerdict } from "@/lib/round/round";
import {
  MICROSCOPE_PHASES,
  phaseNumber,
  REBUILD_ORDER,
  SIDE_COUNTS,
  SPECIMEN,
  SPECIMEN_GROUPS,
  SPECIMEN_RECALL,
  SPECIMEN_SCORE,
  type MicroscopePhase,
} from "@/lib/home/specimen";
import { BoardFigure, StaticBoard, type PieceState } from "./BoardFigure";
import { MicroscopeOverlay } from "./MicroscopeOverlay";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const SPECIMEN_AND_RECALL = { ...SPECIMEN, ...SPECIMEN_RECALL };

function pieceState(phase: MicroscopePhase, square: SquareName): PieceState {
  switch (phase.pieces) {
    case "none":
      return "off";
    case "specimen":
      if (!SPECIMEN[square]) return "off";
      return phase.focus.length > 0 && !phase.focus.includes(square) ? "ghost" : "on";
    case "recall":
      return SPECIMEN_RECALL[square] ? "on" : phase.marks ? "ghost" : "off";
  }
}

const PHONE = "(max-width: 820px)";
// Desktop: the step crossing the middle of the viewport is the active one.
const DESKTOP_BAND = "-45% 0px -45% 0px";
// Phone: the step crossing a thin line just under the sticky card is the active one.
const BELOW_CARD_GAP = 8;
const LINE_THICKNESS = 2;

/** The observer's root margin: a thin line under the sticky card on phones, the middle band elsewhere. */
function activeBand(card: HTMLElement | null): string {
  if (!card || !window.matchMedia(PHONE).matches) return DESKTOP_BAND;
  const line = Math.round(parseFloat(getComputedStyle(card).top) + card.offsetHeight + BELOW_CARD_GAP);
  return `-${line}px 0px -${Math.max(window.innerHeight - line - LINE_THICKNESS, 0)}px 0px`;
}

function useActiveStep(count: number) {
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
          });
        },
        { rootMargin: activeBand(cardRef.current) },
      );
      stepRefs.current.slice(0, count).forEach((step) => step && observer?.observe(step));
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      window.removeEventListener("resize", observe);
      observer?.disconnect();
    };
  }, [count]);

  return { active, stepRefs, cardRef };
}

/** The encode step's sentences, one per group, numbered as the board labels them. */
function GroupSentences() {
  const t = useTranslations("home.lab.method.groups");
  return (
    <ol className="lab-sentences">
      {SPECIMEN_GROUPS.map((group) => (
        <li key={group.id}>
          <b>{t(`${group.id}.name`)}.</b> {t(`${group.id}.sentence`)}
        </li>
      ))}
    </ol>
  );
}

export function MicroscopeSection() {
  const t = useTranslations("home.lab.method");
  const { active, stepRefs, cardRef } = useActiveStep(MICROSCOPE_PHASES.length);
  const phase = MICROSCOPE_PHASES[active];

  return (
    <section className="lab-sec" id={LAB_SECTIONS.method.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="method" title={t("title")} lede={t("lede")} />
        <div className="lab-scope">
          <div className="lab-scope-fig" ref={cardRef}>
            <div className="lab-scope-card lab-plate lab-plate-grid" data-phase={phase.id}>
              <div className="lab-scope-status">
                <span className="lab-k">
                  {t("status", { number: phaseNumber(phase.id), name: t(`phases.${phase.id}.name`) })}
                </span>
                <span className="lab-k lab-mono">{t("clock", { seconds: phase.clock })}</span>
              </div>
              <BoardFigure>
                <StaticBoard
                  position={SPECIMEN_AND_RECALL}
                  pieceState={(square) => pieceState(phase, square)}
                  mark={(square) => (phase.marks ? squareVerdict(SPECIMEN, SPECIMEN_RECALL, square) : undefined)}
                  revealOrder={(square) => REBUILD_ORDER[square]}
                />
                <MicroscopeOverlay phase={phase} />
                <div className="lab-score-chip" data-on={phase.scoreChip || undefined} aria-hidden="true">
                  <b>{SPECIMEN_SCORE.accuracy}%</b>
                  {t("scoreChip", { correct: SPECIMEN_SCORE.correct, total: SPECIMEN_SCORE.total })}
                  <br />
                  {t("countChip", SIDE_COUNTS)}
                </div>
              </BoardFigure>
            </div>
          </div>
          <div className="lab-steps">
            {MICROSCOPE_PHASES.map(({ id }, index) => (
              <article
                key={id}
                className="lab-step"
                data-step={index}
                data-on={index === active || undefined}
                ref={(node) => {
                  stepRefs.current[index] = node;
                }}
              >
                <span className="lab-k">
                  {t("status", { number: phaseNumber(id), name: t(`phases.${id}.name`) })}
                </span>
                <h3>{t(`phases.${id}.title`)}</h3>
                <p>{t(`phases.${id}.body`)}</p>
                <div className="lab-ann">
                  {t(`phases.${id}.note`, {
                    correct: SPECIMEN_SCORE.correct,
                    total: SPECIMEN_SCORE.total,
                    accuracy: SPECIMEN_SCORE.accuracy,
                  })}
                  {id === "encode" && <GroupSentences />}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
