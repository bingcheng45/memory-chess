'use client';

import { useGameStore } from '@/lib/store/gameStore';

export default function StatsCards() {
  const {
    getTotalGames,
    getAverageScore,
    getHighestLevel,
    getTotalTimePlayed,
  } = useGameStore();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  const stats = [
    { label: 'Total Games', value: getTotalGames().toString() },
    { label: 'Average Score', value: getAverageScore().toString() },
    { label: 'Highest Level', value: getHighestLevel().toString() },
    { label: 'Time Played', value: formatTime(getTotalTimePlayed()) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-white/10 bg-gray-800 p-4"
        >
          <p className="text-sm text-gray-400">{stat.label}</p>
          <p className="text-2xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
} 