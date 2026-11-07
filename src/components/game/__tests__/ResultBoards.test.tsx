import { fireEvent, render, screen, within } from "@/test-utils/intl";
import ResultBoards from "@/components/game/ResultBoards";
import { scoredRound } from "@/test-utils/round";

const TARGET = "4k3/8/8/8/3q4/8/PP6/4K3";
const YOUR_BOARD = "Your board, with correct and wrong pieces marked";

const pressedView = () =>
  within(screen.getByRole("group", { name: "Result view" }))
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-pressed") === "true")
    .map((button) => button.textContent);

describe("ResultBoards", () => {
  it("keeps side by side for a round with something to compare", () => {
    render(<ResultBoards round={scoredRound(TARGET, "4k3/8/8/8/8/8/PP6/4K3")} view="side" onViewChange={jest.fn()} />);

    expect(pressedView()).toEqual(["Side by side"]);
    expect(screen.getByRole("group", { name: YOUR_BOARD })).toBeInTheDocument();
  });

  it.each([
    ["a perfect round", TARGET],
    ["an empty board", "8/8/8/8/8/8/8/8"],
  ])("shows one board for %s, even when side by side is saved", (_, placed) => {
    render(<ResultBoards round={scoredRound(TARGET, placed)} view="side" onViewChange={jest.fn()} />);

    expect(pressedView()).toEqual(["One board"]);
    expect(screen.queryByRole("group", { name: YOUR_BOARD })).toBeNull();
  });

  it("still lets the player switch a perfect round to side by side", () => {
    const onViewChange = jest.fn();
    render(<ResultBoards round={scoredRound(TARGET, TARGET)} view="side" onViewChange={onViewChange} />);

    fireEvent.click(screen.getByRole("button", { name: "One board" }));
    fireEvent.click(screen.getByRole("button", { name: "Side by side" }));

    expect(pressedView()).toEqual(["Side by side"]);
    expect(screen.getByRole("group", { name: YOUR_BOARD })).toBeInTheDocument();
    expect(onViewChange.mock.calls).toEqual([["side"]]);
  });

  it.each([
    ["side", "4k3/8/8/8/8/8/PP6/4K3"],
    ["overlay", "4k3/8/8/8/8/8/PP6/4K3"],
  ] as const)("renders the view toggle before the boards in the %s view, and keeps it first after switching", (view, placed) => {
    const { container } = render(<ResultBoards round={scoredRound(TARGET, placed)} view={view} onViewChange={jest.fn()} />);
    const order = () => {
      const toggle = container.querySelector("[data-result-views]")!;
      const board = container.querySelector("[data-result-board]")!;
      return [toggle.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING, toggle.parentElement === board.parentElement, board.contains(toggle)];
    };

    const before = order();
    fireEvent.click(screen.getByRole("button", { name: view === "side" ? "One board" : "Side by side" }));

    expect([before, order()]).toEqual([
      [Node.DOCUMENT_POSITION_FOLLOWING, true, false],
      [Node.DOCUMENT_POSITION_FOLLOWING, true, false],
    ]);
  });
});
