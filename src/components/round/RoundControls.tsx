"use client";

import { useTranslations } from "next-intl";
import { ROUND_CONTROLS, type ControlIntent } from "@/lib/round/controls";
import type { RoundPhase } from "@/lib/round/round";
import type { RoundCopy } from "./RoundBoard";
import "./round.css";

interface RoundControlsProps {
  readonly phase: RoundPhase;
  readonly press: Readonly<Record<ControlIntent, () => void>>;
  readonly copy: RoundCopy;
  /** Holds the start button while a round is being set up. */
  readonly starting?: boolean;
}

/** The round's two buttons, from ROUND_CONTROLS. */
export function RoundControls({ phase, press, copy, starting = false }: RoundControlsProps) {
  const t = useTranslations(copy);
  const controls = ROUND_CONTROLS[phase];

  return (
    <div className="lab-cal-main" role="group" aria-label={t("controlsLabel")}>
      {(["first", "second"] as const).map((slot) => {
        const control = controls[slot];
        const primary = controls.primary === slot;
        return (
          <button
            key={slot}
            type="button"
            className={`lab-btn ${primary ? "lab-btn-primary" : "lab-btn-secondary"}`}
            data-primary={primary || undefined}
            disabled={!control.enabled || (control.intent === "start" && starting)}
            onClick={press[control.intent]}
          >
            {t(control.label)}
          </button>
        );
      })}
    </div>
  );
}
