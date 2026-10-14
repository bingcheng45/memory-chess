"use client";

import { memo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { RoundState } from "@/lib/round/round";
import { formatSecondsMs } from "@/utils/timer";
import { RecallBar } from "@/components/home/LabCharts";
import type { RoundCopy } from "./RoundBoard";
import "./round.css";

const STATUS = {
  idle: { key: "statusIdle", state: "idle" },
  ready: { key: "statusIdle", state: "idle" },
  countdown: { key: "statusIdle", state: "idle" },
  study: { key: "statusRecording", state: "recording" },
  rebuild: { key: "statusRecording", state: "recording" },
  scored: { key: "statusDone", state: "done" },
} as const satisfies Record<RoundState["phase"], { key: string; state: string }>;

interface ReadoutCardProps {
  readonly state: RoundState;
  readonly copy: RoundCopy;
  /** What the card shows before a round has a config of its own. */
  readonly expected: { readonly pieceCount: number; readonly studyMs: number };
  /** A block under the recall bars, such as the homepage's suggested difficulty. */
  readonly next?: ReactNode;
}

// Memoized: the round's clock ticks every frame, and this changes only with the round.
export const ReadoutCard = memo(function ReadoutCard({ state, copy, expected, next }: ReadoutCardProps) {
  const t = useTranslations(copy);
  const scored = state.phase === "scored" ? state : null;
  const score = scored?.score;
  const exposure = formatSecondsMs(state.phase === "rebuild" || state.phase === "scored" ? state.studyMs : expected.studyMs);
  const pieceCount = state.phase === "idle" ? expected.pieceCount : state.config.pieceCount;

  return (
    <div className="lab-card">
      <div className="lab-rc-top">
        <div>
          <span className="lab-k">{t("readout.title")}</span>
          <div className="lab-rc-big">
            {score ? score.accuracy : "--"}
            <small>%</small>
          </div>
        </div>
        <span className="lab-status" data-state={STATUS[state.phase].state}>
          {t(`readout.${STATUS[state.phase].key}`)}
        </span>
      </div>
      <div className="lab-rc-grid">
        <div>
          <span className="lab-k">{t("readout.correct")}</span>
          <b>
            {score ? score.correct : "--"} / {score ? score.total : pieceCount}
          </b>
        </div>
        <div>
          <span className="lab-k">{t("readout.time")}</span>
          <b>{scored ? `${formatSecondsMs(scored.rebuildMs)}s` : "--.---s"}</b>
        </div>
        <div>
          <span className="lab-k">{t("readout.wrong")}</span>
          <b>{score ? score.wrong : "--"}</b>
        </div>
        <div>
          <span className="lab-k">{t("readout.exposure")}</span>
          <b>{exposure}s</b>
        </div>
      </div>
      <div className="lab-bars">
        {score ? (
          <>
            <span className="lab-k">{t("readout.byType")}</span>
            {score.byType.map(({ type, correct, total }) => (
              <RecallBar key={type} label={t(`pieceTypes.${type}`)} share={correct / total} value={`${correct}/${total}`} />
            ))}
          </>
        ) : (
          <span className="lab-note">{t("readout.byTypeEmpty")}</span>
        )}
      </div>
      {next}
      <div className="lab-legend">
        <span>
          <i data-key="ok" aria-hidden="true" />
          {t("readout.legendCorrect")}
        </span>
        <span>
          <i data-key="wrong" aria-hidden="true" />
          {t("readout.legendWrong")}
        </span>
        <span>
          <i data-key="miss" aria-hidden="true" />
          {t("readout.legendMissed")}
        </span>
      </div>
    </div>
  );
});
