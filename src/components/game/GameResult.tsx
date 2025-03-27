'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { GameState } from '@/lib/types/game';
import { Button } from "@/components/ui/button";
import { useEffect } from 'react';
import { playSound } from '@/lib/utils/soundEffects';

// Extended GameState type with skillRatingChange
type GameStateWithRating = GameState & { 
  skillRatingChange?: number;
  timeBonusEarned?: number;
  perfectScore?: boolean;
};

interface GameResultProps {
  readonly onTryAgain: () => void;
  readonly onNewGame: () => void;
}

export default function GameResult({ onTryAgain, onNewGame }: GameResultProps) {
  const { gameState } = useGameStore();
  
  // Get the local copy of gameState with skill rating change info
  const extendedGameState = gameState as GameStateWithRating;
  
  // Play success sound on component mount
  useEffect(() => {
    // Only play success sound if accuracy is high enough
    if (gameState.accuracy && gameState.accuracy >= 70) {
      playSound('success');
    } else if (gameState.accuracy !== undefined) {
      playSound('failure');
    }
  }, [gameState.accuracy]);
  
  // Time formatting helper
  const formatTimeParts = (seconds: number): { minutes: string; seconds: string; milliseconds: string } => {
    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (wholeSeconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds - wholeSeconds) * 1000).toString().padStart(3, '0');
    
    return {
      minutes,
      seconds: remainingSeconds,
      milliseconds: ms
    };
  };
  
  // Get a message based on accuracy
  const getResultMessage = () => {
    const accuracy = gameState.accuracy || 0;
    
    if (accuracy === 100) return "Perfect Score!";
    if (accuracy >= 90) return "Excellent Memory!";
    if (accuracy >= 80) return "Great Job!";
    if (accuracy >= 70) return "Well Done!";
    if (accuracy >= 50) return "Good Effort!";
    return "Keep Practicing!";
  };
  
  // Get color class based on accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-500";
    if (accuracy >= 70) return "text-peach-500";
    if (accuracy >= 50) return "text-yellow-500";
    return "text-red-500";
  };
  
  return (
    <div className="w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-8 shadow-xl">
      <h2 className={`mb-4 text-center text-3xl font-bold ${getAccuracyColor(gameState.accuracy || 0)}`}>
        {getResultMessage()}
      </h2>
      
      {extendedGameState.perfectScore && (
        <div className="mb-6 rounded-lg bg-green-500/20 p-3 text-center">
          <div className="text-lg font-bold text-green-400">✨ Perfect Score!</div>
        </div>
      )}
      
      <div className="mb-6 space-y-4">
        {/* Accuracy */}
        <div className="flex flex-col border-b border-bg-light pb-3">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Accuracy:</span>
            <span className={`font-bold ${getAccuracyColor(gameState.accuracy || 0)}`}>
              {gameState.accuracy || 0}%
            </span>
          </div>
          
          {/* Pieces correct / total */}
          <div className="flex justify-between mt-1">
            <span className="text-text-secondary text-sm">Pieces correct:</span>
            <span className="text-sm font-medium text-text-primary">
              {Math.round((gameState.accuracy || 0) * gameState.pieceCount / 100)} / {gameState.pieceCount}
            </span>
          </div>
          
          {/* Accuracy progress bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-light">
            <div 
              className={`h-full transition-all ${
                gameState.accuracy && gameState.accuracy >= 90 ? 'bg-green-400' :
                gameState.accuracy && gameState.accuracy >= 70 ? 'bg-peach-400' :
                gameState.accuracy && gameState.accuracy >= 50 ? 'bg-peach-500' :
                'bg-peach-600'
              }`}
              style={{ width: `${gameState.accuracy || 0}%` }}
            ></div>
          </div>
        </div>
        
        {/* Time */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Solution Time:</span>
          <span className="font-bold text-text-primary">
            {(() => {
              const { minutes, seconds, milliseconds } = formatTimeParts(gameState.completionTime || 0);
              return (
                <>
                  {minutes}:{seconds}<span className="text-xs">{milliseconds}</span>
                </>
              );
            })()}
          </span>
        </div>
        
        {/* Recall Speed - replacing Pieces section */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Recall Speed:</span>
          <span className="font-bold text-text-primary">
            {(() => {
              // Handle edge cases
              if (!gameState.completionTime || gameState.completionTime <= 0) {
                return "0.0 pieces/sec";
              }
              
              // Calculate correct pieces based on accuracy
              const accuracyPercentage = (gameState.accuracy || 0) / 100;
              const correctPieces = gameState.pieceCount * accuracyPercentage;
              
              // Calculate correct pieces per second
              const piecesPerSecond = correctPieces / gameState.completionTime;
              
              // Format to 1 decimal place
              return `${piecesPerSecond.toFixed(1)} pieces/sec`;
            })()}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <Button
          onClick={onTryAgain}
          variant="outline"
          className="w-full bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5"
        >
          Try Again
        </Button>
        
        <Button
          onClick={onNewGame}
          variant="secondary"
          size="lg"
          className="w-full border border-gray-600"
        >
          New Game
        </Button>
      </div>
    </div>
  );
} 