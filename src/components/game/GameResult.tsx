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
    if (gameState.accuracy === undefined) return { text: 'Game Completed', color: 'text-white' };
    
    if (gameState.accuracy >= 90) {
      return { text: 'Excellent Memory!', color: 'text-green-400' };
    } else if (gameState.accuracy >= 70) {
      return { text: 'Great Job!', color: 'text-blue-400' };
    } else if (gameState.accuracy >= 50) {
      return { text: 'Good Effort!', color: 'text-yellow-400' };
    } else {
      return { text: 'Keep Practicing!', color: 'text-red-400' };
    }
  };
  
  const result = getResultMessage();
  
  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-800 p-6 shadow-lg">
      <h2 className={`mb-6 text-center text-3xl font-bold ${result.color}`}>
        {result.text}
      </h2>
      
      {isNewBestTime && (
        <div className="mb-4 rounded-lg bg-yellow-500/20 p-3 text-center text-yellow-300">
          🏆 New Best Time! 🏆
        </div>
      )}
      
      <div className="mb-8 space-y-4">
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-300">Time:</span>
          <span className="font-medium text-white">
            {formatTime(gameState.completionTime || 0)}
          </span>
        </div>
        
        {bestTime > 0 && (
          <div className="flex justify-between border-b border-gray-700 pb-2">
            <span className="text-gray-300">Best Time:</span>
            <span className="font-medium text-green-400">
              {formatTime(bestTime)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-300">Accuracy:</span>
          <span className="font-medium text-white">{gameState.accuracy || 0}%</span>
        </div>
        
        <div className="flex justify-between border-b border-gray-700 pb-2">
          <span className="text-gray-300">Pieces:</span>
          <span className="font-medium text-white">{gameState.pieceCount}</span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <button
          onClick={onTryAgain}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Try Again (Same Configuration)
        </button>
        
        <button
          onClick={onNewGame}
          className="rounded-lg bg-gray-700 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          New Game (Different Configuration)
        </button>
      </div>
    </div>
  );
} 