import { render } from "@/test-utils/intl";
import ResponsiveChessBoard from "@/components/game/ResponsiveChessBoard";
import { fenToChessPieces } from "@/utils/chessPieces";
import { fakeLayout } from "@/test-utils/layout";

const BLACK_ROOK_A8_WHITE_KING_H1 = "r7/8/8/8/8/8/8/7K w - - 0 1";

function squaresInPaintOrder(): string[] {
  return Array.from(document.querySelectorAll("[data-coordinate]")).map(
    (square) => square.getAttribute("data-coordinate") ?? "",
  );
}

function occupiedSquares(): string[] {
  return Array.from(document.querySelectorAll("[data-coordinate]"))
    .filter((square) => square.querySelector("img"))
    .map((square) => square.getAttribute("aria-label") ?? "")
    .sort();
}

describe("the board's orientation", () => {
  it("puts each piece of a FEN on the square the FEN names", () => {
    render(
      <ResponsiveChessBoard
        pieces={fenToChessPieces(BLACK_ROOK_A8_WHITE_KING_H1)}
        isInteractive={false}
      />,
    );

    expect(occupiedSquares()).toEqual(["a8 with black rook", "h1 with white king"]);
  });

  it("draws rank 8 across the top and rank 1 across the bottom, White's side", () => {
    render(<ResponsiveChessBoard pieces={[]} isInteractive={false} />);

    const squares = squaresInPaintOrder();

    expect(squares.slice(0, 8)).toEqual(["a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"]);
    expect(squares.slice(56)).toEqual(["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"]);
  });
});

describe("the board's first paint", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("draws the board at the size of its area on the first commit, so it never grows from zero on screen", () => {
    fakeLayout(() => ({ width: 400, height: 520 }));

    render(<ResponsiveChessBoard pieces={[]} isInteractive={false} />);

    const board = document.querySelector<HTMLElement>(".game-container");
    expect([board?.style.width, board?.style.height]).toEqual(["400px", "400px"]);
  });
});
