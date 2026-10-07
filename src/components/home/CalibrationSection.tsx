"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CALIBRATION_RULES,
  labPositionToFen,
  loadCalibrationPosition,
  roundReducer,
  type RoundState,
} from "@/lib/home/calibration";
import { recordLabRound } from "@/lib/lab/recordRound";
import { CalibrationBoard } from "./CalibrationBoard";
import { ReadoutCard } from "./ReadoutCard";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const STUDY_TICK_MS = 50;
const REBUILD_TICK_MS = 100;
const STUDY_SECONDS = CALIBRATION_RULES.studyMs / 1000;

const formatSeconds = (ms: number) => (ms / 1000).toFixed(1).padStart(4, "0");

/** Counts the study window down and the rebuild up; ends the study window itself. */
function useRoundClock(state: RoundState, onStudyEnded: (now: number) => void): number {
  const [clockMs, setClockMs] = useState<number>(CALIBRATION_RULES.studyMs);
  const studyTarget = state.phase === "study" ? state.target : null;
  const rebuildStart = state.phase === "rebuild" ? state.startedAt : null;

  useEffect(() => {
    if (!studyTarget) return;
    const startedAt = performance.now();
    setClockMs(CALIBRATION_RULES.studyMs);
    const timer = setInterval(() => {
      const now = performance.now();
      const left = Math.max(0, CALIBRATION_RULES.studyMs - (now - startedAt));
      setClockMs(left);
      if (left === 0) {
        clearInterval(timer);
        onStudyEnded(now);
      }
    }, STUDY_TICK_MS);
    return () => clearInterval(timer);
  }, [studyTarget, onStudyEnded]);

  useEffect(() => {
    if (rebuildStart === null) return;
    setClockMs(0);
    const timer = setInterval(() => setClockMs(performance.now() - rebuildStart), REBUILD_TICK_MS);
    return () => clearInterval(timer);
  }, [rebuildStart]);

  return clockMs;
}

const PHASE_KEY = {
  study: "phaseStudy",
  rebuild: "phaseRebuild",
  scored: "phaseScore",
} as const;

/** Saves each scored reading to the lab record once, tagged so it never counts as a game round. */
function useRecordReading(state: RoundState): void {
  const recorded = useRef<RoundState | null>(null);

  useEffect(() => {
    if (state.phase !== "scored" || recorded.current === state) return;
    recorded.current = state;
    void recordLabRound({
      source: "calibration",
      pieceCount: CALIBRATION_RULES.pieceCount,
      memorizeSeconds: STUDY_SECONDS,
      targetFen: labPositionToFen(state.target),
      placedFen: labPositionToFen(state.placed),
      memorizeMs: CALIBRATION_RULES.studyMs,
      solveMs: Math.round(state.rebuildMs),
    });
  }, [state]);
}

export function CalibrationSection() {
  const t = useTranslations("home.lab.calibrate");
  const [state, dispatch] = useReducer(roundReducer, { phase: "idle" });
  const onStudyEnded = useCallback((now: number) => dispatch({ type: "studyEnded", now }), []);
  const clockMs = useRoundClock(state, onStudyEnded);
  useRecordReading(state);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  const start = async () => {
    setStarting(true);
    setStartFailed(false);
    try {
      const target = await loadCalibrationPosition();
      if (target) dispatch({ type: "start", target });
      else setStartFailed(true);
    } catch {
      setStartFailed(true);
    } finally {
      setStarting(false);
    }
  };

  const heading =
    state.phase === "idle"
      ? t("phaseReady", { pieces: CALIBRATION_RULES.pieceCount, seconds: STUDY_SECONDS })
      : t(PHASE_KEY[state.phase]);
  const clock =
    state.phase === "scored"
      ? `${state.score.accuracy}%`
      : `${formatSeconds(state.phase === "idle" ? CALIBRATION_RULES.studyMs : clockMs)}s`;
  const meter = state.phase === "study" ? (clockMs / CALIBRATION_RULES.studyMs) * 100 : 0;
  const announcement = startFailed
    ? t("startFailed")
    : state.phase === "study"
      ? t("liveStudy", { seconds: STUDY_SECONDS })
      : state.phase === "rebuild"
        ? t("liveRebuild")
        : state.phase === "scored"
          ? t("liveScore", {
              accuracy: state.score.accuracy,
              correct: state.score.correct,
              total: state.score.total,
            })
          : "";
  const startLabel =
    state.phase === "rebuild" ? t("restart") : state.phase === "scored" ? t("again") : t("start");

  return (
    <section className="lab-sec" id={LAB_SECTIONS.calibrate.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="calibrate" title={t("title")} lede={t("lede", { pieces: CALIBRATION_RULES.pieceCount, seconds: STUDY_SECONDS })} />
        <div className="lab-cal">
          <div className="lab-cal-board">
            <div className="lab-cal-head">
              <span className="lab-k">{heading}</span>
              <span className="lab-mono">{clock}</span>
            </div>
            <div className="lab-meter" aria-hidden="true">
              <i style={{ width: `${meter}%` }} />
            </div>
            <CalibrationBoard state={state} dispatch={dispatch} />
            <div className="lab-cal-actions">
              <button
                type="button"
                className="lab-btn lab-btn-primary"
                disabled={state.phase === "study" || starting}
                onClick={start}
              >
                <span className="lab-dot" aria-hidden="true" />
                {startLabel}
              </button>
              <button
                type="button"
                className="lab-btn lab-btn-secondary"
                disabled={state.phase !== "rebuild"}
                onClick={() => dispatch({ type: "submit", now: performance.now() })}
              >
                {t("submit")}
              </button>
              <button
                type="button"
                className="lab-btn lab-btn-secondary"
                disabled={state.phase !== "rebuild"}
                onClick={() => dispatch({ type: "clear" })}
              >
                {t("clear")}
              </button>
            </div>
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
