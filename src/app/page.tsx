'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/ui/PageHeader';
import FaqSection from '@/components/ui/FaqSection';
import VideoSection from '@/components/ui/VideoSection';
import Footer from '@/components/ui/Footer';
import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';

export default function Home() {
  const [totalPlays, setTotalPlays] = useState<number | null>(null);

  // Fetch total plays from Supabase on component mount
  useEffect(() => {
    async function fetchTotalPlays() {
      try {
        const response = await fetch('/api/game-stats?metric=total_plays');
        
        if (!response.ok) {
          console.error('Failed to fetch total plays data');
          return;
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Extract the value from the correct path: data.metric_value
        const playsValue = data?.data?.metric_value;
        
        console.log('Extracted plays value:', playsValue);
        
        if (playsValue !== undefined) {
          setTotalPlays(playsValue);
        } else {
          console.error('Could not find metric_value in API response');
          setTotalPlays(0);
        }
      } catch (err) {
        console.error('Error fetching total plays:', err);
      }
    }
    
    fetchTotalPlays();
  }, []);

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader showSoundSettings={false} />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-8 text-center mb-12">
          <h2 className="text-xl font-bold text-peach-500">
            Total Games Played: {totalPlays !== null ? formatNumber(totalPlays) : '...'}
          </h2>
          
          <p className="max-w-2xl text-lg text-text-secondary">
            Train your chess memory and visualization skills through interactive exercises
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link href="/game">
              <Button 
                variant="secondary"
                size="sm"
                className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5 text-sm"
              >
                Start Training
              </Button>
            </Link>
            
            <Link href="/leaderboard">
              <Button 
                variant="outline"
                size="sm"
                className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 hover:text-peach-500 px-3 py-1.5 text-sm"
              >
                Leaderboard
              </Button>
            </Link>
          </div>

          {/* Video Section - Moved up */}
          <VideoSection />

          {/* Three cards grid */}
          <div className="mt-12 grid gap-8 sm:grid-cols-3 w-full max-w-4xl">
            <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-text-primary">Visualization</h2>
              <p className="text-text-secondary">Sharpen your mind&apos;s eye for chess, programming, and problem-solving.</p>
            </div>

            <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-text-primary">Memory</h2>
              <p className="text-text-secondary">Master grandmaster techniques to hold complex information effortlessly.</p>
            </div>

            <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-text-primary">Progress</h2>
              <p className="text-text-secondary">See measurable improvements with just 10-15 minutes of daily practice.</p>
            </div>
          </div>
          
          {/* Added Start Training button below the cards */}
          <div className="mt-8 mb-4">
            <Link href="/game">
              <Button 
                variant="default"
                size="lg"
                className="bg-peach-500 hover:bg-peach-600 text-white px-6 py-2.5 text-base font-medium"
              >
                Start Training Now
              </Button>
            </Link>
          </div>
        </div>
        
        {/* FAQ Section */}
        <FaqSection />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
