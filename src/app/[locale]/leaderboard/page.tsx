import { Suspense } from 'react';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import LeaderboardTabsFromSearchParams, {
  LeaderboardTabs,
  type LeaderboardBoards,
} from '@/components/leaderboard/LeaderboardTabs';
import PageHeader from '@/components/ui/PageHeader';
import { MAX_BOARD_SIZE_PX, PAGE_BELOW_BANNER_MIN_HEIGHT } from '@/lib/layout';
import { RANKED_DIFFICULTIES } from '@/lib/reference/facts';
import { getLeaderboard } from '@/lib/services/leaderboardService';

export const revalidate = 300;

export default async function LeaderboardPage() {
  const results = await Promise.all(
    RANKED_DIFFICULTIES.map((difficulty) => getLeaderboard(difficulty)),
  );
  // A failed revalidation that throws keeps serving the last good page; one that
  // renders would cache the error for the whole window. A build has no last
  // good page and `next dev` caches nothing, so both render the unavailable
  // state instead.
  const failure = results.find((result) => result.error);
  if (
    failure &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD
  ) {
    throw new Error(`Leaderboard refresh failed: ${failure.error}`);
  }
  const boards = Object.fromEntries(
    RANKED_DIFFICULTIES.map((difficulty, index) => [difficulty, results[index]]),
  ) as LeaderboardBoards;

  return (
    <div className={`${PAGE_BELOW_BANNER_MIN_HEIGHT} bg-bg-dark text-text-primary`}>
      <main className="container mx-auto px-1 sm:px-4 pb-8 pt-4">
        <div className="flex justify-center mb-8">
          <PageHeader
            pageType="game-memorize-solution"
            style={{
              maxWidth: MAX_BOARD_SIZE_PX,
            }}
          />
        </div>

        {/* useSearchParams makes static prerender serialise only this fallback,
            so it carries the real rows a crawler reads. */}
        <Suspense fallback={<LeaderboardTabs boards={boards} />}>
          <LeaderboardTabsFromSearchParams boards={boards} />
        </Suspense>
      </main>
    </div>
  );
}
