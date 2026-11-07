import { FIRST_SCREEN_BOARDS, piecesOf, squareAt } from "@/components/home/intro/firstScreen";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const TEXT = String.fromCharCode(0xfe0e);

describe("piecesOf", () => {
  it("places the 32 pieces of the start position", () => {
    const pieces = piecesOf(START);

    expect(pieces).toHaveLength(32);
    expect(pieces.filter((piece) => piece.white)).toHaveLength(16);
  });

  it("counts files from a and ranks from the eighth rank, skipping the empty squares", () => {
    expect(piecesOf("r3k3/8/8/8/8/8/8/4K2R")).toEqual([
      { file: 0, rank: 0, glyph: `♜${TEXT}`, white: false },
      { file: 4, rank: 0, glyph: `♚${TEXT}`, white: false },
      { file: 4, rank: 7, glyph: `♔${TEXT}`, white: true },
      { file: 7, rank: 7, glyph: `♖${TEXT}`, white: true },
    ]);
  });

  it("follows the letter case for the colour", () => {
    expect(piecesOf("p7/8/8/8/8/8/8/7P").map((piece) => piece.white)).toEqual([false, true]);
  });

  it("keeps every piece of the shown boards on the board", () => {
    for (const { fen } of FIRST_SCREEN_BOARDS) {
      for (const piece of piecesOf(fen)) {
        expect(piece.file).toBeGreaterThanOrEqual(0);
        expect(piece.file).toBeLessThanOrEqual(7);
        expect(piece.glyph).not.toBe(TEXT);
      }
    }
  });
});

describe("squareAt", () => {
  it("maps e4 to file 4, rank 4", () => {
    expect(squareAt("e4")).toEqual({ file: 4, rank: 4 });
  });

  it("maps the corners", () => {
    expect(squareAt("a8")).toEqual({ file: 0, rank: 0 });
    expect(squareAt("h1")).toEqual({ file: 7, rank: 7 });
  });
});
