import { useGameStore } from "@/lib/store/gameStore";
import { validateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import { labPositionToFen, type LabPiece, type LabPosition } from "@/lib/round/round";
import type { SquareName } from "@/lib/game/board";
import type { PieceColor, PieceType } from "@/types/chess";
import type { GameHistory, GameState } from "@/lib/types/game";
import { localDayOf } from "@/lib/lab/record";

const store = () => useGameStore.getState();
const boardPlacement = (fen: string) => fen.split(" ")[0];

function place(square: SquareName, type: PieceType, color: PieceColor, now = performance.now()) {
  const { round } = store();
  const selected = round.phase === "rebuild" ? round.selected : null;
  if (selected?.color !== color || selected.type !== type) store().dispatch({ type: "select", piece: { color, type } });
  store().dispatch({ type: "tapSquare", square, now });
}

function placed(): LabPosition {
  const { round } = store();
  if (round.phase !== "rebuild") throw new Error(`no board to place on in the ${round.phase} phase`);
  return round.placed;
}

const target = (): LabPosition => {
  const { round } = store();
  return "target" in round ? round.target : {};
};

describe("starting a round", () => {
  afterEach(() => store().resetGame());

  it("studies a validated position with the requested piece count, at the round's own settings", () => {
    store().startGame(12, 8, "game_form");

    const { gameState, round } = store();
    expect(round.phase).toBe("study");
    expect(round.phase === "study" && round.config).toEqual({ pieceCount: 12, studyMs: 8000, source: "game_form", board: undefined });
    expect(Object.keys(target())).toHaveLength(12);
    expect(boardPlacement(gameState.originalPosition!)).toBe(labPositionToFen(target()));
    expect(validateMemorizationPosition(gameState.originalPosition!, 12)).toMatchObject({ valid: true, violations: [] });
  });
});

describe("reporting a round", () => {
  afterEach(() => {
    store().resetGame();
    Reflect.deleteProperty(window, "gtag");
  });

  it("sends GA4 round_start with the round's size and source, and no position", () => {
    const gtag = jest.fn();
    window.gtag = gtag;

    store().startGame(6, 10, "home_quick");

    expect(gtag.mock.calls).toEqual([["event", "round_start", { piece_count: 6, memorize_time: 10, source: "home_quick" }]]);
  });

  it("sends round_complete once when the round is scored, with what the player got right", () => {
    const gtag = jest.fn();
    store().startGame(6, 10, "plan");
    const [square, piece] = Object.entries(target())[0] as [SquareName, LabPiece];
    store().dispatch({ type: "studyEnded", now: performance.now() });
    place(square, piece.type, piece.color);
    window.gtag = gtag;

    store().submitSolution();
    store().submitSolution();

    const completes = gtag.mock.calls.filter(([, name]) => name === "round_complete");
    expect(completes).toEqual([
      ["event", "round_complete", { piece_count: 6, memorize_time: 10, correct_pieces: 1, accuracy: 17, source: "plan" }],
    ]);
  });
});

describe("the player's rebuild", () => {
  beforeEach(() => {
    store().startGame(6, 10, "game_form");
    store().dispatch({ type: "studyEnded", now: performance.now() });
  });

  afterEach(() => store().resetGame());

  it("records a knight as a knight rather than a king", () => {
    place("c3", "knight", "white");
    place("f6", "knight", "black");
    store().submitSolution();

    expect(boardPlacement(store().gameState.userPosition!)).toBe("8/8/5n2/8/8/2N5/8/8");
  });

  it("records every piece type on the square it was placed on", () => {
    place("a1", "rook", "white");
    place("b2", "knight", "white");
    place("c3", "bishop", "white");
    place("d4", "queen", "white");
    place("e5", "king", "white");
    place("f6", "pawn", "white");
    store().submitSolution();

    expect(boardPlacement(store().gameState.userPosition!)).toBe("8/8/5P2/4K3/3Q4/2B5/1N6/R7");
  });

  it("refuses a second king of one colour", () => {
    place("e1", "king", "white");
    place("a5", "king", "white");

    expect(placed()).toEqual({ e1: { color: "white", type: "king" } });
  });

  it("clears the board", () => {
    place("e1", "king", "white");
    place("e8", "king", "black");
    store().dispatch({ type: "clear" });

    expect(placed()).toEqual({});
  });
});

describe("ending study early", () => {
  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
  });

  it("keeps the time the player actually looked, and never more than the round gave", () => {
    let clock = 0;
    jest.spyOn(performance, "now").mockImplementation(() => clock);
    store().startGame(6, 10, "game_form");
    store().dispatch({ type: "studyEnded", now: 3250 });
    store().submitSolution(5250);
    const early = store().gameState;
    store().startGame(6, 10, "try_again");
    clock = 100;
    store().dispatch({ type: "studyEnded", now: 60000 });
    store().submitSolution(64000);
    const late = store().gameState;

    expect([early.actualMemorizeTime, early.completionTime]).toEqual([3.25, 2]);
    expect([late.actualMemorizeTime, late.completionTime]).toEqual([10, 4]);
  });
});

