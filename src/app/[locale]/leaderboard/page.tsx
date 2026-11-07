import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import LeaderboardTabs from '@/components/leaderboard/LeaderboardTabs';
import { DEFAULT_BOARD } from '@/lib/leaderboard/defaultBoard';
import { getLeaderboard } from '@/lib/services/leaderboardService';
import { boardRowOf } from '@/types/leaderboard';

export const revalidate = 900;

export default async function LeaderboardPage() {
  // Only the board the page opens on is served. Every board embedded here is
  // written again on each revalidation in every locale, so the other tabs are
  // read in the browser, from the CDN-cached API, when first opened.
  const board = await getLeaderboard({ difficulty: DEFAULT_BOARD });
  // A failed revalidation that throws keeps serving the last good page; one that
  // renders would cache the error for the whole window. A build has no last
  // good page and `next dev` caches nothing, so both render the unavailable
  // state instead.
  if (board.error && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
    throw new Error(`Leaderboard refresh failed: ${board.error}`);
  }

  return (
    <main className="lab-wrap lb-main">
      <LeaderboardTabs boards={{ [DEFAULT_BOARD]: { ...board, data: board.data.map(boardRowOf) } }} />
    </main>
  );
}
