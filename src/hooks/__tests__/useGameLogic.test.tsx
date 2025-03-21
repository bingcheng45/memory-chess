import { renderHook, act } from '@testing-library/react';
import { useGameLogic } from '../useGameLogic';
import { useGameStore } from '@/stores/gameStore';
import { playSound } from '@/lib/utils/sound';
import { ChessPiece, PieceType, PieceColor, Position } from '@/components/features/game/ChessBoard/ChessBoard.types';

// Mock dependencies
jest.mock('@/stores/gameStore');
jest.mock('@/lib/utils/sound');

// Define a proper type for the mock game store
interface MockGameStore {
  pieces: unknown[];
  selectedPiece: null | unknown; // Allow selectedPiece to be null or any type
  gameStatus: string;
  score: number;
  timeElapsed: number;
  makeMove: jest.Mock;
  revealPiece: jest.Mock;
  matchPieces: jest.Mock;
  pauseGame: jest.Mock;
  resumeGame: jest.Mock;
  resetGame: jest.Mock;
  updateTimeElapsed: jest.Mock;
}

describe('useGameLogic Hook', () => {
  // Mock implementation of useGameStore
  const mockGameStore: MockGameStore = {
    pieces: [],
    selectedPiece: null,
    gameStatus: 'idle',
    score: 0,
    timeElapsed: 0,
    makeMove: jest.fn(),
    revealPiece: jest.fn(),
    matchPieces: jest.fn(),
    pauseGame: jest.fn(),
    resumeGame: jest.fn(),
    resetGame: jest.fn(),
    updateTimeElapsed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGameStore as unknown as jest.Mock).mockReturnValue(mockGameStore);
  });

  it('should format time correctly', () => {
    // Test with 0 seconds
    mockGameStore.timeElapsed = 0;
    const { result } = renderHook(() => useGameLogic());
    expect(result.current.formattedTime).toBe('00:00');

    // Test with 65 seconds (1 minute and 5 seconds)
    mockGameStore.timeElapsed = 65;
    const { result: result2 } = renderHook(() => useGameLogic());
    expect(result2.current.formattedTime).toBe('01:05');

    // Test with 3661 seconds (1 hour, 1 minute, and 1 second)
    mockGameStore.timeElapsed = 3661;
    const { result: result3 } = renderHook(() => useGameLogic());
    expect(result3.current.formattedTime).toBe('61:01');
  });

  it('should handle piece click correctly', () => {
    const { result } = renderHook(() => useGameLogic());
    
    const mockPiece: ChessPiece = {
      id: 'piece-1',
      type: 'pawn' as PieceType,
      color: 'white' as PieceColor,
      position: { row: 0, col: 0 },
      symbol: '♟',
      isRevealed: false,
      isMatched: false,
    };

    // When game status is not 'playing', it should not call revealPiece
    mockGameStore.gameStatus = 'paused';
    act(() => {
      result.current.handlePieceClick(mockPiece);
    });
    expect(mockGameStore.revealPiece).not.toHaveBeenCalled();
    expect(playSound).not.toHaveBeenCalled();

    // When game status is 'playing', it should call revealPiece and playSound
    mockGameStore.gameStatus = 'playing';
    act(() => {
      result.current.handlePieceClick(mockPiece);
    });
    expect(mockGameStore.revealPiece).toHaveBeenCalledWith(mockPiece);
    expect(playSound).toHaveBeenCalledWith('reveal');
  });

  it('should handle square click correctly', () => {
    const { result } = renderHook(() => useGameLogic());
    
    const mockPosition: Position = { row: 0, col: 0 };
    const mockSelectedPiece: ChessPiece = {
      id: 'piece-1',
      type: 'pawn' as PieceType,
      color: 'white' as PieceColor,
      position: { row: 1, col: 1 },
      symbol: '♟',
      isRevealed: true,
      isMatched: false,
    };

    // When game status is not 'playing', it should not call makeMove
    mockGameStore.gameStatus = 'paused';
    mockGameStore.selectedPiece = mockSelectedPiece;
    act(() => {
      result.current.handleSquareClick(mockPosition);
    });
    expect(mockGameStore.makeMove).not.toHaveBeenCalled();

    // When game status is 'playing' but no piece is selected, it should not call makeMove
    mockGameStore.gameStatus = 'playing';
    mockGameStore.selectedPiece = null;
    act(() => {
      result.current.handleSquareClick(mockPosition);
    });
    expect(mockGameStore.makeMove).not.toHaveBeenCalled();

    // When game status is 'playing' and a piece is selected, it should call makeMove
    mockGameStore.gameStatus = 'playing';
    mockGameStore.selectedPiece = mockSelectedPiece;
    act(() => {
      result.current.handleSquareClick(mockPosition);
    });
    expect(mockGameStore.makeMove).toHaveBeenCalledWith(
      mockSelectedPiece.position,
      mockPosition
    );
    expect(playSound).toHaveBeenCalledWith('click');
  });

  it('should handle pause, resume, and reset game correctly', () => {
    const { result } = renderHook(() => useGameLogic());
    
    act(() => {
      result.current.pauseGame();
    });
    expect(mockGameStore.pauseGame).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('click');

    act(() => {
      result.current.resumeGame();
    });
    expect(mockGameStore.resumeGame).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('click');

    act(() => {
      result.current.resetGame();
    });
    expect(mockGameStore.resetGame).toHaveBeenCalledTimes(1);
    expect(playSound).toHaveBeenCalledWith('click');
  });
}); 