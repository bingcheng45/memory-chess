import { sessionsOf } from "@/lib/lab/sessions";
import { round } from "./fixtures";

const NOON = Date.UTC(2026, 9, 7, 12);
const MINUTE = 60_000;

describe("sessionsOf", () => {
  it("starts a new session when two rounds end exactly 30 minutes apart", () => {
    expect(sessionsOf([round({ id: "a", endedAt: NOON }), round({ id: "b", endedAt: NOON + 30 * MINUTE })])).toEqual([
      { startedAt: NOON, endedAt: NOON, rounds: 1, sources: ["game"] },
      { startedAt: NOON + 30 * MINUTE, endedAt: NOON + 30 * MINUTE, rounds: 1, sources: ["game"] },
    ]);
  });

  it("keeps rounds 29 minutes 59 seconds apart in one session, however long the chain runs", () => {
    const gap = 30 * MINUTE - 1000;

    expect(sessionsOf([0, 1, 2].map((step) => round({ id: `r${step}`, endedAt: NOON + step * gap })))).toEqual([
      { startedAt: NOON, endedAt: NOON + 2 * gap, rounds: 3, sources: ["game"] },
    ]);
  });

  it("orders rounds by when they ended, whatever order they arrive in", () => {
    const records = [
      round({ id: "late", endedAt: NOON + 120 * MINUTE }),
      round({ id: "first", endedAt: NOON, source: "calibration" }),
      round({ id: "second", endedAt: NOON + 10 * MINUTE }),
    ];

    expect(sessionsOf(records)).toEqual([
      { startedAt: NOON, endedAt: NOON + 10 * MINUTE, rounds: 2, sources: ["game", "calibration"] },
      { startedAt: NOON + 120 * MINUTE, endedAt: NOON + 120 * MINUTE, rounds: 1, sources: ["game"] },
    ]);
  });

  it("keeps a sitting across midnight together even though its rounds fall on two days", () => {
    const beforeMidnight = Date.UTC(2026, 9, 7, 23, 50);
    const afterMidnight = Date.UTC(2026, 9, 8, 0, 10);
    const records = [
      round({ id: "a", endedAt: beforeMidnight, localDay: "2026-10-07" }),
      round({ id: "b", endedAt: afterMidnight, localDay: "2026-10-08" }),
    ];

    expect(sessionsOf(records)).toEqual([{ startedAt: beforeMidnight, endedAt: afterMidnight, rounds: 2, sources: ["game"] }]);
  });

  it("reads the hour the clocks go back by elapsed time, since endedAt is epoch milliseconds", () => {
    const at0150Edt = Date.UTC(2026, 10, 1, 5, 50);
    const at0110Est = Date.UTC(2026, 10, 1, 6, 10);

    expect(sessionsOf([round({ id: "a", endedAt: at0150Edt }), round({ id: "b", endedAt: at0110Est })])).toEqual([
      { startedAt: at0150Edt, endedAt: at0110Est, rounds: 2, sources: ["game"] },
    ]);
  });
});
