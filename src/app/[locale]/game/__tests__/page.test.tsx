import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@/test-utils/intl";
import { openDaily, type DailyStart } from "@/lib/lab/dailyBoard";
import { buildRoundRecord } from "@/lib/lab/record";
import { readReviewOpened } from "@/lib/lab/review";
import { openReview, type ReviewStart } from "@/lib/lab/reviewBoard";
import GamePage from "@/app/[locale]/game/page";

const mockStartGame = jest.fn();
const mockCountInGame = jest.fn();
const mockPrepareGame = jest.fn();
const mockResetGame = jest.fn();
const mockConfig = { pieceCount: 2, studyMs: 10000, source: "game_form" } as const;
const mockTarget = { e1: { color: "white", type: "king" }, e8: { color: "black", type: "king" } } as const;
const ROUNDS = {
  idle: { phase: "idle" },
  study: { phase: "study", config: mockConfig, target: mockTarget, startedAt: 0 },
  rebuild: { phase: "rebuild", config: mockConfig, target: mockTarget, placed: {}, selected: null, studyMs: 4000, log: { startedAt: 0, placements: [], removals: 0 } },
} as const;
let mockPhase: keyof typeof ROUNDS = "idle";

jest.mock("@/lib/store/gameStore", () => {
  const mockState = () => ({
    gameState: { pieceCount: 2, memorizeTime: 10 },
    round: ROUNDS[mockPhase],
    lastSettings: null,
    startGame: mockStartGame,
    countInGame: mockCountInGame,
    prepareGame: mockPrepareGame,
    endCountdown: jest.fn(),
    resetGame: mockResetGame,
    dispatch: jest.fn(),
    submitSolution: jest.fn(),
  });
  const useGameStore = (selector?: (state: ReturnType<typeof mockState>) => unknown) =>
    selector ? selector(mockState()) : mockState();
  useGameStore.getState = mockState;
  return { useGameStore };
});

jest.mock("@/lib/lab/dailyBoard", () => ({ ...jest.requireActual("@/lib/lab/dailyBoard"), openDaily: jest.fn() }));
jest.mock("@/lib/lab/reviewBoard", () => ({ ...jest.requireActual("@/lib/lab/reviewBoard"), openReview: jest.fn() }));

jest.mock("@/lib/utils/soundEffects", () => ({
  ...jest.requireActual("@/lib/utils/soundEffects"),
  playSound: jest.fn(),
  stopTimerSound: jest.fn(),
}));

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/game",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Link: ({ href, children, className, "aria-current": ariaCurrent }: { href: string; children: ReactNode; className?: string; "aria-current"?: "page" }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  mockStartGame.mockClear();
  mockCountInGame.mockClear();
  mockPrepareGame.mockClear();
  mockResetGame.mockClear();
  jest.mocked(openDaily).mockReset();
  jest.mocked(openReview).mockReset();
});

afterEach(() => {
  mockPhase = "idle";
  window.history.pushState({}, "", "/");
  jest.restoreAllMocks();
});

describe("GamePage URL-driven start", () => {
  it("holds the round a drill link names behind Start", async () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(12, 8, "link"));
  });

  it("starts a challenge link with the default memorize time", async () => {
    window.history.pushState({}, "", "/game?pieceCount=6&challenge=2026-09-16");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(6, 10, "link"));
  });

  it("clears the round params from the address after the URL start", async () => {
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(6, 10, "link"));
    expect(window.location.pathname + window.location.search).toBe("/game");
  });

  it("keeps other params when it clears the round params", () => {
    window.history.pushState({}, "", "/game?pieceCount=6&challenge=2026-09-16");

    render(<GamePage />);

    expect(window.location.search).toBe("?challenge=2026-09-16");
  });

  it("starts the round with the source its link names and clears that from the address", async () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=guide_cta");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(12, 8, "guide_cta"));
    expect(window.location.pathname + window.location.search).toBe("/game");
  });

  it("starts the round with the source a from= link names and clears from= from the address", async () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&from=guide_cta&challenge=x");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(12, 8, "guide_cta"));
    expect(window.location.search).toBe("?challenge=x");
  });

  it("prefers from= over a legacy source= when a link has both", async () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=plan&from=review");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(12, 8, "review"));
  });

  it("reads an unknown source as a plain link", async () => {
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=newsletter%3Cx%3E");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(12, 8, "link"));
  });

  it("starts a round at the longest study time a link can name", async () => {
    window.history.pushState({}, "", "/game?pieceCount=8&memorizeTime=60&source=plan");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(8, 60, "plan"));
  });

  it("opens the configuration form for a link past the longest study time", () => {
    window.history.pushState({}, "", "/game?pieceCount=8&memorizeTime=61&source=plan");

    render(<GamePage />);

    expect(mockPrepareGame).not.toHaveBeenCalled();
    expect(document.querySelector("[data-game-config]")).not.toBeNull();
    expect(window.location.search).toBe("");
  });

  it("waits on the configuration form without round params", () => {
    window.history.pushState({}, "", "/game?difficulty=hard");

    render(<GamePage />);

    expect(mockPrepareGame).not.toHaveBeenCalled();
  });

  it("leaves the address alone without round params", () => {
    window.history.pushState({}, "", "/game?difficulty=hard");

    render(<GamePage />);

    expect(window.location.search).toBe("?difficulty=hard");
  });
});

