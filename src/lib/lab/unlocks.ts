import { LAB_METRICS, type LabResults, type MetricId } from "./metrics";
import { PANEL_ORDER, type PanelId } from "./panels";
import type { Need } from "./readiness";

/** Bests need only one round, so they stay out. */
type UnlockMetric = Exclude<MetricId & PanelId, "bests">;
const unlocks = (panel: PanelId): panel is UnlockMetric => panel in LAB_METRICS && panel !== "bests";

/** The metrics a few rounds unlock, in the order the section's rows read them. */
const UNLOCK_ORDER = PANEL_ORDER.filter(unlocks);

export interface Unlock {
  readonly metric: UnlockMetric;
  /** False before the first round: `need` is then the metric's whole threshold. */
  readonly started: boolean;
  readonly need: Need;
}

/** What playing still unlocks, read from the same registry and readiness as the panels, so the two never disagree. */
export function unlocksFor(results: LabResults): readonly Unlock[] {
  return UNLOCK_ORDER.flatMap((metric): Unlock[] => {
    const { state, need } = results[metric].readiness;
    if (state === "empty") return [{ metric, started: false, need: LAB_METRICS[metric].thresholds }];
    return state === "warming" && need ? [{ metric, started: true, need }] : [];
  });
}
