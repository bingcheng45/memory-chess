"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { SquareName } from "@/lib/game/board";
import { SHOWCASE } from "@/lib/home/showcase";
import { SHOWCASE_STEPS, type StepTone } from "@/lib/home/showcaseTour";
import { inspect, viewOfInspection, viewOfStep } from "@/lib/home/showcaseView";
import { usePieceName } from "./BoardFigure";
import { ShowcaseControls } from "./ShowcaseControls";
import { ShowcaseFigure } from "./ShowcaseFigure";
import { useShowcaseClock } from "./useShowcaseClock";

const TAG_CLASS: Record<StepTone, string> = {
  white: "lab-tag lab-tag-blue",
  black: "lab-tag",
  mate: "lab-tag lab-tag-ink",
  rebuild: "lab-tag lab-tag-mint",
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

/**
 * The hero's card: Deep Fritz against Kramnik, walked through step by step, with
 * any piece open to inspection. The first frame is the full position, so the
 * page is complete before any motion starts.
 */
export function ShowcaseBoard() {
  const t = useTranslations("home.lab.hero.showcase");
  const pieceName = usePieceName();
  const [inspected, setInspected] = useState<SquareName | null>(null);
  const clock = useShowcaseClock(SHOWCASE_STEPS, inspected !== null);
  const step = SHOWCASE_STEPS[clock.index];
  const inspection = inspected ? inspect(inspected) : null;
  const view = inspection ? viewOfInspection(inspection) : viewOfStep(step);

  const resume = () => {
    setInspected(null);
    clock.play();
  };
  const go = (target: number) => {
    setInspected(null);
    clock.go(target);
  };
  useInspectedKeys(inspected, resume);

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
    <figure ref={clock.ref} className="lab-showcase" aria-label={t("aria")}>
      <div className="lab-sc-top">
        <span className="lab-k lab-live">
          <i aria-hidden="true" />
          {t("event")}
        </span>
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
