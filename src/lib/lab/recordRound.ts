import { v4 as uuidv4 } from "uuid";
import type { SetBoard } from "@/lib/types/game";
import { daysBetween } from "./readiness";
import { buildRoundRecord, localDayOf, type RoundCapture, type RoundInput, type RoundRecord } from "./record";
import { announceLabChange } from "./recordSync";
import { labStore } from "./storage";

/** `id` lets the caller find the round once it is saved; without one the round gets a fresh id. `board` is the set position played, if any. */
export type RoundFacts = Omit<RoundInput, "id" | "endedAt" | "localDay"> &
  Partial<Pick<RoundInput, "id">> &
  Pick<RoundCapture, "startSource" | "placements" | "removals" | "blindfold"> & { readonly board?: SetBoard };

/** A scored game round as the game hands it to the record: what was played, the id it is saved under, and when it ended. */
export interface LabRound {
  readonly facts: RoundFacts & { readonly id: string };
  readonly endedAt: number;
}

/** A review's delay is counted to the day the round ends, the day the record files it under. */
function boardCapture(board: SetBoard | undefined, localDay: string): RoundCapture {
  if (!board) return {};
  if (board.kind === "daily") return { kind: "daily", dailyDay: board.day };
  return { kind: "review", reviewOf: board.reviewOf, reviewDelayDays: daysBetween(board.firstDay, localDay) };
}

/** The record of a round that ended at `now`: what the record saves, and what the result screen counts before it is saved. */
export function roundRecordOf(facts: RoundFacts, now: Date): RoundRecord {
  const { id = uuidv4(), startSource, placements, removals, board, blindfold, ...input } = facts;
  const localDay = localDayOf(now);
  return buildRoundRecord(
    { ...input, id, endedAt: now.getTime(), localDay },
    { startSource, ...boardCapture(board, localDay), placements, removals, blindfold, tzOffsetMin: now.getTimezoneOffset() },
  );
}

/** Saves a finished round on this device. Never throws: the game must not depend on it. */
export async function recordLabRound(facts: RoundFacts, now: Date = new Date()): Promise<boolean> {
  try {
    const store = labStore();
    if (!store) return false;
    const saved = await store.addRound(roundRecordOf(facts, now));
    if (saved) announceLabChange();
    return saved;
  } catch {
    return false;
  }
}
