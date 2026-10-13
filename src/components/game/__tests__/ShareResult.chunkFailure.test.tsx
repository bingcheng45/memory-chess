import { act, fireEvent, render, screen } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { scoredRound } from "@/test-utils/round";

jest.mock("@/components/share/ShareDialog", () => {
  throw new Error("Loading chunk failed");
});
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(() => Promise.resolve(null)), readCachedCutoffs: jest.fn(() => null) }));

const mockStore = {
  round: scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3"),
  gameState: { pieceCount: 5, memorizeTime: 10, accuracy: 80, correctPlacements: 4, skillRating: 1042, skillRatingChange: 12, streak: 3, labRound: { facts: { id: "r1" }, endedAt: 0 } },
};
jest.mock("@/lib/store/gameStore", () => ({ useGameStore: () => mockStore }));

it("keeps the result screen and its actions when the share dialog's code will not load", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
  jest.spyOn(console, "error").mockImplementation(() => undefined);
  render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Share result" })));

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("heading", { name: "Great job!" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Share result" })).toBeInTheDocument();
});
