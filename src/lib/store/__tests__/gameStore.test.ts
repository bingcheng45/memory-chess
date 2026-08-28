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
