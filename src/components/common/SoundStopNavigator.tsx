'use client';

import { useStopSoundOnNavigate } from '@/hooks/useStopSoundOnNavigate';

/**
 * Client component wrapper to execute the useStopSoundOnNavigate hook.
 */
export default function SoundStopNavigator(): null {
  useStopSoundOnNavigate();
  return null; // This component doesn't render anything itself
} 