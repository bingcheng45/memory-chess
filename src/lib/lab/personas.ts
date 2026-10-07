import { BOARD_SQUARES } from "@/lib/game/board";
import { placementFromFen } from "@/lib/game/scoring";
import { generateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import { buildRoundRecord, type LabSource, type RoundRecord } from "./record";
import { createLabStore, type LabStore } from "./storage";
import { buildExport, type LabExportV2 } from "./transfer";

/**
 * A fixed cast of synthetic players, so every phase tests and screenshots the
 * lab record against the same histories. Seeded, so the same day always gives
 * the same rounds. Days count back from the `today` passed in, which keeps
 * streaks and staleness the same whatever day a browser run happens on.
 */
export const PERSONA_TODAY = "2026-10-08";

export const PERSONA_NAMES = [
  "newVisitor",
  "twoRounds",
  "threeDays",
  "thirtyDays",
  "heavy",
  "easyOnly",
  "stale",
] as const;
export type PersonaName = (typeof PERSONA_NAMES)[number];

interface Setting {
  readonly source: LabSource;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

interface PlannedRound extends Setting {
  readonly daysAgo: number;
}

type MissChance = (square: string, piece: string) => number;

interface PersonaPlan {
  readonly seed: number;
  readonly rounds: readonly PlannedRound[];
  readonly missChance: MissChance;
}

const PRACTICE: Setting = { source: "calibration", pieceCount: 6, memorizeSeconds: 10 };
const MEDIUM: Setting = { source: "game", pieceCount: 6, memorizeSeconds: 10 };
const EASY: Setting = { source: "game", pieceCount: 2, memorizeSeconds: 10 };
const HARD: Setting = { source: "game", pieceCount: 12, memorizeSeconds: 8 };
const HEAVY_ROUNDS = 5003;
const HEAVY_PER_DAY = 20;

const steady: MissChance = () => 0.1;

/** Misses cluster on the a and h files, and queens slip far more often than pawns. */
const edgesAndQueens: MissChance = (square, piece) => {
  if (square[0] === "a" || square[0] === "h") return 0.6;
  if (piece.toLowerCase() === "q") return 0.45;
  if (piece.toLowerCase() === "p") return 0.03;
  return 0.1;
};

function daily(days: readonly number[], perDay: (daysAgo: number, slot: number) => Setting | null, slots: number): PlannedRound[] {
  return days.flatMap((daysAgo) =>
    Array.from({ length: slots }, (_, slot) => perDay(daysAgo, slot))
      .flatMap((setting) => (setting ? [{ ...setting, daysAgo }] : [])),
  );
}

const countdown = (from: number, to: number) => Array.from({ length: from - to + 1 }, (_, index) => from - index);

const PLANS: Record<PersonaName, PersonaPlan> = {
  newVisitor: { seed: 1, rounds: [], missChance: steady },
  twoRounds: { seed: 2, rounds: daily([0], (_, slot) => (slot === 0 ? PRACTICE : MEDIUM), 2), missChance: steady },
  threeDays: { seed: 3, rounds: daily(countdown(2, 0), (_, slot) => (slot === 0 ? PRACTICE : MEDIUM), 4), missChance: steady },
  thirtyDays: {
    seed: 30,
    rounds: daily(countdown(29, 0), (daysAgo, slot) => (slot === 0 && daysAgo % 2 === 0 ? PRACTICE : [EASY, MEDIUM, HARD][(daysAgo + slot) % 3]), 3),
    missChance: edgesAndQueens,
  },
  heavy: {
    seed: 5003,
    rounds: Array.from({ length: HEAVY_ROUNDS }, (_, index) => ({
      ...(index % 5 === 1 ? PRACTICE : MEDIUM),
      daysAgo: Math.floor((HEAVY_ROUNDS - 1 - index) / HEAVY_PER_DAY),
    })),
    missChance: steady,
  },
  easyOnly: { seed: 50, rounds: daily(countdown(9, 0), () => EASY, 5), missChance: steady },
  stale: { seed: 20, rounds: daily(countdown(25, 20), () => MEDIUM, 5), missChance: steady },
};

/** mulberry32: small, fast and the same on every platform. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Noon UTC, so a persona's days are the same calendar days in every timezone. */
function noonUtc(day: string, by = 0): number {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date + by, 12);
}

function boardFen(placement: Readonly<Record<string, string>>): string {
  const rows = Array.from({ length: 8 }, (_, row) => BOARD_SQUARES.slice(row * 8, row * 8 + 8).map((square) => placement[square] ?? "1").join(""));
  return rows.map((row) => row.replace(/1+/g, (run) => String(run.length))).join("/");
}

export function personaRounds(name: PersonaName, today: string = PERSONA_TODAY): RoundRecord[] {
  const { seed, rounds, missChance } = PLANS[name];
  const random = seeded(seed);
  const slots = new Map<number, number>();

  return rounds.map((planned, index) => {
    const slot = slots.get(planned.daysAgo) ?? 0;
    slots.set(planned.daysAgo, slot + 1);
    const playedAt = noonUtc(today, -planned.daysAgo);
    const target = placementFromFen(generateMemorizationPosition(planned.pieceCount, random)?.fen() ?? "8/8/8/8/8/8/8/8");
    const placed = Object.fromEntries(Object.entries(target).filter(([square, piece]) => random() >= missChance(square, piece)));
    return buildRoundRecord({
      id: `${name}-${index}`,
      source: planned.source,
      endedAt: playedAt + slot * 60_000,
      localDay: new Date(playedAt).toISOString().slice(0, 10),
      pieceCount: planned.pieceCount,
      memorizeSeconds: planned.memorizeSeconds,
      targetFen: boardFen(target),
      placedFen: boardFen(placed),
      memorizeMs: planned.memorizeSeconds * 1000,
      solveMs: 8000 + Math.floor(random() * 22_000),
    });
  });
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

export function memoryLabStore(indexedDB: IDBFactory): LabStore {
  return createLabStore({ indexedDB, localStorage: memoryStorage(), storageManager: undefined, locks: undefined });
}

/**
 * The file the app itself would export after playing the persona's rounds:
 * they go through the real store, so the round cap, eviction and lifetime
 * summary are the app's own, not a copy of its rules.
 */
export async function exportPersona(
  name: PersonaName,
  store: LabStore,
  today: string = PERSONA_TODAY,
  exportedAt: number = noonUtc(today),
): Promise<LabExportV2> {
  await store.mergeRounds(personaRounds(name, today));
  return buildExport(await store.listRounds(), exportedAt, await store.readSummary());
}
