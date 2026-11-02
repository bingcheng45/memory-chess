import { render } from "@testing-library/react";
import { MissMap, boardFromLines } from "@/components/home/LabCharts";

const files = [0.5, null, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
const ranks = [0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, null];

describe("boardFromLines", () => {
  it("shades each square by the mean of its file and rank, rank 8 first", () => {
    const board = boardFromLines(files, ranks);
    expect(board).toHaveLength(64);
    expect(board[0]).toBeCloseTo(0.4);
    expect(board[2]).toBeCloseTo(0.2);
    expect(board[63]).toBeNull();
    expect(board[1]).toBeNull();
    expect(board[8]).toBeCloseTo(0.3);
  });
});

describe("MissMap", () => {
  it("draws a board with a1 dark, h1 light, and grey squares for thin data", () => {
    const { container } = render(<MissMap cells={boardFromLines(files, ranks)} />);
    const squares = container.querySelectorAll(".lab-heat i");
    expect(squares).toHaveLength(64);
    expect(squares[56].hasAttribute("data-dark")).toBe(true);
    expect(squares[63].hasAttribute("data-dark")).toBe(false);
    expect(squares[1].hasAttribute("data-thin")).toBe(true);
    expect((squares[0] as HTMLElement).style.getPropertyValue("--heat")).toBe("42%");
    expect([...container.querySelectorAll(".lab-missboard-files li")].map((li) => li.textContent).join("")).toBe("abcdefgh");
    expect([...container.querySelectorAll(".lab-missboard-ranks li")].map((li) => li.textContent).join("")).toBe("87654321");
  });

  it("is an image with the given label, and hidden from screen readers without one", () => {
    const labelled = render(<MissMap label="Your misses" />).container.firstElementChild;
    expect(labelled?.getAttribute("role")).toBe("img");
    expect(labelled?.getAttribute("aria-label")).toBe("Your misses");
    const bare = render(<MissMap cells={boardFromLines(files, ranks)} />).container.firstElementChild;
    expect(bare?.getAttribute("aria-hidden")).toBe("true");
  });
});
