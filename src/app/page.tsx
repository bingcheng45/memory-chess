'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import FaqSection from '@/components/ui/FaqSection';
import OtherAppsSection from '@/components/ui/OtherAppsSection';
import VideoSection from '@/components/ui/VideoSection';
import Footer from '@/components/ui/Footer';
import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';
import Script from 'next/script';
import { motion } from 'framer-motion';
import { Eye, Brain, TrendingUp } from 'lucide-react';

export default function Home() {
  const [totalPlays, setTotalPlays] = useState<number | null>(null);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Memory Chess",
    "url": "https://thememorychess.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://thememorychess.com/?s={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

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
        <Script id="website-schema" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(websiteSchema)}
        </Script>

        <div className="flex flex-col items-center justify-center space-y-8 text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-extrabold text-text-primary"
          >
            Train Spatial Memory with Memory Chess
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-2xl text-lg text-text-secondary"
          >
            Play a free online memory chess game to sharpen board visualization and recall.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-2xl text-lg text-text-secondary"
          >
            Join players worldwide improving their spatial memory and track results on the{' '}
            <Link href="/leaderboard" className="underline hover:text-peach-500">
              leaderboard
            </Link>.
          </motion.p>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-xl font-bold text-peach-500"
          >
            Total Games Played: {totalPlays !== null ? formatNumber(totalPlays) : '...'}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col gap-4 sm:flex-row sm:gap-6"
          >
            <Link href="/game">
              <Button
                variant="secondary"
                size="sm"
                className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5 text-sm"
              >
                Play Free
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
          </motion.div>

          <VideoSection />

          <section className="mt-16 w-full max-w-5xl">
            <h2 className="mb-8 text-2xl sm:text-3xl font-bold text-center text-text-primary">
              How Memory Chess Builds Spatial Memory
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.5 }}
                className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md"
              >
                <Eye className="h-10 w-10 text-peach-500 mb-4" />
                <h3 className="mb-2 text-xl font-semibold text-text-primary">Observe</h3>
                <p className="text-text-secondary">
                  Study a randomized chessboard for a few seconds to imprint key patterns.
                </p>
              </motion.div>

              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md"
              >
                <Brain className="h-10 w-10 text-peach-500 mb-4" />
                <h3 className="mb-2 text-xl font-semibold text-text-primary">Recreate</h3>
                <p className="text-text-secondary">
                  Rebuild the position from memory to train recall and board vision.
                </p>
              </motion.div>

              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl border border-bg-light bg-bg-card p-6 shadow-md"
              >
                <TrendingUp className="h-10 w-10 text-peach-500 mb-4" />
                <h3 className="mb-2 text-xl font-semibold text-text-primary">Improve</h3>
                <p className="text-text-secondary">
                  Get instant feedback and track your progress over time.
                </p>
              </motion.div>
            </div>
          </section>

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

        {/* Other Apps Section */}
        <OtherAppsSection />
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
