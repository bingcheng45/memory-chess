import { trackEvent } from "@/lib/analytics/events";
import { labStore } from "@/lib/lab/storage";
import { buildExport, type PlayerStanding } from "@/lib/lab/transfer";
import { saveBlob } from "@/lib/saveBlob";

const EXPORT_FILE = "memory-chess-lab-record.json";

// Loaded on demand so the game store stays out of the home bundle until a backup needs it.
const gameStore = () => import("@/lib/store/gameStore");

async function readStanding(): Promise<PlayerStanding | undefined> {
  try {
    const { useGameStore, standingOf } = await gameStore();
    return standingOf(useGameStore.getState());
  } catch {
    return undefined;
  }
}

/** Saves the record, with the rating and streak, as a file. Resolves to when the export started, or null without storage. */
export async function downloadLabRecord(): Promise<number | null> {
  const store = labStore();
  if (!store) return null;
  // Summary first: a round saved between the two reads is then in the file but uncounted, never counted but missing.
  const lifetime = await store.readSummary();
  const rounds = await store.listRounds();
  const standing = await readStanding();
  const now = Date.now();
  saveBlob(new Blob([JSON.stringify(buildExport(rounds, now, lifetime, standing))], { type: "application/json" }), EXPORT_FILE);
  // Records that an export was started; whether the file was saved is up to the browser.
  store.markBackedUp(now);
  trackEvent({ name: "lab_export", params: { rounds: rounds.length } });
  return now;
}

/** The record's lifetime round count, which the backup-interest event carries; 0 when it cannot be read. */
export async function lifetimeRounds(): Promise<number> {
  try {
    return (await labStore()?.readSummary())?.rounds ?? 0;
  } catch {
    return 0;
  }
}
