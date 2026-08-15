import { act, renderHook } from "@testing-library/react";
import { useGameLogic } from "../useGameLogic";
import { useGameStore } from "@/stores/gameStore";
import { playSound } from "@/lib/utils/soundEffects";
import type { ChessPiece } from "@/components/features/game/ChessBoard/ChessBoard.types";

jest.mock("@/stores/gameStore");
jest.mock("@/lib/utils/soundEffects", () => ({
  playSound: jest.fn(),
  stopTimerSound: jest.fn(),
}));

const storeResetGame = jest.fn();
const mockPiece: ChessPiece = {
  id: "piece-1",
  type: "pawn",
  color: "white",
  position: { row: 0, col: 0 },
  symbol: "♟",
  isRevealed: false,
  isMatched: false,
};

describe("useGameLogic", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(useGameStore).mockReturnValue({
      resetGame: storeResetGame,
    } as ReturnType<typeof useGameStore>);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("formats elapsed play time", () => {
    const { result } = renderHook(() => useGameLogic());
    expect(result.current.formattedTime).toBe("00:00");

    act(() => {
      result.current.resumeGame();
    });
    act(() => {
      jest.advanceTimersByTime(65_000);
    });
    expect(result.current.formattedTime).toBe("01:05");

    act(() => {
      jest.advanceTimersByTime(3_596_000);
    });
    expect(result.current.formattedTime).toBe("61:01");
  });

  it("only reveals pieces while playing", () => {
    const { result } = renderHook(() => useGameLogic());

    act(() => {
      result.current.handlePieceClick(mockPiece);
    });
    expect(playSound).not.toHaveBeenCalledWith("reveal");

    act(() => {
      result.current.resumeGame();
    });
    act(() => {
      result.current.handlePieceClick(mockPiece);
    });
    expect(playSound).toHaveBeenCalledWith("reveal");
  });

  it("ignores square clicks when no piece is selected", () => {
    const { result } = renderHook(() => useGameLogic());

    act(() => {
      result.current.resumeGame();
    });
    jest.mocked(playSound).mockClear();
    act(() => {
      result.current.handleSquareClick({ row: 1, col: 1 });
    });

    expect(playSound).not.toHaveBeenCalledWith("click");
    expect(result.current.selectedPiece).toBeNull();
  });

  it("pauses, resumes, and resets its game state", () => {
    const { result } = renderHook(() => useGameLogic());

    act(() => {
      result.current.resumeGame();
    });
    expect(result.current.gameStatus).toBe("playing");

    act(() => {
      result.current.pauseGame();
    });
    expect(result.current.gameStatus).toBe("paused");

    act(() => {
      result.current.resetGame();
    });
    expect(result.current.gameStatus).toBe("idle");
    expect(result.current.formattedTime).toBe("00:00");
    expect(storeResetGame).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith("click");
  });
});
