import { act, fireEvent, render, screen, waitFor, within } from "@/test-utils/intl";
import GameResult from "@/components/game/GameResult";
import TileArticlesProvider from "@/components/game/TileArticlesProvider";
import { makeArticle } from "@/lib/articles/__tests__/fixtures";
import { tileArticleOf } from "@/lib/articles/tile";
import { loadLeaderboardCutoffs, readCachedCutoffs } from "@/lib/leaderboard/cutoffsClient";
import type { BoardCutoff, LeaderboardCutoffs } from "@/lib/leaderboard/ranking";
import { scoredRound } from "@/test-utils/round";
import type { SetBoard } from "@/lib/types/game";
import type { RatingResult } from "@/lib/game/rating";
import type { RoundOutcome } from "@/lib/game/roundOutcome";

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

const mockRound = scoredRound("4k3/8/8/8/3q4/8/PP6/4K3", "4k3/8/8/8/8/8/PP6/4K3");

let mockGameState: typeof baseGameState & { board?: SetBoard; rating?: RoundOutcome } = baseGameState;

jest.mock("@/lib/store/gameStore", () => ({
  useGameStore: () => ({ gameState: mockGameState, round: mockRound }),
}));

jest.mock("@/lib/leaderboard/cutoffsClient", () => ({
  loadLeaderboardCutoffs: jest.fn(),
  readCachedCutoffs: jest.fn(),
}));

const loadCutoffsMock = loadLeaderboardCutoffs as jest.Mock;
const readCachedCutoffsMock = readCachedCutoffs as jest.Mock;

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

