import { runsByDay, streakOf } from "@/lib/lab/streak";

const run = (from: string, to: string) => {
  const days: string[] = [];
  for (let day = new Date(`${from}T12:00:00Z`); day <= new Date(`${to}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + 1)) {
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
};

describe("streak with one grace day a week", () => {
  it("counts the played days in a row ending today", () => {
    expect(streakOf(run("2026-10-05", "2026-10-07"), "2026-10-07")).toMatchObject({
      current: 3,
      longest: 3,
      graceUsed: false,
      forgivenDays: [],
    });
  });

  it("forgives a single missed day: the run carries on and the missed day is not counted as played", () => {
    const value = streakOf(["2026-10-01", "2026-10-02", "2026-10-04", "2026-10-05"], "2026-10-05");

    expect(value).toMatchObject({ current: 4, longest: 4, graceUsed: true, forgivenDays: ["2026-10-03"] });
    expect(value.window.slice(-5)).toEqual(["played", "played", "forgiven", "played", "played"]);
  });

  it("ends the run at two missed days in a row", () => {
    expect(streakOf(["2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06"], "2026-10-06")).toMatchObject({
      current: 2,
      longest: 2,
      graceUsed: false,
      forgivenDays: [],
    });
  });

  it("ends the run at a second single miss 6 days before a forgiven one, and the longest run uses the same rule", () => {
    const days = ["2026-09-29", "2026-09-30", ...run("2026-10-02", "2026-10-06"), "2026-10-08"];

    expect(streakOf(days, "2026-10-08")).toMatchObject({ current: 6, longest: 7, graceUsed: true, forgivenDays: ["2026-10-07"] });
  });

  it("forgives a second single miss 7 days before a forgiven one, one grace per rolling week", () => {
    const days = ["2026-09-30", ...run("2026-10-02", "2026-10-07"), "2026-10-09"];

    expect(streakOf(days, "2026-10-09")).toMatchObject({ current: 8, longest: 8, graceUsed: true, forgivenDays: ["2026-10-08", "2026-10-01"] });
  });

  it("walks back from yesterday while today has no round, forgiving yesterday when the day before was played", () => {
    const value = streakOf(["2026-10-04", "2026-10-05"], "2026-10-07");

    expect(value).toMatchObject({ current: 2, graceUsed: true, forgivenDays: ["2026-10-06"] });
    expect(value.window.slice(-4)).toEqual(["played", "played", "forgiven", "today"]);
  });

  it("is over when neither today nor the two days before it have a round", () => {
    const value = streakOf(["2026-10-04", "2026-10-05"], "2026-10-08");

    expect(value).toMatchObject({ current: 0, longest: 2, graceUsed: false, forgivenDays: [] });
    expect(value.window.slice(-4)).toEqual(["played", "missed", "missed", "today"]);
  });

  it("forgives a missed day across a month boundary", () => {
    expect(streakOf(["2026-09-29", "2026-10-01"], "2026-10-01")).toMatchObject({ current: 2, forgivenDays: ["2026-09-30"] });
  });

  it("gives each played day the run that ends on it, with that run's forgiven days", () => {
    const days = ["2026-09-29", "2026-09-30", "2026-10-02", "2026-10-03", "2026-10-05"];

    expect(runsByDay(days)).toEqual([
      { played: 1, forgivenDays: [] },
      { played: 2, forgivenDays: [] },
      { played: 3, forgivenDays: ["2026-10-01"] },
      { played: 4, forgivenDays: ["2026-10-01"] },
      { played: 3, forgivenDays: ["2026-10-04"] },
    ]);
  });
});
