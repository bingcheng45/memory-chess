'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { GamePhase } from '@/lib/types/game';
import GameConfig from '@/components/game/GameConfig';
import MemorizationBoard from '@/components/game/MemorizationBoard';
import SolutionBoard from '@/components/game/SolutionBoard';
import GameResult from '@/components/game/GameResult';
import GameStats from '@/components/game/GameStats';

export default function GamePage() {
  const { 
    gameState, 
    gamePhase, 
    startGame, 
    resetGame, 
    startMemorizationPhase, 
    endMemorizationPhase, 
    startSolutionPhase, 
    submitSolution 
  } = useGameStore();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Start memorization phase when game is started
  useEffect(() => {
    if (gameState.isPlaying && gamePhase === GamePhase.CONFIGURATION) {
      console.log('Starting memorization phase');
      startMemorizationPhase();
    }
  }, [gameState.isPlaying, gamePhase, startMemorizationPhase]);
  
  // Auto-transition from memorization to solution phase
  useEffect(() => {
    if (gameState.isMemorizationPhase) {
      console.log(`Setting timeout for ${gameState.memorizeTime} seconds`);
      const timer = setTimeout(() => {
        console.log('Memorization time ended, transitioning to solution phase');
        endMemorizationPhase();
        startSolutionPhase();
      }, gameState.memorizeTime * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState.isMemorizationPhase, gameState.memorizeTime, endMemorizationPhase, startSolutionPhase]);
  
  // Track elapsed time during solution phase
  useEffect(() => {
    if (gameState.isSolutionPhase) {
      console.log('Starting solution phase timer');
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setElapsedTime(0);
    }
  }, [gameState.isSolutionPhase]);
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle submitting the solution
  const handleSubmitSolution = () => {
    console.log('Submitting solution');
    submitSolution();
  };
  
  // Handle trying again with the same configuration
  const handleTryAgain = () => {
    console.log('Trying again with same configuration');
    resetGame();
    startGame(gameState.pieceCount, gameState.memorizeTime);
  };
  
  // Handle starting a new game with different configuration
  const handleNewGame = () => {
    console.log('Starting new game with different configuration');
    resetGame();
  };
  
  // Handle starting the game from configuration
  const handleStartGame = (pieceCount: number, memorizeTime: number) => {
    console.log(`Starting game with ${pieceCount} pieces and ${memorizeTime}s memorize time`);
    startGame(pieceCount, memorizeTime);
  };
  
  console.log('Current game phase:', gamePhase);
  
  // Render the appropriate component based on game phase
  const renderGameContent = () => {
    switch (gamePhase) {
      case GamePhase.CONFIGURATION:
        return (
          <div className="flex flex-col items-center">
            <GameConfig onStart={handleStartGame} />
            {gameState.completionTime !== undefined && (
              <div className="mt-8">
                <GameStats />
              </div>
            )}
          </div>
        );
        
      case GamePhase.MEMORIZATION:
        return <MemorizationBoard />;
        
      case GamePhase.SOLUTION:
        return (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex w-full max-w-[600px] items-center justify-between">
              <div className="text-xl font-bold text-peach-100">
                Time: {formatTime(elapsedTime)}
              </div>
              <button
                onClick={handleSubmitSolution}
                className="rounded-lg bg-peach-500 px-4 py-2 font-medium text-black transition-colors hover:bg-peach-400 focus:outline-none focus:ring-2 focus:ring-peach-300"
                type="button"
              >
                Submit Solution
              </button>
            </div>
            <SolutionBoard />
          </div>
        );
        
      case GamePhase.RESULT:
        return <GameResult onTryAgain={handleTryAgain} onNewGame={handleNewGame} />;
        
      default:
        return <GameConfig onStart={handleStartGame} />;
    }
  };
  
  return (
    <main className="min-h-screen bg-black text-peach-100">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="mb-8 text-center text-4xl font-bold text-peach-100">
          Memory <span className="text-peach-500">Chess</span>
        </h1>
        
        {renderGameContent()}
      </div>
    </main>
  );
} 