import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { GamePhase } from '@/lib/types/game';
import { playSound, isSoundEnabled } from '@/lib/utils/soundEffects';
import { trackEvent } from '@/lib/analytics/events';

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
      
      const soundEnabled = isSoundEnabled();
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'sound_settings', {
          'event_category': 'user_preferences',
          'event_label': soundEnabled ? 'sound_on' : 'sound_off',
          'value': soundEnabled ? 1 : 0
        });
      }

      const { pieceCount, memorizeTime, correctPlacements, accuracy } = useGameStore.getState().gameState;
      trackEvent({
        name: 'round_complete',
        params: {
          piece_count: pieceCount,
          memorize_time: memorizeTime,
          correct_pieces: correctPlacements ?? 0,
          accuracy: accuracy ?? 0,
        },
      });
      
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