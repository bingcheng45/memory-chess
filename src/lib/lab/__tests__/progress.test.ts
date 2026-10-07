import { countsForTrend, type LabInput } from "@/lib/lab/engine";
import { LAB_METRICS } from "@/lib/lab/metrics";
import type { RoundInput, RoundRecord } from "@/lib/lab/record";
import { summarize } from "@/lib/lab/summary";
import { round, roundV2 } from "./fixtures";

const THREE = "4k3/8/8/3q4/8/8/8/4K3";
const HALF = "4k3/8/8/8/8/8/8/4K3";
const NONE = "8/8/8/8/8/8/8/8";
const TODAY = "2026-10-07";
const HOUR = 60 * 60 * 1000;
const at = (day: string, hour: number) => Date.parse(`${day}T${String(hour).padStart(2, "0")}:00:00Z`);

const input = (records: readonly RoundRecord[], today = TODAY): LabInput => ({ records, summary: summarize(records), today });
const rounds = (count: number, make: (index: number) => Partial<RoundInput>) =>
  Array.from({ length: count }, (_, index) => round({ id: `r${index}`, endedAt: at(TODAY, 0) + index * HOUR, ...make(index) }));

describe("countsForTrend", () => {
  it("counts every kind of round until the daily and review phases need to keep theirs out of the progress lines", () => {
    const kinds = (["normal", "daily", "review"] as const).map((kind) => roundV2({ id: kind }, { kind }));

    expect([round(), ...kinds].map(countsForTrend)).toEqual([true, true, true, true]);
  });
});

