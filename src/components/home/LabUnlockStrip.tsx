"use client";

import { useTranslations } from "next-intl";
import type { LabResults } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS, type Need } from "@/lib/lab/readiness";
import { unlocksFor, type Unlock } from "@/lib/lab/unlocks";
import type { LabStorageState } from "@/hooks/useLabData";
import { LabPlayLink } from "./LabPlayLink";
import { settingValues } from "./labFormat";

const roundsAndDays = ({ rounds = 0, days = 0 }: Need) => (rounds > 0 && days > 0 ? "RoundsDays" : rounds > 0 ? "Rounds" : "Days");

const LEFT: { readonly [K in Unlock["metric"]]: (need: Need) => string } = {
  span: (need) => (need.largerRounds ? "spanLarger" : "spanLeft"),
  piecesHeld: (need) => `piecesHeld${roundsAndDays(need)}`,
  trend: (need) => `trend${roundsAndDays(need)}`,
  speed: (need) => (need.rightRounds ? "speedRight" : "speedRounds"),
  streak: () => "streakLeft",
  missMap: () => "missMapLeft",
  typeRecall: () => "typeRecallLeft",
};

/**
 * Before any round it lists the fixed thresholds, which the server can render; after, only what is still missing.
 * Once nothing is missing it keeps its reserved box with one line, since collapsing it moved the panels below.
 */
export function LabUnlockStrip({ results, storage }: { results: LabResults; storage: LabStorageState }) {
  const t = useTranslations("home.lab.record.unlock");
  const unlocks = unlocksFor(results);

  const text = ({ metric, started, need }: Unlock) => {
    const setting = metric === "speed" ? results.speed.value?.setting : results.trend.value?.setting;
    const values = {
      rounds: 0,
      days: 0,
      exposures: 0,
      qualifyingRounds: 0,
      largerRounds: 0,
      rightRounds: 0,
      ...need,
      accuracy: LAB_THRESHOLDS.spanAccuracy,
      minPieces: LAB_THRESHOLDS.spanMinPieces,
      ...(setting && settingValues(setting)),
    };
    return t(started ? LEFT[metric](need) : metric, values);
  };

  const content =
    unlocks.length === 0 ? (
      <p className="lab-panel-desc">{t("done")}</p>
    ) : (
      <>
        <div className="lab-panel-h">
          <p className="lab-k" id="lab-unlock-label">
            {t("label")}
          </p>
          <LabPlayLink panel="unlock" />
        </div>
        <ul aria-labelledby="lab-unlock-label">
          {/* Keyed by position, so when real data arrives each line changes its text in place instead of moving. */}
          {unlocks.map((unlock, index) => (
            <li key={index}>{text(unlock)}</li>
          ))}
        </ul>
      </>
    );

  return (
    <div className="lab-unlock">
      {storage !== "unavailable" && content}
    </div>
  );
}
