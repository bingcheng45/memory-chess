import type { StoredPlan } from "@/lib/lab/choices";
import { deriveLab } from "@/lib/lab/metrics";
import { nextRung } from "@/lib/lab/plans";
import type { LabSource, RoundRecord } from "@/lib/lab/record";
import { summarize } from "@/lib/lab/summary";
import { round, TARGET } from "./fixtures";

const TODAY = "2026-10-08";
/** Kings on a8 and h8 and rooks on a1 and h1: every piece on an edge file. */
const EDGES = "k6K/8/8/8/8/8/8/R6r";
const EDGES_ONE_MISSED = "k6K/8/8/8/8/8/8/7r";
const THREE_OF_FOUR = "4k3/8/8/8/8/5N2/8/4K3";

let count = 0;
function played(day: string, setting: { pieces?: number; seconds?: number; source?: LabSource; target?: string; placed?: string } = {}): RoundRecord {
  const { pieces = 6, seconds = 10, source = "game", target = TARGET, placed = target } = setting;
  count += 1;
  const [, month, date] = day.split("-").map(Number);
  return round({ id: `p${count}`, source, endedAt: Date.UTC(2026, month - 1, date, 12, count), localDay: day, pieceCount: pieces, memorizeSeconds: seconds, targetFen: target, placedFen: placed });
}

const plansOf = (records: readonly RoundRecord[], plan: StoredPlan | null, today = TODAY) =>
  deriveLab({ records, summary: summarize(records), today, plan }).plans;

