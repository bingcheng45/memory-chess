"use client";

import { Eraser } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CALIBRATION_RULES,
  labPositionToFen,
  loadCalibrationPosition,
  roundReducer,
  type RoundState,
} from "@/lib/home/calibration";
import { phaseNumber, type MicroscopePhaseId } from "@/lib/home/specimen";
import { trackEvent } from "@/lib/analytics/events";
import { recordLabRound } from "@/lib/lab/recordRound";
import { formatSecondsMs } from "@/utils/timer";
import { CalibrationBoard } from "./CalibrationBoard";
import { ReadoutCard } from "./ReadoutCard";
import { RoundClock, type ClockFace } from "./RoundClock";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const STUDY_SECONDS = CALIBRATION_RULES.studyMs / 1000;

function useStudyDeadline(state: RoundState, onStudyEnded: (now: number) => void): void {
  const startedAt = state.phase === "study" ? state.startedAt : null;

  useEffect(() => {
    if (startedAt === null) return;
    const left = Math.max(0, CALIBRATION_RULES.studyMs - (performance.now() - startedAt));
    const timer = setTimeout(() => onStudyEnded(performance.now()), left);
    return () => clearTimeout(timer);
  }, [startedAt, onStudyEnded]);
}

function clockFace(state: RoundState): ClockFace {
  switch (state.phase) {
    case "idle":
      return { kind: "still", text: `${formatSecondsMs(CALIBRATION_RULES.studyMs)}s` };
    case "study":
      return { kind: "countdown", startedAt: state.startedAt, totalMs: CALIBRATION_RULES.studyMs };
    case "rebuild":
      return { kind: "countup", startedAt: state.log.startedAt };
    case "scored":
      return { kind: "still", text: `${state.score.accuracy}%` };
  }
}

const ROUND_PHASE_ID = {
  study: "study",
  rebuild: "rebuild",
  scored: "score",
} as const satisfies Record<Exclude<RoundState["phase"], "idle">, MicroscopePhaseId>;

type ControlIntent = "start" | "endStudy" | "submit";

interface RoundControl {
  readonly label: "start" | "done" | "restart" | "again" | "submit";
  readonly intent: ControlIntent;
  readonly enabled: boolean;
}

interface PhaseControls {
  readonly first: RoundControl;
  readonly second: RoundControl;
  readonly primary: "first" | "second";
  readonly clearEnabled: boolean;
  readonly hint: "studyHint" | null;
}

const SUBMIT_OFF: RoundControl = { label: "submit", intent: "submit", enabled: false };

const ROUND_CONTROLS = {
  idle: {
    first: { label: "start", intent: "start", enabled: true },
    second: SUBMIT_OFF,
    primary: "first",
    clearEnabled: false,
    hint: null,
  },
  study: {
    first: { label: "done", intent: "endStudy", enabled: true },
    second: SUBMIT_OFF,
    primary: "first",
    clearEnabled: false,
    hint: "studyHint",
  },
  rebuild: {
    first: { label: "restart", intent: "start", enabled: true },
    second: { label: "submit", intent: "submit", enabled: true },
    primary: "second",
    clearEnabled: true,
    hint: null,
  },
  scored: {
    first: { label: "again", intent: "start", enabled: true },
    second: SUBMIT_OFF,
    primary: "first",
    clearEnabled: false,
    hint: null,
  },
} as const satisfies Record<RoundState["phase"], PhaseControls>;

function useRecordReading(state: RoundState): void {
  const recorded = useRef<RoundState | null>(null);

  useEffect(() => {
    if (state.phase !== "scored" || recorded.current === state) return;
    recorded.current = state;
    void recordLabRound({
      source: "calibration",
      startSource: "calibration",
      pieceCount: CALIBRATION_RULES.pieceCount,
      memorizeSeconds: STUDY_SECONDS,
      targetFen: labPositionToFen(state.target),
      placedFen: labPositionToFen(state.placed),
      memorizeMs: Math.round(state.studyMs),
      solveMs: Math.round(state.rebuildMs),
      placements: state.log.placements,
      removals: state.log.removals,
    });
    trackEvent({
      name: "round_complete",
      params: {
        piece_count: CALIBRATION_RULES.pieceCount,
        memorize_time: STUDY_SECONDS,
        correct_pieces: state.score.correct,
        accuracy: state.score.accuracy,
        source: "calibration",
      },
    });
  }, [state]);
}

