'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { GameState } from '@/lib/types/game';
import { Button } from "@/components/ui/button";

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
  const { 
    gameState, 
    getBestTime, 
    getSkillRating,
    getCurrentStreak
  } = useGameStore();
  
  // Cast gameState to extended type
  const extendedGameState = gameState as GameStateWithRating;
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get metrics
  const bestTime = getBestTime();
  const skillRating = getSkillRating();
  const currentStreak = getCurrentStreak();
  
  const isNewBestTime = gameState.completionTime !== undefined && 
                        bestTime > 0 && 
                        gameState.completionTime < bestTime && 
                        gameState.accuracy !== undefined && 
                        gameState.accuracy >= 80;
  
  // Determine result message and color based on accuracy
  const getResultMessage = () => {
    if (gameState.accuracy === undefined) return { text: 'Game Completed', color: 'text-text-primary' };
    
    if (gameState.accuracy >= 90) {
      return { text: 'Excellent Memory!', color: 'text-green-400' };
    } else if (gameState.accuracy >= 70) {
      return { text: 'Great Job!', color: 'text-peach-400' };
    } else if (gameState.accuracy >= 50) {
      return { text: 'Good Effort!', color: 'text-peach-500' };
    } else {
      return { text: 'Keep Practicing!', color: 'text-peach-600' };
    }
  };
  
  const result = getResultMessage();
  
  // Calculate accuracy color
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-400';
    if (accuracy >= 70) return 'text-peach-400';
    if (accuracy >= 50) return 'text-peach-500';
    return 'text-peach-600';
  };
  
  // Get skill rating change class
  const getSkillRatingChangeClass = () => {
    if (!extendedGameState.skillRatingChange) return 'text-text-secondary';
    return extendedGameState.skillRatingChange > 0 ? 'text-green-400' : 'text-red-400';
  };
  
  // Get skill rating change symbol
  const getSkillRatingChangeSymbol = () => {
    if (!extendedGameState.skillRatingChange) return '';
    return extendedGameState.skillRatingChange > 0 ? '▲' : '▼';
  };
  
  return (
    <div className="w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-8 shadow-xl">
      <h2 className={`mb-4 text-center text-3xl font-bold ${result.color}`}>
        {result.text}
      </h2>
      
      {isNewBestTime && (
        <div className="mb-6 rounded-lg bg-peach-500/20 p-3 text-center">
          <div className="text-lg font-bold text-peach-400">🏆 New Best Time!</div>
        </div>
      )}
      
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
          <span className="text-text-secondary font-medium">Time:</span>
          <span className="font-bold text-text-primary">
            {formatTime(gameState.completionTime || 0)}
          </span>
        </div>
        
        {/* Skill Rating */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Skill Rating:</span>
          <div className="flex items-center">
            <span className="font-bold text-text-primary">{skillRating}</span>
            {extendedGameState.skillRatingChange !== undefined && (
              <span className={`ml-2 text-sm ${getSkillRatingChangeClass()}`}>
                {getSkillRatingChangeSymbol()} {Math.abs(extendedGameState.skillRatingChange)}
              </span>
            )}
          </div>
        </div>
        
        {/* Streak */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Current Streak:</span>
          <span className="font-bold text-text-primary">{currentStreak}</span>
        </div>
        
        {/* Pieces */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Pieces:</span>
          <span className="font-bold text-text-primary">{gameState.pieceCount}</span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <Button
          onClick={onTryAgain}
          variant="primary"
          size="lg"
          className="w-full"
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