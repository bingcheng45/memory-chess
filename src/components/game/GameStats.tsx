'use client';

import { useGameStore } from '@/lib/store/gameStore';

import { useTranslations } from "next-intl";
export default function GameStats() {
  const t = useTranslations("game");
  const { gameState, getBestTime, getAverageAccuracy } = useGameStore();
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get best time for current piece count
  const bestTime = getBestTime();
  
  // Get average accuracy
  const averageAccuracy = getAverageAccuracy();
  
  return (
    <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-xl">
      <h2 className="mb-6 text-xl font-bold text-text-primary">{t("stats.title")}</h2>
      
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-text-secondary">{t("stats.currentTime")}</p>
          <p className="text-2xl font-bold text-text-primary">{formatTime(0)}</p>
        </div>
        
        {bestTime > 0 && (
          <div>
            <p className="text-sm font-medium text-text-secondary">Best Time ({gameState.pieceCount} pieces)</p>
            <p className="text-2xl font-bold text-peach-400">{formatTime(bestTime)}</p>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-text-secondary">{t("stats.piecesToMemorize")}</p>
          <p className="text-2xl font-bold text-text-primary">{gameState.pieceCount}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-text-secondary">{t("stats.averageAccuracy")}</p>
          <p className="text-2xl font-bold text-text-primary">{averageAccuracy}%</p>
        </div>
      </div>
    </div>
  );
} 