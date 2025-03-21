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
  const {
    pieces,
    selectedPiece,
    gameStatus,
    score,
    timeElapsed,
    makeMove,
    revealPiece,
    matchPieces,
    pauseGame,
    resumeGame,
    resetGame,
    updateTimeElapsed
  } = useGameStore();

  const [revealedPieces, setRevealedPieces] = useState<ChessPiece[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameStatus === 'playing') {
      timer = setInterval(() => {
        updateTimeElapsed(timeElapsed + 1);
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [gameStatus, timeElapsed, updateTimeElapsed]);

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