import { v4 as uuidv4 } from "uuid";
import { buildRoundRecord, localDayOf, type RoundCapture, type RoundInput } from "./record";
import { labStore } from "./storage";

export const LAB_RECORD_CHANGED = "memory-chess-lab-changed";

export type RoundFacts = Omit<RoundInput, "id" | "endedAt" | "localDay"> &
  Pick<RoundCapture, "startSource" | "placements" | "removals">;

/** Saves a finished round on this device. Never throws: the game must not depend on it. */
export async function recordLabRound(facts: RoundFacts, now: Date = new Date()): Promise<boolean> {
  try {
    const store = labStore();
    if (!store) return false;
    const { startSource, placements, removals, ...input } = facts;
    const saved = await store.addRound(
      buildRoundRecord(
        { ...input, id: uuidv4(), endedAt: now.getTime(), localDay: localDayOf(now) },
        { startSource, placements, removals, tzOffsetMin: now.getTimezoneOffset() },
      ),
    );
    if (saved) window.dispatchEvent(new Event(LAB_RECORD_CHANGED));
    return saved;
  } catch {
    return false;
  }
}
