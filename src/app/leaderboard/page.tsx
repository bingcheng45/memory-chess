'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import PageHeader from '@/components/ui/PageHeader';
import { LeaderboardEntry } from '@/types/leaderboard';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('medium');
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
          <h1 className="text-3xl font-bold text-peach-400">⚡ Memory Legends ⚡</h1>
          
          <div className="max-w-2xl space-y-2">
            <p className="text-lg text-text-secondary text-center">
              Brain vs. Board! 🧠♟️ Can you out-memorize the competition and claim your spot among the memory elite?
            </p>
            
            <p className="text-sm text-text-secondary/80 text-center">
              Top 200 players shown • Ranked by correct pieces → speed → style points ✨
            </p>
          </div>
          
          <Tabs 
            defaultValue="medium" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full max-w-4xl"
          >
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="easy">Easy</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="hard">Hard</TabsTrigger>
              <TabsTrigger value="grandmaster">Grandmaster</TabsTrigger>
            </TabsList>
            
            <TabsContent value="easy">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
            
            <TabsContent value="medium">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
            
            <TabsContent value="hard">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
            
            <TabsContent value="grandmaster">
              <LeaderboardTable data={leaderboardData} isLoading={isLoading} error={error} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 