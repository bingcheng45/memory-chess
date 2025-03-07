'use client';

import { useGameStore } from '@/lib/store/gameStore';

interface GameResultProps {
  readonly onTryAgain: () => void;
  readonly onNewGame: () => void;
}

export default function GameResult({ onTryAgain, onNewGame }: GameResultProps) {
  const { gameState, getBestTime } = useGameStore();
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get best time for current piece count
  const bestTime = getBestTime();
  const isNewBestTime = gameState.completionTime !== undefined && 
                        bestTime > 0 && 
                        gameState.completionTime < bestTime && 
                        gameState.accuracy !== undefined && 
                        gameState.accuracy >= 80;
  
  // Determine result message and color based on accuracy
  const getResultMessage = () => {
    if (gameState.accuracy === undefined) return { text: 'Game Completed', color: 'text-text-primary' };
    
    if (gameState.accuracy >= 90) {
      return { text: 'Excellent Memory!', color: 'text-peach-400' };
    } else if (gameState.accuracy >= 70) {
      return { text: 'Great Job!', color: 'text-peach-500' };
    } else if (gameState.accuracy >= 50) {
      return { text: 'Good Effort!', color: 'text-peach-600' };
    } else {
      return { text: 'Keep Practicing!', color: 'text-peach-700' };
    }
  };
  
  const result = getResultMessage();
  
  return (
    <div className="w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-8 shadow-xl">
      <h2 className={`mb-6 text-center text-3xl font-bold ${result.color}`}>
        {result.text}
      </h2>
      
      {isNewBestTime && (
        <div className="mb-6 rounded-lg bg-peach-500/10 p-4 text-center">
          <div className="text-xl font-bold text-peach-400">🏆 New Best Time! 🏆</div>
          <div className="mt-1 text-sm text-text-secondary">You&apos;ve set a new record for {gameState.pieceCount} pieces</div>
        </div>
      )}
      
      <div className="mb-8 space-y-4">
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary">Time:</span>
          <span className="font-medium text-text-primary">
            {formatTime(gameState.completionTime || 0)}
          </span>
        </div>
        
        {bestTime > 0 && (
          <div className="flex justify-between border-b border-bg-light pb-3">
            <span className="text-text-secondary">Best Time:</span>
            <span className="font-medium text-peach-400">
              {formatTime(bestTime)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary">Accuracy:</span>
          <span className="font-medium text-text-primary">{gameState.accuracy || 0}%</span>
        </div>
        
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary">Pieces:</span>
          <span className="font-medium text-text-primary">{gameState.pieceCount}</span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <button
          onClick={onTryAgain}
          className="rounded-lg bg-peach-500 px-4 py-3 font-medium text-bg-dark transition-all hover:bg-peach-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-peach-300"
        >
          Try Again (Same Configuration)
        </button>
        
        <button
          onClick={onNewGame}
          className="rounded-lg border border-peach-500/30 bg-transparent px-4 py-3 font-medium text-text-primary transition-all hover:bg-peach-500/10 focus:outline-none focus:ring-2 focus:ring-peach-300"
        >
          New Game (Different Configuration)
        </button>
      </div>
    </div>
  );
} 