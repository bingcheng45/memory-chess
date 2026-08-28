import {
  fenToChessPieces,
  mapChessJsPieceToType,
  pieceTypeToFenChar,
} from "@/utils/chessPieces";
import type { PieceColor, PieceType } from "@/types/chess";

const ALL_PIECE_TYPES: readonly PieceType[] = [
  "pawn",
  "knight",
  "bishop",
  "rook",
  "queen",
  "king",
];
const ALL_PIECE_COLORS: readonly PieceColor[] = ["white", "black"];

describe("pieceTypeToFenChar", () => {
  it.each([
    ["pawn", "P", "p"],
    ["knight", "N", "n"],
    ["bishop", "B", "b"],
    ["rook", "R", "r"],
    ["queen", "Q", "q"],
    ["king", "K", "k"],
  ] as const)("maps %s to %s / %s", (type, white, black) => {
    expect(pieceTypeToFenChar(type, "white")).toBe(white);
    expect(pieceTypeToFenChar(type, "black")).toBe(black);
  });

  it("never encodes a knight as a king", () => {
    // Regression: deriving the FEN char from the first letter of the type name
    // turned every knight into a king, so knights were scored as missed.
    expect(pieceTypeToFenChar("knight", "white")).not.toBe(
      pieceTypeToFenChar("king", "white"),
    );
    expect(pieceTypeToFenChar("knight", "black")).not.toBe(
      pieceTypeToFenChar("king", "black"),
    );
  });

  it("assigns a distinct character to every piece type", () => {
    const chars = ALL_PIECE_TYPES.map((type) =>
      pieceTypeToFenChar(type, "white"),
    );

    expect(new Set(chars).size).toBe(ALL_PIECE_TYPES.length);
  });

  it("round-trips through mapChessJsPieceToType for every type and color", () => {
    ALL_PIECE_TYPES.forEach((type) => {
      ALL_PIECE_COLORS.forEach((color) => {
        expect(mapChessJsPieceToType(pieceTypeToFenChar(type, color))).toBe(
          type,
        );
      });
    });
  });
});


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
