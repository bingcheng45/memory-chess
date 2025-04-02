'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { stopTimerSound } from '@/lib/utils/soundEffects';

/**
 * Custom hook to stop sound effects when the pathname changes.
 * This ensures no sounds continue playing when navigating between pages.
 */
export function useStopSoundOnNavigate(): void {
  const pathname = usePathname();

  useEffect(() => {
    // Stop all sounds whenever the pathname changes
    console.log('Pathname changed, stopping sounds:', pathname);
    
    // Currently we only have a specific function for stopping timer sounds
    // If more sounds need to be stopped in the future, add them here
    stopTimerSound();

  }, [pathname]);
} 