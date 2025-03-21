'use client';

import { useEffect } from 'react';
import { playSound } from '@/lib/utils/sound';

interface KeyboardShortcuts {
  onNewGame?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  gameStatus?: string;
}

export function useKeyboardShortcuts({
  onNewGame,
  onPause,
  onResume,
  onReset,
  gameStatus
}: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts if no input element is focused
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (event.key.toLowerCase()) {
        case 'n':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            playSound('click');
            onNewGame?.();
          }
          break;

        case ' ':
          event.preventDefault();
          playSound('click');
          if (onPause && onResume) {
            if (gameStatus === 'playing') {
              onPause();
            } else {
              onResume();
            }
          }
          break;

        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            playSound('click');
            onReset?.();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewGame, onPause, onResume, onReset, gameStatus]);
} 