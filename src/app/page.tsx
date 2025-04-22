'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/ui/PageHeader';
import FaqSection from '@/components/ui/FaqSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <PageHeader showSoundSettings={false} />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-8 text-center mb-16">
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

          <div className="mt-12 grid gap-8 sm:grid-cols-3 w-full max-w-4xl">
            <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-text-primary">Visualization</h2>
              <p className="text-text-secondary">Train your ability to see the board in your mind</p>
            </div>

            <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-text-primary">Memory</h2>
              <p className="text-text-secondary">Remember positions and sequences of moves</p>
            </div>

            <div className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md transition-all hover:shadow-lg">
              <h2 className="mb-2 text-xl font-semibold text-text-primary">Progress</h2>
              <p className="text-text-secondary">Track your improvement over time</p>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <FaqSection />
      </main>
    </div>
  );
}