describe("plan progress", () => {
  it("is empty with no plan chosen, so the panel shows its sample", () => {
    expect(plansOf([played("2026-10-07")], null)).toEqual({ readiness: { state: "empty", sampleSize: 0 }, value: null });
  });

  it("counts a baseline week's days with a Medium round, practice or game, and compares nothing before day 7", () => {
    const records = [
      played("2026-10-04", { placed: THREE_OF_FOUR }),
      played("2026-10-05", { source: "calibration" }),
      played("2026-10-05"),
      played("2026-10-06", { pieces: 8 }),
      played("2026-10-03"),
    ];

    expect(plansOf(records, { planId: "baseline", startedDay: "2026-10-04" })).toEqual({
      readiness: { state: "ready", sampleSize: 3 },
      value: { planId: "baseline", status: { kind: "active", day: 5 }, daysPlayed: 2, comparison: null },
    });
  });

  it("compares the first and the latest Medium round from day 7, and says down when it fell", () => {
    const records = [played("2026-10-02"), played("2026-10-05"), played("2026-10-08", { placed: THREE_OF_FOUR })];

    expect(plansOf(records, { planId: "baseline", startedDay: "2026-10-02" }).value).toEqual({
      planId: "baseline",
      status: { kind: "active", day: 7 },
      daysPlayed: 3,
      comparison: { kind: "change", firstDay: 1, first: 100, lastDay: 7, latest: 75, change: -25 },
    });
  });

  it("says how few rounds there are to compare instead of a change", () => {
    expect(plansOf([], { planId: "baseline", startedDay: "2026-10-01" }).value).toMatchObject({ status: { kind: "active", day: 8 }, comparison: { kind: "tooFew", rounds: 0 } });
    expect(plansOf([played("2026-10-03")], { planId: "baseline", startedDay: "2026-10-01" }).value).toMatchObject({ comparison: { kind: "tooFew", rounds: 1 } });
  });

  it("is done on the day of the seventh day played, and later rounds do not move its comparison", () => {
    const days = ["2026-09-20", "2026-09-21", "2026-09-22", "2026-09-24", "2026-09-25", "2026-09-27", "2026-09-29"];
    const records = [...days.map((day, index) => played(day, { placed: index === 0 ? THREE_OF_FOUR : TARGET })), played("2026-10-01", { placed: THREE_OF_FOUR })];

    expect(plansOf(records, { planId: "baseline", startedDay: "2026-09-20" }).value).toEqual({
      planId: "baseline",
      status: { kind: "done", day: 10, how: "rounds" },
      daysPlayed: 7,
      comparison: { kind: "change", firstDay: 1, first: 75, lastDay: 10, latest: 100, change: 25 },
    });
  });

  it("keeps the day a plan was finished early or stopped, and counts no round after it", () => {
    const records = [played("2026-10-02"), played("2026-10-03"), played("2026-10-06")];

    expect(plansOf(records, { planId: "baseline", startedDay: "2026-10-02", ended: { how: "finished", day: "2026-10-04" } }).value).toEqual({
      planId: "baseline",
      status: { kind: "done", day: 3, how: "finished" },
      daysPlayed: 2,
      comparison: { kind: "change", firstDay: 1, first: 100, lastDay: 2, latest: 100, change: 0 },
    });
    expect(plansOf(records, { planId: "edge", startedDay: "2026-10-02", ended: { how: "stopped", day: "2026-10-05" } }).value).toMatchObject({ status: { kind: "stopped", day: 4 } });
  });

  it("counts edge rig days against the days so far and compares edge-file misses once both sides have three rounds", () => {
    const before = Array.from({ length: 3 }, () => played("2026-09-30", { target: EDGES, placed: EDGES_ONE_MISSED }));
    const drill = [
      played("2026-10-04", { pieces: 8, seconds: 15, target: EDGES }),
      played("2026-10-04", { pieces: 8, seconds: 15, target: EDGES }),
      played("2026-10-06", { pieces: 8, seconds: 15, target: EDGES, placed: EDGES_ONE_MISSED }),
    ];

    expect(plansOf([...before, ...drill], { planId: "edge", startedDay: "2026-10-03" }).value).toEqual({
      planId: "edge",
      status: { kind: "active", day: 6 },
      daysPlayed: 2,
      daysElapsed: 6,
      before: { rounds: 3, shown: 12, missed: 3, percent: 25 },
      since: { rounds: 3, shown: 12, missed: 1, percent: 8 },
    });
  });

  it("leaves the edge comparison unread with fewer than three rounds that showed an edge piece on a side", () => {
    const records = [played("2026-09-30", { target: EDGES }), played("2026-10-04"), played("2026-10-05", { pieces: 8, seconds: 15, target: EDGES })];

    expect(plansOf(records, { planId: "edge", startedDay: "2026-10-03" }).value).toMatchObject({
      before: { rounds: 1, shown: 4, missed: 0, percent: null },
      since: { rounds: 1, shown: 4, missed: 0, percent: null },
    });
  });

  it("reads a plan dated after today, as a clock set back leaves it, as on its first day", () => {
    expect(plansOf([], { planId: "ladder", startedDay: "2026-10-10" }).value).toMatchObject({ status: { kind: "active", day: 1 } });
  });

  it("finishes the edge drill after its fourteenth day", () => {
    expect(plansOf([], { planId: "edge", startedDay: "2026-09-25" }).value).toMatchObject({ status: { kind: "active", day: 14 }, daysElapsed: 14 });
    expect(plansOf([], { planId: "edge", startedDay: "2026-09-24" }).value).toMatchObject({ status: { kind: "done", day: 14, how: "calendar" }, daysElapsed: 14 });
  });

  it("counts no edge rig round after the drill's fourteenth day", () => {
    const rig = (day: string, placed = EDGES) => played(day, { pieces: 8, seconds: 15, target: EDGES, placed });
    const records = [rig("2026-09-20"), rig("2026-09-26"), rig("2026-10-03"), rig("2026-10-04", EDGES_ONE_MISSED), rig("2026-10-06", EDGES_ONE_MISSED)];

    expect(plansOf(records, { planId: "edge", startedDay: "2026-09-20" }).value).toEqual({
      planId: "edge",
      status: { kind: "done", day: 14, how: "calendar" },
      daysPlayed: 3,
      daysElapsed: 14,
      before: { rounds: 0, shown: 0, missed: 0, percent: null },
      since: { rounds: 3, shown: 12, missed: 0, percent: 0 },
    });
  });

  it("puts the ladder on the latest game setting, before the start when nothing is played since, else Medium", () => {
    const plan: StoredPlan = { planId: "ladder", startedDay: "2026-10-07" };

    expect(plansOf([played("2026-10-01", { pieces: 9, seconds: 7 }), played("2026-10-02", { source: "calibration" })], plan).value).toEqual({
      planId: "ladder",
      status: { kind: "active", day: 2 },
      rung: { pieceCount: 9, memorizeSeconds: 7 },
      run: 0,
      climbed: false,
      next: { pieceCount: 9, memorizeSeconds: 5 },
    });
    expect(plansOf([], plan).value).toMatchObject({ rung: { pieceCount: 6, memorizeSeconds: 10 }, next: { pieceCount: 6, memorizeSeconds: 8 } });
  });

  it("climbs a rung on three rounds in a row at 90 or better, and a miss or another setting in between starts the count again", () => {
    const records = [
      played("2026-10-06"),
      played("2026-10-06", { placed: THREE_OF_FOUR }),
      played("2026-10-06"),
      played("2026-10-07", { seconds: 8 }),
      played("2026-10-07"),
      played("2026-10-07"),
    ];
    const plan: StoredPlan = { planId: "ladder", startedDay: "2026-10-06" };

    expect(plansOf(records, plan).value).toMatchObject({ rung: { pieceCount: 6, memorizeSeconds: 10 }, run: 2, climbed: false });
    expect(plansOf([...records, played("2026-10-08")], plan).value).toMatchObject({ run: 3, climbed: true, next: { pieceCount: 6, memorizeSeconds: 8 } });
  });
});

describe("a plan started partway through a day", () => {
  it("counts no round played earlier that day toward the ladder", () => {
    const earlier = [played("2026-10-07"), played("2026-10-07"), played("2026-10-07")];
    const plan: StoredPlan = { planId: "ladder", startedDay: "2026-10-07", startedAt: earlier[2].endedAt + 1 };

    expect(plansOf([...earlier, played("2026-10-07")], plan).value).toMatchObject({ run: 1, climbed: false });
  });
});

describe("the next rung", () => {
  it.each([
    [{ pieceCount: 6, memorizeSeconds: 10 }, 10, { pieceCount: 6, memorizeSeconds: 8 }],
    [{ pieceCount: 6, memorizeSeconds: 6 }, 10, { pieceCount: 6, memorizeSeconds: 5 }],
    [{ pieceCount: 6, memorizeSeconds: 5 }, 10, { pieceCount: 7, memorizeSeconds: 10 }],
    [{ pieceCount: 6, memorizeSeconds: 3 }, 3, { pieceCount: 7, memorizeSeconds: 5 }],
    [{ pieceCount: 32, memorizeSeconds: 5 }, 10, null],
  ])("after %o on a ladder that started at %i s is %o", (rung, startSeconds, next) => {
    expect(nextRung(rung, startSeconds)).toEqual(next);
  });
});
