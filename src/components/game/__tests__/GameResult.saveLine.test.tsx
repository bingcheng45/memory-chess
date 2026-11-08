import { fireEvent, render, screen, waitFor } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { resetSaveLine } from "@/components/game/ResultSaveLine";
import { downloadLabRecord, lifetimeRounds } from "@/components/home/labDownload";
import { scoredRound } from "@/test-utils/round";

const mockRound = scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3");
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
let mockHistory: readonly { readonly id: string }[] = [];
const historyOf = (rounds: number) => Array.from({ length: rounds }, (_, index) => ({ id: `round-${index}` }));

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ gameState: mockGameState, round: mockRound, history: mockHistory, resultView: "side", setResultView: jest.fn() }),
}));
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({
  loadLeaderboardCutoffs: () => Promise.resolve(null),
  readCachedCutoffs: () => null,
}));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/resultDeltasWarm", () => ({
  recordReadDuringRound: () => Promise.resolve(null),
  warmedResultDeltas: () => null,
}));
jest.mock("@/components/home/labDownload", () => ({
  downloadLabRecord: jest.fn(),
  lifetimeRounds: jest.fn(),
}));

const LINE = "Your record lives only in this browser.";
const renderResult = () => render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
  Object.defineProperty(window, "indexedDB", { value: {}, configurable: true });
  window.gtag = jest.fn();
});

afterEach(() => {
  Reflect.deleteProperty(window, "indexedDB");
  // @ts-expect-error gtag is optional at runtime
  delete window.gtag;
  mockHistory = [];
  resetSaveLine();
  jest.mocked(downloadLabRecord).mockReset();
  jest.mocked(lifetimeRounds).mockReset();
});

describe("the save line on the result screen", () => {
  it("is not shown after a player's first round", () => {
    mockHistory = historyOf(1);
    renderResult();

    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back up across devices (coming soon)" })).not.toBeInTheDocument();
  });

  it.each([2, 5])("is shown once, with both actions, after %i rated rounds", (rounds) => {
    mockHistory = historyOf(rounds);
    renderResult();

    expect(screen.getAllByText(LINE)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Download a copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back up across devices (coming soon)" })).toHaveAttribute("aria-disabled", "true");
  });

  it("is not shown where the browser cannot keep a record, since there is nothing to download", () => {
    mockHistory = historyOf(3);
    Reflect.deleteProperty(window, "indexedDB");
    renderResult();

    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
  });

  it("counts backup interest from the result screen with the record's round count and nothing else", async () => {
    mockHistory = historyOf(2);
    jest.mocked(lifetimeRounds).mockResolvedValue(7);
    renderResult();

    fireEvent.click(screen.getByRole("button", { name: "Back up across devices (coming soon)" }));

    await waitFor(() => expect(window.gtag).toHaveBeenCalledWith("event", "lab_backup_interest", { rounds: 7, surface: "result_screen" }));
    expect(screen.getByText("Cross-device backup is not built yet. Thanks, your interest is counted.")).toHaveAttribute("role", "status");
  });

  it("downloads a copy of the record with the home record's export", async () => {
    mockHistory = historyOf(2);
    jest.mocked(downloadLabRecord).mockResolvedValue(Date.parse("2026-11-08T10:00:00Z"));
    renderResult();

    fireEvent.click(screen.getByRole("button", { name: "Download a copy" }));

    await waitFor(() => expect(screen.getByText("Download started. Keep the file somewhere other than this browser.")).toBeInTheDocument());
    expect(downloadLabRecord).toHaveBeenCalledTimes(1);
  });

  it("stays hidden on later results once hidden for the session", () => {
    mockHistory = historyOf(2);
    const { unmount } = renderResult();

    fireEvent.click(screen.getByRole("button", { name: "Hide for now" }));
    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
    unmount();

    mockHistory = historyOf(3);
    renderResult();
    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
  });
});

describe("tomorrow's board on the result screen", () => {
  it("sits under the readout, before the secondary actions and the save line's own place after it", () => {
    mockHistory = historyOf(2);
    renderResult();

    const order = [
      document.querySelector(".lab-rc-big"),
      screen.getByRole("region", { name: "Tomorrow's board" }),
      screen.getByText(LINE),
      screen.getByRole("navigation", { name: "Result actions" }),
    ];
    const follows = order.slice(1).map((element, index) => Boolean(order[index]!.compareDocumentPosition(element!) & Node.DOCUMENT_POSITION_FOLLOWING));
    expect(follows).toEqual([true, true, true]);
    expect(screen.getByRole("region", { name: "Tomorrow's board" })).toContainElement(screen.getByRole("button", { name: "Remind me daily" }));
  });

  it("keeps every result action after the move", () => {
    mockHistory = historyOf(1);
    renderResult();

    const actions = screen.getByRole("navigation", { name: "Result actions" });
    expect(actions).toHaveTextContent("Try again");
    expect(actions).toHaveTextContent("Change settings");
    expect(screen.getByRole("link", { name: "View leaderboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Next round/ })).toBeInTheDocument();
    expect(screen.getAllByRole("region", { name: "Tomorrow's board" })).toHaveLength(1);
  });
});