describe("scoring and the skill rating", () => {
  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
  });

  it("scores a new player's perfect rebuild as a provisional round, raises the rating and the streak, and leaves the round on its score", () => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    useGameStore.setState(({ gameState }) => ({ history: [], certainty: { rd: 350, rounds: 0 }, gameState: { ...gameState, skillRating: 1000, streak: 0 } }));
    store().startGame(6, 10, "game_form");
    store().dispatch({ type: "studyEnded", now: 10000 });
    for (const [square, piece] of Object.entries(target()) as [SquareName, LabPiece][]) place(square, piece.type, piece.color, 11000);
    store().submitSolution(14000);

    const { gameState, round } = store();
    expect(round.phase).toBe("scored");
    expect(gameState).toMatchObject({
      accuracy: 100,
      perfectScore: true,
      success: true,
      correctPlacements: 6,
      extraPieces: 0,
      totalPiecesPlaced: 6,
      skillRatingChange: 225,
      skillRating: 1225,
      streak: 1,
      rating: { phase: "provisional" },
    });
  });

  it("restarts a placement with a new position at the same settings, rating untouched", () => {
    useGameStore.setState(({ gameState }) => ({ gameState: { ...gameState, skillRating: 1234, streak: 3 } }));
    store().startGame(6, 10, "game_form");
    store().dispatch({ type: "studyEnded", now: performance.now() });
    store().startGame(6, 10, "try_again");

    const { gameState, round } = store();
    expect(round.phase).toBe("study");
    expect([gameState.skillRating, gameState.streak, gameState.startSource]).toEqual([1234, 3, "try_again"]);
  });
});

