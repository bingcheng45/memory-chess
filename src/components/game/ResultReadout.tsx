"use client";

import { useTranslations } from "next-intl";
import type { RoundState } from "@/lib/round/round";
import { formatSecondsMs } from "@/utils/timer";
import { RecallBar } from "@/components/home/LabCharts";
import "@/components/round/round.css";

type ScoredRound = Extract<RoundState, { phase: "scored" }>;

interface ResultReadoutProps {
  readonly round: ScoredRound;
}

/** The result screen's readout: the score and its figures beside the recall by piece type, in one compact card. */
export function ResultReadout({ round }: ResultReadoutProps) {
  const t = useTranslations("game.round");
  const { score } = round;
  const stats = [
    ["correct", `${score.correct} / ${score.total}`],
    ["wrong", String(score.wrong)],
    ["time", `${formatSecondsMs(round.rebuildMs)}s`],
    ["exposure", `${formatSecondsMs(round.studyMs)}s`],
  ] as const;

  return (
    <div className="lab-card lab-rr">
      <div className="lab-rr-cols">
        <div className="lab-rr-score">
          <span className="lab-k">{t("readout.title")}</span>
          <div className="lab-rc-big">
            {score.accuracy}
            <small>%</small>
          </div>
          <dl className="lab-rr-stats">
            {stats.map(([key, value]) => (
              <div key={key}>
                <dt>{t(`readout.${key}`)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lab-bars lab-rr-bars">
          <span className="lab-k">{t("readout.byType")}</span>
          {score.byType.map(({ type, correct, total }) => (
            <RecallBar key={type} label={t(`pieceTypes.${type}`)} share={correct / total} value={`${correct}/${total}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