describe("GameResult", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { value: 1 } }),
    });
    loadCutoffsMock.mockReset();
    loadCutoffsMock.mockResolvedValue(null);
    readCachedCutoffsMock.mockReset();
    readCachedCutoffsMock.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockGameState = baseGameState;
  });

  it("renders the compact summary, both board positions, and working replay actions", () => {
    const onTryAgain = jest.fn();
    const onNewGame = jest.fn();

    render(<GameResult onTryAgain={onTryAgain} onNewGame={onNewGame} onPlay={jest.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Great job!" }),
    ).toBeInTheDocument();
    expect(screen.getByText("4 / 6")).toBeInTheDocument();
    expect(screen.getByText("Placing rate")).toBeInTheDocument();
    expect(document.querySelector(".lab-rc-big")).toHaveTextContent("80%");

    const summary = screen.getByRole("region", { name: "Great job!" });
    const actions = within(summary).getByRole("navigation", {
      name: "Result actions",
    });
    expect(
      within(actions).getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("button", { name: "New game" }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("button", { name: "Submit to leaderboard" }),
    ).toBeInTheDocument();
    expect(
      within(actions).getByRole("link", { name: "View leaderboard" }),
    ).toBeInTheDocument();

    const board = document.querySelector<HTMLElement>('[data-result-board="scored"]')!;
    expect(
      ["a2", "e1", "d4", "h8"].map((square) => board.querySelector(`[data-coordinate="${square}"]`)?.getAttribute("data-mark") ?? null),
    ).toEqual(["ok", "ok", "miss", null]);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    fireEvent.click(screen.getByRole("button", { name: "New game" }));
    expect(onTryAgain).toHaveBeenCalledTimes(1);
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it("says the rating is provisional while it is, and nothing once it is rated", () => {
    const player = { rating: 1080, rd: 200, rounds: 3 };
    const provisional: RatingResult = { phase: "provisional", rating: 1080, change: 40, player, breakdown: { challenge: 1000, expected: 0.82, score: 1 } };
    const rated: RatingResult = { ...provisional, phase: "rated", player: { ...player, rd: 80 } };

    mockGameState = { ...baseGameState, rating: provisional };
    const { unmount } = render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
    const shown = document.querySelector("[data-rating-phase]")?.textContent;
    unmount();
    mockGameState = { ...baseGameState, rating: rated };
    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    expect([shown, document.querySelector("[data-rating-phase]")]).toEqual(["Provisional rating", null]);
  });

  it("says the day's free skip in place of a rating change", () => {
    mockGameState = { ...baseGameState, accuracy: 0, correctPlacements: 0, totalPiecesPlaced: 0, rating: { phase: "freeSkip", rating: 1200, change: 0 } };
    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    expect(document.querySelector("[data-rating-phase]")?.textContent).toBe(
      "Free skip of the day: an empty board doesn't change your rating. The next one today will.",
    );
  });

  it("preserves leaderboard submission access for standard difficulties", () => {
    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    expect(
      screen.getByRole("link", { name: "View leaderboard" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Submit to leaderboard" }),
    );

    expect(
      screen.getByRole("heading", { name: "Submit to leaderboard" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Player name")).toBeInTheDocument();
  });

  describe("the article tile", () => {
    const TILE_ARTICLES = [0, 1, 2].map((index) => tileArticleOf(makeArticle(index)));
    const shownSlug = () =>
      document.querySelector("section[data-article-tile]")?.getAttribute("data-article-tile");

    function renderWithArticles() {
      return render(
        <TileArticlesProvider articles={TILE_ARTICLES}>
          <GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />
        </TileArticlesProvider>,
      );
    }

    it("comes after the board review and after all four actions, outside the result card", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      renderWithArticles();
      const tile = screen.getByRole("region", { name: "Read next" });
      const comesBeforeTile = (element: HTMLElement) =>
        Boolean(element.compareDocumentPosition(tile) & Node.DOCUMENT_POSITION_FOLLOWING);

      expect(comesBeforeTile(document.querySelector<HTMLElement>('[data-result-board="scored"]')!)).toBe(true);
      expect(
        ["Try again", "New game", "Submit to leaderboard", "View leaderboard"].map((name) =>
          comesBeforeTile(screen.getByRole(name === "View leaderboard" ? "link" : "button", { name })),
        ),
      ).toEqual([true, true, true, true]);
      expect(screen.getByRole("region", { name: "Great job!" })).not.toContainElement(tile);
    });

    it("sets the round that was just played beside the article's drill", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      renderWithArticles();
      const tile = screen.getByRole("region", { name: "Read next" });

      expect(within(tile).getByText("Your round").closest("div")).toHaveTextContent("6 pieces, 10 seconds");
    });

    it("keeps its article when the leaderboard form opens", () => {
      const random = jest.spyOn(Math, "random").mockReturnValue(0);
      renderWithArticles();
      expect(shownSlug()).toBe("alder-fixture");

      random.mockReturnValue(0.99);
      fireEvent.click(screen.getByRole("button", { name: "Submit to leaderboard" }));

      expect(screen.getByLabelText("Player name")).toBeInTheDocument();
      expect(shownSlug()).toBe("alder-fixture");
    });

    it("is absent when the page was given no articles", () => {
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

      expect(document.querySelector('[data-result-board="scored"]')).not.toBeNull();
      expect(shownSlug()).toBeUndefined();
    });
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

    render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Submit to leaderboard" }),
    );
    fireEvent.change(screen.getByLabelText("Player name"), {
      target: { value: "Poteto" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

    expect(
      await screen.findByText(`Error: ${serverMessage}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Error: Failed to submit score"),
    ).not.toBeInTheDocument();
    logged.mockRestore();
  });

  describe("score_submit event", () => {
    function submitScore() {
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
      fireEvent.click(
        screen.getByRole("button", { name: "Submit to leaderboard" }),
      );
      fireEvent.change(screen.getByLabelText("Player name"), {
        target: { value: "Poteto" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit score" }));
    }

    beforeEach(() => {
      window.gtag = jest.fn();
    });

    afterEach(() => {
      // @ts-expect-error gtag is optional at runtime, as it is on non-production builds
      delete window.gtag;
    });

    it("fires once when the server accepts the score", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });

      submitScore();

      await waitFor(() => {
        expect(window.gtag).toHaveBeenCalledWith("event", "score_submit", {
          difficulty: "medium",
          piece_count: 6,
        });
      });
      expect(window.gtag).toHaveBeenCalledTimes(1);
    });

    it("sends the rating after this round's change, the one the result screen shows", async () => {
      mockGameState = { ...baseGameState, skillRating: 1187, skillRatingChange: 12 } as typeof mockGameState;
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
      global.fetch = fetchMock;

      submitScore();

      await waitFor(() => expect(screen.getByRole("heading", { name: "Score submitted!" })).toBeInTheDocument());
      const [, init] = fetchMock.mock.calls.find(([url]) => String(url).includes("/api/leaderboard"));
      expect(JSON.parse(init.body)).toMatchObject({ difficulty: "medium", skill_rating: 1187 });
    });

    it("sends a rating of 0 as 0, not as the starting rating", async () => {
      mockGameState = { ...baseGameState, skillRating: 0, skillRatingChange: 0 } as typeof mockGameState;
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
      global.fetch = fetchMock;

      submitScore();

      await waitFor(() => expect(screen.getByRole("heading", { name: "Score submitted!" })).toBeInTheDocument());
      const [, init] = fetchMock.mock.calls.find(([url]) => String(url).includes("/api/leaderboard"));
      expect(JSON.parse(init.body)).toMatchObject({ skill_rating: 0 });
    });

    it("keeps the entry the board stored on this device, so the lab record can ask for its standing", async () => {
      window.localStorage.clear();
      jest.spyOn(Date, "now").mockReturnValue(1_000);
      const row = {
        id: "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f",
        player_name: "Poteto",
        difficulty: "medium",
        piece_count: 6,
        correct_pieces: 4,
        total_wrong_pieces: 2,
        memorize_time: 8.25,
        solution_time: 12.5,
        country_code: "ZZ",
        created_at: "2026-10-09T01:00:00Z",
      };
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, data: row }) });

      submitScore();

      await waitFor(() => expect(window.localStorage.getItem("memory-chess-lab-entries")).not.toBeNull());
      expect(JSON.parse(window.localStorage.getItem("memory-chess-lab-entries") ?? "null")).toEqual({
        medium: {
          id: "0b5e8f7c-3c1a-4e2b-9d4f-1a2b3c4d5e6f",
          difficulty: "medium",
          country: "ZZ",
          score: { correctPieces: 4, totalWrongPieces: 2, memorizeTime: 8.25, solutionTime: 12.5 },
          submittedAt: 1_000,
        },
      });
    });

    it("links the leaderboard to the name the board stored, without the spaces typed around it", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Submit to leaderboard" }));
      fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "  Poteto  " } });
      fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

      const dialog = await screen.findByRole("dialog");
      await waitFor(() => expect(within(dialog).getByRole("heading", { name: "Score submitted!" })).toBeInTheDocument());

      expect(within(dialog).getByRole("link", { name: "View leaderboard" }).getAttribute("href")).toMatch(/[?&]player=Poteto&/);
    });

    it("still says the score was submitted when the reply carries no entry it can keep", async () => {
      window.localStorage.clear();
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });

      submitScore();

      expect(await screen.findByRole("heading", { name: "Score submitted!" })).toBeInTheDocument();
      expect(screen.queryByText(/^Error:/)).toBeNull();
      expect(window.localStorage.getItem("memory-chess-lab-entries")).toBeNull();
    });

    it("stays silent when the server rejects the score", async () => {
      const logged = jest.spyOn(console, "error").mockImplementation(() => {});
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "boom" }),
      });

      submitScore();

      expect(await screen.findByText("Error: boom")).toBeInTheDocument();
      expect(window.gtag).not.toHaveBeenCalledWith(
        "event",
        "score_submit",
        expect.anything(),
      );
      logged.mockRestore();
    });
  });

  it("offers no submission for a round with no correct piece, which the board would never show", () => {
    mockGameState = { ...baseGameState, accuracy: 0, correctPlacements: 0 };

    try {
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

      expect(
        screen.queryByRole("button", { name: "Submit to leaderboard" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "View leaderboard" }),
      ).toBeInTheDocument();
    } finally {
      mockGameState = baseGameState;
    }
  });

  it.each([
    ["the daily board, whose position every player shares", { kind: "daily", day: "2026-10-09", fen: baseGameState.originalPosition }],
    ["a review, whose position the player has seen before", { kind: "review", fen: baseGameState.originalPosition, reviewOf: "first-round", firstDay: "2026-10-06", step: 1 }],
  ] as const)("offers no submission for %s", (_, board: SetBoard) => {
    mockGameState = { ...baseGameState, board };

    try {
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

      expect(screen.queryByRole("button", { name: "Submit to leaderboard" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    } finally {
      mockGameState = baseGameState;
    }
  });

  it("sends a daily round to join its own day's board on /daily where the round is recorded, and a review or an unrecorded round nowhere", () => {
    const joinLinks = (board: SetBoard, recorded = true) => {
      mockGameState = { ...baseGameState, board };
      if (recorded) Object.defineProperty(window, "indexedDB", { value: {}, configurable: true });
      else Reflect.deleteProperty(window, "indexedDB");
      const { unmount } = render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
      const hrefs = screen.queryAllByRole("link", { name: "Join today's board" }).map((link) => link.getAttribute("href"));
      unmount();
      Reflect.deleteProperty(window, "indexedDB");
      return hrefs;
    };

    try {
      expect(joinLinks({ kind: "daily", day: "2026-10-13", fen: baseGameState.originalPosition })).toEqual(["/daily"]);
      expect(joinLinks({ kind: "daily", day: "2026-10-13", fen: baseGameState.originalPosition }, false)).toEqual([]);
      expect(joinLinks({ kind: "review", fen: baseGameState.originalPosition, reviewOf: "first-round", firstDay: "2026-10-06", step: 1 })).toEqual([]);
    } finally {
      mockGameState = baseGameState;
    }
  });

  describe("leaderboard qualifier", () => {
    afterEach(() => {
      mockGameState = baseGameState;
    });

    async function renderSettled() {
      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);
      await act(async () => {});
    }

    it("tells a qualifying player their score makes the board", async () => {
      mockGameState = perfectEasyGame;
      loadCutoffsMock.mockResolvedValue(CUTOFFS);

      await renderSettled();

      expect(screen.getByRole("status")).toHaveTextContent(QUALIFIES_SENTENCE);
    });

    it("shows the nudge on the first render when the round left the cutoffs cached, so nothing under it moves", () => {
      mockGameState = perfectEasyGame;
      readCachedCutoffsMock.mockReturnValue(CUTOFFS);
      loadCutoffsMock.mockReturnValue(new Promise(() => {}));

      render(<GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />);

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
        screen.getByRole("button", { name: "Submit to leaderboard" }),
      );
      fireEvent.change(screen.getByLabelText("Player name"), {
        target: { value: "Poteto" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit score" }));

      await waitFor(() => {
        expect(screen.queryByText(QUALIFIES_SENTENCE)).not.toBeInTheDocument();
      });
    });
  });
});
