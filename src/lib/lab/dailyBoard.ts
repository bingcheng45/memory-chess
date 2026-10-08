import type { SetBoard } from "@/lib/types/game";
import { generateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import { seededRandom } from "@/lib/utils/seededRandom";
import { DAILY_OPENED_KEY, DAILY_SETTING, dailyBoardOf, readDailyOpened, utcDayOf } from "./daily";
import { positionId, type RoundRecord } from "./record";
import { labStore } from "./storage";

/** The day's seed from the stable position-id hash, so the board never changes for a day once it is out. */
const dailySeed = (day: string) => Number.parseInt(positionId(`daily ${day}`).slice(-8), 16);

/** The real game's generator with a seeded random source: the same board for the same UTC day in every browser. */
export function dailyFen(day: string): string | null {
  return generateMemorizationPosition(DAILY_SETTING.pieceCount, seededRandom(dailySeed(day)))?.fen() ?? null;
}

export type DailyStart =
  | { readonly kind: "play"; readonly pieceCount: number; readonly memorizeTime: number; readonly board: SetBoard }
  | { readonly kind: "played" };

export function dailyStart(records: readonly RoundRecord[], at: number, openedDay: string | null): DailyStart | null {
  const day = utcDayOf(at);
  if (dailyBoardOf(records, day, openedDay).status !== "open") return { kind: "played" };
  const fen = dailyFen(day);
  return fen === null ? null : { kind: "play", ...DAILY_SETTING, board: { kind: "daily", day, fen } };
}

/** Reads the record on this device first, so a second attempt on the same UTC day is refused. Marks nothing: only the caller that starts the round knows it is the try. */
export async function openDaily(at: number): Promise<DailyStart | null> {
  const store = labStore();
  const records = store && (await store.isAvailable()) ? await store.listRounds() : [];
  return dailyStart(records, at, readDailyOpened());
}

export function markDailyOpened(day: string): void {
  try {
    window.localStorage.setItem(DAILY_OPENED_KEY, day);
  } catch {
    // Without storage the record alone limits the day to one result.
  }
}
