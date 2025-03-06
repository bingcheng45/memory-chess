'use client';

import { useGameStore } from '@/lib/store/gameStore';

export default function RecentGames() {
  const history = useGameStore((state) => state.history);

  return (
    <div className="rounded-lg border border-white/10 bg-gray-800 p-6">
      <h2 className="mb-4 text-xl font-semibold">Recent Games</h2>
      <div className="space-y-4">
        {history.length === 0 ? (
          <p className="text-center text-gray-400">No recent games</p>
        ) : (
          history.slice(0, 5).map((game) => (
            <div
              key={game.id}
              className="rounded border border-white/5 bg-gray-700/50 p-3"
            >
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">
                  {new Date(game.date).toLocaleDateString()}
                </span>
                <span className="text-sm font-semibold">
                  Level {game.level}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Score: {game.score}</span>
                <span className="text-gray-400">
                  {Math.floor(game.duration / 60)}m {game.duration % 60}s
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 