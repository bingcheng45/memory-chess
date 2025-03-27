import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { GamePhase } from '@/lib/types/game';
import { playSound } from '@/lib/utils/soundEffects';

export function useSoundEffects() {
  const { gameState, gamePhase } = useGameStore();
  
  // Use a ref to track the previous phase
  const prevPhaseRef = useRef<GamePhase | null>(null);

  // Play sounds when game phase or success state changes
  useEffect(() => {
    // Skip on initial render
    if (prevPhaseRef.current === null) {
      prevPhaseRef.current = gamePhase;
      return;
    }

    // Handle transition to RESULT phase (after submitting solution)
    if (prevPhaseRef.current !== GamePhase.RESULT && gamePhase === GamePhase.RESULT) {
      console.log('Game phase changed to RESULT, success value:', gameState.success);
      
      // Play appropriate sound based on success
      if (gameState.success) {
        console.log('Playing success sound');
        playSound('success');
      } else {
        console.log('Playing failure sound');
        playSound('failure');
      }
    }

    // Update the previous phase
    prevPhaseRef.current = gamePhase;
  }, [gamePhase, gameState.success]);

  return null; // This hook doesn't return anything
} 