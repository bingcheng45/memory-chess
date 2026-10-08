"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { LAB_METRICS, type LabResults } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS, type Need } from "@/lib/lab/readiness";
import { unlocksFor, type Unlock } from "@/lib/lab/unlocks";
import type { LabStorageState } from "@/hooks/useLabData";
import { LabPlayLink } from "./LabPlayLink";

const roundsAndDays = ({ rounds = 0, days = 0 }: Need) => (rounds > 0 && days > 0 ? "RoundsDays" : rounds > 0 ? "Rounds" : "Days");

const LEFT: { readonly [K in Unlock["metric"]]: (need: Need) => string } = {
  span: (need) => (need.largerRounds ? "spanLarger" : "spanLeft"),
  piecesHeld: (need) => `piecesHeld${roundsAndDays(need)}`,
  trend: (need) => `trend${roundsAndDays(need)}`,
  speed: () => "speedRounds",
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
  const listId = useId();
  const [expanded, setExpanded] = useState(false);

  const text = ({ metric, started, need }: Unlock) => {
    const values = {
      rounds: 0,
      days: 0,
      exposures: 0,
      qualifyingRounds: 0,
      largerRounds: 0,
      ...need,
      accuracy: LAB_THRESHOLDS.spanAccuracy,
      minPieces: LAB_THRESHOLDS.spanMinPieces,
      threshold: LAB_METRICS[metric].thresholds.exposures ?? 0,
      ...(metric === "speed" ? results.speed.value?.setting : results.trend.value?.setting),
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
        <ul aria-labelledby="lab-unlock-label" id={listId}>
          {/* Keyed by position, so when real data arrives each line changes its text in place instead of moving. */}
          {unlocks.map((unlock, index) => (
            <li key={index}>{text(unlock)}</li>
          ))}
        </ul>
        {/* Phones show the first line only, so the box keeps one small reserve for any number of lines. */}
        <button
          type="button"
          className="lab-bests-toggle lab-unlock-toggle"
          aria-expanded={expanded}
          aria-controls={listId}
          data-single={unlocks.length === 1 ? "" : undefined}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t("showFewer") : t("showAll", { count: unlocks.length })}
        </button>
      </>
    );

  return (
    <div className="lab-unlock" data-expanded={expanded ? "" : undefined}>
      {storage !== "unavailable" && content}
    </div>
  );
}
