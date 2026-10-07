import { configKey, localDayOf } from "@/lib/lab/record";
import { round, TARGET } from "./fixtures";

describe("buildRoundRecord", () => {
  it("records each square's outcome and the counts the result screen shows", () => {
    const record = round({ placedFen: "4k3/8/8/8/3q4/8/5N2/4K2Q w - - 0 1" });

    expect(record).toEqual({
      v: 1,
      id: "r1",
      source: "game",
      endedAt: Date.UTC(2026, 9, 7, 12),
      localDay: "2026-10-07",
      config: { pieceCount: 4, memorizeSeconds: 10, difficulty: null },
      targetFen: TARGET,
      placedFen: "4k3/8/8/8/3q4/8/5N2/4K2Q",
      squares: "....c......................m.......x.........m.......x......c..x",
      shownByType: { k: 2, q: 1, n: 1 },
      missedByType: { q: 1, n: 1 },
      memorizeMs: 10000,
      solveMs: 20000,
      correct: 2,
      wrong: 3,
      extra: 1,
      accuracy: 40,
    });
  });

  it("names the preset when the config matches one", () => {
    expect(round({ pieceCount: 6, memorizeSeconds: 10 }).config.difficulty).toBe("medium");
  });

  it("marks a wrong piece on a target square as w", () => {
    expect(round({ placedFen: "4k3/8/8/3Q4/8/5N2/8/4K3" }).squares[27]).toBe("w");
  });
});

describe("record helpers", () => {
  it("formats the local calendar day", () => {
    expect(localDayOf(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("keys a config by pieces and seconds", () => {
    expect(configKey({ pieceCount: 6, memorizeSeconds: 10 })).toBe("6x10");
  });
});
