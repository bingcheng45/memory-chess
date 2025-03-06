'use client';

import { useGameStore } from '@/lib/store/gameStore';
import StatsCards from '@/components/dashboard/StatsCards';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentGames from '@/components/dashboard/RecentGames';
import Link from 'next/link';

export default function DashboardPage() {
  const { history, getTotalGames, getAverageScore, getHighestLevel, getTotalTimePlayed } = useGameStore();

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Progress</h1>
          <p className="text-gray-400">Track your memory chess training performance</p>
        </div>
        <Link 
          href="/game"
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 sm:mt-0"
        >
          <span>Start New Game</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <StatsCards 
          totalGames={getTotalGames()}
          averageScore={getAverageScore()}
          highestLevel={getHighestLevel()}
          totalTimePlayed={getTotalTimePlayed()}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-white/10 bg-gray-800 p-4">
          <h2 className="mb-4 text-xl font-semibold">Performance Over Time</h2>
          <ProgressChart history={history} />
        </div>

        <div className="rounded-lg border border-white/10 bg-gray-800 p-4">
          <h2 className="mb-4 text-xl font-semibold">Recent Games</h2>
          <RecentGames games={history.slice(0, 5)} />
        </div>
      </div>
    </main>
  );
} 