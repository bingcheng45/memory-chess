import { act } from '@testing-library/react';
import { useGameStore } from '../gameStore';
import { ChessPiece, Position } from '@/components/features/game/ChessBoard/ChessBoard.types';

// Mock the localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('gameStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    act(() => {
      useGameStore.setState({
        pieces: [],
        selectedPiece: null,
        moves: [],
        matchedPairs: [],
        gameStatus: 'idle',
        score: 0,
        timeElapsed: 0,
        isLoading: false,
        error: null,
        lastUpdated: 0,
      });
      mockLocalStorage.clear();
    });
  });

  it('should initialize the game with pieces', () => {
    const mockPieces: ChessPiece[] = [
      {
        id: 'piece-1',
        type: 'pawn',
        color: 'white',
        position: { row: 0, col: 0 },
        symbol: '♟',
        isRevealed: false,
        isMatched: false,
      },
    ];

    act(() => {
      useGameStore.getState().initializeGame(mockPieces);
    });

    expect(useGameStore.getState().pieces).toEqual(mockPieces);
    expect(useGameStore.getState().gameStatus).toBe('playing');
    expect(useGameStore.getState().score).toBe(0);
    expect(useGameStore.getState().timeElapsed).toBe(0);
  });

  it('should select a piece', () => {
    const mockPiece: ChessPiece = {
      id: 'piece-1',
      type: 'pawn',
      color: 'white',
      position: { row: 0, col: 0 },
      symbol: '♟',
      isRevealed: false,
      isMatched: false,
    };

    act(() => {
      useGameStore.getState().selectPiece(mockPiece);
    });

    expect(useGameStore.getState().selectedPiece).toEqual(mockPiece);
  });

  it('should make a move', () => {
    const mockPiece: ChessPiece = {
      id: 'piece-1',
      type: 'pawn',
      color: 'white',
      position: { row: 0, col: 0 },
      symbol: '♟',
      isRevealed: false,
      isMatched: false,
    };

    act(() => {
      useGameStore.setState({
        pieces: [mockPiece],
        selectedPiece: mockPiece,
      });
    });

    const fromPosition: Position = { row: 0, col: 0 };
    const toPosition: Position = { row: 1, col: 1 };

    act(() => {
      useGameStore.getState().makeMove(fromPosition, toPosition);
    });

    // The piece should be moved to the new position
    expect(useGameStore.getState().pieces[0].position).toEqual(toPosition);
    // The move should be recorded
    expect(useGameStore.getState().moves.length).toBe(1);
    expect(useGameStore.getState().moves[0].from).toEqual(fromPosition);
    expect(useGameStore.getState().moves[0].to).toEqual(toPosition);
    // The selected piece should be cleared
    expect(useGameStore.getState().selectedPiece).toBeNull();
  });

  it('should reveal a piece', () => {
    const mockPiece: ChessPiece = {
      id: 'piece-1',
      type: 'pawn',
      color: 'white',
      position: { row: 0, col: 0 },
      symbol: '♟',
      isRevealed: false,
      isMatched: false,
    };

    act(() => {
      useGameStore.setState({
        pieces: [mockPiece],
      });
    });

    act(() => {
      useGameStore.getState().revealPiece(mockPiece);
    });

    expect(useGameStore.getState().pieces[0].isRevealed).toBe(true);
  });

  it('should match pieces', () => {
    const mockPiece1: ChessPiece = {
      id: 'piece-1',
      type: 'pawn',
      color: 'white',
      position: { row: 0, col: 0 },
      symbol: '♟',
      isRevealed: true,
      isMatched: false,
    };

    const mockPiece2: ChessPiece = {
      id: 'piece-2',
      type: 'pawn',
      color: 'white',
      position: { row: 1, col: 1 },
      symbol: '♟',
      isRevealed: true,
      isMatched: false,
    };

    act(() => {
      useGameStore.setState({
        pieces: [mockPiece1, mockPiece2],
        score: 0,
      });
    });

    act(() => {
      useGameStore.getState().matchPieces(mockPiece1, mockPiece2);
    });

    expect(useGameStore.getState().pieces[0].isMatched).toBe(true);
    expect(useGameStore.getState().pieces[1].isMatched).toBe(true);
    expect(useGameStore.getState().matchedPairs.length).toBe(1);
    expect(useGameStore.getState().score).toBe(100); // Score should be increased
  });

  it('should pause and resume the game', () => {
    act(() => {
      useGameStore.setState({
        gameStatus: 'playing',
      });
    });

    act(() => {
      useGameStore.getState().pauseGame();
    });

    expect(useGameStore.getState().gameStatus).toBe('paused');

    act(() => {
      useGameStore.getState().resumeGame();
    });

    expect(useGameStore.getState().gameStatus).toBe('playing');
  });

  it('should reset the game', () => {
    const mockPiece: ChessPiece = {
      id: 'piece-1',
      type: 'pawn',
      color: 'white',
      position: { row: 0, col: 0 },
      symbol: '♟',
      isRevealed: true,
      isMatched: true,
    };

    act(() => {
      useGameStore.setState({
        pieces: [mockPiece],
        selectedPiece: mockPiece,
        moves: [{ piece: mockPiece, from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }],
        matchedPairs: ['pair-1'],
        gameStatus: 'playing',
        score: 100,
        timeElapsed: 60,
      });
    });

    act(() => {
      useGameStore.getState().resetGame();
    });

    expect(useGameStore.getState().pieces).toEqual([]);
    expect(useGameStore.getState().selectedPiece).toBeNull();
    expect(useGameStore.getState().moves).toEqual([]);
    expect(useGameStore.getState().matchedPairs).toEqual([]);
    expect(useGameStore.getState().gameStatus).toBe('idle');
    expect(useGameStore.getState().score).toBe(0);
    expect(useGameStore.getState().timeElapsed).toBe(0);
  });

  it('should update the score', () => {
    act(() => {
      useGameStore.setState({
        score: 0,
      });
    });

    act(() => {
      useGameStore.getState().updateScore(50);
    });

    expect(useGameStore.getState().score).toBe(50);

    act(() => {
      useGameStore.getState().updateScore(25);
    });

    expect(useGameStore.getState().score).toBe(75);
  });

  it('should update the time elapsed', () => {
    act(() => {
      useGameStore.setState({
        timeElapsed: 0,
      });
    });

    act(() => {
      useGameStore.getState().updateTimeElapsed(30);
    });

    expect(useGameStore.getState().timeElapsed).toBe(30);
  });

  it('should set loading state', () => {
    act(() => {
      useGameStore.setState({
        isLoading: false,
      });
    });

    act(() => {
      useGameStore.getState().setLoading(true);
    });

    expect(useGameStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    act(() => {
      useGameStore.setState({
        error: null,
      });
    });

    act(() => {
      useGameStore.getState().setError('An error occurred');
    });

    expect(useGameStore.getState().error).toBe('An error occurred');
  });
}); 