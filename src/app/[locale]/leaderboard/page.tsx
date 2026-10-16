import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import LeaderboardTabs, { type LeaderboardBoards } from '@/components/leaderboard/LeaderboardTabs';
import { utcDayOf } from '@/lib/lab/daily';
import { RANKED_DIFFICULTIES } from '@/lib/reference/facts';
import { getLeaderboard } from '@/lib/services/leaderboardService';
import { DAILY_BOARD } from '@/types/leaderboard';

export const revalidate = 300;

export default async function LeaderboardPage() {
  const day = utcDayOf(Date.now());
  const [daily, ...rankedResults] = await Promise.all([
    getLeaderboard({ difficulty: DAILY_BOARD, daily_day: day }),
    ...RANKED_DIFFICULTIES.map((difficulty) => getLeaderboard({ difficulty })),
  ]);
  // A failed revalidation that throws keeps serving the last good page; one that
  // renders would cache the error for the whole window. A build has no last
  // good page and `next dev` caches nothing, so both render the unavailable
  // state instead.
  const rankedFailure = rankedResults.find((result) => result.error);
  if (
    rankedFailure &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD
  ) {
    throw new Error(`Leaderboard refresh failed: ${rankedFailure.error}`);
  }
  const boards = {
    ...Object.fromEntries(RANKED_DIFFICULTIES.map((difficulty, index) => [difficulty, rankedResults[index]])),
    daily: { ...daily, day },
  } as LeaderboardBoards;

  return (
    <main className="lab-wrap lb-main">
      <LeaderboardTabs boards={boards} />
    </main>
  );
}
