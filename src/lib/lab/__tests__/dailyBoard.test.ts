import { dailyFen, dailyStart } from "@/lib/lab/dailyBoard";
import { positionId } from "@/lib/lab/record";
import { roundV2 } from "./fixtures";

const NOON = Date.parse("2026-10-09T12:00:00Z");
/** Pinned literally: a change to the generator or the seed would hand every player a different board for a past day. */
const DAY_ONE = "8/8/8/1pQ4k/P2p4/8/8/1K6 b - - 0 1";
const DAY_TWO = "8/8/8/8/1kp2K1p/8/7R/1R6 b - - 0 1";

describe("the daily board position", () => {
  it("is the same position for the same UTC day, with a stable position id", () => {
    expect(dailyFen("2026-10-09")).toBe(DAY_ONE);
    expect(dailyFen("2026-10-09")).toBe(DAY_ONE);
    expect(positionId(DAY_ONE.split(" ")[0])).toBe("0e5a324d1f8d13");
  });

  it("is a different position on another day", () => {
    expect(dailyFen("2026-10-10")).toBe(DAY_TWO);
    expect(DAY_TWO).not.toBe(DAY_ONE);
  });

  it("holds the Medium preset's 6 pieces", () => {
    expect(DAY_ONE.split(" ")[0].replace(/[\d/]/g, "")).toHaveLength(6);
  });
});

describe("starting today's board", () => {
  it("opens today's position at the Medium preset when the record has no daily round today", () => {
    expect(dailyStart([], NOON, null)).toEqual({
      kind: "play",
      pieceCount: 6,
      memorizeTime: 10,
      board: { kind: "daily", day: "2026-10-09", fen: DAY_ONE },
    });
  });

  it("refuses a second attempt on the same UTC day", () => {
    const played = roundV2({ endedAt: NOON - 3_600_000, localDay: "2026-10-09" }, { kind: "daily", dailyDay: "2026-10-09" });

    expect(dailyStart([played], NOON, "2026-10-09")).toEqual({ kind: "played" });
  });

  it("refuses a board opened earlier today and left before its result", () => {
    expect(dailyStart([], NOON, "2026-10-09")).toEqual({ kind: "played" });
  });

  it("opens the next day's position once UTC midnight has passed", () => {
    const played = roundV2({ endedAt: NOON - 3_600_000, localDay: "2026-10-09" }, { kind: "daily", dailyDay: "2026-10-09" });

    expect(dailyStart([played], NOON + 12 * 3_600_000, "2026-10-09")).toMatchObject({ kind: "play", board: { day: "2026-10-10", fen: DAY_TWO } });
  });
});
