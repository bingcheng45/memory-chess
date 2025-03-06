'use client';

import { useEffect, useState } from 'react';
import ChessBoard from '@/components/game/ChessBoard';
import GameControls from '@/components/game/GameControls';
import GameStats from '@/components/game/GameStats';
import { useGameStore } from '@/lib/store/gameStore';
import Link from 'next/link';

export default function GamePage() {
  const { gameState, makeMove, stopGame, startGame } = useGameStore();
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize the game when the component mounts
  useEffect(() => {
    // Reset the game state when the component mounts
    if (!isLoaded) {
      startGame();
      setIsLoaded(true);
    }
  }, [isLoaded, startGame]);

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (gameState.isPlaying) {
        stopGame();
      }
    };
  }, [gameState.isPlaying, stopGame]);

  const handleMove = (move: string): boolean => {
    try {
      return makeMove(move);
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chess Training</h1>
        <Link 
          href="/"
          className="rounded-lg border border-white/20 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10"
        >
          Back to Home
        </Link>
      </div>
      
      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="flex flex-col items-center gap-8">
          <ChessBoard onMove={handleMove} />
          <GameControls />
        </div>
        <div>
          <GameStats />
        </div>
      </div>
    </main>
  );
} 