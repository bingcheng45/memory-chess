'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export default function GameStats() {
  const { gameState } = useGameStore();
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer when game is playing
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (gameState.isPlaying) {
      // Start a new timer
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      // Reset timer when game stops
      setTimer(0);
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState.isPlaying]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-lg border border-white/10 bg-gray-800 p-4">
      <h2 className="mb-4 text-xl font-semibold">Game Stats</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Score</p>
          <p className="text-lg font-medium">{gameState.score}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Level</p>
          <p className="text-lg font-medium">{gameState.level || gameState.currentLevel}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Time</p>
          <p className="text-lg font-medium">{formatTime(timer)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Moves</p>
          <p className="text-lg font-medium">{gameState.moves?.length || 0}</p>
        </div>
      </div>
    </div>
  );
} 