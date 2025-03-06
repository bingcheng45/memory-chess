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
      <div className="rounded-lg border border-white/10 bg-gray-800 p-4">
        <p className="text-sm text-gray-400">Total Games</p>
        <p className="text-2xl font-medium">{totalGames}</p>
      </div>
      
      <div className="rounded-lg border border-white/10 bg-gray-800 p-4">
        <p className="text-sm text-gray-400">Average Score</p>
        <p className="text-2xl font-medium">{averageScore}</p>
      </div>
      
      <div className="rounded-lg border border-white/10 bg-gray-800 p-4">
        <p className="text-sm text-gray-400">Highest Level</p>
        <p className="text-2xl font-medium">{highestLevel}</p>
      </div>
      
      <div className="rounded-lg border border-white/10 bg-gray-800 p-4">
        <p className="text-sm text-gray-400">Total Time Played</p>
        <p className="text-2xl font-medium">{formatTime(totalTimePlayed)}</p>
      </div>
    </>
  );
} 