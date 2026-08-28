'use client';

import { useState, useEffect, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import PageHeader from '@/components/ui/PageHeader';
import { MAX_BOARD_SIZE_PX, PAGE_BELOW_BANNER_MIN_HEIGHT } from '@/lib/layout';
import { LeaderboardEntry } from '@/types/leaderboard';
import { useSearchParams } from 'next/navigation';
import { Link } from "@/i18n/navigation";
import { Button } from '@/components/ui/button';

import { useTranslations } from "next-intl";
// Interface for entry details from URL params
interface EntryDetails {
  player: string | null;
  difficulty: string | null;
  memorizeTime: number | null;
  solutionTime: number | null;
  pieceCount: number | null;
  correctPieces: number | null;
  totalWrongPieces: number | null;
}

// Component that uses searchParams - needs to be wrapped in Suspense
function LeaderboardContent() {
  const t = useTranslations("leaderboard");
  // Difficulty names are the same strings the game config shows; reuse them
  // rather than translating "Easy" twice and letting the two drift.
  const tg = useTranslations("game");
  const searchParams = useSearchParams();
  
  // Extract all parameters for precise entry identification
  const entryDetails: EntryDetails = {
    player: searchParams.get('player'),
    difficulty: searchParams.get('difficulty'),
    memorizeTime: searchParams.get('memorizeTime') ? parseFloat(searchParams.get('memorizeTime')!) : null,
    solutionTime: searchParams.get('solutionTime') ? parseFloat(searchParams.get('solutionTime')!) : null,
    pieceCount: searchParams.get('pieceCount') ? parseInt(searchParams.get('pieceCount')!) : null,
    correctPieces: searchParams.get('correctPieces') ? parseInt(searchParams.get('correctPieces')!) : null,
    totalWrongPieces: searchParams.get('totalWrongPieces') ? parseInt(searchParams.get('totalWrongPieces')!) : null
  };
  
  const [activeTab, setActiveTab] = useState(
    entryDetails.difficulty && ['easy', 'medium', 'hard', 'grandmaster'].includes(entryDetails.difficulty) 
      ? entryDetails.difficulty 
      : 'medium'
  );
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data based on active tab
  useEffect(() => {
    async function fetchLeaderboardData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
        
        const response = await fetch(`/api/leaderboard?difficulty=${activeTab}`, {
          signal: controller.signal
        }).catch(err => {
          if (err.name === 'AbortError') {
            throw new Error(t('errors.timeout'));
          }
          throw err;
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json().catch(() => {
          throw new Error(t('errors.parse'));
        });
        
        if (!response.ok || result.error) {
          // If the API returns an error but with status 200, we'll still catch it here
          throw new Error(result.error || t('errors.status', { status: response.status }));
        }
        
        setLeaderboardData(result.data || []);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError(err instanceof Error ? err.message : t('errors.unexpected'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLeaderboardData();
  }, [activeTab, t]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      <h1 className="text-3xl font-bold text-peach-400">{t("title")}</h1>
      
      <div className="max-w-2xl space-y-2">
        <p className="text-lg text-text-secondary text-center">{t("subtitle")}</p>
      </div>
      
      <Tabs 
        defaultValue="medium" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-4xl"
      >
        <TabsList className="grid grid-cols-4 mb-8 bg-bg-light/30">
          <TabsTrigger 
            value="easy"
            className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
          >{tg("presets.easy.label")}</TabsTrigger>
          <TabsTrigger 
            value="medium"
            className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
          >{tg("presets.medium.label")}</TabsTrigger>
          <TabsTrigger 
            value="hard"
            className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
          >{tg("presets.hard.label")}</TabsTrigger>
          <TabsTrigger 
            value="grandmaster"
            className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
          >{tg("presets.grandmaster.label")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="easy">
          <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} entryDetails={entryDetails} activeTab="easy" />
        </TabsContent>
        
        <TabsContent value="medium">
          <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} entryDetails={entryDetails} activeTab="medium" />
        </TabsContent>
        
        <TabsContent value="hard">
          <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} entryDetails={entryDetails} activeTab="hard" />
        </TabsContent>
        
        <TabsContent value="grandmaster">
          <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} entryDetails={entryDetails} activeTab="grandmaster" />
        </TabsContent>
      </Tabs>
      
      {/* Start Playing Now button - only shown when there's data */}
      {leaderboardData.length > 0 && !isLoading && !error && (
        <div className="w-full flex justify-center mt-4 mb-6">
          <Link href={`/game?difficulty=${activeTab}`} className="inline-block">
            <Button 
              variant="secondary"
              className="bg-peach-500 text-white hover:bg-peach-600 px-6 py-2"
              size="lg"
            >{t("claimRank")}</Button>
          </Link>
        </div>
      )}
      
      <div className="w-full max-w-4xl flex justify-end">
        <p className="text-xs text-text-secondary/70 italic">{t("footnote")}</p>
      </div>
    </div>
  );
}

// Loading fallback component
function LeaderboardLoading() {
  const t = useTranslations("leaderboard");
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
        <div className="flex flex-col items-center justify-center space-y-8">
          <h1 className="text-3xl font-bold text-peach-400">{t("title")}</h1>
          <div className="max-w-2xl space-y-2">
            <p className="text-lg text-text-secondary text-center">{t("loading")}</p>
          </div>
          <div className="w-full max-w-4xl flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-peach-500 rounded-full border-t-transparent"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main export - the wrapper with suspense boundary
export default function LeaderboardPage() {
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

        <Suspense fallback={<LeaderboardLoading />}>
          <LeaderboardContent />
        </Suspense>
      </main>
    </div>
  );
}
