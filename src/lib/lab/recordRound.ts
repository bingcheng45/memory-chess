import { v4 as uuidv4 } from "uuid";
import type { SetBoard } from "@/lib/types/game";
import { daysBetween } from "./readiness";
import { buildRoundRecord, localDayOf, type RoundCapture, type RoundInput } from "./record";
import { announceLabChange } from "./recordSync";
import { labStore } from "./storage";

/** `id` lets the caller find the round once it is saved; without one the round gets a fresh id. `board` is the set position played, if any. */
export type RoundFacts = Omit<RoundInput, "id" | "endedAt" | "localDay"> &
  Partial<Pick<RoundInput, "id">> &
  Pick<RoundCapture, "startSource" | "placements" | "removals"> & { readonly board?: SetBoard };

/** A review's delay is counted to the day the round ends, the day the record files it under. */
function boardCapture(board: SetBoard | undefined, localDay: string): RoundCapture {
  if (!board) return {};
  if (board.kind === "daily") return { kind: "daily", dailyDay: board.day };
  return { kind: "review", reviewOf: board.reviewOf, reviewDelayDays: daysBetween(board.firstDay, localDay) };
}

/** Saves a finished round on this device. Never throws: the game must not depend on it. */
export async function recordLabRound(facts: RoundFacts, now: Date = new Date()): Promise<boolean> {
  try {
    const store = labStore();
    if (!store) return false;
    const { id = uuidv4(), startSource, placements, removals, board, ...input } = facts;
    const localDay = localDayOf(now);
    const saved = await store.addRound(
      buildRoundRecord(
        { ...input, id, endedAt: now.getTime(), localDay },
        { startSource, ...boardCapture(board, localDay), placements, removals, tzOffsetMin: now.getTimezoneOffset() },
      ),
    );
    if (saved) announceLabChange();
    return saved;
  } catch {
    return false;
  }
}
