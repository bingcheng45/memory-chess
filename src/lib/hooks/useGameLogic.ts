import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export function useGameLogic() {
  const { gameState, chess, makeMove, updateScore } = useGameStore();

  const handleMove = useCallback((move: string) => {
    if (makeMove(move)) {
      updateScore(10); // Basic scoring
      return true;
    }
    return false;
  }, [makeMove, updateScore]);

  // Add game timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState.isPlaying) {
      interval = setInterval(() => {
        useGameStore.setState((state) => ({
          gameState: {
            ...state.gameState,
            timeElapsed: state.gameState.timeElapsed + 1,
          },
        }));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [gameState.isPlaying]);

  return {
    handleMove,
  };
} 