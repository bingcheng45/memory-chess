import { fireEvent, render, screen } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { scoredRound } from "@/test-utils/round";

const mockRound = scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3");

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({
    round: mockRound,
    history: [],
    gameState: {
      pieceCount: 6,
      memorizeTime: 10,
      actualMemorizeTime: 8.25,
      completionTime: 12.5,
      accuracy: 80,
      correctPlacements: 4,
      extraPieces: 0,
      totalPiecesPlaced: 5,
      originalPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
      userPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
    },
  }),
}));
jest.mock("@/lib/lab/entries", () => {
  throw new Error("Loading chunk 77 failed");
});
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null), readCachedCutoffs: () => null }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));

beforeEach(() => {
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === "POST" && String(input).includes("/api/leaderboard")
      ? { ok: true, status: 200, json: async () => ({ success: true, data: { id: "3c3c3c3c-0000-4000-8000-000000000003" } }) }
      : { ok: true, json: async () => ({ data: { value: 1 } }) },
  ) as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe("submitting a score when the stored-entries code fails to load", () => {
  it("says the score was submitted, since the server stored it", async () => {
    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Submit to leaderboard" }));
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Poteto" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

    expect(await screen.findByText("Score submitted!")).toBeInTheDocument();
    expect(screen.queryByText(/Error:/)).toBeNull();
  });
});
