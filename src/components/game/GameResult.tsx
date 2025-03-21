'use client';

import { useState, useEffect } from 'react';
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
    getAverageAccuracy, 
    getSkillRating,
    getCurrentStreak,
    getLongestStreak,
    getRecommendedDifficulty
  } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Cast gameState to extended type
  const extendedGameState = gameState as GameStateWithRating;
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get best time for current piece count
  const bestTime = getBestTime();
  const averageAccuracy = getAverageAccuracy();
  const skillRating = getSkillRating();
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();
  const recommendedDifficulty = getRecommendedDifficulty();
  
  const isNewBestTime = gameState.completionTime !== undefined && 
                        bestTime > 0 && 
                        gameState.completionTime < bestTime && 
                        gameState.accuracy !== undefined && 
                        gameState.accuracy >= 80;
  
  // Show confetti animation for excellent results
  useEffect(() => {
    if (gameState.accuracy !== undefined && gameState.accuracy >= 90) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState.accuracy]);
  
  // Determine result message and color based on accuracy
  const getResultMessage = () => {
    if (gameState.accuracy === undefined) return { text: 'Game Completed', color: 'text-text-primary' };
    
    if (gameState.accuracy >= 90) {
      return { text: 'Excellent Memory!', color: 'text-green-400', emoji: '🏆' };
    } else if (gameState.accuracy >= 70) {
      return { text: 'Great Job!', color: 'text-peach-400', emoji: '🎯' };
    } else if (gameState.accuracy >= 50) {
      return { text: 'Good Effort!', color: 'text-peach-500', emoji: '👍' };
    } else {
      return { text: 'Keep Practicing!', color: 'text-peach-600', emoji: '💪' };
    }
  };
  
  // Get improvement tips based on accuracy
  const getImprovementTips = () => {
    if (gameState.accuracy === undefined) return [];
    
    const tips = [];
    
    if (gameState.accuracy < 50) {
      tips.push('Start with fewer pieces to build your memory');
      tips.push('Focus on key pieces like kings and queens first');
      tips.push('Try to identify patterns in the position');
    } else if (gameState.accuracy < 70) {
      tips.push('Pay attention to piece colors and their positions');
      tips.push('Try to remember pieces by their relative positions');
      tips.push('Practice with slightly more time before reducing it');
    } else if (gameState.accuracy < 90) {
      tips.push('Focus on the exact square of each piece');
      tips.push('Try to visualize the board in sections');
      tips.push('Challenge yourself with more pieces or less time');
    } else {
      tips.push('You\'re doing great! Try increasing the difficulty');
      tips.push('Challenge yourself with more pieces or less time');
      tips.push('Practice consistently to maintain your skills');
    }
    
    return tips;
  };
  
  const result = getResultMessage();
  const improvementTips = getImprovementTips();
  
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
      {showConfetti && (
        <div className="confetti-container absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: ['#FFB380', '#FF9248', '#FFD700', '#87CEEB', '#90EE90'][Math.floor(Math.random() * 5)],
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                animation: `fall ${Math.random() * 3 + 2}s linear forwards, sway ${Math.random() * 2 + 3}s ease-in-out infinite alternate`
              }}
            />
          ))}
          <style jsx>{`
            @keyframes fall {
              to { transform: translateY(105vh); }
            }
            @keyframes sway {
              from { transform: translateX(-5px); }
              to { transform: translateX(5px); }
            }
            .confetti {
              position: absolute;
              border-radius: 2px;
              opacity: 0.7;
            }
          `}</style>
        </div>
      )}
      
      <h2 className={`mb-4 text-center text-3xl font-bold ${result.color} flex items-center justify-center`}>
        <span className="mr-2">{result.emoji}</span>
        {result.text}
        <span className="ml-2">{result.emoji}</span>
      </h2>
      
      {isNewBestTime && (
        <div className="mb-6 rounded-lg bg-peach-500/20 p-4 text-center border border-peach-500/30">
          <div className="text-xl font-bold text-peach-400">🏆 New Best Time! 🏆</div>
          <div className="mt-1 text-sm text-text-secondary">You&apos;ve set a new record for {gameState.pieceCount} pieces</div>
        </div>
      )}
      
      {extendedGameState.perfectScore && (
        <div className="mb-6 rounded-lg bg-green-500/20 p-4 text-center border border-green-500/30">
          <div className="text-xl font-bold text-green-400">✨ Perfect Score! ✨</div>
          <div className="mt-1 text-sm text-text-secondary">You placed all pieces correctly</div>
        </div>
      )}
      
      <div className="mb-6 space-y-4">
        {/* Skill Rating */}
        <div className="flex flex-col border-b border-bg-light pb-3">
          <div className="flex justify-between">
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
          
          {/* Skill level */}
          <div className="mt-1 text-xs text-right text-text-muted">
            Level: {recommendedDifficulty.name}
          </div>
        </div>
        
        {/* Streak */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Current Streak:</span>
          <div className="flex items-center">
            <span className="font-bold text-text-primary">{currentStreak}</span>
            {longestStreak > 0 && (
              <span className="ml-2 text-xs text-text-muted">
                (Best: {longestStreak})
              </span>
            )}
          </div>
        </div>
        
        {/* Time */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Time:</span>
          <span className="font-bold text-text-primary">
            {formatTime(gameState.completionTime || 0)}
          </span>
        </div>
        
        {bestTime > 0 && (
          <div className="flex justify-between border-b border-bg-light pb-3">
            <span className="text-text-secondary font-medium">Best Time:</span>
            <span className="font-bold text-peach-400">
              {formatTime(bestTime)}
            </span>
          </div>
        )}
        
        {/* Time Bonus */}
        {extendedGameState.timeBonusEarned !== undefined && extendedGameState.timeBonusEarned > 0 && (
          <div className="flex justify-between border-b border-bg-light pb-3">
            <span className="text-text-secondary font-medium">Time Bonus:</span>
            <span className="font-bold text-green-400">+{extendedGameState.timeBonusEarned} pts</span>
          </div>
        )}
        
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
          
          {averageAccuracy > 0 && (
            <div className="mt-1 text-xs text-right text-text-muted">
              Your average: {averageAccuracy}%
            </div>
          )}
        </div>
        
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Pieces:</span>
          <span className="font-bold text-text-primary">{gameState.pieceCount}</span>
        </div>
      </div>
      
      {/* Recommended next challenge */}
      <div className="mb-6 rounded-lg bg-bg-dark/30 p-4">
        <h3 className="mb-2 text-sm font-medium text-text-primary">Recommended Challenge</h3>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Difficulty:</span>
          <span className="font-medium text-peach-400">{recommendedDifficulty.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Pieces:</span>
          <span className="font-medium text-text-primary">
            {recommendedDifficulty.minPieces}-{recommendedDifficulty.maxPieces}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Time:</span>
          <span className="font-medium text-text-primary">
            {recommendedDifficulty.minTime}-{recommendedDifficulty.maxTime}s
          </span>
        </div>
      </div>
      
      {/* Improvement tips */}
      {improvementTips.length > 0 && (
        <div className="mb-6 rounded-lg bg-bg-dark/30 p-4">
          <h3 className="mb-2 text-sm font-medium text-text-primary">Tips for Improvement</h3>
          <ul className="list-inside list-disc space-y-1 text-xs text-text-secondary">
            {improvementTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex flex-col space-y-3">
        <Button
          onClick={onTryAgain}
          variant={gameState.accuracy === 100 ? "secondary" : "primary"}
          size="lg"
          className="w-full"
        >
          Try Again (Same Configuration)
        </Button>
        
        <Button
          onClick={onNewGame}
          variant={gameState.accuracy === 100 ? "primary" : "secondary"}
          size="lg"
          className={`w-full ${gameState.accuracy === 100 ? "" : "border border-gray-600"}`}
        >
          New Game (Different Configuration)
        </Button>
      </div>
    </div>
  );
} 