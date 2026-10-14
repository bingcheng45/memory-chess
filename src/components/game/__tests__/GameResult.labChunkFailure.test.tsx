import { render, screen } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { scoredRound } from "@/test-utils/round";

const mockRound = scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3");

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({
    round: mockRound,
    gameState: {
      pieceCount: 6,
      memorizeTime: 10,
      actualMemorizeTime: 8,
      completionTime: 12,
      accuracy: 80,
      correctPlacements: 4,
      extraPieces: 0,
      totalPiecesPlaced: 5,
      labRound: { facts: { id: "played-now" }, endedAt: 0 },
      originalPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
      userPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
    },
  }),
}));
jest.mock("@/components/game/ResultLabCard", () => {
  throw new Error("Loading chunk 42 failed");
});
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null), readCachedCutoffs: () => null }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));
beforeEach(() => {
  Object.defineProperty(window, "indexedDB", { value: {}, configurable: true });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(window, "indexedDB");
});

describe("the result screen when the lab card's code fails to load", () => {
  it("keeps the score and every action, and only the card's frame says it could not be shown", async () => {
    const onTryAgain = jest.fn();
    render(<GameResult onTryAgain={onTryAgain} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    expect(await screen.findByText("Your lab record could not be shown for this round.")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).toBeNull();
    expect(screen.getByRole("heading", { name: "Great job!" })).toBeInTheDocument();
    expect(document.querySelector(".lab-rc-big")).toHaveTextContent("80%");
    screen.getByRole("button", { name: "Try again" }).click();
    expect(onTryAgain).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "New game" })).toBeInTheDocument();
  });
});
