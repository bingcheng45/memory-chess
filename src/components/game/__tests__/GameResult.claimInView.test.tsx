import { act, fireEvent, render, screen, waitFor, within } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { loadLeaderboardCutoffs, readCachedCutoffs } from "@/lib/leaderboard/cutoffsClient";
import type { LeaderboardCutoffs } from "@/lib/leaderboard/ranking";
import { scoredRound } from "@/test-utils/round";
import { useSettingsStore } from "@/stores/settingsStore";

jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/share/ShareDialog", () => ({ ShareDialog: ({ title }: { title: string }) => <div role="dialog" aria-label={title} /> }));
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(), readCachedCutoffs: jest.fn() }));

const OPEN: LeaderboardCutoffs = { easy: { kind: "open" }, medium: { kind: "open" }, hard: { kind: "open" }, grandmaster: { kind: "open" } };
const FULL_MEDIUM: LeaderboardCutoffs = {
  ...OPEN,
  medium: { kind: "full", worst: { correctPieces: 6, totalWrongPieces: 0, memorizeTime: 1, solutionTime: 1 } },
};

const round = scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3", { pieceCount: 6, studyMs: 10000, source: "game_form" });
const GAME = {
  pieceCount: 6,
  memorizeTime: 10,
  accuracy: 80,
  correctPlacements: 5,
  extraPieces: 0,
  totalPiecesPlaced: 6,
  labRound: { facts: { id: "r1" }, endedAt: 0 },
};
let mockGame: typeof GAME & { pieceCount: number } = GAME;
jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ gameState: mockGame, round, history: [], resultView: "side", setResultView: jest.fn() }),
}));

const show = async (cutoffs: LeaderboardCutoffs | null) => {
  jest.mocked(loadLeaderboardCutoffs).mockResolvedValue(cutoffs);
  render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
  await act(async () => {});
};
const claim = () => document.querySelector<HTMLElement>("[data-result-claim]");

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
  jest.mocked(readCachedCutoffs).mockReturnValue(null);
  window.gtag = jest.fn();
});
afterEach(() => {
  mockGame = GAME;
  useSettingsStore.setState({ playerName: "", countryCode: "ZZ" as never });
  // @ts-expect-error gtag is optional at runtime
  delete window.gtag;
});

describe("the claim line under the score", () => {
  it("names the board a score would make and opens the leaderboard dialog from there", async () => {
    await show(OPEN);

    expect(claim()?.textContent).toBe("Medium: 80% would make the leaderboard.Claim it");
    fireEvent.click(within(claim()!).getByRole("button", { name: "Claim it" }));

    expect(screen.getByRole("dialog", { name: "Submit to leaderboard" })).toBeInTheDocument();
  });

  it("sends the score with score_submit from the claim line's dialog", async () => {
    await show(OPEN);
    fireEvent.click(within(claim()!).getByRole("button", { name: "Claim it" }));
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Poteto" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

    await waitFor(() => expect(window.gtag).toHaveBeenCalledWith("event", "score_submit", { difficulty: "medium", piece_count: 6 }));
  });

  it("promises no placement when the score would not make a full board, or the cutoffs are unknown", async () => {
    await show(null);

    expect(claim()?.textContent).toBe("Medium: see where 80% ranks.Submit it");
  });

  it("says the same when the board is full and the score would not push anyone off", async () => {
    await show(FULL_MEDIUM);

    expect(claim()?.textContent).toBe("Medium: see where 80% ranks.Submit it");
  });

  it("is absent for a custom board, which no leaderboard ranks", async () => {
    mockGame = { ...GAME, pieceCount: 7 };
    await show(OPEN);

    expect(claim()).toBeNull();
  });

  it("returns focus to the button that opened the dialog", async () => {
    await show(OPEN);
    const opener = within(claim()!).getByRole("button", { name: "Claim it" });
    fireEvent.click(opener);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});

describe("Share result beside Next round", () => {
  it("is an icon button in the Next round row that opens the share dialog", async () => {
    await show(OPEN);
    const row = document.querySelector<HTMLElement>(".lab-result-next")!;
    const share = within(row).getByRole("button", { name: "Share result" });

    expect(share.textContent).toBe("");
    expect(within(screen.getByRole("navigation", { name: "Result actions" })).queryByRole("button", { name: "Share result" })).toBeNull();
    await act(async () => fireEvent.click(share));

    expect(await screen.findByRole("dialog", { name: "Share your result" })).toBeInTheDocument();
  });
});

describe("the claim line's accessibility", () => {
  it("describes its button with the sentence it belongs to", async () => {
    await show(OPEN);
    const button = within(claim()!).getByRole("button", { name: "Claim it" });

    expect(document.getElementById(button.getAttribute("aria-describedby")!)?.textContent).toBe("Medium: 80% would make the leaderboard.");
  });
});