describe("GamePage daily board link", () => {
  const BOARD = { kind: "daily", day: "2026-10-09", fen: "8/8/8/1pQ4k/P2p4/8/8/1K6 b - - 0 1" } as const;
  const opens = (daily: DailyStart) => jest.mocked(openDaily).mockResolvedValue(daily);

  it("sets today's board out behind Start at the setting the board names, whatever the link says", async () => {
    opens({ kind: "play", pieceCount: 6, memorizeTime: 10, board: BOARD });
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=daily");

    render(<GamePage />);

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(6, 10, "daily", BOARD));
    expect(mockStartGame).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });

  it("shows neither the board nor the form on a day already tried here, only the refusal once the record answers", async () => {
    let answer: (daily: DailyStart) => void = () => {};
    jest.mocked(openDaily).mockReturnValue(new Promise((resolve) => (answer = resolve)));
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-09T12:00:00Z"));
    window.localStorage.setItem("memory-chess-lab-daily-opened", "2026-10-09");
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10&source=daily");

    render(<GamePage />);
    const whileReading = [screen.queryByRole("button", { name: "Start game" }), document.querySelector("[data-round-phase]"), document.querySelector("[data-game-config]")];
    await act(async () => answer({ kind: "played" }));

    expect(whileReading).toEqual([null, null, null]);
    expect(await screen.findByText("You have already opened today's board. One try a day keeps it fair.")).toBeInTheDocument();
    window.localStorage.removeItem("memory-chess-lab-daily-opened");
  });

  it("refuses a second attempt today with a message in the form's place, until the player chooses a round", async () => {
    opens({ kind: "played" });
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10&source=daily");

    render(<GamePage />);

    expect(await screen.findByText("You have already opened today's board. One try a day keeps it fair.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See today's board" })).toHaveAttribute("href", "/daily");
    expect(document.querySelector("[data-game-config]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play another round" }));
    expect(document.querySelector("[data-game-config]")).not.toBeNull();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  it("plays today's set board from a link in every language", async () => {
    opens({ kind: "play", pieceCount: 6, memorizeTime: 10, board: BOARD });
    window.history.pushState({}, "", "/de/game?pieceCount=6&memorizeTime=10&source=daily");

    render(<GamePage />, { locale: "de" });

    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalledWith(6, 10, "daily", BOARD));
    expect(mockPrepareGame).not.toHaveBeenCalledWith(6, 10, "link");
  });
});

