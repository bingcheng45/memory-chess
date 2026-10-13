import { bandsOverlap, dailySettingOf, InvalidDayError, isUtcDay, scheduleOf, settingsIn, MAX_LOOKBACK_DAYS, WEEKLY_ARC, type Band, type WeeklyArc } from "@/lib/daily/schedule";
import { utcDayOf } from "@/lib/lab/daily";
import { DAY_MS } from "@/lib/lab/readiness";

const daysFrom = (first: string, count: number) => Array.from({ length: count }, (_, index) => utcDayOf(Date.parse(`${first}T00:00:00Z`) + index * DAY_MS));

const EXPECTED_WEEKLY_ARC: Record<number, { pieces: [number, number]; seconds: [number, number] }> = {
  1: { pieces: [4, 5], seconds: [12, 12] },
  2: { pieces: [5, 6], seconds: [10, 10] },
  3: { pieces: [6, 7], seconds: [10, 10] },
  4: { pieces: [7, 8], seconds: [9, 9] },
  5: { pieces: [8, 9], seconds: [8, 8] },
  6: { pieces: [6, 12], seconds: [2, 6] },
  0: { pieces: [12, 32], seconds: [12, 12] },
};

describe("the daily setting", () => {
  it("is the same pinned setting for each day of one week", () => {
    expect(daysFrom("2026-10-19", 7).map(dailySettingOf)).toEqual([
      { pieceCount: 5, memorizeTime: 12 },
      { pieceCount: 5, memorizeTime: 10 },
      { pieceCount: 7, memorizeTime: 10 },
      { pieceCount: 7, memorizeTime: 9 },
      { pieceCount: 8, memorizeTime: 8 },
      { pieceCount: 10, memorizeTime: 4 },
      { pieceCount: 13, memorizeTime: 12 },
    ]);
  });

  it("draws again when the seed lands on yesterday's setting", () => {
    expect(dailySettingOf("2026-10-13")).toEqual({ pieceCount: 6, memorizeTime: 10 });
    expect(dailySettingOf("2026-10-14")).toEqual({ pieceCount: 7, memorizeTime: 10 });
  });

  it("stays inside its weekday's band for a year, and never repeats the day before", () => {
    const days = daysFrom("2026-10-13", 365);
    const settings = days.map(dailySettingOf);

    settings.forEach((setting, index) => {
      const band = EXPECTED_WEEKLY_ARC[new Date(`${days[index]}T00:00:00Z`).getUTCDay()];
      expect([days[index], setting.pieceCount >= band.pieces[0] && setting.pieceCount <= band.pieces[1]]).toEqual([days[index], true]);
      expect([days[index], setting.memorizeTime >= band.seconds[0] && setting.memorizeTime <= band.seconds[1]]).toEqual([days[index], true]);
      if (index > 0) expect([days[index], setting]).not.toEqual([days[index], settings[index - 1]]);
    });
  });

  it("reaches both ends of every band over a year", () => {
    const settings = daysFrom("2026-10-13", 365).map((day) => ({ weekday: new Date(`${day}T00:00:00Z`).getUTCDay(), ...dailySettingOf(day) }));
    const reached = Object.fromEntries(
      Object.keys(EXPECTED_WEEKLY_ARC).map((weekday) => {
        const own = settings.filter((setting) => setting.weekday === Number(weekday));
        const pieces = own.map((setting) => setting.pieceCount);
        const seconds = own.map((setting) => setting.memorizeTime);
        return [weekday, { pieces: [Math.min(...pieces), Math.max(...pieces)], seconds: [Math.min(...seconds), Math.max(...seconds)] }];
      }),
    );

    expect(reached).toEqual(EXPECTED_WEEKLY_ARC);
  });

  it("throws an InvalidDayError for anything but a real UTC day", () => {
    expect(["", "2026-02-30", "2026-10", "0000-01-01", "2026-10-19"].map(isUtcDay)).toEqual([false, false, false, false, true]);
    expect(() => dailySettingOf("")).toThrow(new InvalidDayError(""));
    expect(() => dailySettingOf("2026-02-30")).toThrow(InvalidDayError);
    expect(() => dailySettingOf("2026-10")).toThrow(RangeError);
    expect(dailySettingOf("2026-10-19")).toEqual({ pieceCount: 5, memorizeTime: 12 });
  });

  it("gives every band at least two settings, so a redraw always has one left", () => {
    expect(Object.fromEntries(Object.entries(WEEKLY_ARC).map(([weekday, band]) => [weekday, settingsIn(band).length >= 2]))).toEqual({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    });
  });

  it("ends every run of overlapping days within a week", () => {
    const week: Band[] = [WEEKLY_ARC.sunday, WEEKLY_ARC.monday, WEEKLY_ARC.tuesday, WEEKLY_ARC.wednesday, WEEKLY_ARC.thursday, WEEKLY_ARC.friday, WEEKLY_ARC.saturday];
    const runs = week.map((_, weekday) => {
      let run = 0;
      while (run < 7 && bandsOverlap(week[(weekday - run + 6) % 7], week[(weekday - run + 7) % 7])) run += 1;
      return run;
    });

    expect(runs).toEqual([0, 0, 0, 1, 0, 0, 0]);
  });

  it("keeps every run of overlapping weekday pairs shorter than the lookback cap", () => {
    const week: Band[] = [WEEKLY_ARC.sunday, WEEKLY_ARC.monday, WEEKLY_ARC.tuesday, WEEKLY_ARC.wednesday, WEEKLY_ARC.thursday, WEEKLY_ARC.friday, WEEKLY_ARC.saturday];
    const overlapsPrevious = week.map((band, weekday) => bandsOverlap(week[(weekday + 6) % 7], band));
    const doubled = [...overlapsPrevious, ...overlapsPrevious];
    const runs = doubled.map((_, end) => {
      let run = 0;
      while (run <= end && doubled[end - run]) run += 1;
      return run;
    });

    expect(Math.max(...runs)).toBeLessThan(MAX_LOOKBACK_DAYS);
  });

  it("never repeats the day before for years before 100, where local-time day maths drifts", () => {
    const days = daysFrom("0050-01-01", 400);
    const settings = days.map(dailySettingOf);

    settings.forEach((setting, index) => {
      if (index > 0) expect([days[index], setting]).not.toEqual([days[index], settings[index - 1]]);
    });
    expect(dailySettingOf("0050-01-02")).not.toEqual(dailySettingOf("0050-01-01"));
  });

  it("rejects an arc with a band whose minimum is above its maximum", () => {
    const bad = { pieces: { min: 8, max: 5 }, seconds: { min: 10, max: 10 } };

    expect(() => scheduleOf({ ...WEEKLY_ARC, tuesday: bad })).toThrow(/tuesday.*pieces/);
    expect(() => scheduleOf({ ...WEEKLY_ARC, friday: { ...bad, pieces: { min: 1, max: 2 }, seconds: { min: 9, max: 3 } } })).toThrow(/friday.*seconds/);
  });

  it("returns the only setting a one-setting week has, looking back no more than a week", () => {
    const only = { pieces: { min: 6, max: 6 }, seconds: { min: 10, max: 10 } };
    const flat: WeeklyArc = { monday: only, tuesday: only, wednesday: only, thursday: only, friday: only, saturday: only, sunday: only };

    expect(scheduleOf(flat)("2026-10-19")).toEqual({ pieceCount: 6, memorizeTime: 10 });
  });
});
