import { validateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import { CALIBRATION_RULES, loadCalibrationPosition, suggestTier } from "@/lib/home/calibration";
import { labPositionFromFen, labPositionToFen, type LabPosition } from "@/lib/round/round";

const WK = { color: "white", type: "king" } as const;
const WN = { color: "white", type: "knight" } as const;


function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

describe("calibration positions", () => {
  it("uses the Medium preset from the game config", () => {
    expect(CALIBRATION_RULES).toEqual({ pieceCount: 6, studyMs: 10000 });
  });

  it("comes from the real generator: 200 seeds all pass the game's validator", async () => {
    for (let seed = 1; seed <= 200; seed++) {
      const position = await loadCalibrationPosition(seeded(seed));
      const fen = labPositionToFen(position!);

      // The board keeps no side to move, so either side may be the one in check.
      const legal = ["w", "b"].some((turn) => validateMemorizationPosition(`${fen} ${turn} - - 0 1`, 6).valid);

      expect(legal).toBe(true);
      expect(Object.values(position!).filter((piece) => piece?.type === "king")).toEqual([
        expect.objectContaining({ type: "king" }),
        expect.objectContaining({ type: "king" }),
      ]);
    }
  });

  it("round-trips a position through FEN", () => {
    const position: LabPosition = { a8: { color: "black", type: "rook" }, e4: WN, h1: WK };

    expect(labPositionToFen(position)).toBe("r7/8/8/8/4N3/8/8/7K");
    expect(labPositionFromFen("r7/8/8/8/4N3/8/8/7K w - - 0 1")).toEqual(position);
  });
});

describe("suggestTier", () => {
  it.each([
    [100, "stepUp", "hard", 12, 8],
    [90, "stepUp", "hard", 12, 8],
    [89, "stay", "medium", 6, 10],
    [60, "stay", "medium", 6, 10],
    [59, "start", "easy", 2, 10],
    [0, "start", "easy", 2, 10],
  ])("maps %i%% to %s on %s", (accuracy, advice, difficulty, pieceCount, memorizeTime) => {
    expect(suggestTier(accuracy)).toEqual({ advice, difficulty, pieceCount, memorizeTime });
  });
});
