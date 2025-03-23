/**
 * useGameLogic Hook
 * 
 * This custom hook encapsulates the core game logic for Memory Chess.
 * It provides functions for managing game state, piece placement, and scoring.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { ChessPiece, Position } from '@/components/features/game/ChessBoard/ChessBoard.types';
import { playSound } from '@/lib/utils/sound';

/**
 * Custom hook that provides game logic functionality
 * 
 * @returns Object containing game state and functions to manipulate it
 */
export function useGameLogic() {
  // Use our own state since gameStore has different structure
  const [pieces, setPieces] = useState<ChessPiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'paused' | 'completed'>('idle');
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Only using resetGame from the store
  const { resetGame: storeResetGame } = useGameStore();

  const [revealedPieces, setRevealedPieces] = useState<ChessPiece[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameStatus]);

  // Mock functions that would interact with the store
  const revealPiece = useCallback((piece: ChessPiece) => {
    setPieces(prev => 
      prev.map(p => p.id === piece.id ? { ...p, isRevealed: true } : p)
    );
  }, []);

  const matchPieces = useCallback((piece1: ChessPiece, piece2: ChessPiece) => {
    setPieces(prev => 
      prev.map(p => 
        p.id === piece1.id || p.id === piece2.id 
          ? { ...p, isMatched: true } 
          : p
      )
    );
    setScore(prev => prev + 10);
  }, []);

  const makeMove = useCallback((from: Position, to: Position) => {
    // Implementation for making a move
    setPieces(prev => {
      const pieceIndex = prev.findIndex(p => 
        p.position.row === from.row && p.position.col === from.col
      );
      
      if (pieceIndex === -1) return prev;
      
      const newPieces = [...prev];
      newPieces[pieceIndex] = {
        ...newPieces[pieceIndex],
        position: to
      };
      
      return newPieces;
    });
    setSelectedPiece(null);
  }, []);

  const pauseGame = useCallback(() => {
    setGameStatus('paused');
  }, []);

  const resumeGame = useCallback(() => {
    setGameStatus('playing');
  }, []);

  const resetGame = useCallback(() => {
    setPieces([]);
    setSelectedPiece(null);
    setGameStatus('idle');
    setScore(0);
    setTimeElapsed(0);
    setRevealedPieces([]);
    setIsChecking(false);
    storeResetGame();
  }, [storeResetGame]);

  const handlePieceClick = useCallback((piece: ChessPiece) => {
    if (gameStatus !== 'playing' || isChecking) return;

    if (!piece.isRevealed && !piece.isMatched) {
      playSound('reveal');
      revealPiece(piece);
      setRevealedPieces(prev => [...prev, piece]);

      if (revealedPieces.length === 1) {
        setIsChecking(true);
        const firstPiece = revealedPieces[0];

        if (firstPiece.type === piece.type && firstPiece.id !== piece.id) {
          // Match found
          setTimeout(() => {
            playSound('match');
            matchPieces(firstPiece, piece);
            setRevealedPieces([]);
            setIsChecking(false);
          }, 1000);
        } else {
          // No match
          setTimeout(() => {
            playSound('error');
            setRevealedPieces([]);
            setIsChecking(false);
          }, 1000);
        }
      }
    }
  }, [gameStatus, isChecking, revealedPieces, revealPiece, matchPieces]);

  const handleSquareClick = useCallback((position: Position) => {
    if (gameStatus !== 'playing') return;

    if (selectedPiece) {
      playSound('click');
      makeMove(selectedPiece.position, position);
    }
  }, [gameStatus, selectedPiece, makeMove]);

  const handlePauseGame = useCallback(() => {
    playSound('click');
    pauseGame();
  }, [pauseGame]);

  const handleResumeGame = useCallback(() => {
    playSound('click');
    resumeGame();
  }, [resumeGame]);

  const handleResetGame = useCallback(() => {
    playSound('click');
    resetGame();
  }, [resetGame]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return {
    pieces,
    selectedPiece,
    gameStatus,
    score,
    timeElapsed,
    formattedTime: formatTime(timeElapsed),
    handlePieceClick,
    handleSquareClick,
    pauseGame: handlePauseGame,
    resumeGame: handleResumeGame,
    resetGame: handleResetGame,
    isChecking
  };
} 