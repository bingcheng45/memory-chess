'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import FaqSection from '@/components/ui/FaqSection';
import OtherAppsSection from '@/components/ui/OtherAppsSection';
import VideoSection from '@/components/ui/VideoSection';
import Footer from '@/components/ui/Footer';
import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';
import { getPieceImageUrl } from '@/utils/chessPieces';
import { PieceColor, PieceType } from '@/types/chess';
import Script from 'next/script';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Eye,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const memorySteps = [
  {
    label: '01',
    title: 'Observe',
    description:
      'Scan the board like a position, not a picture. Anchor pieces, colors, and diagonals into a quick mental map.',
    icon: Eye,
  },
  {
    label: '02',
    title: 'Recreate',
    description:
      'Rebuild the position from memory so board vision becomes active recall instead of passive recognition.',
    icon: Brain,
  },
  {
    label: '03',
    title: 'Improve',
    description:
      'Use instant feedback to spot which squares, piece types, and patterns fade first, then train the next board smarter.',
    icon: TrendingUp,
  },
];

// prettier-ignore
const memoryBoardSquares: Array<{ type: PieceType; color: PieceColor } | null> = [
  null, { type: 'knight', color: 'black' }, null, null, { type: 'queen', color: 'white' }, null, null, null,
  null, null, null, { type: 'pawn', color: 'white' }, null, null, { type: 'bishop', color: 'black' }, null,
  { type: 'rook', color: 'black' }, null, null, null, null, { type: 'knight', color: 'white' }, null, null,
  null, null, { type: 'pawn', color: 'black' }, null, null, null, null, null,
  null, { type: 'bishop', color: 'white' }, null, null, { type: 'king', color: 'black' }, null, null, null,
  null, null, null, null, null, null, { type: 'rook', color: 'white' }, null,
  null, null, { type: 'king', color: 'white' }, null, null, null, null, { type: 'queen', color: 'black' },
  null, null, null, null, { type: 'pawn', color: 'white' }, null, null, null,
];

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
          return;
        }
        
        const data = await response.json();
        
        // Extract the value from the correct path: data.metric_value
        const playsValue = data?.data?.metric_value;
        
        if (playsValue !== undefined) {
          setTotalPlays(playsValue);
        }
      } catch {
        // Stats are optional; keep the homepage usable when local Supabase env vars are absent.
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

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6 }}
            className="mt-16 w-full max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(20,20,20,0.96),rgba(10,10,10,0.98)),linear-gradient(90deg,rgba(255,179,128,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(94,234,212,0.06)_1px,transparent_1px)] bg-[length:auto,48px_48px,48px_48px] shadow-2xl shadow-black/30"
          >
            <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="border-b border-white/10 p-6 text-left sm:p-8 lg:border-b-0 lg:border-r">
                <div className="mb-8 flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-peach-500/30 bg-peach-500/10">
                    <Sparkles className="h-4 w-4 text-peach-400" />
                  </span>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-peach-300">
                    Spatial memory loop
                  </p>
                </div>

                <h2 className="max-w-xl text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
                  How Memory Chess Builds Spatial Memory
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
                  A sharper training rhythm for turning a board position into a
                  remembered structure: notice the anchors, reconstruct the map,
                  then refine the recall.
                </p>

                <div className="mt-10 grid gap-4">
                  {memorySteps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <motion.div
                        key={step.title}
                        whileInView={{ opacity: 1, x: 0 }}
                        initial={{ opacity: 0, x: -18 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.45, delay: index * 0.08 }}
                        className="group grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left transition duration-300 hover:border-peach-500/35 hover:bg-white/[0.06]"
                      >
                        <div className="flex flex-col items-center">
                          <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-bg-dark text-peach-300 transition duration-300 group-hover:border-peach-500/35">
                            <Icon className="h-5 w-5" />
                          </span>
                          {index < memorySteps.length - 1 && (
                            <span className="mt-3 h-10 w-px bg-gradient-to-b from-peach-500/50 to-teal-400/20" />
                          )}
                        </div>
                        <div>
                          <div className="mb-2 flex items-center gap-3">
                            <span className="font-mono text-xs text-teal-300">
                              {step.label}
                            </span>
                            <h3 className="text-xl font-semibold text-text-primary">
                              {step.title}
                            </h3>
                          </div>
                          <p className="max-w-xl text-sm leading-6 text-text-muted">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-8 p-6 text-left sm:p-8">
                <div>
                  <div
                    aria-hidden="true"
                    className="mx-auto grid aspect-square w-full max-w-sm grid-cols-8 overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/40"
                  >
                    {memoryBoardSquares.map((piece, index) => {
                      const row = Math.floor(index / 8);
                      const col = index % 8;
                      const isWarmSquare = (row + col) % 2 === 0;

                      return (
                        <div
                          key={`${piece?.color ?? 'empty'}-${piece?.type ?? 'square'}-${index}`}
                          className="flex items-center justify-center border border-black/15"
                          style={{
                            backgroundColor: isWarmSquare
                              ? 'var(--board-light)'
                              : 'var(--board-dark)',
                          }}
                        >
                          {piece && (
                            <Image
                              src={getPieceImageUrl(piece.type, piece.color)}
                              alt=""
                              width={48}
                              height={48}
                              sizes="(max-width: 640px) 9vw, 48px"
                              className="h-[72%] w-[72%] object-contain drop-shadow-md"
                              draggable={false}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mx-auto mt-4 flex max-w-sm items-center justify-between text-xs text-text-muted">
                    <span>5 second imprint</span>
                    <span className="h-px flex-1 bg-white/10 mx-3" />
                    <span>pattern recall</span>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-bg-dark/80 p-5 shadow-xl shadow-black/20">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-300">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-teal-300">
                        Learning Center
                      </p>
                      <h3 className="text-xl font-bold leading-snug text-text-primary">
                        Chess Memory and Visualization
                      </h3>
                    </div>
                  </div>
                  <p className="mb-5 text-sm leading-6 text-text-muted">
                    Beginner-focused guides pair board vision drills with
                    practical routines and direct links back into training.
                  </p>
                  <div className="grid gap-3">
                    <Link href="/learn" className="group">
                      <Button className="w-full justify-between bg-peach-500 text-bg-dark hover:bg-peach-400">
                        Explore Learning Center
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                    <Link
                      href="/learn/how-to-get-better-at-chess-for-beginners"
                      className="group"
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-between border-white/15 bg-white/[0.03] text-text-primary hover:bg-white/[0.07] hover:text-peach-300"
                      >
                        Start with beginner roadmap
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

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
