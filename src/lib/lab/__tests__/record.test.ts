import { buildRoundRecord, configKey, localDayOf, positionId } from "@/lib/lab/record";
import { round, roundV2, TARGET } from "./fixtures";

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

describe("positionId", () => {
  it.each([
    ["a", "1c2ba782c97901"],
    [TARGET, "0a6c3bd6ea5bcc"],
    ["8/8/8/8/8/8/8/8", "0d909b6fd2d2b8"],
  ])("hashes %s to a fixed 14 digit id", (fen, id) => {
    expect(positionId(fen)).toBe(id);
  });

  it("gives a different id when one piece moves", () => {
    expect([positionId(TARGET), positionId("4k3/8/8/4q3/8/5N2/8/4K3")]).toEqual(["0a6c3bd6ea5bcc", "1acd1d80064c9d"]);
  });
});

describe("buildRoundRecord version 2", () => {
  it("writes a board with split empty runs in standard form, so it keeps its position id", () => {
    const record = roundV2({ targetFen: "4k3/44/8/3q22/8/5N11/8/4K3", placedFen: "4k3/8/8/3q4/8/5N2/8/1111K3" });

    expect([record.targetFen, record.placedFen, record.positionId]).toEqual([TARGET, TARGET, "0a6c3bd6ea5bcc"]);
  });


  it("adds the position id, the start, the kind, the timezone and the placements to the scored round", () => {
    const { v, ...core } = round();
    const record = buildRoundRecord(
      {
        id: "r1",
        source: "game",
        endedAt: Date.UTC(2026, 9, 7, 12),
        localDay: "2026-10-07",
        pieceCount: 4,
        memorizeSeconds: 10,
        targetFen: `${TARGET} w - - 0 1`,
        placedFen: TARGET,
        memorizeMs: 10000,
        solveMs: 20000,
      },
      { startSource: "home_quick", tzOffsetMin: -480, placements: [[900, 60, "K"]], removals: 1 },
    );

    expect(v).toBe(1);
    expect(record).toEqual({
      ...core,
      v: 2,
      positionId: "0a6c3bd6ea5bcc",
      kind: "normal",
      startSource: "home_quick",
      tzOffsetMin: -480,
      placements: [[900, 60, "K"]],
      removals: 1,
    });
  });

  it("writes no key for a fact it was not given", () => {
    const record = buildRoundRecord(
      { id: "r1", source: "calibration", endedAt: 1, localDay: "2026-10-07", pieceCount: 4, memorizeSeconds: 10, targetFen: TARGET, placedFen: TARGET, memorizeMs: 1, solveMs: 1 },
      {},
    );

    expect(Object.keys(record).slice(-3)).toEqual(["accuracy", "positionId", "kind"]);
  });
});
