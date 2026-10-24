"use client";

import { Eraser } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { formatSecondsMs } from "@/utils/timer";
import type { RoundState } from "@/lib/round/round";
import { RoundClock, type ClockFace } from "./RoundClock";
import type { RoundCopy } from "./RoundBoard";
import "./round.css";

export function clockFace(state: RoundState, idleStudyMs: number): ClockFace {
  switch (state.phase) {
    case "idle":
      return { kind: "still", text: `${formatSecondsMs(idleStudyMs)}s` };
    case "ready":
    case "countdown":
      return { kind: "still", text: `${formatSecondsMs(state.config.studyMs)}s` };
    case "study":
      return { kind: "countdown", startedAt: state.startedAt, totalMs: state.config.studyMs };
    case "rebuild":
      return { kind: "countup", startedAt: state.log.startedAt };
    case "scored":
      return { kind: "still", text: `${state.score.accuracy}%` };
  }
}

interface RoundHeadProps {
  readonly heading: ReactNode;
  readonly face: ClockFace;
  readonly clearEnabled: boolean;
  readonly onClear: () => void;
  readonly copy: RoundCopy;
  /** Before the phase, for /game's leave button. */
  readonly lead?: ReactNode;
  /** Between the clock and the eraser, for /game's restart. */
  readonly trail?: ReactNode;
}

/** The phase, the clock, the eraser and the study meter above the board. */
export function RoundHead({ heading, face, clearEnabled, onClear, copy, lead, trail }: RoundHeadProps) {
  const t = useTranslations(copy);
  const meterRef = useRef<HTMLElement>(null);

  return (
    <>
      <div className="lab-cal-head">
        {lead}
        <span className="lab-k">{heading}</span>
        <div className="lab-cal-head-end">
          <RoundClock face={face} meterRef={meterRef} />
          {trail}
          <button
            type="button"
            className="lab-icon-btn"
            disabled={!clearEnabled}
            aria-label={t("clear")}
            title={t("clear")}
            onClick={onClear}
          >
            <Eraser size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="lab-meter" aria-hidden="true">
        <i ref={meterRef} />
      </div>
    </>
  );
}
