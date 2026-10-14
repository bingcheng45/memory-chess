"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { SquareName } from "@/lib/game/board";
import { LINE_KINDS, type LineKind } from "@/lib/home/lineGrammar";
import { linesOf, SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS, STEP_MS, type ShowcaseStep, type StepTone } from "@/lib/home/showcaseTour";
import { inspect, viewOfInspection, viewOfStep } from "@/lib/home/showcaseView";
import { usePieceName } from "@/components/round/BoardFigure";
import { LineSwatch } from "./BoardLine";
import { ShowcaseControls } from "./ShowcaseControls";
import { ShowcaseFigure } from "./ShowcaseFigure";
import { useReducedMotion } from "./useLabEffects";
import { useShowcaseClock } from "./useShowcaseClock";

const TAG_CLASS: Record<StepTone, string> = {
  white: "lab-tag lab-tag-accent",
  black: "lab-tag",
  game: "lab-tag",
  rebuild: "lab-tag",
};

const sentenceCase = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function useInspectedKeys(inspected: SquareName | null, onLeave: () => void) {
  useEffect(() => {
    if (!inspected) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onLeave();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [inspected, onLeave]);
}

/** Names each kind of line on the board, so a line is never left to be guessed. Empty, it keeps its height. */
function LineKey({ kinds }: { kinds: readonly LineKind[] }) {
  const t = useTranslations("home.lab.hero.showcase.lines");
  return (
    <ul className="lab-sc-key" aria-hidden="true">
      {kinds.map((kind) => (
        <li key={kind}>
          <LineSwatch kind={kind} />
          {t(kind)}
        </li>
      ))}
    </ul>
  );
}

/**
 * Which of a step's boards is showing. A stretch of the game plays its plies one
 * a second from the moment the step opens; under reduced motion it shows the last.
 */
function useBeat(step: ShowcaseStep): number {
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState({ key: step.key, n: 0 });
  const current = beat.key === step.key ? beat.n : 0;
  const last = step.boards.length - 1;

  useEffect(() => {
    if (current >= last) return;
    const timer = window.setTimeout(() => setBeat({ key: step.key, n: current + 1 }), STEP_MS.ply);
    return () => window.clearTimeout(timer);
  }, [step.key, current, last]);

  return reduced ? last : current;
}

/**
 * The hero's card: Topalov against Shirov, walked through step by step, with
 * any piece open to inspection. The first frame is the full position, so the
 * page is complete before any motion starts.
 */
export function ShowcaseBoard() {
  const t = useTranslations("home.lab.hero.showcase");
  const pieceName = usePieceName();
  const [inspected, setInspected] = useState<SquareName | null>(null);
  const clock = useShowcaseClock(SHOWCASE_STEPS, inspected !== null);
  const step = SHOWCASE_STEPS[clock.index];
  const beat = useBeat(step);
  const inspection = inspected ? inspect(inspected) : null;
  const view = inspection ? viewOfInspection(inspection) : viewOfStep(step, beat);

  const resume = () => {
    setInspected(null);
    clock.play();
  };
  const go = (target: number) => {
    setInspected(null);
    clock.go(target);
  };
  useInspectedKeys(inspected, resume);

  const drawn = linesOf(view.annotations);
  const kinds = LINE_KINDS.filter((kind) => drawn.some((line) => line.kind === kind));
  const thoughtKey = `steps.${step.key}.thought`;
  const thought = !inspection && t.has(thoughtKey) ? t(thoughtKey) : "";
  const counter = inspection
    ? t("counter.resume")
    : step.ordinal
      ? t(`counter.${step.phase}`, { n: step.ordinal.n, total: step.ordinal.of })
      : t(`tags.${step.tag}`);
  const caption = inspection
    ? [
        t("inspect.title", { piece: sentenceCase(pieceName(SHOWCASE.position[inspection.source]!)), square: inspection.source }),
        t("inspect.reach", { moves: inspection.moves.length, captures: inspection.captures.length }),
        inspection.checks.length ? t("inspect.checks", { moves: inspection.checks.join(", ") }) : "",
      ]
        .filter(Boolean)
        .join(" ")
    : t(`steps.${step.key}.caption`);

  return (
    <figure ref={clock.ref} className="lab-showcase lab-plate lab-plate-grid" aria-label={t("aria")}>
      <div className="lab-sc-top">
        <span className="lab-k">{t("event")}</span>
        <span className="lab-note">{t("venue")}</span>
      </div>
      <p className="lab-sc-match">
        <span>
          <i className="lab-sc-swatch" data-side="white" aria-hidden="true" />
          {t("white")}
        </span>
        <span className="lab-k">{t("versus")}</span>
        <span>
          <i className="lab-sc-swatch" data-side="black" aria-hidden="true" />
          {t("black")}
        </span>
      </p>
      <ShowcaseFigure
        view={view}
        inspected={inspected}
        onInspect={(square) => (inspected === square ? resume() : setInspected(square))}
      />
      <div className="lab-sc-cap">
        <LineKey kinds={kinds} />
        <div className="lab-sc-cap-top">
          <span className={TAG_CLASS[inspection ? (inspection.color === "white" ? "white" : "black") : step.tone]}>
            {t(inspection ? "tags.inspect" : `tags.${step.tag}`)}
          </span>
          <span className="lab-k" aria-hidden="true">
            {counter}
          </span>
        </div>
        <p className="lab-sc-caption">{caption}</p>
        <p className="lab-sc-thought" data-empty={!thought || undefined}>
          {thought}
        </p>
      </div>
      <ShowcaseControls
        steps={SHOWCASE_STEPS}
        index={clock.index}
        playing={clock.playing && !inspection}
        onGo={go}
        onToggle={inspection ? resume : clock.toggle}
      />
    </figure>
  );
}
