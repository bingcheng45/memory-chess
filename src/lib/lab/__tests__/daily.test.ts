import { dailyBoardOf, msToNextUtcDay, shareGrid, utcDayOf } from "@/lib/lab/daily";
import { personaRounds, PERSONA_TODAY } from "@/lib/lab/personas";
import { round, roundV2 } from "./fixtures";

const daily = (dailyDay: string, overrides: Parameters<typeof roundV2>[0] = {}) =>
  roundV2({ id: `daily-${dailyDay}`, endedAt: Date.parse(`${dailyDay}T09:00:00Z`), localDay: dailyDay, ...overrides }, { kind: "daily", dailyDay, startSource: "daily" });

describe("the daily board's UTC day", () => {
  it("names the day by UTC, whatever the time zone", () => {
    expect(utcDayOf(Date.parse("2026-10-08T23:59:59Z"))).toBe("2026-10-08");
    expect(utcDayOf(Date.parse("2026-10-09T00:00:00Z"))).toBe("2026-10-09");
  });

  it("counts the time left until the next UTC midnight", () => {
    expect(msToNextUtcDay(Date.parse("2026-10-08T18:47:30Z"))).toBe(5 * 3_600_000 + 12 * 60_000 + 30_000);
    expect(msToNextUtcDay(Date.parse("2026-10-09T00:00:00Z"))).toBe(24 * 3_600_000);
  });
});

describe("today's daily board on this device", () => {
  it("is open with no streak before any daily round", () => {
    expect(dailyBoardOf([round(), roundV2()], "2026-10-09", null)).toEqual({ status: "open", day: "2026-10-09", streak: null });
  });

  it("is played once a daily round for today is in the record, and keeps the first attempt", () => {
    const first = daily("2026-10-09", { id: "first", endedAt: Date.parse("2026-10-09T08:00:00Z") });
    const second = daily("2026-10-09", { id: "second", endedAt: Date.parse("2026-10-09T10:00:00Z") });

    const board = dailyBoardOf([second, first], "2026-10-09", null);

    expect(board).toMatchObject({ status: "played", day: "2026-10-09", round: { id: "first" }, streak: { current: 1, longest: 1 } });
  });

  it("stays open when the only daily rounds are from earlier days, and carries their streak", () => {
    const board = dailyBoardOf([daily("2026-10-06"), daily("2026-10-07"), daily("2026-10-08")], "2026-10-09", null);

    expect(board).toMatchObject({ status: "open", day: "2026-10-09", streak: { current: 3, longest: 3, graceUsed: false } });
  });

  it("reads the board's own day, not the day the round ended, for a round that ended after UTC midnight", () => {
    const late = daily("2026-10-08", { endedAt: Date.parse("2026-10-09T00:00:20Z"), localDay: "2026-10-09" });

    expect(dailyBoardOf([late], "2026-10-09", null)).toMatchObject({ status: "open", streak: { current: 1 } });
  });

  it("forgives one missed day in the daily streak, as the practice streak does", () => {
    const days = ["2026-10-03", "2026-10-04", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];

    expect(dailyBoardOf(days.map((day) => daily(day)), "2026-10-09", null)).toMatchObject({
      status: "played",
      streak: { current: 6, longest: 6, graceUsed: true, forgivenDays: ["2026-10-05"] },
    });
  });

  it("is unfinished once today's board was opened without a result, and open again the next day", () => {
    const records = [daily("2026-10-08")];

    expect(dailyBoardOf(records, "2026-10-09", "2026-10-09")).toMatchObject({ status: "unfinished", streak: { current: 1 } });
    expect(dailyBoardOf(records, "2026-10-10", "2026-10-09")).toMatchObject({ status: "open" });
  });

  it("ignores normal rounds, which never count as today's board", () => {
    expect(dailyBoardOf([roundV2({ localDay: "2026-10-09", endedAt: Date.parse("2026-10-09T09:00:00Z") })], "2026-10-09", null)).toMatchObject({ status: "open", streak: null });
  });
});

describe("the share grid", () => {
  it("draws the 64 squares as eight rows of eight, a8 first, without naming a piece", () => {
    const squares = `${"c".padEnd(8, ".")}${".".repeat(8)}${"...m....".repeat(1)}${".".repeat(16)}${"......w."}${".".repeat(8)}${"x......c"}`;

    expect(shareGrid(squares)).toBe(
      [
        "🟩⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜🟥⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜",
        "⬜⬜⬜⬜⬜⬜🟨⬜",
        "⬜⬜⬜⬜⬜⬜⬜⬜",
        "🟧⬜⬜⬜⬜⬜⬜🟩",
      ].join("\n"),
    );
  });
});

describe("the daily personas", () => {
  it("read as today's board open, played, and a nine-day streak with one forgiven day", () => {
    const boardOf = (name: "dailyOpen" | "dailyPlayed" | "dailyStreak") => dailyBoardOf(personaRounds(name), PERSONA_TODAY, null);

    expect(boardOf("dailyOpen")).toMatchObject({ status: "open", day: "2026-10-08", streak: { current: 3, longest: 3, graceUsed: false } });
    expect(boardOf("dailyPlayed")).toMatchObject({
      status: "played",
      round: { kind: "daily", dailyDay: "2026-10-08", startSource: "daily", positionId: "1330e3656bec5f" },
      streak: { current: 1 },
    });
    expect(boardOf("dailyStreak")).toMatchObject({ status: "played", streak: { current: 9, longest: 9, graceUsed: true, forgivenDays: ["2026-10-03"] } });
  });
});