describe("remembering the last settings played", () => {
  const STORAGE_KEY = "memory-chess-storage";

  const rehydrateFrom = async (lastSettings: unknown) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { lastSettings }, version: 0 }),
    );
    await useGameStore.persist.rehydrate();
    return useGameStore.getState().lastSettings;
  };

  afterEach(() => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ lastSettings: null });
    localStorage.clear();
  });

  it("records the settings a round was started with", () => {
    useGameStore.getState().startGame(12, 8, "game_form");

    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 12, memorizeTime: 8 });
  });

  it("keeps the last settings through a new-game reset", () => {
    useGameStore.getState().startGame(12, 8, "game_form");
    useGameStore.getState().resetGame();

    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 12, memorizeTime: 8 });
  });

  it("keeps custom settings of 3 pieces at 18 seconds through a new-game reset", () => {
    useGameStore.getState().startGame(3, 18, "game_form");
    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 3, memorizeTime: 18 });

    useGameStore.getState().resetGame();

    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 3, memorizeTime: 18 });
  });

  it("persists the last settings", () => {
    useGameStore.getState().startGame(7, 9, "game_form");

    const { partialize } = useGameStore.persist.getOptions();
    expect(partialize!(useGameStore.getState())).toMatchObject({
      lastSettings: { pieceCount: 7, memorizeTime: 9 },
    });
  });

  it("restores valid stored settings", async () => {
    await expect(rehydrateFrom({ pieceCount: 12, memorizeTime: 8 })).resolves.toEqual({
      pieceCount: 12,
      memorizeTime: 8,
    });
  });

  it.each([
    [2, 2],
    [32, 60],
    [2, 60],
    [32, 2],
  ])("restores stored settings at the range ends (%i pieces, %is)", async (pieceCount, memorizeTime) => {
    await expect(rehydrateFrom({ pieceCount, memorizeTime })).resolves.toEqual({
      pieceCount,
      memorizeTime,
    });
  });

  it.each([
    ["1 piece", { pieceCount: 1, memorizeTime: 10 }],
    ["33 pieces", { pieceCount: 33, memorizeTime: 10 }],
    ["0 seconds", { pieceCount: 6, memorizeTime: 0 }],
    ["61 seconds", { pieceCount: 6, memorizeTime: 61 }],
    ["an out-of-range piece count", { pieceCount: 999, memorizeTime: 8 }],
    ["a missing memorize time", { pieceCount: 12 }],
    ["a fractional value", { pieceCount: 12.5, memorizeTime: 8 }],
    ["a numeric string", { pieceCount: "12", memorizeTime: 8 }],
    ["a string", "abc"],
    ["null", null],
  ])("drops %s", async (_label, stored) => {
    useGameStore.setState({ lastSettings: { pieceCount: 6, memorizeTime: 10 } });

    await expect(rehydrateFrom(stored)).resolves.toBeNull();
  });
});

const STORAGE_KEY = "memory-chess-storage";
const storedState = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!).state;

/** Plays a round from a clock at 0: studies for `studyMs`, rebuilds `correct` of the pieces and submits `solveMs` later. */
function playRound({ pieceCount, solveMs, correct = pieceCount, studyMs = 10000 }: { pieceCount: number; solveMs: number; correct?: number; studyMs?: number }) {
  store().startGame(pieceCount, 10, "game_form");
  store().dispatch({ type: "studyEnded", now: studyMs });
  for (const [square, piece] of (Object.entries(target()) as [SquareName, LabPiece][]).slice(0, correct)) {
    place(square, piece.type, piece.color, studyMs);
  }
  store().submitSolution(studyMs + solveMs);
  return store().gameState as GameState & { skillRatingChange?: number };
}

/** 09:00 local time on 2026-10-14. */
const TODAY = new Date(2026, 9, 14, 9).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

const NEW_CERTAINTY = { rd: 350, rounds: 0 };
/** The uncertainty of a player the game is sure of. */
const SETTLED = { rd: 47, rounds: 100 };

const freshPlayer = () =>
  useGameStore.setState({
    freeSkipDay: null,
    certainty: NEW_CERTAINTY,
    history: [],
    gameState: { pieceCount: 8, memorizeTime: 10, currentLevel: 1, level: 1, skillRating: 1000, streak: 0 },
  });

