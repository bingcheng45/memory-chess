import { localDayOf } from "./record";
import { EMPTY_SUMMARY, type LabSummary } from "./summary";

export const SEED_PARAM = "lab-seed";

/** The days each seed has played, counted back from today, so a review capture can photograph a Lab record it needs. */
const SEEDS = new Map<string, readonly number[]>([
  // Four days played and the miss three days ago already forgiven, so skipping today would end the streak.
  ["streak-ends-today", [-5, -4, -2, -1]],
]);

/** A link to the live site never seeds, so nobody can be sent one that replaces their record. */
const LIVE_HOST = /(^|\.)thememorychess\.com$/;

/** The summary a `?lab-seed=` address asks for, or null when it names no seed or points at the live site. */
export function seededSummary(address: URL, now: Date): LabSummary | null {
  const offsets = SEEDS.get(address.searchParams.get(SEED_PARAM) ?? "");
  if (!offsets || LIVE_HOST.test(address.hostname)) return null;
  const days = offsets.map((offset) => localDayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)));
  return { ...EMPTY_SUMMARY, rounds: offsets.length, days };
}
