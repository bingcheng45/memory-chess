import { BOARD_SQUARES } from "@/lib/game/board";
import { placementFromFen } from "@/lib/game/scoring";
import { generateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import { seededRandom } from "@/lib/utils/seededRandom";
import type { RoundSource } from "@/lib/analytics/events";
import type { PlanId, StoredPlan, StoredTarget } from "./choices";
import { shiftDay } from "./engine";
import { EDGE_RIG } from "./insights";
import type { PlacementEvent } from "./placements";
import { buildRoundRecord, type LabSource, type RoundCapture, type RoundInput, type RoundRecord } from "./record";
import { dailyFen } from "./dailyBoard";
import { createLabStore, PLACEMENT_KEEP, type LabStore } from "./storage";
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
  "v1Legacy",
  "spanClimber",
  "shortSessions",
  "plateau",
  "colourSkew",
  "graceStreak",
  "planBaseline",
  "planEdge",
  "ladderClimb",
  "dailyOpen",
  "dailyPlayed",
  "dailyStreak",
] as const;
export type PersonaName = (typeof PERSONA_NAMES)[number];
/** The players with a plan or a goal chosen; the rest of the cast has none. */
export const PLAN_PERSONAS = ["planBaseline", "planEdge", "ladderClimb"] as const satisfies readonly PersonaName[];
/** The players with daily board rounds, whose board days are UTC days: drivers set the browser clock to their today. */
export const DAILY_PERSONAS = ["dailyOpen", "dailyPlayed", "dailyStreak"] as const satisfies readonly PersonaName[];

interface Setting {
  readonly source: LabSource;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
}

interface PlannedRound extends Setting {
  readonly daysAgo: number;
  /** Minutes after noon the round ends; by default one minute after the day's previous round. */
  readonly minute?: number;
  /** A fixed chance each piece is missed, in place of the persona's own, to set a round's score. */
  readonly miss?: number;
  /** The shared daily board of the round's day, in place of a random position. */
  readonly dailyBoard?: true;
}

/** `progress` runs from 0 at the first round to just under 1 at the last. */
type MissChance = (square: string, piece: string, progress: number) => number;

interface PersonaPlan {
  readonly seed: number;
  readonly rounds: readonly PlannedRound[];
  readonly missChance: MissChance;
  /** Rounds written before version 2, with none of its facts. */
  readonly legacy?: true;
}

const PRACTICE: Setting = { source: "calibration", pieceCount: 6, memorizeSeconds: 10 };
const MEDIUM: Setting = { source: "game", pieceCount: 6, memorizeSeconds: 10 };
const EASY: Setting = { source: "game", pieceCount: 2, memorizeSeconds: 10 };
const HARD: Setting = { source: "game", pieceCount: 12, memorizeSeconds: 8 };
const HEAVY_ROUNDS = 5003;
const HEAVY_PER_DAY = 20;

const steady: MissChance = () => 0.1;
const GAME_STARTS: readonly RoundSource[] = ["home_quick", "try_again", "game_form", "tile_drill", "home_tier", "link"];
const TZ_OFFSET_MIN = -480;

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

const blackSlips: MissChance = (_, piece) => (piece === piece.toLowerCase() ? 0.3 : 0.06);

const countdown = (from: number, to: number) => Array.from({ length: from - to + 1 }, (_, index) => from - index);

/** Four pieces for the first 20 days, ten up to a week ago, fourteen in the last week, all at 10 seconds. */
const climbing = (daysAgo: number): Setting => ({ source: "game", pieceCount: daysAgo >= 25 ? 4 : daysAgo >= 7 ? 10 : 14, memorizeSeconds: 10 });

/** Three sittings a day, more than 30 minutes apart, each a practice round then three Medium games a few minutes apart. */
const SITTING_STARTS = [0, 45, 200];
const shortSittings: PlannedRound[] = countdown(5, 0).flatMap((daysAgo) =>
  SITTING_STARTS.flatMap((start) => [PRACTICE, MEDIUM, MEDIUM, MEDIUM].map((setting, index) => ({ ...setting, daysAgo, minute: start + index * 3 }))),
);

/**
 * An older run, 31 to 24 days ago with day 27 missed, that ends at two missed days in a row, then the current run from
 * 19 days ago to today with day 9 missed: one forgiven day in each.
 */
