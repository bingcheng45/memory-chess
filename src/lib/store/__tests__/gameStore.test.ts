import { useGameStore } from "@/lib/store/gameStore";
import { validateMemorizationPosition } from "@/lib/utils/memorizationPosition";
import { pieceTypeToFenChar } from "@/utils/chessPieces";
import type { PieceColor, PieceType } from "@/types/chess";

const placeOnSolutionBoard = (
  square: string,
  type: PieceType,
  color: PieceColor,
) => useGameStore.getState().placePiece(square, pieceTypeToFenChar(type, color));

const boardPlacement = (fen: string) => fen.split(" ")[0];

describe("active game store position generation", () => {
  afterEach(() => {
    useGameStore.getState().resetGame();
  });

  it("stores a validated memorization position with the requested piece count", () => {
    useGameStore.getState().startGame(12, 8);

    const { gameState, memorizationChess } = useGameStore.getState();
    expect(gameState.isPlaying).toBe(true);
    expect(gameState.originalPosition).toBe(memorizationChess?.fen());
    expect(
      validateMemorizationPosition(gameState.originalPosition!, 12),
    ).toMatchObject({ valid: true, violations: [] });
  });
});

describe("recording the player's solution", () => {
  beforeEach(() => {
    useGameStore.getState().startGame(6, 10);
    useGameStore.getState().startSolutionPhase();
  });

  afterEach(() => {
    useGameStore.getState().resetGame();
  });

  it("records a knight as a knight rather than a king", () => {
    // Regression: knights were encoded from the first letter of the type name,
    // so they landed in the scored FEN as kings and were counted as missed.
    placeOnSolutionBoard("c3", "knight", "white");
    placeOnSolutionBoard("f6", "knight", "black");

    const { userPosition } = useGameStore.getState().gameState;

    expect(boardPlacement(userPosition!)).toBe("8/8/5n2/8/8/2N5/8/8");
  });

  it("keeps both knights of a color and the king of that color", () => {
    placeOnSolutionBoard("b1", "knight", "white");
    placeOnSolutionBoard("g1", "knight", "white");
    placeOnSolutionBoard("e1", "king", "white");

    const { userPosition } = useGameStore.getState().gameState;

    expect(boardPlacement(userPosition!)).toBe("8/8/8/8/8/8/8/1N2K1N1");
  });

  it("records every piece type on the square it was placed on", () => {
    placeOnSolutionBoard("a1", "rook", "white");
    placeOnSolutionBoard("b2", "knight", "white");
    placeOnSolutionBoard("c3", "bishop", "white");
    placeOnSolutionBoard("d4", "queen", "white");
    placeOnSolutionBoard("e5", "king", "white");
    placeOnSolutionBoard("f6", "pawn", "white");

    const { userPosition } = useGameStore.getState().gameState;

    expect(boardPlacement(userPosition!)).toBe("8/8/5P2/4K3/3Q4/2B5/1N6/R7");
  });

  it("leaves the board unchanged when a placement is rejected", () => {
    placeOnSolutionBoard("e1", "king", "white");
    const before = useGameStore.getState().gameState.userPosition;

    // A second white king is not a legal placement, so nothing should change.
    placeOnSolutionBoard("a5", "king", "white");

    expect(useGameStore.getState().gameState.userPosition).toBe(before);
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
    useGameStore.getState().startGame(12, 8);

    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 12, memorizeTime: 8 });
  });

  it("keeps the last settings through a new-game reset", () => {
    useGameStore.getState().startGame(12, 8);
    useGameStore.getState().resetGame();

    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 12, memorizeTime: 8 });
  });

  it("keeps custom settings of 3 pieces at 18 seconds through a new-game reset", () => {
    useGameStore.getState().startGame(3, 18);
    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 3, memorizeTime: 18 });

    useGameStore.getState().resetGame();

    expect(useGameStore.getState().lastSettings).toEqual({ pieceCount: 3, memorizeTime: 18 });
  });

  it("persists the last settings", () => {
    useGameStore.getState().startGame(7, 9);

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