describe("GamePage review link", () => {
  const BOARD = { kind: "review", fen: "4k3/8/8/3q4/8/5N2/8/4K3 w - - 0 1", reviewOf: "first-round", firstDay: "2026-10-06", step: 1 } as const;
  const opens = (review: ReviewStart) => jest.mocked(openReview).mockResolvedValue(review);

  it("replays the board due next at the setting it was first played at, whatever the link says", async () => {
    opens({ kind: "play", pieceCount: 4, memorizeTime: 10, board: BOARD });
    window.history.pushState({}, "", "/game?pieceCount=12&memorizeTime=8&source=review");

    render(<GamePage />);

    await waitFor(() => expect(mockStartGame).toHaveBeenCalledWith(4, 10, "review", BOARD));
    expect(window.location.search).toBe("");
  });

  it("says nothing is due in the form's place when the queue emptied since the link was drawn, until the player chooses a round", async () => {
    opens({ kind: "none" });
    window.history.pushState({}, "", "/game?pieceCount=4&memorizeTime=10&source=review");

    render(<GamePage />);

    expect(await screen.findByText("No board is due for review on this device right now.")).toBeInTheDocument();
    expect(document.querySelector("[data-game-config]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play another round" }));
    expect(document.querySelector("[data-game-config]")).not.toBeNull();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  it("leaves a round the player started by hand alone when the review board answers late", async () => {
    let answer: (review: ReviewStart) => void = () => {};
    jest.mocked(openReview).mockReturnValue(new Promise((resolve) => (answer = resolve)));
    window.history.pushState({}, "", "/game?pieceCount=4&memorizeTime=10&source=review");
    render(<GamePage />);

    fireEvent.click(await screen.findByRole("button", { name: "Start round" }));
    await act(async () => answer({ kind: "play", pieceCount: 4, memorizeTime: 10, board: BOARD }));

    expect(mockCountInGame.mock.calls.map(([, , source]) => source)).toEqual(["game_form"]);
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  it("says today's reviews are done in the form's place once the daily limit is reached", async () => {
    opens({ kind: "capped" });
    window.history.pushState({}, "", "/game?pieceCount=4&memorizeTime=10&source=review");

    render(<GamePage />);

    expect(await screen.findByText("Today's 5 reviews are done on this device.")).toBeInTheDocument();
    expect(mockStartGame).not.toHaveBeenCalled();
  });

  it("replays the board due next from a link in every language", async () => {
    opens({ kind: "play", pieceCount: 4, memorizeTime: 10, board: BOARD });
    window.history.pushState({}, "", "/de/game?pieceCount=4&memorizeTime=10&source=review");

    render(<GamePage />, { locale: "de" });

    await waitFor(() => expect(mockStartGame).toHaveBeenCalledWith(4, 10, "review", BOARD));
    expect(mockPrepareGame).not.toHaveBeenCalledWith(4, 10, "link");
  });
});

describe("GamePage URL-driven start under StrictMode", () => {
  it("sets the round out after the remount's reset and clears the address", async () => {
    window.history.pushState({}, "", "/game?pieceCount=6&memorizeTime=10");

    render(<GamePage />, { reactStrictMode: true });
    await waitFor(() => expect(mockPrepareGame).toHaveBeenCalled());

    const lastStart = Math.max(...mockPrepareGame.mock.invocationCallOrder);
    const lastReset = Math.max(0, ...mockResetGame.mock.invocationCallOrder);
    expect(mockPrepareGame).toHaveBeenLastCalledWith(6, 10, "link");
    expect(lastStart).toBeGreaterThan(lastReset);
    expect(window.location.pathname + window.location.search).toBe("/game");
  });

  it("sets today's board out once, leaving the day's try for Start", async () => {
    const actual = jest.requireActual<typeof import("@/lib/lab/dailyBoard")>("@/lib/lab/dailyBoard");
    jest.mocked(openDaily).mockImplementation(actual.openDaily);
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-09T12:00:00Z"));
    window.localStorage.removeItem("memory-chess-lab-daily-opened");
    window.history.pushState({}, "", "/game?pieceCount=9&memorizeTime=8&source=daily");

    render(<GamePage />, { reactStrictMode: true });

    await waitFor(() =>
      expect(mockPrepareGame).toHaveBeenCalledWith(9, 8, "daily", { kind: "daily", day: "2026-10-09", fen: "8/8/8/1pQB3k/P2p1p2/3P4/8/1K6 w - - 0 1" }),
    );
    expect(mockPrepareGame).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("You have already opened today's board. One try a day keeps it fair.")).toBeNull();
    expect(window.localStorage.getItem("memory-chess-lab-daily-opened")).toBeNull();
  });

  it("plays the due review on the first try and marks its step opened once", async () => {
    const { reviewStart } = jest.requireActual<typeof import("@/lib/lab/reviewBoard")>("@/lib/lab/reviewBoard");
    const missed = buildRoundRecord(
      {
        id: "first-round",
        source: "game",
        endedAt: new Date(2026, 9, 8, 12).getTime(),
        localDay: "2026-10-08",
        pieceCount: 4,
        memorizeSeconds: 10,
        targetFen: "4k3/8/8/3q4/8/5N2/8/4K3",
        placedFen: "4k3/8/8/8/8/8/8/4K3",
        memorizeMs: 10000,
        solveMs: 9000,
      },
      { startSource: "home_quick" },
    );
    jest.mocked(openReview).mockImplementation(async (at) => reviewStart([missed], at, readReviewOpened()));
    jest.spyOn(Date, "now").mockReturnValue(new Date(2026, 9, 9, 12).getTime());
    window.localStorage.removeItem("memory-chess-lab-review-opened");
    window.history.pushState({}, "", "/game?pieceCount=4&memorizeTime=10&source=review");

    render(<GamePage />, { reactStrictMode: true });

    await waitFor(() =>
      expect(mockStartGame).toHaveBeenCalledWith(4, 10, "review", {
        kind: "review",
        fen: "4k3/8/8/3q4/8/5N2/8/4K3 w - - 0 1",
        reviewOf: "first-round",
        firstDay: "2026-10-08",
        step: 0,
      }),
    );
    expect(mockStartGame).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("No board is due for review on this device right now.")).toBeNull();
    expect(window.localStorage.getItem("memory-chess-lab-review-opened")).toBe('[{"reviewOf":"first-round","step":0,"day":"2026-10-09"}]');
  });
});

describe("GamePage header", () => {
  it.each(["idle", "study", "rebuild"] as const)(
    "draws the Lab Paper header, with Play in the nav marked current and no Play button, in the %s phase",
    (phase) => {
      mockPhase = phase;

      const { container } = render(<GamePage />);

      expect(container.querySelector(".lab-paper .lab-header")).not.toBeNull();
      expect(container.querySelector(".lab-header-tools .lab-btn-primary")).toBeNull();
      expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("aria-current", "page");
    },
  );
});

describe("GamePage pinning", () => {
  it("unpins the page when the round leaves the board", () => {
    mockPhase = "rebuild";
    const { rerender } = render(<GamePage />);

    mockPhase = "idle";
    rerender(<GamePage />);

    expect([document.documentElement.className, document.body.className]).toEqual(["", ""]);
  });
});
