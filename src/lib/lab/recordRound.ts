import { v4 as uuidv4 } from "uuid";
import { buildRoundRecord, localDayOf, type RoundCapture, type RoundInput } from "./record";
import { announceLabChange } from "./recordSync";
import { labStore } from "./storage";

/** `id` lets the caller find the round once it is saved; without one the round gets a fresh id. */
export type RoundFacts = Omit<RoundInput, "id" | "endedAt" | "localDay"> &
  Partial<Pick<RoundInput, "id">> &
  Pick<RoundCapture, "startSource" | "placements" | "removals" | "kind" | "dailyDay">;

/** Saves a finished round on this device. Never throws: the game must not depend on it. */
export async function recordLabRound(facts: RoundFacts, now: Date = new Date()): Promise<boolean> {
  try {
    const store = labStore();
    if (!store) return false;
    const { id = uuidv4(), startSource, placements, removals, kind, dailyDay, ...input } = facts;
    const saved = await store.addRound(
      buildRoundRecord(
        { ...input, id, endedAt: now.getTime(), localDay: localDayOf(now) },
        { startSource, kind, dailyDay, placements, removals, tzOffsetMin: now.getTimezoneOffset() },
      ),
    );
    if (saved) announceLabChange();
    return saved;
  } catch {
    return false;
  }
}
