import { fireEvent, render } from "@/test-utils/intl";
import ResponsiveChessBoard from "@/components/game/ResponsiveChessBoard";
import { fenToChessPieces } from "@/utils/chessPieces";

const square = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-coordinate="${name}"]`);

describe("ResponsiveChessBoard", () => {
  it("draws each piece on the square its FEN names", () => {
    const { container } = render(
      <ResponsiveChessBoard
        pieces={fenToChessPieces("7k/8/8/8/8/2K5/1p6/8 w - - 0 1")}
      />,
    );

    expect(square(container, "h8")?.querySelector("img")).not.toBeNull();
    expect(square(container, "c3")?.querySelector("img")).not.toBeNull();
    expect(square(container, "b2")?.querySelector("img")).not.toBeNull();
    expect(square(container, "b7")?.querySelector("img")).toBeNull();
    expect(container.querySelector("[data-coordinate]")?.dataset.coordinate).toBe("a8");
  });

  it("reports the clicked square in board coordinates", () => {
    const onSquareClick = jest.fn();
    const { container } = render(
      <ResponsiveChessBoard pieces={[]} isInteractive onSquareClick={onSquareClick} />,
    );

    fireEvent.click(square(container, "c3")!);

    expect(onSquareClick).toHaveBeenCalledWith({ file: 2, rank: 2 });
  });
});
