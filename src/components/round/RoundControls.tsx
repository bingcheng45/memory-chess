"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { gameSlotsOf, ROUND_CONTROLS, type ControlIntent } from "@/lib/round/controls";
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
    <div className="lab-cal-main" role="group" aria-label={t("controlsLabel")} data-phase={phase}>
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

type GameControlProps = Omit<RoundControlsProps, "starting">;

/** The phase's primary control, in /game's tall slot beside the palette. */
export function RoundPrimaryControl({ phase, press, copy }: GameControlProps) {
  const t = useTranslations(copy);
  const { primary } = gameSlotsOf(phase);

  return (
    <button
      type="button"
      className="lab-btn lab-btn-primary lab-primary-slot"
      data-primary
      disabled={!primary.enabled}
      onClick={press[primary.intent]}
    >
      {t(primary.label)}
    </button>
  );
}

/** The phase's restart as an icon in /game's status row; nothing in a phase without one, the row's slot held empty. */
export function RoundRestartControl({ phase, press, copy }: GameControlProps) {
  const t = useTranslations(copy);
  const { restart } = gameSlotsOf(phase);
  if (!restart) return null;

  return (
    <button
      type="button"
      className="lab-icon-btn lab-restart"
      aria-label={t(restart.label)}
      title={t(restart.label)}
      disabled={!restart.enabled}
      onClick={press[restart.intent]}
    >
      <RotateCcw size={20} aria-hidden="true" />
    </button>
  );
}
