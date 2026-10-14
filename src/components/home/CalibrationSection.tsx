"use client";

import { memo, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CALIBRATION_CONFIG, CALIBRATION_RULES, loadCalibrationPosition, suggestTier } from "@/lib/home/calibration";
import { labPositionToFen, roundReducer, type RoundState } from "@/lib/round/round";
import { phaseNumber, type MicroscopePhaseId } from "@/lib/home/specimen";
import { trackEvent } from "@/lib/analytics/events";
import { recordLabRound } from "@/lib/lab/recordRound";
import { playHref } from "@/lib/game/roundLink";
import { useStudyDeadline } from "@/components/round/useStudyDeadline";
import { RefusalAnnouncement, RoundBoard, RoundPalette } from "@/components/round/RoundBoard";
import { RoundControls } from "@/components/round/RoundControls";
import { clockFace, RoundHead } from "@/components/round/RoundHead";
import { ReadoutCard } from "@/components/round/ReadoutCard";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const STUDY_SECONDS = CALIBRATION_RULES.studyMs / 1000;
const COPY = "home.lab.calibrate";

const ROUND_PHASE_ID = {
  ready: "study",
  countdown: "study",
  study: "study",
  rebuild: "rebuild",
  scored: "score",
} as const satisfies Record<Exclude<RoundState["phase"], "idle">, MicroscopePhaseId>;

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

/** The suggested difficulty under the readout, once the reading has a score. */
const CalibrationNext = memo(function CalibrationNext({ accuracy }: { accuracy: number | null }) {
  const t = useTranslations(COPY);
  const presets = useTranslations("game.presets");
  const tier = accuracy === null ? null : suggestTier(accuracy);

  return (
    <div className="lab-rc-next">
      {tier ? (
        <>
          <b>{t("readout.suggested")}</b>{" "}
          {t(`readout.${tier.advice}`, {
            tier: presets(`${tier.difficulty}.label`),
            pieceCount: tier.pieceCount,
            memorizeSeconds: tier.memorizeTime,
          })}
          <br />
          <Link className="lab-go" href={playHref(tier.pieceCount, tier.memorizeTime, "calibration_cta")}>
            {t("readout.playTier", { tier: presets(`${tier.difficulty}.label`) })} →
          </Link>
        </>
      ) : (
        t("readout.nextEmpty")
      )}
    </div>
  );
});

export function CalibrationSection() {
  const t = useTranslations(COPY);
  const tPhase = useTranslations("home.lab.method.phases");
  const [state, dispatch] = useReducer(roundReducer, { phase: "idle" });
  const onStudyEnded = useCallback((now: number) => dispatch({ type: "studyEnded", now }), []);
  useStudyDeadline(state, onStudyEnded);
  useRecordReading(state);
  const [starting, setStarting] = useState(false);
  const [startFailed, setStartFailed] = useState(false);

  const start = async () => {
    setStarting(true);
    setStartFailed(false);
    try {
      const target = await loadCalibrationPosition();
      if (target) {
        dispatch({ type: "start", config: CALIBRATION_CONFIG, target, now: performance.now() });
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

  return (
    <section className="lab-sec" id={LAB_SECTIONS.calibrate.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="calibrate" title={t("title")} lede={t("lede", { pieceCount: CALIBRATION_RULES.pieceCount, memorizeSeconds: STUDY_SECONDS })} />
        <div className="lab-cal">
          <div className="lab-cal-board lab-plate lab-plate-grid">
            <RoundHead
              heading={heading}
              face={clockFace(state, CALIBRATION_RULES.studyMs)}
              clearEnabled={state.phase === "rebuild"}
              onClear={() => dispatch({ type: "clear" })}
              copy={COPY}
            />
            <RoundBoard state={state} dispatch={dispatch} copy={COPY} />
            <RoundPalette state={state} dispatch={dispatch} copy={COPY} />
            <div className="lab-cal-actions">
              <RoundControls
                phase={state.phase}
                copy={COPY}
                starting={starting}
                press={{
                  start,
                  endStudy: () => dispatch({ type: "studyEnded", now: performance.now() }),
                  submit: () => dispatch({ type: "submit", now: performance.now() }),
                }}
              />
            </div>
            <p className="lab-sr" aria-live="polite">
              {announcement}
              <RefusalAnnouncement state={state} copy={COPY} />
            </p>
            {startFailed && <p className="lab-note">{t("startFailed")}</p>}
          </div>
          <div>
            <ReadoutCard
              state={state}
              copy={COPY}
              expected={CALIBRATION_RULES}
              next={<CalibrationNext accuracy={state.phase === "scored" ? state.score.accuracy : null} />}
            />
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
