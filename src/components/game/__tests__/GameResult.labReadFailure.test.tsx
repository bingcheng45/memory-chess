import { render, screen } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { round } from "@/lib/lab/__tests__/fixtures";
import { summarize } from "@/lib/lab/summary";

const mockRecord = { ...round({ id: "played-now", endedAt: Date.UTC(2026, 9, 7, 8), localDay: "2026-10-07" }), accuracy: 80 };

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({
    gameState: {
      pieceCount: 6,
      memorizeTime: 10,
      actualMemorizeTime: 8,
      completionTime: 12,
      accuracy: 80,
      correctPlacements: 4,
      extraPieces: 0,
      totalPiecesPlaced: 5,
      labRoundId: "played-now",
      originalPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
      userPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
    },
  }),
}));
jest.mock("@/lib/lab/resultCard", () => ({
  resultCardFor: () => {
    throw new Error("derive failed");
  },
}));
jest.mock("@/hooks/useLabData", () => ({
  ...jest.requireActual("@/hooks/useLabData"),
  useLabData: () => ({ storage: "available", records: [mockRecord], summary: summarize([mockRecord]), lastBackup: null, today: "2026-10-07" }),
}));
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null) }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/game/ResultBoardComparison", () => ({ __esModule: true, default: () => null }));

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

describe("the result screen when the lab card's record throws while it is read", () => {
  it("keeps the score and every action, and only the card's frame says it could not be shown", async () => {
    const onTryAgain = jest.fn();
    render(<GameResult onTryAgain={onTryAgain} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    expect(await screen.findByText("Your lab record could not be shown for this round.")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).toBeNull();
    expect(screen.getByRole("heading", { name: "Great Job!" })).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    screen.getByRole("button", { name: "Try Again" }).click();
    expect(onTryAgain).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "New Game" })).toBeInTheDocument();
  });
});
