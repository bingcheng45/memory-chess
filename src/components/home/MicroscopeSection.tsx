"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { squareVerdict, type SquareName } from "@/lib/home/calibration";
import {
  MICROSCOPE_PHASES,
  SPECIMEN,
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
      return SPECIMEN[square] ? "on" : "off";
    case "recall":
      return SPECIMEN_RECALL[square] ? "on" : "ghost";
  }
}

// The band in the middle of the viewport where a step counts as current.
const ACTIVE_BAND = "-45% 0px -45% 0px";

function useActiveStep(count: number) {
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        });
      },
      { rootMargin: ACTIVE_BAND },
    );
    stepRefs.current.slice(0, count).forEach((step) => step && observer.observe(step));
    return () => observer.disconnect();
  }, [count]);

  return { active, stepRefs };
}

export function MicroscopeSection() {
  const t = useTranslations("home.lab.method");
  const { active, stepRefs } = useActiveStep(MICROSCOPE_PHASES.length);
  const phase = MICROSCOPE_PHASES[active];
  const number = (index: number) => String(index + 1).padStart(2, "0");

  return (
    <section className="lab-sec lab-sec-tight" id={LAB_SECTIONS.method.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="method" title={t("title")} lede={t("lede")} />
        <div className="lab-scope">
          <div className="lab-scope-fig">
            <div className="lab-scope-card" data-phase={phase.id}>
              <div className="lab-scope-status">
                <span className="lab-k">
                  {t("status", { number: number(active), name: t(`phases.${phase.id}.name`) })}
                </span>
                <span className="lab-k lab-mono">{t("clock", { seconds: phase.clock })}</span>
              </div>
              <BoardFigure>
                <StaticBoard
                  position={SPECIMEN_AND_RECALL}
                  pieceState={(square) => pieceState(phase, square)}
                  mark={(square) => (phase.marks ? squareVerdict(SPECIMEN, SPECIMEN_RECALL, square) : undefined)}
                />
                <MicroscopeOverlay overlay={phase.overlay} />
                <div className="lab-score-chip" data-on={phase.scoreChip || undefined} aria-hidden="true">
                  <b>{SPECIMEN_SCORE.accuracy}%</b>
                  {t("scoreChip", { correct: SPECIMEN_SCORE.correct, total: SPECIMEN_SCORE.total })}
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
                  {t("status", { number: number(index), name: t(`phases.${id}.name`) })}
                </span>
                <h3>{t(`phases.${id}.title`)}</h3>
                <p>{t(`phases.${id}.body`)}</p>
                <div className="lab-ann">{t(`phases.${id}.note`)}</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
