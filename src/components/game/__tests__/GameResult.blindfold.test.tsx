import { fireEvent, render, screen } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import { scoredRound } from "@/test-utils/round";

const BOARD_ROUND = scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3", { pieceCount: 6, studyMs: 10_000, source: "game_form" });
const BLINDFOLD_ROUND = scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3", { pieceCount: 6, studyMs: 10_000, source: "game_form", blindfold: true });
let mockRound = BOARD_ROUND;

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
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null), readCachedCutoffs: () => null }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/game/FirstGameFeedbackDialog", () => ({ __esModule: true, default: () => null }));

let gtag: jest.Mock;

beforeEach(() => {
  gtag = jest.fn();
  window.gtag = gtag;
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    init?.method === "POST" && String(input) === "/api/leaderboard"
      ? { ok: true, status: 200, json: async () => ({ success: true, data: { id: "3c3c3c3c-0000-4000-8000-000000000003" } }) }
      : { ok: true, json: async () => ({ data: { value: 1 } }) },
  ) as unknown as typeof fetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  mockRound = BOARD_ROUND;
});

const BLINDFOLD_LINE = "Blindfold round: you studied the position as notation.";

const OPEN = process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
afterEach(() => {
  if (OPEN === undefined) delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
  else process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = OPEN;
});

const submittedLink = () =>
  screen.getAllByRole("link", { name: "View leaderboard" }).map((link) => link.getAttribute("href") ?? "").find((href) => href.includes("player="));

const renderResult = () => render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

async function submitAs(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "Submit and see my rank" }));
  fireEvent.change(screen.getByLabelText("Player name"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "Submit score" }));
  await screen.findByText("Score submitted!");
}

const postedBody = () => {
  const call = (global.fetch as jest.Mock).mock.calls.find(([url, init]) => String(url) === "/api/leaderboard" && init?.method === "POST");
  return JSON.parse(call[1].body);
};

describe("the result of a blindfold round", () => {
  it("names the mode, and offers no submission while the blindfold board is closed", () => {
    delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
    mockRound = BLINDFOLD_ROUND;
    renderResult();

    expect(screen.getByText(BLINDFOLD_LINE)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit and see my rank" })).toBeNull();
    expect(screen.getByRole("link", { name: "View leaderboard" })).toBeInTheDocument();
  });

  it("sends the score to the blindfold board once it is open, and links to that board", async () => {
    process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";
    mockRound = BLINDFOLD_ROUND;
    renderResult();

    await submitAs("Poteto");

    expect(postedBody()).toMatchObject({ difficulty: "medium", piece_count: 6, mode: "blindfold" });
    expect(gtag.mock.calls).toContainEqual(["event", "score_submit", { difficulty: "medium", piece_count: 6, round_mode: "blindfold" }]);
    expect(submittedLink()).toContain("difficulty=medium&mode=blindfold&");
  });

  it("sends a board round's score with no mode, as before, open or not", async () => {
    process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";
    renderResult();
    expect(screen.queryByText(BLINDFOLD_LINE)).toBeNull();

    await submitAs("Poteto");

    expect(postedBody()).not.toHaveProperty("mode");
    expect(gtag.mock.calls).toContainEqual(["event", "score_submit", { difficulty: "medium", piece_count: 6 }]);
    expect(submittedLink()).toContain("difficulty=medium&memorizeTime=");
  });
});
