import { useGameStore } from "@/lib/store/gameStore";
import { validateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import { labPositionToFen, type LabPiece, type LabPosition } from "@/lib/round/round";
import type { SquareName } from "@/lib/game/board";
import type { PieceColor, PieceType } from "@/types/chess";

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
  return round.phase === "idle" ? {} : round.target;
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

    store().startGame(6, 10, "game_quick");

    expect(gtag.mock.calls).toEqual([["event", "round_start", { piece_count: 6, memorize_time: 10, source: "game_quick" }]]);
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

  it("scores a perfect rebuild, raises the rating and the streak, and leaves the round on its score", () => {
    jest.spyOn(performance, "now").mockReturnValue(0);
    useGameStore.setState(({ gameState }) => ({ gameState: { ...gameState, skillRating: 1000, streak: 0 } }));
    store().startGame(2, 10, "game_form");
    store().dispatch({ type: "studyEnded", now: 10000 });
    for (const [square, piece] of Object.entries(target()) as [SquareName, LabPiece][]) place(square, piece.type, piece.color, 11000);
    store().submitSolution(14000);

    const { gameState, round } = store();
    expect(round.phase).toBe("scored");
    expect(gameState).toMatchObject({
      accuracy: 100,
      perfectScore: true,
      success: true,
      correctPlacements: 2,
      extraPieces: 0,
      totalPiecesPlaced: 2,
      skillRatingChange: 114,
      skillRating: 1114,
      streak: 1,
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
    [32, 32],
    [2, 32],
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
    ["1 second", { pieceCount: 6, memorizeTime: 1 }],
    ["33 seconds", { pieceCount: 6, memorizeTime: 33 }],
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