const GRACE_DAYS = [...countdown(31, 24), ...countdown(19, 0)].filter((daysAgo) => daysAgo !== 27 && daysAgo !== 9);

const THREE_DAYS: PersonaPlan = { seed: 3, rounds: daily(countdown(2, 0), (_, slot) => (slot === 0 ? PRACTICE : MEDIUM), 4), missChance: steady };

const EDGE_RIG_SETTING: Setting = { source: "game", ...EDGE_RIG };
const MEDIUM_8S: Setting = { ...MEDIUM, memorizeSeconds: 8 };
const at = (setting: Setting, daysAgo: number, miss?: number): PlannedRound => ({ ...setting, daysAgo, ...(miss !== undefined && { miss }) });
const dailyBoardOn = (daysAgo: number): PlannedRound => ({ ...MEDIUM, daysAgo, dailyBoard: true });

/** Thirty days of edge-file misses before the drill, then fewer once it starts: the last six rounds are the drill's. */
const edgesThenDrill: MissChance = (square, piece, progress) =>
  square[0] === "a" || square[0] === "h" ? (progress < 30 / 36 ? 0.6 : 0.15) : edgesAndQueens(square, piece, progress);

const PLANS: Record<PersonaName, PersonaPlan> = {
  newVisitor: { seed: 1, rounds: [], missChance: steady },
  twoRounds: { seed: 2, rounds: daily([0], (_, slot) => (slot === 0 ? PRACTICE : MEDIUM), 2), missChance: steady },
  threeDays: THREE_DAYS,
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
  // The three-day player's own rounds as version 1, so the two must read the same.
  v1Legacy: { ...THREE_DAYS, legacy: true },
  spanClimber: { seed: 45, rounds: daily(countdown(44, 0), climbing, 3), missChance: (_, __, progress) => 0.33 - 0.3 * progress },
  shortSessions: { seed: 72, rounds: shortSittings, missChance: steady },
  // Medium every day for two weeks: accuracy flat over the last 20 rounds and a span that has not moved.
  plateau: { seed: 4, rounds: daily(countdown(13, 0), () => MEDIUM, 4), missChance: () => 0.12 },
  colourSkew: { seed: 61, rounds: daily(countdown(14, 0), () => MEDIUM, 4), missChance: blackSlips },
  graceStreak: { seed: 19, rounds: daily(GRACE_DAYS, (_, slot) => (slot === 0 ? PRACTICE : MEDIUM), 2), missChance: steady },
  // A Medium game a day for nine days, then a baseline week from six days ago with Medium on five of its seven days, a
  // weak first day, and one Hard game that the plan does not count but the goal of 12 pieces at 100 percent does.
  planBaseline: {
    seed: 77,
    rounds: [
      ...countdown(16, 8).map((daysAgo) => at(MEDIUM, daysAgo)),
      at(MEDIUM, 6, 0.5),
      ...[5, 4].map((daysAgo) => at(MEDIUM, daysAgo)),
      at(HARD, 3, 0.3),
      ...[2, 0].map((daysAgo) => at(MEDIUM, daysAgo)),
    ],
    missChance: () => 0.12,
  },
  // Thirty Medium games that miss the a and h files, then the edge rig twice a day on three of the plan's six days.
  planEdge: {
    seed: 88,
    rounds: [...countdown(35, 6).map((daysAgo) => at(MEDIUM, daysAgo)), ...[5, 5, 3, 3, 1, 1].map((daysAgo) => at(EDGE_RIG_SETTING, daysAgo))],
    missChance: edgesThenDrill,
  },
  // Medium games before a ladder started two days ago; since then a miss, three perfect Medium games that climb the
  // rung, and two perfect games today at the next rung, 6 pieces at 8 s.
  ladderClimb: {
    seed: 99,
    rounds: [
      ...daily(countdown(10, 3), () => MEDIUM, 2),
      at(MEDIUM, 2, 0.5),
      ...[1, 1, 1].map((daysAgo) => at(MEDIUM, daysAgo, 0)),
      ...[0, 0].map((daysAgo) => at(MEDIUM_8S, daysAgo, 0)),
    ],
    missChance: steady,
  },
  // Today's board still open, after the board on each of the last three days among two Medium games a day.
  dailyOpen: { seed: 101, rounds: [...daily(countdown(3, 0), () => MEDIUM, 2), ...[3, 2, 1].map(dailyBoardOn)], missChance: steady },
  // Medium games yesterday and today, and today's board played: its first daily round.
  dailyPlayed: { seed: 102, rounds: [...daily([1, 0], () => MEDIUM, 2), dailyBoardOn(0)], missChance: steady },
  // The board on nine of the last ten days, today included, with five days ago missed and forgiven.
  dailyStreak: { seed: 103, rounds: countdown(9, 0).filter((daysAgo) => daysAgo !== 5).map(dailyBoardOn), missChance: steady },
};

