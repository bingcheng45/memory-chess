import { parseWeekGoal, weekProgress } from "@/lib/lab/week";

describe("week progress", () => {
  it("counts the days played since Monday of the current calendar week", () => {
    expect(weekProgress(["2026-10-01", "2026-10-05", "2026-10-06", "2026-10-08"], "2026-10-08", 5)).toEqual({
      daysPlayed: 3,
      goal: 5,
      weekStart: "2026-10-05",
      remaining: 2,
      daysLeft: 3,
    });
  });

  it("starts a new week on Monday, leaving Sunday in the week before", () => {
    expect(weekProgress(["2026-10-04", "2026-10-05"], "2026-10-05", 3)).toEqual({ daysPlayed: 1, goal: 3, weekStart: "2026-10-05", remaining: 2, daysLeft: 6 });
  });

  it("keeps Sunday in the week that started on Monday, and never asks for a negative number of days", () => {
    const days = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-09", "2026-10-11"];

    expect(weekProgress(days, "2026-10-11", 4)).toEqual({ daysPlayed: 5, goal: 4, weekStart: "2026-10-05", remaining: 0, daysLeft: 0 });
  });

  it("does not count a day after today", () => {
    expect(weekProgress(["2026-10-08", "2026-10-09"], "2026-10-08", 7)).toEqual({ daysPlayed: 1, goal: 7, weekStart: "2026-10-05", remaining: 6, daysLeft: 3 });
  });

  it("counts today among the days left only while it has no round", () => {
    expect(weekProgress(["2026-10-05"], "2026-10-10", 5)).toEqual({ daysPlayed: 1, goal: 5, weekStart: "2026-10-05", remaining: 4, daysLeft: 2 });
  });

  it("starts the week in the old year when the new year begins midweek", () => {
    expect(weekProgress(["2026-12-28", "2027-01-01"], "2027-01-01", 5)).toEqual({ daysPlayed: 2, goal: 5, weekStart: "2026-12-28", remaining: 3, daysLeft: 2 });
  });
});

describe("week goal parsing", () => {
  it("accepts 3, 4, 5 or 7 days a week, and nothing else", () => {
    expect(["3", "4", "5", "7", "6", "0", "5.0", "five", "", null].map(parseWeekGoal)).toEqual([3, 4, 5, 7, null, null, null, null, null, null]);
  });
});
