import { act } from "@testing-library/react";
import { useGameStore } from "../gameStore";
import { GamePhase } from "@/types/game";
import type { ChessPiece } from "@/types/chess";

const whitePawn: ChessPiece = {
  id: "white-pawn",
  type: "pawn",
  color: "white",
  position: { file: 0, rank: 1 },
};

const blackRook: ChessPiece = {
  id: "black-rook",
  type: "rook",
  color: "black",
  position: { file: 7, rank: 7 },
};

describe("gameStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => {
      useGameStore.setState({
        phase: GamePhase.CONFIGURATION,
        config: {
          pieceCount: 6,
          memorizeTime: 10,
          difficulty: "medium",
        },
        originalPosition: [],
        playerSolution: [],
        startTime: undefined,
        endTime: undefined,
        accuracy: undefined,
        correctPlacements: undefined,
        isLoading: false,
        error: null,
      });
    });
  });

  it("initializes a memorization round with the supplied position", () => {
    act(() => {
      useGameStore.getState().initializeGame([whitePawn, blackRook]);
    });

    const state = useGameStore.getState();
    expect(state.phase).toBe(GamePhase.MEMORIZATION);
    expect(state.originalPosition).toEqual([whitePawn, blackRook]);
    expect(state.playerSolution).toEqual([]);
    expect(state.startTime).toEqual(expect.any(Number));
    expect(state.isLoading).toBe(false);
  });

  it("applies presets and clamps custom configuration values", () => {
    act(() => {
      useGameStore.getState().setDifficulty("easy");
    });
    expect(useGameStore.getState().config).toEqual({
      pieceCount: 2,
      memorizeTime: 10,
      difficulty: "easy",
    });

    act(() => {
      useGameStore.getState().setPieceCount(99);
      useGameStore.getState().setMemorizeTime(0);
    });
    expect(useGameStore.getState().config).toEqual({
      pieceCount: 32,
      memorizeTime: 1,
      difficulty: "custom",
    });
  });

  it("moves from memorization into the solution phase", () => {
    act(() => {
      useGameStore.getState().initializeGame([whitePawn]);
      useGameStore.getState().endMemorization();
    });

    expect(useGameStore.getState().phase).toBe(GamePhase.SOLUTION);
    expect(useGameStore.getState().playerSolution).toEqual([]);
  });

  it("adds, replaces, and removes solution pieces by square", () => {
    act(() => {
      useGameStore.getState().placePiece(whitePawn);
      useGameStore.getState().placePiece({
        ...blackRook,
        position: whitePawn.position,
      });
    });

    expect(useGameStore.getState().playerSolution).toEqual([
      { ...blackRook, position: whitePawn.position },
    ]);

    act(() => {
      useGameStore.getState().removePiece(whitePawn.position);
    });
    expect(useGameStore.getState().playerSolution).toEqual([]);
  });

  it("scores an identical solution as fully correct", () => {
    act(() => {
      useGameStore.setState({
        phase: GamePhase.SOLUTION,
        originalPosition: [whitePawn, blackRook],
        playerSolution: [whitePawn, blackRook],
        startTime: Date.now() - 1_000,
      });
      useGameStore.getState().submitSolution();
    });

    const state = useGameStore.getState();
    expect(state.phase).toBe(GamePhase.RESULT);
    expect(state.accuracy).toBe(100);
    expect(state.correctPlacements).toBe(2);
    expect(state.endTime).toEqual(expect.any(Number));
  });

  it("resets round data while preserving the current configuration", () => {
    act(() => {
      useGameStore.setState({
        phase: GamePhase.RESULT,
        config: {
          pieceCount: 12,
          memorizeTime: 8,
          difficulty: "hard",
        },
        originalPosition: [whitePawn],
        playerSolution: [blackRook],
        accuracy: 50,
      });
      useGameStore.getState().resetGame();
    });

    const state = useGameStore.getState();
    expect(state.phase).toBe(GamePhase.CONFIGURATION);
    expect(state.config).toEqual({
      pieceCount: 12,
      memorizeTime: 8,
      difficulty: "hard",
    });
    expect(state.originalPosition).toEqual([]);
    expect(state.playerSolution).toEqual([]);
    expect(state.accuracy).toBeUndefined();
  });

  it("tracks loading and error state", () => {
    act(() => {
      useGameStore.getState().setLoading(true);
      useGameStore.getState().setError("An error occurred");
    });

    expect(useGameStore.getState().isLoading).toBe(true);
    expect(useGameStore.getState().error).toBe("An error occurred");
  });

  it("only prepares leaderboard entries for standard difficulties", () => {
    act(() => {
      useGameStore.setState({
        config: {
          pieceCount: 6,
          memorizeTime: 10,
          difficulty: "medium",
        },
        accuracy: 50,
        startTime: 1_000,
        endTime: 3_500,
      });
    });

    expect(useGameStore.getState().isEligibleForLeaderboard()).toBe(true);
    expect(useGameStore.getState().prepareLeaderboardEntry("Player")).toEqual({
      player_name: "Player",
      difficulty: "medium",
      piece_count: 6,
      correct_pieces: 3,
      memorize_time: 10,
      solution_time: 2.5,
    });

    act(() => {
      useGameStore.getState().setPieceCount(7);
    });
    expect(useGameStore.getState().isEligibleForLeaderboard()).toBe(false);
  });
});