describe("saving finished rounds to the history", () => {
  beforeEach(() => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    localStorage.clear();
    freshPlayer();
  });

  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
    freshPlayer();
    localStorage.clear();
  });

  it("saves each scored round once, newest first, with what was played", () => {
    playRound({ pieceCount: 2, solveMs: 4000 });
    store().submitSolution(20000);
    playRound({ pieceCount: 6, correct: 3, solveMs: 15000 });

    expect(store().history).toEqual([
      {
        id: expect.any(String),
        timestamp: expect.any(Number),
        pieceCount: 6,
        memorizeTime: 10,
        actualMemorizeTime: 10,
        completionTime: 15,
        duration: 15,
        accuracy: 50,
        correctPlacements: 3,
        totalPlacements: 6,
        perfectScore: false,
        level: 1,
        skillRatingChange: -120,
        streak: 0,
        facts: { pieceCount: 6, studySeconds: 10, rebuildSeconds: 15, accuracy: 50 },
      },
      {
        id: expect.any(String),
        timestamp: expect.any(Number),
        pieceCount: 2,
        memorizeTime: 10,
        actualMemorizeTime: 10,
        completionTime: 4,
        duration: 4,
        accuracy: 100,
        correctPlacements: 2,
        totalPlacements: 2,
        perfectScore: true,
        level: 1,
        skillRatingChange: 0,
        streak: 1,
        facts: { pieceCount: 2, studySeconds: 10, rebuildSeconds: 4, accuracy: 100 },
      },
    ]);
  });

  it("writes the history to storage", () => {
    playRound({ pieceCount: 2, solveMs: 4000 });

    const stored: { accuracy: number; skillRatingChange: number }[] = storedState().history;
    expect(stored.map(({ accuracy, skillRatingChange }) => [accuracy, skillRatingChange])).toEqual([[100, 0]]);
  });

  it("keeps the 30 newest rounds", () => {
    useGameStore.setState({
      history: Array.from({ length: 30 }, (_, i) => ({
        id: `old-${i}`,
        timestamp: i,
        pieceCount: 6,
        memorizeTime: 10,
        accuracy: 50,
        correctPlacements: 3,
        totalPlacements: 6,
        level: 1,
        duration: 20,
      })),
    });

    playRound({ pieceCount: 2, solveMs: 4000 });

    const { history } = store();
    expect([history.length, history[0].accuracy, history[1].id, history[29].id]).toEqual([30, 100, "old-0", "old-28"]);
  });
});

describe("provisional and rated rounds", () => {
  const heldRound = (i: number, facts?: GameHistory["facts"]): GameHistory => ({
    id: `held-${i}`,
    timestamp: i,
    pieceCount: 6,
    memorizeTime: 10,
    accuracy: 83,
    correctPlacements: 5,
    totalPlacements: 6,
    level: 1,
    duration: 15,
    skillRatingChange: 30,
    ...(facts ? { facts } : {}),
  });

  beforeEach(() => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    freshPlayer();
  });

  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
    freshPlayer();
  });

  it("rates an established player's round against its board, at most 50 either way", () => {
    const facts = { pieceCount: 6, studySeconds: 10, rebuildSeconds: 15, accuracy: 83 };
    useGameStore.setState(({ gameState }) => ({
      history: Array.from({ length: 10 }, (_, i) => heldRound(i, facts)),
      certainty: SETTLED,
      gameState: { ...gameState, skillRating: 1200 },
    }));

    const won = playRound({ pieceCount: 6, solveMs: 4000 });
    const missed = playRound({ pieceCount: 6, correct: 1, solveMs: 4000 });

    expect([won.rating?.phase, won.skillRatingChange, won.skillRating, missed.skillRatingChange]).toEqual(["rated", 5, 1205, -14]);
  });

  it("keeps the rating's uncertainty, narrowing it with each rated round, in the store and in storage", () => {
    useGameStore.setState({ history: Array.from({ length: 10 }, (_, i) => heldRound(i)) });

    const first = playRound({ pieceCount: 6, solveMs: 4000 });

    expect([first.rating?.phase, first.skillRating, store().certainty, storedState().certainty]).toEqual([
      "provisional",
      1225,
      { rd: expect.closeTo(249, 0), rounds: 1 },
      store().certainty,
    ]);
  });
});

