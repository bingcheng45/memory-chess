import {
  appearance,
  botMoveTimes,
  cameraAt,
  captionAt,
  counterAt,
  darkness,
  heroMoveTimes,
  layoutFor,
  movesPlayed,
  nextBeatTime,
} from "@/lib/home/intro/introBeats";

describe("what is on screen at a moment", () => {
  it.each([
    [0, "one", { boards: 1, dark: false }],
    [2.2, "many", { boards: 1, dark: false }],
    [3.5, "many", { boards: 24, dark: false }],
    [5, "many", { boards: 45, dark: false }],
    [6.2, "dark", { boards: 45, dark: true }],
    [8, "you", { boards: 45, dark: true }],
    [9.6, "you", { boards: 45, dark: true }],
  ])("at %ss: caption %s and the counter reads %j", (t, caption, counter) => {
    expect(captionAt(t)).toBe(caption);
    expect(counterAt(t)).toEqual(counter);
  });

  it("grows each board in from the centre out", () => {
    expect([0, 1, 20, 44].map((rank) => appearance(1, rank))).toEqual([1, 0, 0, 0]);
    expect([0, 1, 20, 44].map((rank) => appearance(5, rank))).toEqual([1, 1, 1, 1]);
  });

  it("darkens every board, then brings only the centre one back", () => {
    expect(darkness(5, 0)).toBe(0);
    expect(darkness(7, 0)).toBe(1);
    expect(darkness(7, 44)).toBe(1);
    expect(darkness(9.5, 0)).toBe(0);
    expect(darkness(9.5, 44)).toBe(1);
  });
});

describe("jumping ahead", () => {
  it.each([
    [0, 2.2],
    [1.9, 2.2],
    [2.2, 5.6],
    [6, 7.8],
    [8, 9.4],
    [9.5, 10],
  ])("from %ss goes to %ss", (t, next) => {
    expect(nextBeatTime(t)).toBe(next);
  });
});

describe("the layout", () => {
  it("stands the grid up on a phone and lays it down on a desktop, with the Opera Game in the middle cell", () => {
    expect(layoutFor(375, 812)).toMatchObject({ cols: 5, rows: 9, midY: 812 * 0.38 });
    expect(layoutFor(1440, 900)).toMatchObject({ cols: 9, rows: 5, midY: 450 });
    expect(layoutFor(375, 812).order[0]).toBe(22);
    expect(layoutFor(1440, 900).order[0]).toBe(22);
    expect([...layoutFor(1440, 900).order].sort((a, b) => a - b)).toEqual(Array.from({ length: 45 }, (_, cell) => cell));
  });

  it("starts on one large board and pulls back until every board is its grid size", () => {
    const layout = layoutFor(1440, 900);
    expect(cameraAt(0, layout, 1440, 900).zoom).toBeCloseTo(558);
    expect(cameraAt(5, layout, 1440, 900).zoom).toBeCloseTo(layout.tile);
    expect(cameraAt(10, layout, 1440, 900).zoom).toBeCloseTo(558 * 1.1);
  });
});

describe("moves", () => {
  it("plays the Opera Game quickly alone, then at a reading pace", () => {
    const times = heroMoveTimes(33);
    expect(times).toHaveLength(14);
    expect(times.slice(0, 6).map((at) => Number(at.toFixed(2)))).toEqual([0.5, 0.92, 1.34, 1.76, 2.18, 2.6]);
    expect(movesPlayed(times, 0.4)).toBe(0);
    expect(movesPlayed(times, 6.3)).toBe(10);
    expect(movesPlayed(times, 10)).toBe(14);
  });

  it("gives each bot board its own schedule inside the ten seconds and within its moves", () => {
    const schedules = Array.from({ length: 44 }, (_, board) => botMoveTimes(board, 30));
    schedules.forEach((times) => {
      expect(times.length).toBeGreaterThanOrEqual(4);
      expect(times.length).toBeLessThanOrEqual(30);
      expect(times.every((at) => at >= 0.3 && at < 10)).toBe(true);
    });
    expect(new Set(schedules.map((times) => times.join())).size).toBe(44);
    expect(botMoveTimes(0, 3)).toEqual([0.3, 1, 1.7]);
  });
});
