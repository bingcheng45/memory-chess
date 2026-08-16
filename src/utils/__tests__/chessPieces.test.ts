import { fenToChessPieces } from "@/utils/chessPieces";

describe("fenToChessPieces", () => {
  it("parses every piece type, color, and board rank", () => {
    const pieces = fenToChessPieces("KQRBNP2/8/8/8/8/8/8/2pnbrqk w - - 0 1");

    expect(pieces).toHaveLength(12);
    expect(
      pieces.slice(0, 6).map(({ type, color, position }) => ({
        type,
        color,
        position,
      })),
    ).toEqual([
      { type: "king", color: "white", position: { file: 0, rank: 7 } },
      { type: "queen", color: "white", position: { file: 1, rank: 7 } },
      { type: "rook", color: "white", position: { file: 2, rank: 7 } },
      { type: "bishop", color: "white", position: { file: 3, rank: 7 } },
      { type: "knight", color: "white", position: { file: 4, rank: 7 } },
      { type: "pawn", color: "white", position: { file: 5, rank: 7 } },
    ]);
    expect(
      pieces.slice(6).map(({ type, color, position }) => ({
        type,
        color,
        position,
      })),
    ).toEqual([
      { type: "pawn", color: "black", position: { file: 2, rank: 0 } },
      { type: "knight", color: "black", position: { file: 3, rank: 0 } },
      { type: "bishop", color: "black", position: { file: 4, rank: 0 } },
      { type: "rook", color: "black", position: { file: 5, rank: 0 } },
      { type: "queen", color: "black", position: { file: 6, rank: 0 } },
      { type: "king", color: "black", position: { file: 7, rank: 0 } },
    ]);
  });

  it("accepts an empty board", () => {
    expect(fenToChessPieces("8/8/8/8/8/8/8/8 w - - 0 1")).toEqual([]);
  });

  it.each([
    "",
    "8/8/8/8/8/8/8",
    "9/8/8/8/8/8/8/8",
    "7x/8/8/8/8/8/8/8",
    "7/8/8/8/8/8/8/8",
  ])("rejects malformed FEN board data: %s", (fen) => {
    expect(() => fenToChessPieces(fen)).toThrow("Invalid FEN");
  });
});