describe("keeping the win streak across visits", () => {
  const rehydrateFrom = async (gameState: object, version = 3, history: object[] = []) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { gameState, history }, version }));
    await useGameStore.persist.rehydrate();
    return store().gameState;
  };

  beforeEach(() => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    localStorage.clear();
    freshPlayer();
  });

  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
    freshPlayer();
    localStorage.clear();
  });

  it("stores the win streak with the rating", () => {
    playRound({ pieceCount: 2, solveMs: 4000 });

    expect(storedState().gameState).toEqual({ pieceCount: 2, memorizeTime: 10, level: 1, skillRating: 1000, streak: 1 });
  });

  it("starts a rating stored before the placement and Elo rating again at 1000, keeping the streak and the rows", async () => {
    const row = { id: "old", timestamp: 1, pieceCount: 6, memorizeTime: 10, accuracy: 100, correctPlacements: 6, totalPlacements: 6, level: 1, duration: 9, skillRatingChange: 114 };
    const restored = await rehydrateFrom({ pieceCount: 6, memorizeTime: 10, level: 1, skillRating: 5000, streak: 4 }, 0, [row]);

    expect([restored.skillRating, restored.streak, store().history]).toEqual([1000, 4, [row]]);
  });

  it("restores the stored win streak and counts on from it", async () => {
    await rehydrateFrom({ pieceCount: 2, memorizeTime: 10, level: 1, skillRating: 1114, streak: 3 });
    const restored = store().getCurrentStreak();

    playRound({ pieceCount: 2, solveMs: 4000 });

    expect([restored, store().gameState.streak]).toEqual([3, 4]);
  });

  it.each([
    ["a NaN saved as null", null],
    ["a string", "1300"],
    ["a negative rating", -5],
    ["a fraction", 1300.5],
  ])("loads the starting rating in place of %s", async (_case, skillRating) => {
    const restored = await rehydrateFrom({ pieceCount: 6, memorizeTime: 10, level: 1, skillRating, streak: 2 });

    expect([restored.skillRating, restored.streak]).toEqual([1000, 2]);
  });

  it("keeps a stored rating of 0 and lowers one above the 5000 ceiling to 5000", async () => {
    const zero = (await rehydrateFrom({ pieceCount: 6, memorizeTime: 10, level: 1, skillRating: 0 })).skillRating;
    const high = (await rehydrateFrom({ pieceCount: 6, memorizeTime: 10, level: 1, skillRating: 52000 })).skillRating;

    expect([zero, high]).toEqual([0, 5000]);
  });

  it("loads state stored before the streak was kept with a streak of 0 and its rating intact", async () => {
    await expect(rehydrateFrom({ pieceCount: 6, memorizeTime: 10, level: 1, skillRating: 1300 })).resolves.toEqual({
      pieceCount: 6,
      memorizeTime: 10,
      currentLevel: 1,
      level: 1,
      skillRating: 1300,
      streak: 0,
    });
  });
});

describe("how a provisional round moves the skill rating", () => {
  beforeEach(() => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    freshPlayer();
  });

  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
    freshPlayer();
  });

  it("lowers the rating for an empty submit however fast it comes, once the day's free skip is spent", () => {
    jest.spyOn(Date, "now").mockReturnValue(TODAY);
    useGameStore.setState({ freeSkipDay: localDayOf(new Date(TODAY)) });
    const first = playRound({ pieceCount: 6, correct: 0, solveMs: 0 });
    const firstRating = first.skillRating;
    const second = playRound({ pieceCount: 6, correct: 0, solveMs: 1 });

    expect([first.accuracy, first.skillRatingChange, firstRating, second.skillRatingChange, second.skillRating]).toEqual([0, -400, 600, -161, 439]);
  });

  it("gives an instant perfect round no more rebuild credit than one at three quarters of a second a piece", () => {
    const instant = playRound({ pieceCount: 6, solveMs: 100 }).skillRatingChange;
    freshPlayer();
    const quick = playRound({ pieceCount: 6, solveMs: 4500 }).skillRatingChange;

    expect([instant, quick]).toEqual([225, 225]);
  });

  it("lowers the rating for a half-recalled board", () => {
    const half = playRound({ pieceCount: 6, correct: 3, solveMs: 5000 });

    expect([half.accuracy, half.skillRatingChange]).toEqual([50, -113]);
  });

  it("gains nothing from a board 500 or more below the rating", () => {
    useGameStore.setState(({ gameState }) => ({ gameState: { ...gameState, skillRating: 4990 } }));
    const top = playRound({ pieceCount: 20, solveMs: 4000 });

    expect([top.skillRating, top.skillRatingChange]).toEqual([4990, 0]);
  });

  it("plays on from a rating of 0 rather than the starting rating, through a reset", () => {
    useGameStore.setState(({ gameState }) => ({ gameState: { ...gameState, skillRating: 0 } }));
    store().resetGame();
    const held = store().getSkillRating();
    const won = playRound({ pieceCount: 6, solveMs: 4000 });

    expect([held, won.standingBefore?.skillRating, won.skillRating]).toEqual([0, 0, 400]);
  });

  it("gives a slow perfect round less than a quick one", () => {
    const slow = playRound({ pieceCount: 6, solveMs: 60000 }).skillRatingChange;
    freshPlayer();
    const quick = playRound({ pieceCount: 6, solveMs: 4000 }).skillRatingChange;

    expect([slow, quick]).toEqual([192, 225]);
  });
});

