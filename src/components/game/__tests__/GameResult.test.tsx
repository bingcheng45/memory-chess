import { act, fireEvent, render, screen, waitFor, within } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { loadLeaderboardCutoffs } from "@/lib/leaderboard/cutoffsClient";
import type { BoardCutoff, LeaderboardCutoffs } from "@/lib/leaderboard/ranking";

const baseGameState = {
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

let mockGameState = baseGameState;

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ gameState: mockGameState }),
}));

jest.mock("@/lib/leaderboard/cutoffsClient", () => ({
  loadLeaderboardCutoffs: jest.fn(),
}));

const loadCutoffsMock = loadLeaderboardCutoffs as jest.Mock;

const PRODUCTION_EASY_CUTOFF: BoardCutoff = {
  kind: "full",
  worst: {
    correctPieces: 2,
    totalWrongPieces: 0,
    memorizeTime: 3.917,
    solutionTime: 5.567,
  },
};

const CUTOFFS: LeaderboardCutoffs = {
  easy: PRODUCTION_EASY_CUTOFF,
  medium: { kind: "open" },
  hard: { kind: "open" },
  grandmaster: { kind: "open" },
};

const QUALIFIES_SENTENCE =
  "Your score makes the leaderboard. Submit it before it's gone.";

const perfectEasyGame = {
  ...baseGameState,
  pieceCount: 2,
  accuracy: 100,
  correctPlacements: 2,
  extraPieces: 0,
  totalPiecesPlaced: 2,
  actualMemorizeTime: 2.5,
  completionTime: 4,
};

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
    loadCutoffsMock.mockReset();
    loadCutoffsMock.mockResolvedValue(null);
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

  it("shows the reason the server gave, not a generic failure", async () => {
    const serverMessage = "The leaderboard is being updated. Please try again shortly.";
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST" && String(input).includes("/api/leaderboard")) {
        return { ok: false, status: 503, json: async () => ({ error: serverMessage }) };
      }
      return { ok: true, json: async () => ({ data: { value: 1 } }) };
    }) as unknown as typeof fetch;

    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Submit to Leaderboard" }),
    );
    fireEvent.change(screen.getByLabelText("Player Name"), {
      target: { value: "Poteto" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit Score" }));

    expect(
      await screen.findByText(`Error: ${serverMessage}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Error: Failed to submit score"),
    ).not.toBeInTheDocument();
    logged.mockRestore();
  });

  it("offers no submission for a round with no correct piece, which the board would never show", () => {
    mockGameState = { ...baseGameState, accuracy: 0, correctPlacements: 0 };

    try {
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} />);

      expect(
        screen.queryByRole("button", { name: "Submit to Leaderboard" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "View Leaderboard" }),
      ).toBeInTheDocument();
    } finally {
      mockGameState = baseGameState;
    }
  });

  describe("leaderboard qualifier", () => {
    afterEach(() => {
      mockGameState = baseGameState;
    });

    async function renderSettled() {
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} />);
      await act(async () => {});
    }

    it("tells a qualifying player their score makes the board", async () => {
      mockGameState = perfectEasyGame;
      loadCutoffsMock.mockResolvedValue(CUTOFFS);

      await renderSettled();

      expect(screen.getByRole("status")).toHaveTextContent(QUALIFIES_SENTENCE);
    });

    it("stays silent for a score slower than the worst entry on the board", async () => {
      mockGameState = {
        ...perfectEasyGame,
        actualMemorizeTime: 9.4,
        completionTime: 11.2,
      };
      loadCutoffsMock.mockResolvedValue(CUTOFFS);

      await renderSettled();

      expect(screen.queryByText(QUALIFIES_SENTENCE)).not.toBeInTheDocument();
    });

    it("stays silent for a custom game, which no board ranks", async () => {
      mockGameState = {
        ...perfectEasyGame,
        pieceCount: 7,
        correctPlacements: 7,
        totalPiecesPlaced: 7,
      };
      loadCutoffsMock.mockResolvedValue(CUTOFFS);

      await renderSettled();

      expect(screen.queryByText(QUALIFIES_SENTENCE)).not.toBeInTheDocument();
    });

    it("stays silent when the cutoffs are unavailable", async () => {
      mockGameState = perfectEasyGame;
      loadCutoffsMock.mockResolvedValue(null);

      await renderSettled();

      expect(screen.queryByText(QUALIFIES_SENTENCE)).not.toBeInTheDocument();
    });

    it("drops the nudge once the score has been submitted", async () => {
      mockGameState = perfectEasyGame;
      loadCutoffsMock.mockResolvedValue(CUTOFFS);

      await renderSettled();
      expect(screen.getByText(QUALIFIES_SENTENCE)).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Submit to Leaderboard" }),
      );
      fireEvent.change(screen.getByLabelText("Player Name"), {
        target: { value: "Poteto" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit Score" }));

      await waitFor(() => {
        expect(screen.queryByText(QUALIFIES_SENTENCE)).not.toBeInTheDocument();
      });
    });
  });
});
