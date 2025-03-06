'use client';

import { useGameStore } from '@/lib/store/gameStore';

export default function GameControls() {
  const { gameState, startGame, stopGame, resetGame } = useGameStore();

  return (
    <div className="flex gap-4">
      <button
        onClick={gameState.isPlaying ? stopGame : startGame}
        className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        {gameState.isPlaying ? 'Stop' : 'Start'} Training
      </button>
      
      <button
        onClick={resetGame}
        className="rounded-lg border border-white/20 px-6 py-2 font-semibold text-white transition-colors hover:bg-white/10"
      >
        Reset
      </button>
    </div>
  );
} 