describe("sessions metric", () => {
  const sessions = (records: readonly RoundRecord[], today = TODAY) => LAB_METRICS.sessions.compute(input(records, today));

  it("is empty before any round", () => {
    expect(sessions([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("lists each sitting, practice and games together, once there is a round", () => {
    const records = [
      round({ id: "a", endedAt: at("2026-10-06", 9) }),
      round({ id: "b", endedAt: at("2026-10-06", 9) + 60_000, source: "calibration" }),
      round({ id: "c", endedAt: at(TODAY, 18), localDay: TODAY }),
    ];

    expect(sessions(records)).toEqual({
      readiness: { state: "ready", sampleSize: 3 },
      value: {
        sessions: [
          { startedAt: at("2026-10-06", 9), endedAt: at("2026-10-06", 9) + 60_000, rounds: 2, sources: ["game", "calibration"] },
          { startedAt: at(TODAY, 18), endedAt: at(TODAY, 18), rounds: 1, sources: ["game"] },
        ],
      },
    });
  });

  it("turns stale two weeks after the last round", () => {
    expect(sessions([round()], "2026-10-21").readiness).toEqual({ state: "stale", sampleSize: 1 });
  });
});

describe("memory span", () => {
  const span = (records: readonly RoundRecord[], today = TODAY) => LAB_METRICS.span.compute(input(records, today));

  it("is empty before any round", () => {
    expect(span([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("is warming with one round at 80 percent or better, and says one more at that size is needed", () => {
    const records = [round({ id: "a", endedAt: at(TODAY, 9) }), round({ id: "b", endedAt: at(TODAY, 10), placedFen: THREE })];

    expect(span(records)).toEqual({
      readiness: { state: "warming", sampleSize: 2, need: { qualifyingRounds: 1 } },
      value: {
        pieceCount: null,
        memorizeSeconds: 10,
        qualifyingRounds: 0,
        history: [
          { endedAt: at(TODAY, 9), pieceCount: null },
          { endedAt: at(TODAY, 10), pieceCount: null },
        ],
        weekAgo: null,
        change: null,
      },
    });
  });

  it("is the largest size held twice, with its steps per session and the change since a week ago", () => {
    const records = [
      round({ id: "4a", endedAt: at("2026-09-29", 9), localDay: "2026-09-29" }),
      round({ id: "4b", endedAt: at("2026-09-29", 9) + 60_000, localDay: "2026-09-29" }),
      round({ id: "8a", endedAt: at(TODAY, 9), pieceCount: 8 }),
      round({ id: "8b", endedAt: at(TODAY, 11), pieceCount: 8 }),
      round({ id: "12", endedAt: at(TODAY, 13), pieceCount: 12 }),
      round({ id: "8c", endedAt: at(TODAY, 15), pieceCount: 8, placedFen: THREE }),
    ];

    expect(span(records)).toEqual({
      readiness: { state: "ready", sampleSize: 6 },
      value: {
        pieceCount: 8,
        memorizeSeconds: 10,
        qualifyingRounds: 2,
        history: [
          { endedAt: at("2026-09-29", 9) + 60_000, pieceCount: 4 },
          { endedAt: at(TODAY, 9), pieceCount: 4 },
          { endedAt: at(TODAY, 11), pieceCount: 8 },
          { endedAt: at(TODAY, 13), pieceCount: 8 },
          { endedAt: at(TODAY, 15), pieceCount: 8 },
        ],
        weekAgo: 4,
        change: 4,
      },
    });
  });

  it("reads only rounds at the usual study time, the one played most in the last 20 rounds", () => {
    const records = [
      ...rounds(2, () => ({ pieceCount: 12, memorizeSeconds: 30 })).map((record, index) => ({ ...record, id: `slow${index}` })),
      ...rounds(3, (index) => ({ endedAt: at(TODAY, 10 + index), pieceCount: 6 })),
    ];

    expect(span(records).value).toMatchObject({ pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 3 });
  });

  it("breaks a tie between study times toward the one played most recently", () => {
    const records = [
      ...rounds(2, (index) => ({ pieceCount: 12, memorizeSeconds: 8, endedAt: at(TODAY, 1 + index) })),
      ...rounds(2, (index) => ({ pieceCount: 6, memorizeSeconds: 10, endedAt: at(TODAY, 3 + index) })).map((record) => ({ ...record, id: `${record.id}b` })),
    ];

    expect(span(records).value).toMatchObject({ pieceCount: 6, memorizeSeconds: 10 });
    expect(span(records.map((record) => ({ ...record, endedAt: -record.endedAt }))).value).toMatchObject({ pieceCount: 12, memorizeSeconds: 8 });
  });

  it("turns stale two weeks after the last round, keeping the span", () => {
    const records = rounds(2, () => ({ pieceCount: 6 }));

    expect(span(records, "2026-10-21")).toMatchObject({ readiness: { state: "stale", sampleSize: 2 }, value: { pieceCount: 6 } });
  });
});

describe("pieces held", () => {
  const held = (records: readonly RoundRecord[], today = TODAY) => LAB_METRICS.piecesHeld.compute(input(records, today));

  it("is empty before any round", () => {
    expect(held([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("is warming with three rounds on one day and says exactly what is missing", () => {
    expect(held(rounds(3, () => ({}))).readiness).toEqual({ state: "warming", sampleSize: 3, need: { rounds: 2, days: 1 } });
  });

  it("averages correct pieces across settings and compares the last 10 rounds with the 10 before", () => {
    const records = rounds(20, (index) =>
      index < 10 ? { placedFen: HALF, localDay: "2026-10-06" } : { pieceCount: 12, localDay: TODAY },
    );

    expect(held(records)).toEqual({
      readiness: { state: "ready", sampleSize: 20 },
      value: {
        points: [...Array(10).fill(2), ...Array(10).fill(4)],
        movingAverage: [...Array(10).fill(2), 2.4, 2.8, 3.2, 3.6, ...Array(6).fill(4)],
        recent: { average: 4, previous: 2, change: 2 },
      },
    });
  });

  it("plots the last 30 rounds and leaves the change out until there are 20", () => {
    const records = rounds(35, (index) => ({ placedFen: index % 2 ? HALF : THREE, localDay: index < 5 ? "2026-10-06" : TODAY }));
    const few = held(records.slice(0, 15)).value;

    expect(held(records).value?.points).toHaveLength(30);
    expect(held(records).value?.movingAverage.slice(0, 2)).toEqual([2.4, 2.6]);
    expect(few?.recent).toEqual({ average: 2.5, previous: null, change: null });
  });

  it("turns stale two weeks after the last round", () => {
    const records = rounds(5, (index) => ({ localDay: index < 2 ? "2026-10-06" : TODAY }));

    expect(held(records, "2026-10-21").readiness).toEqual({ state: "stale", sampleSize: 5 });
  });
});

describe("speed", () => {
  const speed = (records: readonly RoundRecord[], today = TODAY) => LAB_METRICS.speed.compute(input(records, today));

  it("is empty before any round", () => {
    expect(speed([])).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("is warming at four rounds of one setting and leaves out rounds with nothing correct", () => {
    const records = [...rounds(4, () => ({})), round({ id: "blank", placedFen: NONE, endedAt: at(TODAY, 20) })];

    expect(speed(records).readiness).toEqual({ state: "warming", sampleSize: 4, need: { rounds: 1 } });
  });

  it("is rebuild seconds per correct piece at the busiest setting, beside the same rounds' accuracy", () => {
    const records = [
      ...rounds(5, (index) => ({ placedFen: index % 2 ? HALF : THREE, solveMs: 12_000 })),
      round({ id: "other", pieceCount: 12, endedAt: at(TODAY, 22) }),
    ];

    expect(speed(records)).toEqual({
      readiness: { state: "ready", sampleSize: 5 },
      value: {
        setting: { source: "game", pieceCount: 4, memorizeSeconds: 10 },
        points: [4, 6, 4, 6, 4],
        recent: { average: 4.8, previous: null, change: null },
        accuracyAtSameRounds: { points: [75, 50, 75, 50, 75], recent: { average: 65, previous: null, change: null } },
      },
    });
  });

  it("compares the last 10 rounds with the 10 before", () => {
    const records = rounds(20, (index) => ({ solveMs: index < 10 ? 20_000 : 8_000 }));

    expect(speed(records).value?.recent).toEqual({ average: 2, previous: 5, change: -3 });
  });

  it("turns stale two weeks after the last round", () => {
    expect(speed(rounds(5, () => ({})), "2026-10-21").readiness).toEqual({ state: "stale", sampleSize: 5 });
  });
});
