'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { Button } from '@/components/ui/button';

export default function GameControls() {
  const { gameState, startGame, stopGame, resetGame } = useGameStore();

  const handleStartStop = () => {
    if (gameState.isPlaying) {
      stopGame();
    } else {
      startGame(gameState.pieceCount || 8, gameState.memorizeTime || 10);
    }
  };

  const handleReset = () => {
    if (!gameState.isPlaying) {
      resetGame();
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        onClick={handleStartStop}
        variant="primary"
        aria-label={gameState.isPlaying ? "Stop Training" : "Start Training"}
      >
        {gameState.isPlaying ? 'Stop' : 'Start'} Training
      </Button>
      
      <Button
        onClick={handleReset}
        variant="outline"
        aria-label="Reset Game"
        disabled={gameState.isPlaying}
        className={gameState.isPlaying ? 'opacity-50' : ''}
      >
        Reset
      </Button>
    </div>
  );
} 