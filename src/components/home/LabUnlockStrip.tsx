"use client";

import { useTranslations } from "next-intl";
import { LAB_METRICS, type LabResults } from "@/lib/lab/metrics";
import { unlocksFor, type Unlock } from "@/lib/lab/unlocks";
import { LabPlayLink } from "./LabPlayLink";

/** Before any round it lists the fixed thresholds, which the server can render; after, only what is still missing. */
export function LabUnlockStrip({ results }: { results: LabResults }) {
  const t = useTranslations("home.lab.record.unlock");
  const unlocks = unlocksFor(results);
  const setting = results.trend.value?.setting;

  const text = ({ metric, started, need: { rounds = 0, days = 0, exposures = 0 } }: Unlock) => {
    if (!started) return t(metric, { rounds, days, exposures });
    if (metric !== "trend") return t(`${metric}Left`, { days, exposures, threshold: LAB_METRICS[metric].thresholds.exposures ?? 0 });
    const key = rounds > 0 && days > 0 ? "trendRoundsDays" : rounds > 0 ? "trendRounds" : "trendDays";
    return t(key, { rounds, days, ...setting });
  };

  return (
    <div className="lab-unlock">
      {unlocks.length > 0 && (
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
      )}
    </div>
  );
}