describe("the standing a round started from", () => {
  beforeEach(() => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    freshPlayer();
  });

  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
    freshPlayer();
  });

  it("keeps the rating and win streak from before each scored round beside the new ones", () => {
    jest.spyOn(Date, "now").mockReturnValue(TODAY);
    useGameStore.setState({ freeSkipDay: localDayOf(new Date(TODAY)) });
    const won = playRound({ pieceCount: 2, solveMs: 4000 });
    const wonBefore = won.standingBefore;
    const lost = playRound({ pieceCount: 6, correct: 0, solveMs: 0 });

    expect([wonBefore, [won.skillRating, won.streak], lost.standingBefore, [lost.skillRating, lost.streak]]).toEqual([
      { skillRating: 1000, streak: 0 },
      [1000, 1],
      { skillRating: 1000, streak: 1 },
      [600, 0],
    ]);
  });
});

describe("the day's free skip", () => {
  const heldRow: GameHistory = {
    id: "held",
    timestamp: 1,
    pieceCount: 6,
    memorizeTime: 10,
    accuracy: 83,
    correctPlacements: 5,
    totalPlacements: 6,
    level: 1,
    duration: 15,
    skillRatingChange: 12,
    facts: { pieceCount: 6, studySeconds: 10, rebuildSeconds: 15, accuracy: 83 },
  };
  const playedOn = (at: number, round: Parameters<typeof playRound>[0]) => {
    jest.spyOn(Date, "now").mockReturnValue(at);
    return playRound(round);
  };
  const emptyBoard = { pieceCount: 6, correct: 0, solveMs: 2000 };

  beforeEach(() => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    localStorage.clear();
    freshPlayer();
    useGameStore.setState(({ gameState }) => ({ history: [heldRow], certainty: SETTLED, gameState: { ...gameState, skillRating: 1200, streak: 3 } }));
  });

  afterEach(() => {
    store().resetGame();
    jest.restoreAllMocks();
    freshPlayer();
    localStorage.clear();
  });

  it("keeps the rating, the win streak and the rated history through the first empty board of the day, and stores the day", () => {
    const skipped = playedOn(TODAY, emptyBoard);

    expect([skipped.rating, skipped.skillRatingChange, skipped.skillRating, skipped.streak, store().history, storedState().freeSkipDay]).toEqual([
      { phase: "freeSkip", rating: 1200, change: 0 },
      0,
      1200,
      3,
      [heldRow],
      "2026-10-14",
    ]);
  });

  it("rates a second empty board the same day as a loss that ends the win streak", () => {
    playedOn(TODAY, emptyBoard);
    const second = playedOn(TODAY + 60_000, emptyBoard);

    expect([second.rating?.phase, second.skillRatingChange, second.skillRating, second.streak, store().history.length]).toEqual([
      "rated",
      -18,
      1182,
      0,
      2,
    ]);
  });

  it("gives the first empty board of the next day a free skip again", () => {
    playedOn(TODAY, emptyBoard);
    const tomorrow = playedOn(TODAY + DAY_MS, emptyBoard);

    expect([tomorrow.rating?.phase, tomorrow.skillRating, tomorrow.streak, store().freeSkipDay]).toEqual(["freeSkip", 1200, 3, "2026-10-15"]);
  });

  it("rates a board with a piece on it as before and keeps the free skip for later", () => {
    const one = playedOn(TODAY, { pieceCount: 6, correct: 1, solveMs: 2000 });

    expect([one.rating?.phase, one.skillRatingChange, one.streak, store().history.length, store().freeSkipDay]).toEqual([
      "rated",
      -14,
      0,
      2,
      null,
    ]);
  });

  it("leaves an empty review unrated without spending the free skip", () => {
    jest.spyOn(Date, "now").mockReturnValue(TODAY);
    const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";
    store().startGame(2, 10, "review", { kind: "review", fen, reviewOf: "first", firstDay: "2026-10-01", step: 0 });
    store().dispatch({ type: "studyEnded", now: 10000 });
    store().submitSolution(12000);
    const review = store().gameState;

    expect([review.rating, review.skillRating, review.streak, store().history, store().freeSkipDay]).toEqual([
      { phase: "review", rating: 1200, change: 0 },
      1200,
      3,
      [heldRow],
      null,
    ]);
  });

  it.each([
    ["kept", "2026-10-13", "2026-10-13"],
    ["dropped when it is not a day", "yesterday", null],
    ["dropped when it is not a string", 20261013, null],
  ])("restores a stored free-skip day, %s", async (_case, stored, restored) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { gameState: { skillRating: 1300, streak: 2 }, freeSkipDay: stored }, version: 3 }));
    await useGameStore.persist.rehydrate();

    expect([store().freeSkipDay, store().gameState.skillRating]).toEqual([restored, 1300]);
  });

  it("migrates a version 1 store with no free skip spent", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { gameState: { skillRating: 1300, streak: 2 }, history: [heldRow] }, version: 1 }));
    await useGameStore.persist.rehydrate();

    expect([store().gameState.streak, store().history, store().freeSkipDay]).toEqual([2, [heldRow], null]);
  });
});

