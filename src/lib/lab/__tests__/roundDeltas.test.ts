import type { GameStanding } from "@/lib/lab/dashboard";
import type { RoundRecord } from "@/lib/lab/record";
import { roundDeltasOf, verdictOf, type FigureDelta } from "@/lib/lab/roundDeltas";
import { summarize } from "@/lib/lab/summary";
import { reviewedBoard, roundV2, TARGET } from "./fixtures";

const KINGS = "4k3/8/8/8/8/8/8/4K3";
const EMPTY = "8/8/8/8/8/8/8/8";
const FIVE = "4k3/8/8/3q4/8/5N2/3P4/4K3";
const TODAY = "2026-10-07";

const at = (localDay: string, hour: number) => ({ endedAt: Date.parse(`${localDay}T${String(hour).padStart(2, "0")}:00:00Z`), localDay });

function deltasAfter(earlier: readonly RoundRecord[], round: RoundRecord, game: { before: GameStanding | null; after: GameStanding | null }) {
  const records = [...earlier, round];
  return roundDeltasOf({
    dashboard: {
      records,
      summary: summarize(records),
      weekGoal: 5,
      entries: null,
      today: TODAY,
      utcDay: TODAY,
      dailyOpened: null,
      chooseHref: null,
      game: game.after,
      winAccuracy: 70,
    },
    round,
    gameBefore: game.before,
  });
}

const pick = (deltas: readonly FigureDelta[], ...ids: FigureDelta["id"][]) => deltas.filter(({ id }) => ids.includes(id));

