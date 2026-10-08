import type { LabInput } from "./engine";
import { daysBetween, LAB_THRESHOLDS } from "./readiness";
import type { RoundRecord } from "./record";
import { MAX_DAYS } from "./summary";

export interface WelcomeBack {
  /** Today's day of the record counted from the first day played, or null once the kept days no longer reach it. */
  readonly day: number | null;
  readonly accuracy: number;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

/** A greeting for a player back after some days away, read from their latest round. */
export function welcomeBack({ records, summary: { days }, today }: LabInput): WelcomeBack | null {
  const latest = records.reduce<RoundRecord | null>((found, record) => (found && found.endedAt >= record.endedAt ? found : record), null);
  const lastDay = days.at(-1);
  if (!today || !latest || !lastDay || daysBetween(lastDay, today) < LAB_THRESHOLDS.awayDays) return null;
  return {
    day: days.length < MAX_DAYS ? daysBetween(days[0], today) + 1 : null,
    accuracy: latest.accuracy,
    pieceCount: latest.config.pieceCount,
    memorizeSeconds: latest.config.memorizeSeconds,
  };
}
