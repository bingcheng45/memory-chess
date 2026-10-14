import { parsePlan, parseTarget, type StoredTarget } from "@/lib/lab/choices";
import { deriveLab } from "@/lib/lab/metrics";
import type { LabSource, RoundRecord } from "@/lib/lab/record";
import { summarize } from "@/lib/lab/summary";
import { round, TARGET } from "./fixtures";

const TODAY = "2026-10-08";
const THREE_OF_FOUR = "4k3/8/8/8/8/5N2/8/4K3";
const HALF = "4k3/8/8/8/8/8/8/4K3";

let count = 0;
function played(day: string, pieces: number, placed = TARGET, source: LabSource = "game"): RoundRecord {
  count += 1;
  const [, month, date] = day.split("-").map(Number);
  return round({ id: `g${count}`, source, endedAt: Date.UTC(2026, month - 1, date, 12, count), localDay: day, pieceCount: pieces, targetFen: TARGET, placedFen: placed });
}

const goalOf = (records: readonly RoundRecord[], target: StoredTarget | null) => deriveLab({ records, summary: summarize(records), today: TODAY, target }).goal;
const EIGHT_AT_80: StoredTarget = { pieceCount: 8, accuracy: 80, createdDay: "2026-10-05" };

describe("goal progress", () => {
  it("is empty with no goal set", () => {
    expect(goalOf([played("2026-10-07", 8)], null)).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("warms up until a round at the goal's piece count or more is played since it was set", () => {
    const records = [played("2026-10-04", 8), played("2026-10-06", 7)];

    expect(goalOf(records, EIGHT_AT_80)).toEqual({
      readiness: { state: "warming", sampleSize: 0, need: { rounds: 1 } },
      value: { target: EIGHT_AT_80, best: null, percent: 0, reached: null },
    });
  });

  it("fills from the best round at the piece count or more, as a percent of the goal's accuracy", () => {
    const records = [played("2026-10-05", 8, HALF), played("2026-10-06", 10, THREE_OF_FOUR, "calibration"), played("2026-10-07", 6)];

    expect(goalOf(records, EIGHT_AT_80)).toEqual({
      readiness: { state: "ready", sampleSize: 2 },
      value: {
        target: EIGHT_AT_80,
        best: { at: records[1].endedAt, localDay: "2026-10-06", pieceCount: 10, accuracy: 75 },
        percent: 94,
        reached: null,
      },
    });
  });

  it("is reached by the first round that meets both, and keeps that round when a later one is better", () => {
    const records = [played("2026-10-05", 9, THREE_OF_FOUR), played("2026-10-06", 8), played("2026-10-07", 12)];
    const { value } = goalOf(records, { ...EIGHT_AT_80, accuracy: 75 });

    expect(value?.reached).toEqual({ at: records[0].endedAt, localDay: "2026-10-05", pieceCount: 9, accuracy: 75 });
    expect(value?.best).toEqual({ at: records[1].endedAt, localDay: "2026-10-06", pieceCount: 8, accuracy: 100 });
    expect(value?.percent).toBe(100);
  });

  it("counts no round played earlier on the day the goal was set", () => {
    const early = played("2026-10-07", 8);
    const late = played("2026-10-07", 8, THREE_OF_FOUR);
    const { value } = goalOf([early, late], { pieceCount: 8, accuracy: 75, createdDay: "2026-10-07", createdAt: early.endedAt + 1 });

    expect(value?.best).toEqual({ at: late.endedAt, localDay: "2026-10-07", pieceCount: 8, accuracy: 75 });
    expect(value?.reached).toEqual({ at: late.endedAt, localDay: "2026-10-07", pieceCount: 8, accuracy: 75 });
  });
});

describe("stored choices", () => {
  it.each([
    ['{"planId":"edge","startedDay":"2026-10-03"}', { planId: "edge", startedDay: "2026-10-03" }],
    ['{"planId":"baseline","startedDay":"2026-10-03","ended":{"how":"stopped","day":"2026-10-04"}}', { planId: "baseline", startedDay: "2026-10-03", ended: { how: "stopped", day: "2026-10-04" } }],
    ['{"planId":"edge","startedDay":"2026-10-03","startedAt":1791028800000}', { planId: "edge", startedDay: "2026-10-03", startedAt: 1791028800000 }],
    ['{"planId":"edge","startedDay":"2026-10-03","startedAt":"noon"}', null],
    ['{"planId":"sprint","startedDay":"2026-10-03"}', null],
    ['{"planId":"edge","startedDay":"2026-02-30"}', null],
    ['{"planId":"edge","startedDay":"2026-10-03","ended":{"how":"stopped","day":"2026-10-01"}}', null],
    ["not json", null],
    [null, null],
  ])("reads the plan %p as %p", (text, plan) => {
    expect(parsePlan(text)).toEqual(plan);
  });

  it.each([
    ['{"pieceCount":8,"accuracy":85,"createdDay":"2026-10-03"}', { pieceCount: 8, accuracy: 85, createdDay: "2026-10-03" }],
    ['{"pieceCount":8,"accuracy":85,"createdDay":"2026-10-03","createdAt":1791028800000}', { pieceCount: 8, accuracy: 85, createdDay: "2026-10-03", createdAt: 1791028800000 }],
    ['{"pieceCount":8,"accuracy":85,"createdDay":"2026-10-03","createdAt":-1}', null],
    ['{"pieceCount":2,"accuracy":85,"createdDay":"2026-10-03"}', null],
    ['{"pieceCount":33,"accuracy":85,"createdDay":"2026-10-03"}', null],
    ['{"pieceCount":8,"accuracy":87,"createdDay":"2026-10-03"}', null],
    ['{"pieceCount":8,"accuracy":55,"createdDay":"2026-10-03"}', null],
    ['{"pieceCount":8,"accuracy":85}', null],
  ])("reads the goal %p as %p", (text, target) => {
    expect(parseTarget(text)).toEqual(target);
  });
});
