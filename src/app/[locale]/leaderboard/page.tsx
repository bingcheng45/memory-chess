import { Suspense } from 'react';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import LeaderboardTabsFromSearchParams, {
  LeaderboardTabs,
  type LeaderboardBoards,
} from '@/components/leaderboard/LeaderboardTabs';
import { utcDayOf } from '@/lib/lab/daily';
import { RANKED_DIFFICULTIES } from '@/lib/reference/facts';
import { getLeaderboard } from '@/lib/services/leaderboardService';
import { DAILY_BOARD } from '@/types/leaderboard';

export const revalidate = 300;

export default async function LeaderboardPage() {
  const day = utcDayOf(Date.now());
  const all = await Promise.all([
    getLeaderboard({ difficulty: DAILY_BOARD, daily_day: day }),
    ...RANKED_DIFFICULTIES.map((difficulty) => getLeaderboard({ difficulty })),
  ]);
  const [daily, ...results] = all;
  // A failed revalidation that throws keeps serving the last good page; one that
  // renders would cache the error for the whole window. A build has no last
  // good page and `next dev` caches nothing, so both render the unavailable
  // state instead.
  const failure = all.find((result) => result.error);
  if (
    failure &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD
  ) {
    throw new Error(`Leaderboard refresh failed: ${failure.error}`);
  }
  const boards = {
    ...Object.fromEntries(RANKED_DIFFICULTIES.map((difficulty, index) => [difficulty, results[index]])),
    daily: { ...daily, day },
  } as LeaderboardBoards;

  return (
    <main className="lab-wrap lb-main">
      {/* useSearchParams makes static prerender serialise only this fallback,
          so it carries the real rows a crawler reads. */}
      <Suspense fallback={<LeaderboardTabs boards={boards} />}>
        <LeaderboardTabsFromSearchParams boards={boards} />
      </Suspense>
    </main>
  );
}
