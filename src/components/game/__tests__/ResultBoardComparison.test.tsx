import { render, screen, within } from "@/test-utils/intl";
import ResultBoardComparison from "@/components/game/ResultBoardComparison";

jest.mock("@/hooks/useResponsiveBoard", () => ({
  useResponsiveBoard: () => ({
    size: 320,
    squareSize: 40,
    pieceSize: 32,
    fontSize: { coordinates: 10, pieceSelector: 12 },
    padding: 5,
  }),
}));

jest.mock("@/components/game/ResponsiveChessBoard", () => {
  function MockResponsiveChessBoard({
    pieces,
    squareFeedback,
    isInteractive,
  }: {
    pieces: unknown[];
    squareFeedback?: Record<string, string>;
    isInteractive?: boolean;
  }) {
    return (
      <div
        data-testid="mock-board"
        data-piece-count={pieces.length}
        data-feedback={JSON.stringify(squareFeedback ?? {})}
        data-interactive={String(isInteractive)}
      />
    );
  }

  return { __esModule: true, default: MockResponsiveChessBoard };
});

describe("ResultBoardComparison", () => {
  const originalPosition = "8/8/8/8/3B4/8/1r6/P7 w - - 0 1";
  const userPosition = "8/8/8/8/8/2Q5/1R6/P7 w - - 0 1";

  it("renders the target first, submitted board second, and keeps both read-only", () => {
    render(
      <ResultBoardComparison
        originalPosition={originalPosition}
        userPosition={userPosition}
      />,
    );

    const figures = screen.getAllByRole("figure");
    expect(
      within(figures[0]).getByText("Position to Remember"),
    ).toBeInTheDocument();
    expect(
      within(figures[1]).getByText("Your Submitted Position"),
    ).toBeInTheDocument();

    const boards = screen.getAllByTestId("mock-board");
    expect(boards[0]).toHaveAttribute("data-piece-count", "3");
    expect(boards[1]).toHaveAttribute("data-piece-count", "3");
    expect(boards[0]).toHaveAttribute("data-interactive", "false");
    expect(boards[1]).toHaveAttribute("data-interactive", "false");
  });

  it("annotates correct, incorrect, extra, and missed squares with wrong-piece precedence", () => {
    render(
      <ResultBoardComparison
        originalPosition={originalPosition}
        userPosition={userPosition}
      />,
    );

    const submittedBoard = screen.getAllByTestId("mock-board")[1];
    expect(JSON.parse(submittedBoard.dataset.feedback ?? "{}")).toEqual({
      "0-0": "correct",
      "1-1": "incorrect",
      "2-2": "incorrect",
      "3-3": "missing",
    });
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(screen.getByText("Missed")).toBeInTheDocument();
  });

  it("keeps the rest of the result usable when comparison data is unavailable", () => {
    render(
      <ResultBoardComparison
        originalPosition="invalid"
        userPosition={userPosition}
      />,
    );

    expect(
      screen.getByText("Board comparison unavailable."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("mock-board")).not.toBeInTheDocument();
  });
});