describe("giving a stored rating its uncertainty", () => {
  const row = (i: number, accuracy: number, facts = true): GameHistory => ({
    id: `held-${i}`,
    timestamp: i,
    pieceCount: 6,
    memorizeTime: 10,
    accuracy,
    correctPlacements: 5,
    totalPlacements: 6,
    level: 1,
    duration: 15,
    ...(facts ? { facts: { pieceCount: 6, studySeconds: 10, rebuildSeconds: 15, accuracy } } : {}),
  });
  const rehydrateFrom = async (skillRating: number, history: GameHistory[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { gameState: { skillRating, streak: 2 }, history }, version: 2 }));
    await useGameStore.persist.rehydrate();
    return { rating: store().gameState.skillRating, certainty: store().certainty, history: store().history.length };
  };

  afterEach(() => {
    freshPlayer();
    localStorage.clear();
  });

  it("replays the stored rated rounds, oldest first, from the stored rating", async () => {
    const newestFirst = [row(2, 100), row(1, 67), row(0, 83)];

    await expect(rehydrateFrom(1300, newestFirst)).resolves.toEqual({ rating: 1254, certainty: { rd: expect.closeTo(214, 0), rounds: 3 }, history: 3 });
  });

  it("starts a player with no rated rounds as a new player", async () => {
    await expect(rehydrateFrom(1300, [row(0, 83, false)])).resolves.toEqual({ rating: 1000, certainty: { rd: 350, rounds: 0 }, history: 1 });
  });
});
