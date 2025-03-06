'use client';

import { useGameStore } from '@/lib/store/gameStore';

export default function GameControls() {
  const { gameState, startGame, stopGame, resetGame } = useGameStore();

  const handleStartStop = () => {
    if (gameState.isPlaying) {
      stopGame();
    } else {
      startGame();
    }
  };

  const handleReset = () => {
    if (!gameState.isPlaying) {
      resetGame();
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleStartStop}
        className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label={gameState.isPlaying ? "Stop Training" : "Start Training"}
      >
        {gameState.isPlaying ? 'Stop' : 'Start'} Training
      </button>
      
      <button
        onClick={handleReset}
        className={`rounded-lg border border-white/20 px-6 py-2 font-semibold text-white transition-colors ${
          gameState.isPlaying 
            ? 'cursor-not-allowed opacity-50' 
            : 'hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-gray-900'
        }`}
        aria-label="Reset Game"
        disabled={gameState.isPlaying}
      >
        Reset
      </button>
    </div>
  );
} 