interface PersonaChoices {
  readonly plan?: { readonly planId: PlanId; readonly startedDaysAgo: number };
  readonly target?: { readonly pieceCount: number; readonly accuracy: number; readonly createdDaysAgo: number };
}

const CHOICES: Record<(typeof PLAN_PERSONAS)[number], PersonaChoices> = {
  planBaseline: { plan: { planId: "baseline", startedDaysAgo: 6 }, target: { pieceCount: 12, accuracy: 100, createdDaysAgo: 6 } },
  planEdge: { plan: { planId: "edge", startedDaysAgo: 5 }, target: { pieceCount: 8, accuracy: 70, createdDaysAgo: 5 } },
  ladderClimb: { plan: { planId: "ladder", startedDaysAgo: 2 } },
};

/** The plan and goal a persona has chosen, which live outside the record and its export, dated from `today`. */
export function personaChoices(name: PersonaName, today: string = PERSONA_TODAY): { plan: StoredPlan | null; target: StoredTarget | null } {
  const { plan, target }: PersonaChoices = CHOICES[name as keyof typeof CHOICES] ?? {};
  return {
    plan: plan ? { planId: plan.planId, startedDay: shiftDay(today, -plan.startedDaysAgo) } : null,
    target: target ? { pieceCount: target.pieceCount, accuracy: target.accuracy, createdDay: shiftDay(today, -target.createdDaysAgo) } : null,
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

/** Each piece placed in board order, spread evenly over the rebuild. */
function placementsOf(placed: Readonly<Record<string, string>>, solveMs: number): PlacementEvent[] {
  const squares = BOARD_SQUARES.flatMap((square, index) => (placed[square] ? [[index, placed[square]] as const] : []));
  return squares.map(([index, piece], order) => [Math.round((solveMs * (order + 1)) / (squares.length + 1)), index, piece]);
}

export function personaRounds(name: PersonaName, today: string = PERSONA_TODAY): RoundRecord[] {
  const { seed, rounds, missChance, legacy } = PLANS[name];
  const random = seededRandom(seed);
  const slots = new Map<number, number>();

  return rounds.map((planned, index) => {
    const slot = slots.get(planned.daysAgo) ?? 0;
    slots.set(planned.daysAgo, slot + 1);
    const playedAt = noonUtc(today, -planned.daysAgo);
    const day = new Date(playedAt).toISOString().slice(0, 10);
    const fen = planned.dailyBoard ? dailyFen(day) : generateMemorizationPosition(planned.pieceCount, random)?.fen();
    const target = placementFromFen(fen ?? "8/8/8/8/8/8/8/8");
    const progress = index / rounds.length;
    const placed = Object.fromEntries(Object.entries(target).filter(([square, piece]) => random() >= (planned.miss ?? missChance(square, piece, progress))));
    const solveMs = 8000 + Math.floor(random() * 22_000);
    const input: RoundInput = {
      id: `${name}-${index}`,
      source: planned.source,
      endedAt: playedAt + (planned.minute ?? slot) * 60_000,
      localDay: day,
      pieceCount: planned.pieceCount,
      memorizeSeconds: planned.memorizeSeconds,
      targetFen: boardFen(target),
      placedFen: boardFen(placed),
      memorizeMs: planned.memorizeSeconds * 1000,
      solveMs,
    };
    if (legacy) return buildRoundRecord(input);
    const recent = index >= rounds.length - PLACEMENT_KEEP;
    const capture: RoundCapture = {
      startSource: planned.dailyBoard ? "daily" : planned.source === "calibration" ? "calibration" : GAME_STARTS[index % GAME_STARTS.length],
      ...(planned.dailyBoard && { kind: "daily", dailyDay: day }),
      tzOffsetMin: TZ_OFFSET_MIN,
      ...(recent && { placements: placementsOf(placed, solveMs), removals: 0 }),
    };
    return buildRoundRecord(input, capture);
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
