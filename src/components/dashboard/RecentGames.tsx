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
            className="rounded-xl border border-bg-light bg-bg-card p-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">{formatDate(game.date)}</span>
              <span className="rounded-full bg-indigo-500/30 px-2 py-1 text-xs font-medium text-indigo-300">
                Level {game.level}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-text-primary">
                  {formatTime(game.completionTime)} time
                </p>
                <p className="text-sm text-text-secondary">{game.accuracy}% accuracy</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  game.accuracy >= 80 ? 'bg-peach-500' : 
                  game.accuracy >= 50 ? 'bg-indigo-500' : 'bg-teal-500'
                }`}></span>
                <span className="text-sm font-medium text-text-secondary">
                  {game.accuracy >= 80 ? 'Excellent' : 
                   game.accuracy >= 50 ? 'Good' : 'Practice'}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-bg-light bg-bg-card p-6 text-center shadow-md">
          <p className="text-text-secondary">No games played yet</p>
          <p className="mt-2 text-sm text-text-muted">
            Start training to see your game history
          </p>
        </div>
      )}
    </div>
  );
} 