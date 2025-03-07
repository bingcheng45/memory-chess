'use client';

import { useGameStore } from '@/lib/store/gameStore';
import StatsCards from '@/components/dashboard/StatsCards';
import ProgressChart from '@/components/dashboard/ProgressChart';
import RecentGames from '@/components/dashboard/RecentGames';
import Link from 'next/link';

export default function DashboardPage() {
  const { history, getTotalGames, getBestTime, getAverageAccuracy, getHighestLevel } = useGameStore();

  return (
    <main className="min-h-screen bg-black text-peach-100">
      <div className="container mx-auto p-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-peach-100">Your Progress</h1>
            <p className="text-peach-200">Track your memory chess training performance</p>
          </div>
          <div className="mt-4 flex gap-4 sm:mt-0">
            <Link 
              href="/"
              className="inline-flex items-center rounded-lg border border-peach-500/30 px-4 py-2 font-medium text-peach-100 transition-all hover:bg-peach-500/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Home</span>
            </Link>
            <Link 
              href="/game"
              className="inline-flex items-center rounded-lg bg-peach-500 px-4 py-2 font-medium text-black transition-all hover:bg-peach-400"
            >
              <span>Start New Game</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <StatsCards 
            totalGames={getTotalGames()}
            averageScore={getAverageAccuracy()}
            highestLevel={getHighestLevel()}
            totalTimePlayed={getBestTime()}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-gray-light bg-gray-dark p-6 shadow-xl">
            <h2 className="mb-6 text-xl font-semibold text-peach-100">Performance Over Time</h2>
            <ProgressChart history={history} />
          </div>

          <div className="rounded-xl border border-gray-light bg-gray-dark p-6 shadow-xl">
            <h2 className="mb-6 text-xl font-semibold text-peach-100">Recent Games</h2>
            <RecentGames games={history.slice(0, 5)} />
          </div>
        </div>
      </div>
    </main>
  );
} 