import { fireEvent, render, screen, within } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";

const mockGameState = {
  isPlaying: false,
  isMemorizationPhase: false,
  isSolutionPhase: false,
  pieceCount: 6,
  memorizeTime: 10,
  actualMemorizeTime: 8.25,
  completionTime: 12.5,
  timeElapsed: 0,
  currentLevel: 1,
  moves: [],
  accuracy: 80,
  correctPlacements: 4,
  extraPieces: 0,
  totalPiecesPlaced: 5,
  originalPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
  userPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
};

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ gameState: mockGameState }),
}));

jest.mock("@/lib/utils/soundEffects", () => ({
  playSound: jest.fn(),
}));

jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/game/ResultBoardComparison", () => ({
  __esModule: true,
  default: ({
    originalPosition,
    userPosition,
  }: {
    originalPosition?: string;
    userPosition?: string;
  }) => (
    <div
      data-testid="result-comparison"
      data-original={originalPosition}
      data-submitted={userPosition}
    />
  ),
}));

describe("GameResult", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { value: 1 } }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the compact summary, both board positions, and working replay actions", () => {
    const onTryAgain = jest.fn();
    const onNewGame = jest.fn();

    render(<GameResult onTryAgain={onTryAgain} onNewGame={onNewGame} />);

    expect(
      screen.getByRole("heading", { name: "Great Job!" }),
    ).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getAllByText("4 / 6")).toHaveLength(2);
    expect(screen.getByText("Recall Speed")).toBeInTheDocument();

    const summary = screen.getByRole("region", { name: "Great Job!" });
    const actions = within(summary).getByRole("navigation", {
      name: "Result actions",
    });
    expect(
      within(actions).getByRole("button", { name: "Try Again" }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("button", { name: "New Game" }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("button", { name: "Submit to Leaderboard" }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("link", { name: "View Leaderboard" }),
    ).toBeInTheDocument();

    const comparison = screen.getByTestId("result-comparison");
    expect(comparison).toHaveAttribute(
      "data-original",
      mockGameState.originalPosition,
    );
    expect(comparison).toHaveAttribute(
      "data-submitted",
      mockGameState.userPosition,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    fireEvent.click(screen.getByRole("button", { name: "New Game" }));
    expect(onTryAgain).toHaveBeenCalledTimes(1);
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it("preserves leaderboard submission access for standard difficulties", () => {
    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} />);

    expect(
      screen.getByRole("link", { name: "View Leaderboard" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Submit to Leaderboard" }),
    );

    expect(
      screen.getByRole("heading", { name: "Submit to Leaderboard" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Player Name")).toBeInTheDocument();
  });
});
