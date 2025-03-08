'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export default function GameStats() {
  const { gameState, getBestTime, getAverageAccuracy } = useGameStore();
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start/stop timer based on game state
  useEffect(() => {
    if (gameState.isSolutionPhase) {
      // Start the timer
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Reset timer if not in solution phase
      if (!gameState.isSolutionPhase) {
        setTimer(0);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.isSolutionPhase]);
  
  // Get best time for current piece count
  const bestTime = getBestTime();
  
  // Get average accuracy
  const averageAccuracy = getAverageAccuracy();
  
  return (
    <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-xl">
      <h2 className="mb-6 text-xl font-bold text-text-primary">Game Stats</h2>
      
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-text-secondary">Current Time</p>
          <p className="text-2xl font-bold text-text-primary">{formatTime(timer)}</p>
        </div>
        
        {bestTime > 0 && (
          <div>
            <p className="text-sm font-medium text-text-secondary">Best Time ({gameState.pieceCount} pieces)</p>
            <p className="text-2xl font-bold text-peach-400">{formatTime(bestTime)}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-text-secondary">Pieces to Memorize</p>
          <p className="text-2xl font-bold text-text-primary">{gameState.pieceCount}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-text-secondary">Average Accuracy</p>
          <p className="text-2xl font-bold text-text-primary">{averageAccuracy}%</p>
        </div>
      </div>
    </div>
  );
} 