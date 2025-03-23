import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export function useGameLogic() {
  const { gameState, makeMove } = useGameStore();

  const handleMove = useCallback((move: string) => {
    if (makeMove(move)) {
      // Score update is handled within the store
      return true;
    }
    return false;
  }, [makeMove]);

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