import { v4 as uuidv4 } from "uuid";
import { buildRoundRecord, localDayOf, type RoundInput } from "./record";
import { labStore } from "./storage";

/** Fired on window after a round is saved, so open panels can re-read the record. */
export const LAB_RECORD_CHANGED = "memory-chess-lab-changed";

export type RoundFacts = Omit<RoundInput, "id" | "endedAt" | "localDay">;

/** Saves a finished round on this device. Never throws: the game must not depend on it. */
export async function recordLabRound(facts: RoundFacts, now: Date = new Date()): Promise<boolean> {
  try {
    const store = labStore();
    if (!store) return false;
    const saved = await store.addRound(
      buildRoundRecord({ ...facts, id: uuidv4(), endedAt: now.getTime(), localDay: localDayOf(now) }),
    );
    if (saved) window.dispatchEvent(new Event(LAB_RECORD_CHANGED));
    return saved;
  } catch {
    return false;
  }
}
