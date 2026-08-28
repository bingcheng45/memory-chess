import { useState } from "react";
import { fireEvent, screen, render } from "@/test-utils/intl";
import ResponsiveInteractiveBoard from "@/components/game/ResponsiveInteractiveBoard";
import type { ChessPiece, PieceColor, PieceType, Position } from "@/types/chess";
import type { BoardDimensions } from "@/hooks/useResponsiveBoard";

const dimensions: BoardDimensions = {
  size: 480,
  squareSize: 60,
  pieceSize: 45,
  padding: 4,
  fontSize: { coordinates: 10, pieceSelector: 12 },
};

/**
 * Drives the board the way the game page does: the parent owns the placed
 * pieces and the board reports placements and removals back to it. Without a
 * real parent the board can never show a piece, so none of the remove or
 * limit behaviour would be reachable.
 */
function Harness({ onChange }: { onChange?: (pieces: ChessPiece[]) => void }) {
  const [pieces, setPieces] = useState<ChessPiece[]>([]);

  const update = (next: ChessPiece[]) => {
    setPieces(next);
    onChange?.(next);
  };

  return (
    <ResponsiveInteractiveBoard
      dimensions={dimensions}
      status={null}
      playerSolution={pieces}
      onPlacePiece={(piece) => update([...pieces, piece])}
      onRemovePiece={(position: Position) =>
        update(
          pieces.filter(
            (p) =>
              p.position.file !== position.file ||
              p.position.rank !== position.rank,
          ),
        )
      }
    />
  );
}

const square = (name: string) =>
  document.querySelector(`[data-coordinate="${name}"]`) as HTMLElement;

const tap = (name: string) => fireEvent.click(square(name));

// The palette labels its buttons with the colour currently selected, e.g.
// "Select white knight", so the colour has to be named to find the button.
const selectPiece = (type: PieceType, color: PieceColor = "white") =>
  fireEvent.click(screen.getByLabelText(`Select ${color} ${type}`));

const selectColor = (color: PieceColor) =>
  fireEvent.click(
    screen.getByLabelText(color === "white" ? "Select white pieces" : "Select black pieces"),
  );

const piecesOnBoard = () =>
  Array.from(document.querySelectorAll("[data-coordinate]"))
    .filter((el) => el.querySelector("img"))
    .map((el) => `${el.getAttribute("data-coordinate")}:${el.querySelector("img")!.getAttribute("alt")}`)
    .sort();

describe("placing and removing pieces on the solution board", () => {
  it("places a piece on the square that was clicked", () => {
    render(<Harness />);

    tap("d4");

    expect(piecesOnBoard()).toEqual(["d4:white pawn"]);
  });

  it("removes a piece when its square is clicked again", () => {
    render(<Harness />);

    tap("d4");
    expect(piecesOnBoard()).toEqual(["d4:white pawn"]);

    tap("d4");
    expect(piecesOnBoard()).toEqual([]);
  });

  it("places every piece when several squares are clicked in a row", () => {
    // Regression: a tap debounce cancelled pending placements, so a burst of
    // clicks only ever landed the first and the last.
    render(<Harness />);

    ["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8"].forEach(tap);

    expect(piecesOnBoard()).toHaveLength(8);
  });

  it("places a piece when the same square is clicked again after a removal", () => {
    render(<Harness />);

    tap("e4");
    tap("e4");
    tap("e4");

    expect(piecesOnBoard()).toEqual(["e4:white pawn"]);
  });

  it("never places two pieces on one square", () => {
    const seen: ChessPiece[][] = [];
    render(<Harness onChange={(p) => seen.push(p)} />);

    tap("d4");
    tap("d4");
    tap("d4");
    tap("d4");

    seen.forEach((pieces) => {
      const squares = pieces.map((p) => `${p.position.file}-${p.position.rank}`);
      expect(new Set(squares).size).toBe(squares.length);
    });
  });
});

describe("switching piece type and color", () => {
  it("places the piece type that is selected", () => {
    render(<Harness />);

    selectPiece("knight");
    tap("b1");
    selectPiece("rook");
    tap("a1");
    selectPiece("queen");
    tap("d1");

    expect(piecesOnBoard()).toEqual([
      "a1:white rook",
      "b1:white knight",
      "d1:white queen",
    ]);
  });

  it("places the color that is selected", () => {
    render(<Harness />);

    tap("a2");
    selectColor("black");
    tap("a7");

    expect(piecesOnBoard()).toEqual(["a2:white pawn", "a7:black pawn"]);
  });

  it("keeps type and color independent when both are switched", () => {
    render(<Harness />);

    selectColor("black");
    selectPiece("bishop", "black");
    tap("c8");
    selectColor("white");
    tap("c1");

    expect(piecesOnBoard()).toEqual(["c1:white bishop", "c8:black bishop"]);
  });

  it("applies a type change immediately on the very next click", () => {
    render(<Harness />);

    selectPiece("knight");
    tap("g1");

    expect(piecesOnBoard()).toEqual(["g1:white knight"]);
  });
});

describe("piece limits", () => {
  it("allows both knights of a color", () => {
    render(<Harness />);

    selectPiece("knight");
    tap("b1");
    tap("g1");

    expect(piecesOnBoard()).toEqual(["b1:white knight", "g1:white knight"]);
  });

  it("does not place more than the allowed number of a piece", () => {
    render(<Harness />);

    selectPiece("queen");
    tap("d1");
    tap("d5");

    expect(piecesOnBoard()).toEqual(["d1:white queen"]);
  });

  it("counts each color's limit separately", () => {
    render(<Harness />);

    selectPiece("king");
    tap("e1");
    selectColor("black");
    tap("e8");

    expect(piecesOnBoard()).toEqual(["e1:white king", "e8:black king"]);
  });

  it("frees the budget again once a piece is removed", () => {
    render(<Harness />);

    selectPiece("queen");
    tap("d1");
    tap("d1"); // remove it
    tap("d5"); // the queen should be available again

    expect(piecesOnBoard()).toEqual(["d5:white queen"]);
  });

  it("does not consume budget for a click that placed nothing", () => {
    // Regression: one gesture used to be counted twice, silently halving the
    // number of pieces a player could place.
    const seen: ChessPiece[][] = [];
    render(<Harness onChange={(p) => seen.push(p)} />);

    ["a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3"].forEach(tap);

    expect(piecesOnBoard()).toHaveLength(8);
    expect(seen[seen.length - 1]).toHaveLength(8);
  });
});
