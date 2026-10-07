"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CALIBRATION_RULES, suggestTier, type RoundState } from "@/lib/home/calibration";
import { playHref } from "./links";

// Below this share a piece type's bar turns orange.
const WEAK_RECALL = 0.5;

const STATUS_KEY = {
  idle: "statusIdle",
  study: "statusRecording",
  rebuild: "statusRecording",
  scored: "statusDone",
} as const;

export function ReadoutCard({ state }: { state: RoundState }) {
  const t = useTranslations("home.lab.calibrate");
  const presets = useTranslations("game.presets");
  const scored = state.phase === "scored" ? state : null;
  const score = scored?.score;
  const tier = score ? suggestTier(score.accuracy) : null;
  const exposure = (CALIBRATION_RULES.studyMs / 1000).toFixed(1);

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
        <span className="lab-tag lab-tag-blue">{t(`readout.${STATUS_KEY[state.phase]}`)}</span>
      </div>
      <div className="lab-rc-grid">
        <div>
          <span className="lab-k">{t("readout.correct")}</span>
          <b>
            {score ? score.correct : "--"} / {score ? score.total : CALIBRATION_RULES.pieceCount}
          </b>
        </div>
        <div>
          <span className="lab-k">{t("readout.time")}</span>
          <b>{scored ? `${(scored.rebuildMs / 1000).toFixed(1)}s` : "--.-s"}</b>
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
              <div className="lab-bar" key={type}>
                <span>{t(`pieceTypes.${type}`)}</span>
                <span className="lab-bar-track">
                  <i
                    style={{ width: `${Math.round((correct / total) * 100)}%` }}
                    data-low={correct / total < WEAK_RECALL || undefined}
                  />
                </span>
                <span className="lab-bar-value">
                  {correct}/{total}
                </span>
              </div>
            ))}
          </>
        ) : (
          <span className="lab-note">{t("readout.byTypeEmpty")}</span>
        )}
      </div>
      <div className="lab-rc-next">
        {tier ? (
          <>
            <b>{t("readout.suggested")}</b>{" "}
            {t(`readout.${tier.advice}`, {
              tier: presets(`${tier.difficulty}.label`),
              pieces: tier.pieceCount,
              seconds: tier.memorizeTime,
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
}
