'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import PageHeader from '@/components/ui/PageHeader';
import { LeaderboardEntry } from '@/types/leaderboard';
import { useSearchParams } from 'next/navigation';

// Interface for entry details from URL params
interface EntryDetails {
  player: string | null;
  difficulty: string | null;
  memorizeTime: number | null;
  solutionTime: number | null;
  pieceCount: number | null;
  correctPieces: number | null;
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  
  // Extract all parameters for precise entry identification
  const entryDetails: EntryDetails = {
    player: searchParams.get('player'),
    difficulty: searchParams.get('difficulty'),
    memorizeTime: searchParams.get('memorizeTime') ? parseFloat(searchParams.get('memorizeTime')!) : null,
    solutionTime: searchParams.get('solutionTime') ? parseFloat(searchParams.get('solutionTime')!) : null,
    pieceCount: searchParams.get('pieceCount') ? parseInt(searchParams.get('pieceCount')!) : null,
    correctPieces: searchParams.get('correctPieces') ? parseInt(searchParams.get('correctPieces')!) : null
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
            throw new Error('Request timed out. Please try again later.');
          }
          throw err;
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json().catch(() => {
          throw new Error('Failed to parse server response. Please try again later.');
        });
        
        if (!response.ok || result.error) {
          // If the API returns an error but with status 200, we'll still catch it here
          throw new Error(result.error || `Request failed with status ${response.status}`);
        }
        
        setLeaderboardData(result.data || []);
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLeaderboardData();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-8">
          <h1 className="text-3xl font-bold text-peach-400">Memory Chess Rankings</h1>
          
          <div className="max-w-2xl space-y-2">
            <p className="text-lg text-text-secondary text-center">
              Master the board through visualization. Compete against the world&apos;s best in mental precision and speed.
            </p>
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
              >
                Easy
              </TabsTrigger>
              <TabsTrigger 
                value="medium"
                className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
              >
                Medium
              </TabsTrigger>
              <TabsTrigger 
                value="hard"
                className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
              >
                Hard
              </TabsTrigger>
              <TabsTrigger 
                value="grandmaster"
                className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
              >
                Grandmaster
              </TabsTrigger>
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
          
          <div className="w-full max-w-4xl flex justify-end">
            <p className="text-xs text-text-secondary/70 italic">
              Displaying top 200 only. Ranked by accuracy, memorization time, and solution speed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 