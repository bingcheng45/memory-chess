"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import type { LabResults } from "@/lib/lab/metrics";
import { LAB_THRESHOLDS, type Need } from "@/lib/lab/readiness";
import { UNLOCK_ORDER, unlocksFor, type Unlock } from "@/lib/lab/unlocks";
import type { WelcomeBack } from "@/lib/lab/welcome";
import type { LabStorageState } from "@/hooks/useLabData";
import { LabPlayLink } from "./LabPlayLink";
import { figureOf } from "./LabRecordPanels";
import { settingValues } from "./labFormat";
import { LabWelcome } from "./LabWelcome";

const roundsAndDays = ({ rounds = 0, days = 0 }: Need) => (rounds > 0 && days > 0 ? "RoundsDays" : rounds > 0 ? "Rounds" : "Days");

/** Each metric's figure, named by its panel's own caption, and the message for what it still needs once started. */
const ROWS: { readonly [K in Unlock["metric"]]: { readonly fig: string; readonly left: (need: Need) => string } } = {
  span: { fig: "span", left: (need) => (need.largerRounds ? "spanLarger" : "spanLeft") },
  piecesHeld: { fig: "held", left: (need) => `piecesHeld${roundsAndDays(need)}` },
  trend: { fig: "spark", left: (need) => `trend${roundsAndDays(need)}` },
  speed: { fig: "speed", left: (need) => (need.rightRounds ? "speedRight" : "speedRounds") },
  streak: { fig: "streak", left: () => "streakLeft" },
  curve: { fig: "curve", left: () => "curveLeft" },
  notebook: { fig: "notebook", left: () => "notebook" },
  missMap: { fig: "heat", left: () => "missMapLeft" },
  typeRecall: { fig: "types", left: () => "typeRecallLeft" },
  insights: { fig: "insights", left: () => "insightsLeft" },
};

/**
 * Before any round it lists the fixed thresholds, which the server can render; after, only what is still missing.
 * Once nothing is missing it keeps its reserved box with one line, since collapsing it moved the panels below.
 * A returning player's greeting sits at the top of the same box, so it needs no space of its own.
 */
export function LabUnlockStrip({ results, storage, welcome }: { results: LabResults; storage: LabStorageState; welcome: WelcomeBack | null }) {
  const record = useTranslations("home.lab.record");
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
      reviews: 0,
      ...need,
      accuracy: LAB_THRESHOLDS.spanAccuracy,
      minPieces: LAB_THRESHOLDS.spanMinPieces,
      ...(setting && settingValues(setting)),
    };
    return t(started ? ROWS[metric].left(need) : metric, values);
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
        <p className="lab-unlock-count">{t("count", { unlocked: UNLOCK_ORDER.length - unlocks.length, total: UNLOCK_ORDER.length })}</p>
        {/* Keyed by whether the record has arrived: a line rewrapped in place moved every line below it, a layout shift. */}
        <ul aria-labelledby="lab-unlock-label" key={unlocks.some(({ started }) => started) ? "mine" : "sample"}>
          {unlocks.map((unlock) => (
            <li key={unlock.metric}>
              <span>{record(`${ROWS[unlock.metric].fig}.fig`, { number: figureOf(unlock.metric) })}</span>
              <span>{text(unlock)}</span>
            </li>
          ))}
        </ul>
      </>
    );

  return (
    <div className="lab-unlock">
      {/* Keyed so the label and list under the greeting mount anew rather than move down, which is a layout shift. */}
      <Fragment key={welcome ? "welcome" : "plain"}>
        {welcome && <LabWelcome welcome={welcome} />}
        {storage !== "unavailable" && content}
      </Fragment>
    </div>
  );
}
