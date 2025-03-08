'use client';

interface StatsCardsProps {
  readonly totalGames: number;
  readonly averageScore: number;
  readonly highestLevel: number;
  readonly totalTimePlayed: number;
}

export default function StatsCards({ 
  totalGames, 
  averageScore, 
  highestLevel, 
  totalTimePlayed 
}: StatsCardsProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <>
      <div className="rounded-xl border border-bg-light bg-bg-card p-4 shadow-md">
        <p className="text-sm font-medium text-text-secondary">Total Games</p>
        <p className="text-2xl font-bold text-text-primary">{totalGames}</p>
      </div>
      
      <div className="rounded-xl border border-bg-light bg-bg-card p-4 shadow-md">
        <p className="text-sm font-medium text-text-secondary">Average Score</p>
        <p className="text-2xl font-bold text-text-primary">{averageScore}</p>
      </div>
      
      <div className="rounded-xl border border-bg-light bg-bg-card p-4 shadow-md">
        <p className="text-sm font-medium text-text-secondary">Highest Level</p>
        <p className="text-2xl font-bold text-text-primary">{highestLevel}</p>
      </div>
      
      <div className="rounded-xl border border-bg-light bg-bg-card p-4 shadow-md">
        <p className="text-sm font-medium text-text-secondary">Total Time Played</p>
        <p className="text-2xl font-bold text-text-primary">{formatTime(totalTimePlayed)}</p>
      </div>
    </>
  );
} 