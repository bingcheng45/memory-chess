"use client";

import { useTranslations } from "next-intl";
import type { ShowcaseStep } from "@/lib/home/showcaseTour";

interface ShowcaseControlsProps {
  steps: readonly ShowcaseStep[];
  index: number;
  /** The tour is advancing by itself. */
  playing: boolean;
  onGo: (index: number) => void;
  onToggle: () => void;
}

/** Back, Pause or Play, Next, and one bar per step. */
export function ShowcaseControls({ steps, index, playing, onGo, onToggle }: ShowcaseControlsProps) {
  const t = useTranslations("home.lab.hero.showcase");

  return (
    <div className="lab-sc-controls">
      <button type="button" className="lab-sc-btn" aria-label={t("controls.previous")} onClick={() => onGo(index - 1)}>
        ‹
      </button>
      <button type="button" className="lab-sc-btn lab-sc-play" onClick={onToggle}>
        {playing ? t("controls.pause") : t("controls.play")}
      </button>
      <button type="button" className="lab-sc-btn" aria-label={t("controls.next")} onClick={() => onGo(index + 1)}>
        ›
      </button>
      <div className="lab-sc-bars" role="group" aria-label={t("controls.steps")}>
        {steps.map((step, position) => (
          <button
            key={step.key}
            type="button"
            className="lab-sc-bar"
            data-phase={step.phase}
            data-state={position < index ? "past" : position === index ? "now" : undefined}
            data-first={(position > 0 && steps[position - 1].phase !== step.phase) || undefined}
            aria-label={t("controls.step", { n: position + 1, total: steps.length, tag: t(`tags.${step.tag}`) })}
            aria-current={position === index ? "step" : undefined}
            onClick={() => onGo(position)}
          />
        ))}
      </div>
    </div>
  );
}
