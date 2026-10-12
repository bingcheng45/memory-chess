import { act, fireEvent, render, screen, waitFor, within } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { drawResultCard } from "@/components/game/resultImage";
import { trackEvent } from "@/lib/analytics/events";
import { saveBlob } from "@/lib/saveBlob";
import { scoredRound } from "@/test-utils/round";
import type { SetBoard } from "@/lib/types/game";

jest.mock("@/lib/analytics/events", () => ({ ...jest.requireActual("@/lib/analytics/events"), trackEvent: jest.fn() }));
jest.mock("@/lib/saveBlob", () => ({ saveBlob: jest.fn() }));
jest.mock("@/components/game/resultImage", () => ({ drawResultCard: jest.fn() }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(() => Promise.resolve(null)), readCachedCutoffs: jest.fn(() => null) }));

const TARGET = "4k3/8/8/8/3q4/8/PP6/4K3";
const PNG = new Blob(["png"], { type: "image/png" });
const DAILY: SetBoard = { kind: "daily", day: "2026-10-12", fen: TARGET };

let mockStore: { gameState: Record<string, unknown>; round: ReturnType<typeof scoredRound> };
jest.mock("@/lib/store/gameStore", () => ({ START_RATING: 1000, useGameStore: () => mockStore }));

function show(board?: SetBoard) {
  const round = scoredRound(TARGET, "4k3/8/8/8/8/8/PP6/4K3", { pieceCount: 5, studyMs: 10000, source: board ? "daily" : "game_form", board });
  mockStore = {
    round,
    gameState: { pieceCount: 5, memorizeTime: 10, accuracy: 80, correctPlacements: 4, skillRating: 1042, skillRatingChange: 12, streak: 3, labRoundId: "r1", board },
  };
  render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
}

const openShare = () => act(async () => fireEvent.click(screen.getByRole("button", { name: "Share result" })));
const dialog = () => screen.getByRole("dialog", { name: "Share your result" });

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
  jest.mocked(drawResultCard).mockReset().mockResolvedValue(PNG);
  jest.mocked(trackEvent).mockClear();
  URL.createObjectURL = jest.fn(() => "blob:result");
  URL.revokeObjectURL = jest.fn();
});

describe("Share result", () => {
  it("opens the share dialog from the result screen with the round's card, caption and board", async () => {
    show();

    await openShare();

    const image = await within(dialog()).findByRole("img");
    expect(image).toHaveAttribute("src", "blob:result");
    expect(image.getAttribute("alt")).toBe(
      "Memory Chess result card: Round result, Accuracy 80%, 4 of 5 pieces, Setting 5 pieces, 8.3 s study, Rebuild time 12.5 s, Rating 1,042 (+12), Win streak 3 rounds in a row.",
    );
    expect(within(dialog()).getByText(/^I recalled/).textContent).toBe(
      "I recalled 4 of 5 pieces (80%) on Memory Chess. Can you beat it? https://thememorychess.com/?utm_source=share&utm_medium=result",
    );
    const [, board] = jest.mocked(drawResultCard).mock.calls[0];
    expect(board?.target.d4).toEqual({ color: "black", type: "queen" });
    expect(board?.placed.d4).toBeUndefined();
  });

  it("draws no board for the daily board, whose position every player shares that day", async () => {
    show(DAILY);

    await openShare();

    await within(dialog()).findByRole("img");
    const [copy, board] = jest.mocked(drawResultCard).mock.calls[0];
    expect([copy.kicker, copy.legend, board]).toEqual(["Daily board · Oct 12, 2026", null, null]);
  });

  it("counts a share under the result event and saves the round's PNG", async () => {
    show();
    await openShare();
    await within(dialog()).findByRole("img");

    await act(async () => fireEvent.click(within(dialog()).getByRole("button", { name: "Download image" })));

    expect(saveBlob).toHaveBeenCalledWith(PNG, "memory-chess-result.png");
    expect(jest.mocked(trackEvent).mock.calls.map(([event]) => event)).toEqual([{ name: "result_share", params: { method: "download" } }]);
  });

  it("closes on Escape and hands focus back to Share result, keeping the card for a second open", async () => {
    show();
    await openShare();
    await within(dialog()).findByRole("img");

    await act(async () => fireEvent.keyDown(document.activeElement as Element, { key: "Escape" }));
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Share result"));
    await openShare();

    expect(within(dialog()).getByRole("img")).toHaveAttribute("src", "blob:result");
    expect(drawResultCard).toHaveBeenCalledTimes(1);
  });
});
