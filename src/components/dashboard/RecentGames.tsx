'use client';

import { GameHistory } from '@/lib/types/game';

interface RecentGamesProps {
  readonly games: readonly GameHistory[];
}

export default function RecentGames({ games }: RecentGamesProps) {
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {games.length > 0 ? (
        games.map((game) => (
          <div
            key={game.id}
            className="rounded-lg border border-white/10 bg-gray-800 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{formatDate(game.date)}</span>
              <span className="rounded-full bg-blue-900/50 px-2 py-1 text-xs font-medium text-blue-200">
                Level {game.level}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{game.score} points</p>
                <p className="text-sm text-gray-400">{formatTime(game.duration)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${game.score > 50 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="text-sm">{game.score > 50 ? 'Good' : 'Average'}</span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-white/10 bg-gray-800 p-6 text-center">
          <p className="text-gray-400">No games played yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Start training to see your game history
          </p>
        </div>
      )}
    </div>
  );
} 