describe("roundDeltasOf", () => {
  it("marks every figure a first round unlocks as new, and leaves out the ones still warming", () => {
    const deltas = deltasAfter([], roundV2({ id: "r1", ...at(TODAY, 12) }), { before: null, after: { rating: 1015, winStreak: 1, changes: [15] } });

    expect(deltas).toEqual([
      { id: "rating", betterWhen: "higher", direction: "new", before: null, after: { value: 1015, unit: "rating", digits: 0 }, delta: null },
      { id: "studyTime", betterWhen: "lower", direction: "new", before: null, after: { value: 10, unit: "seconds", digits: 1 }, delta: null },
      { id: "rebuildTime", betterWhen: "lower", direction: "new", before: null, after: { value: 20, unit: "seconds", digits: 1 }, delta: null },
      { id: "bestAccuracy", betterWhen: "higher", direction: "new", before: null, after: { value: 100, unit: "percent", digits: 0 }, delta: null },
      { id: "recentAccuracy", betterWhen: "higher", direction: "new", before: null, after: { value: 100, unit: "percent", digits: 0 }, delta: null },
      { id: "winStreak", betterWhen: "higher", direction: "new", before: null, after: { value: 1, unit: "rounds", digits: 0 }, delta: null },
      { id: "rounds", betterWhen: "higher", direction: "new", before: null, after: { value: 1, unit: "rounds", digits: 0 }, delta: null },
      { id: "days", betterWhen: "higher", direction: "new", before: null, after: { value: 1, unit: "days", digits: 0 }, delta: null },
    ]);
  });

  it("reads a quicker round that holds one more piece twice as a span and a rating up and both times down, all better", () => {
    const earlier = [
      roundV2({ id: "a", ...at("2026-10-06", 9) }),
      roundV2({ id: "b", ...at("2026-10-06", 10) }),
      roundV2({ id: "c", ...at("2026-10-06", 11), pieceCount: 5, targetFen: FIVE, placedFen: FIVE }),
    ];
    const round = roundV2({ id: "d", ...at(TODAY, 12), pieceCount: 5, targetFen: FIVE, placedFen: FIVE, memorizeMs: 4000, solveMs: 14_000 });

    const deltas = deltasAfter(earlier, round, { before: { rating: 1040, winStreak: 2, changes: [12, 10] }, after: { rating: 1058, winStreak: 3, changes: [18, 12, 10] } });

    expect(deltas).toEqual([
      { id: "rating", betterWhen: "higher", direction: "up", before: { value: 1040, unit: "rating", digits: 0 }, after: { value: 1058, unit: "rating", digits: 0 }, delta: 18 },
      { id: "span", betterWhen: "higher", direction: "up", before: { value: 4, unit: "pieces", digits: 0 }, after: { value: 5, unit: "pieces", digits: 0 }, delta: 1 },
      { id: "studyTime", betterWhen: "lower", direction: "down", before: { value: 10, unit: "seconds", digits: 1 }, after: { value: 8.5, unit: "seconds", digits: 1 }, delta: -1.5 },
      { id: "rebuildTime", betterWhen: "lower", direction: "down", before: { value: 20, unit: "seconds", digits: 1 }, after: { value: 18.5, unit: "seconds", digits: 1 }, delta: -1.5 },
      { id: "bestAccuracy", betterWhen: "higher", direction: "level", before: { value: 100, unit: "percent", digits: 0 }, after: { value: 100, unit: "percent", digits: 0 }, delta: 0 },
      { id: "recentAccuracy", betterWhen: "higher", direction: "level", before: { value: 100, unit: "percent", digits: 0 }, after: { value: 100, unit: "percent", digits: 0 }, delta: 0 },
      { id: "winStreak", betterWhen: "higher", direction: "up", before: { value: 2, unit: "rounds", digits: 0 }, after: { value: 3, unit: "rounds", digits: 0 }, delta: 1 },
      { id: "streak", betterWhen: "higher", direction: "new", before: null, after: { value: 2, unit: "days", digits: 0 }, delta: null },
      { id: "rounds", betterWhen: "higher", direction: "up", before: { value: 3, unit: "rounds", digits: 0 }, after: { value: 4, unit: "rounds", digits: 0 }, delta: 1 },
      { id: "days", betterWhen: "higher", direction: "up", before: { value: 1, unit: "days", digits: 0 }, after: { value: 2, unit: "days", digits: 0 }, delta: 1 },
    ]);
    expect(pick(deltas, "rating", "span", "studyTime", "rebuildTime").map(verdictOf)).toEqual(["better", "better", "better", "better"]);
  });

  it("reads a slower round as both times up, worse", () => {
    const earlier = [roundV2({ id: "a", ...at(TODAY, 9) }), roundV2({ id: "b", ...at(TODAY, 10) })];
    const round = roundV2({ id: "c", ...at(TODAY, 12), memorizeMs: 10_000, solveMs: 50_000 });
    const earlierQuick = earlier.map((record) => ({ ...record, memorizeMs: 7000 }));

    const deltas = pick(deltasAfter(earlierQuick, round, { before: null, after: null }), "studyTime", "rebuildTime");

    expect(deltas).toEqual([
      { id: "studyTime", betterWhen: "lower", direction: "up", before: { value: 7, unit: "seconds", digits: 1 }, after: { value: 8, unit: "seconds", digits: 1 }, delta: 1 },
      { id: "rebuildTime", betterWhen: "lower", direction: "up", before: { value: 20, unit: "seconds", digits: 1 }, after: { value: 30, unit: "seconds", digits: 1 }, delta: 10 },
    ]);
    expect(deltas.map(verdictOf)).toEqual(["worse", "worse"]);
  });

  it("reads an empty board as recent accuracy, rating and win streak down, all worse", () => {
    const earlier = [roundV2({ id: "a", ...at("2026-10-06", 9) }), roundV2({ id: "b", ...at(TODAY, 9) }), roundV2({ id: "c", ...at(TODAY, 10) })];
    const round = roundV2({ id: "d", ...at(TODAY, 12), placedFen: EMPTY });

    const deltas = pick(
      deltasAfter(earlier, round, { before: { rating: 1100, winStreak: 3, changes: [9, 8, 7] }, after: { rating: 1080, winStreak: 0, changes: [-20, 9, 8, 7] } }),
      "rating",
      "recentAccuracy",
      "winStreak",
    );

    expect(deltas).toEqual([
      { id: "rating", betterWhen: "higher", direction: "down", before: { value: 1100, unit: "rating", digits: 0 }, after: { value: 1080, unit: "rating", digits: 0 }, delta: -20 },
      { id: "recentAccuracy", betterWhen: "higher", direction: "down", before: { value: 100, unit: "percent", digits: 0 }, after: { value: 75, unit: "percent", digits: 0 }, delta: -25 },
      { id: "winStreak", betterWhen: "higher", direction: "down", before: { value: 3, unit: "rounds", digits: 0 }, after: { value: 0, unit: "rounds", digits: 0 }, delta: -3 },
    ]);
    expect(deltas.map(verdictOf)).toEqual(["worse", "worse", "worse"]);
  });

  it("reads fewer seconds per piece as speed down and better", () => {
    const earlier = [9, 10, 11, 12, 13].map((hour) => roundV2({ id: `s${hour}`, ...at(TODAY, hour), solveMs: 20000 }));
    const round = roundV2({ id: "fast", ...at(TODAY, 14), solveMs: 8000 });

    const [speed] = pick(deltasAfter(earlier, round, { before: null, after: null }), "speed");

    expect(speed).toEqual({
      id: "speed",
      betterWhen: "lower",
      direction: "down",
      before: { value: 5, unit: "secondsPerPiece", digits: 1 },
      after: { value: 4.5, unit: "secondsPerPiece", digits: 1 },
      delta: -0.5,
    });
    expect(verdictOf(speed)).toBe("better");
  });

  it("reads more seconds per piece as speed up and worse", () => {
    const earlier = [9, 10, 11, 12, 13].map((hour) => roundV2({ id: `s${hour}`, ...at(TODAY, hour), solveMs: 20000 }));
    const round = roundV2({ id: "slow", ...at(TODAY, 14), placedFen: KINGS, solveMs: 20000 });

    const [speed] = pick(deltasAfter(earlier, round, { before: null, after: null }), "speed");

    expect([speed.direction, speed.after.value, speed.delta, verdictOf(speed)]).toEqual(["up", 5.8, 0.8, "worse"]);
  });

  it("leaves the rating and win streak level after a review, which neither rates", () => {
    const seen = roundV2({ id: "a", ...at("2026-10-06", 12), targetFen: TARGET });
    const review = reviewedBoard("b", TODAY, seen, 1);
    const standing = { rating: 1100, winStreak: 2, changes: [9, 8] };

    const deltas = pick(deltasAfter([seen], review, { before: standing, after: standing }), "rating", "winStreak", "rounds");

    expect(deltas.map(({ id, direction, delta }) => [id, direction, delta])).toEqual([
      ["rating", "level", 0],
      ["winStreak", "level", 0],
      ["rounds", "up", 1],
    ]);
    expect(deltas.map(verdictOf)).toEqual(["level", "level", "better"]);
  });
});