export function CalibrationSection() {
  const t = useTranslations("home.lab.calibrate");
  const tPhase = useTranslations("home.lab.method.phases");
  const [state, dispatch] = useReducer(roundReducer, { phase: "idle" });
  const onStudyEnded = useCallback((now: number) => dispatch({ type: "studyEnded", now }), []);
  useStudyDeadline(state, onStudyEnded);
  useRecordReading(state);
  const meterRef = useRef<HTMLElement>(null);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  const start = async () => {
    setStarting(true);
    setStartFailed(false);
    try {
      const target = await loadCalibrationPosition();
      if (target) {
        dispatch({ type: "start", target, now: performance.now() });
        trackEvent({
          name: "round_start",
          params: { piece_count: CALIBRATION_RULES.pieceCount, memorize_time: STUDY_SECONDS, source: "calibration" },
        });
      }
      else setStartFailed(true);
    } catch {
      setStartFailed(true);
    } finally {
      setStarting(false);
    }
  };

  const heading =
    state.phase === "idle"
      ? t("phaseReady", { pieceCount: CALIBRATION_RULES.pieceCount, memorizeSeconds: STUDY_SECONDS })
      : t("phaseLabel", {
          number: phaseNumber(ROUND_PHASE_ID[state.phase]),
          name: tPhase(`${ROUND_PHASE_ID[state.phase]}.name`),
        });
  const announcement = startFailed
    ? t("startFailed")
    : state.phase === "study"
      ? t("liveStudy", { memorizeSeconds: STUDY_SECONDS })
      : state.phase === "rebuild"
        ? t("liveRebuild")
        : state.phase === "scored"
          ? t("liveScore", {
              accuracy: state.score.accuracy,
              correct: state.score.correct,
              total: state.score.total,
            })
          : "";
  const controls = ROUND_CONTROLS[state.phase];
  const press: Record<ControlIntent, () => void> = {
    start,
    endStudy: () => dispatch({ type: "studyEnded", now: performance.now() }),
    submit: () => dispatch({ type: "submit", now: performance.now() }),
  };
  const renderControl = (slot: "first" | "second") => {
    const control = controls[slot];
    const primary = controls.primary === slot;
    return (
      <button
        type="button"
        className={`lab-btn ${primary ? "lab-btn-primary" : "lab-btn-secondary"}`}
        data-primary={primary || undefined}
        disabled={!control.enabled || (control.intent === "start" && starting)}
        aria-describedby={control.label === "done" ? "cal-hint" : undefined}
        onClick={press[control.intent]}
      >
        {primary && <span className="lab-dot" aria-hidden="true" />}
        {t(control.label)}
      </button>
    );
  };

  return (
    <section className="lab-sec" id={LAB_SECTIONS.calibrate.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="calibrate" title={t("title")} lede={t("lede", { pieceCount: CALIBRATION_RULES.pieceCount, memorizeSeconds: STUDY_SECONDS })} />
        <div className="lab-cal">
          <div className="lab-cal-board">
            <div className="lab-cal-head">
              <span className="lab-k">{heading}</span>
              <RoundClock face={clockFace(state)} meterRef={meterRef} />
            </div>
            <div className="lab-meter" aria-hidden="true">
              <i ref={meterRef} />
            </div>
            <CalibrationBoard state={state} dispatch={dispatch} />
            <div className="lab-cal-actions">
              <div className="lab-cal-main" role="group" aria-label={t("controlsLabel")}>
                {renderControl("first")}
                {renderControl("second")}
              </div>
              <button
                type="button"
                className="lab-icon-btn"
                disabled={!controls.clearEnabled}
                aria-label={t("clear")}
                title={t("clear")}
                onClick={() => dispatch({ type: "clear" })}
              >
                <Eraser size={20} aria-hidden="true" />
              </button>
            </div>
            <p className="lab-note lab-cal-hint" id="cal-hint">
              {controls.hint && t(controls.hint)}
            </p>
            <p className="lab-sr" aria-live="polite">
              {announcement}
            </p>
            {startFailed && <p className="lab-note">{t("startFailed")}</p>}
          </div>
          <div>
            <ReadoutCard state={state} />
            <ol className="lab-cal-steps">
              {(t.raw("steps") as string[]).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
