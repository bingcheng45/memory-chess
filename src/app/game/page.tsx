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
      startMemorizationPhase();
    }
  }, [gameState.isPlaying, gamePhase, startMemorizationPhase]);
  
  // Auto-transition from memorization to solution phase
  useEffect(() => {
    if (gameState.isMemorizationPhase) {
      const timer = setTimeout(() => {
        endMemorizationPhase();
        startSolutionPhase();
      }, gameState.memorizeTime * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState.isMemorizationPhase, gameState.memorizeTime, endMemorizationPhase, startSolutionPhase]);
  
  // Track elapsed time during solution phase
  useEffect(() => {
    if (gameState.isSolutionPhase) {
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
    submitSolution();
  };
  
  // Handle trying again with the same configuration
  const handleTryAgain = () => {
    resetGame();
    startGame(gameState.pieceCount, gameState.memorizeTime);
  };
  
  // Handle starting a new game with different configuration
  const handleNewGame = () => {
    resetGame();
  };
  
  // Handle starting the game from configuration
  const handleStartGame = () => {
    // The GameConfig component already calls startGame
    // This is just a placeholder for the onStart prop
  };
  
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
              <div className="text-xl font-bold text-white">
                Time: {formatTime(elapsedTime)}
              </div>
              <button
                onClick={handleSubmitSolution}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
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
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-8 text-center text-3xl font-bold text-white">Memory Chess</h1>
      
      {renderGameContent()}
    </main>
  );
} 