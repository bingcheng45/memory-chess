import { comparePositions } from "@/utils/positionComparator";
import type { ChessPiece } from "@/types/chess";

const piece = (
  id: string,
  file: number,
  rank: number,
  type: ChessPiece["type"] = "pawn",
  color: ChessPiece["color"] = "white",
): ChessPiece => ({ id, type, color, position: { file, rank } });

describe("comparePositions", () => {
  it("recognizes a perfect position", () => {
    const original = [piece("target", 0, 0)];
    const submitted = [piece("submitted", 0, 0)];

    const result = comparePositions(original, submitted);

    expect(result.correctPlacements).toEqual(submitted);
    expect(result.incorrectPlacements).toEqual([]);
    expect(result.missingPieces).toEqual([]);
    expect(result.accuracy).toBe(100);
  });

  it("reports every target piece as missing for an empty submission", () => {
    const original = [piece("a", 0, 0), piece("b", 1, 1, "rook", "black")];

    const result = comparePositions(original, []);

    expect(result.correctPlacements).toEqual([]);
    expect(result.incorrectPlacements).toEqual([]);
    expect(result.missingPieces).toEqual(original);
    expect(result.accuracy).toBe(0);
  });

  it("separates correct, wrong, extra, and missing placements", () => {
    const correct = piece("correct", 0, 0);
    const wrongTarget = piece("wrong-target", 1, 1, "rook", "black");
    const missing = piece("missing", 3, 3, "bishop");
    const wrongSubmitted = piece("wrong-submitted", 1, 1, "rook", "white");
    const extra = piece("extra", 2, 2, "queen");

    const result = comparePositions(
      [correct, wrongTarget, missing],
      [correct, wrongSubmitted, extra],
    );

    expect(result.correctPlacements).toEqual([correct]);
    expect(result.incorrectPlacements).toEqual([wrongSubmitted, extra]);
    expect(result.missingPieces).toEqual([wrongTarget, missing]);
  });
});
