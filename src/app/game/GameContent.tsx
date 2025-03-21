'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GamePhase } from '@/types/game';
import GameConfig from '@/components/game/GameConfig';
import { Button } from '@/components/ui/button';

export function GameContent() {
  const { 
    phase, 
    error,
    isLoading,
    config,
    originalPosition,
    accuracy,
    correctPlacements,
    startGame,
    endMemorization,
    submitSolution,
    resetGame
  } = useGameStore();

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Game error:', error);
    }
  }, [error]);

  // Render the appropriate component based on the current game phase
  const renderPhaseContent = () => {
    switch (phase) {
      case GamePhase.CONFIGURATION:
        return <GameConfig onStart={startGame} />;
      
      case GamePhase.MEMORIZATION:
        return (
          <div className="text-center p-4 sm:p-8 bg-gray-800 rounded-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Memorization Phase</h2>
            <p className="mb-4 text-gray-300">Memorize the position of the pieces on the board.</p>
            <div className="mb-8 relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${(config.memorizeTime / 30) * 100}%` }}
              ></div>
            </div>
            <p className="mb-8 text-xl font-bold">Time remaining: {config.memorizeTime} seconds</p>
            <Button 
              onClick={endMemorization}
              variant="primary"
              className="w-full sm:w-auto"
            >
              I&apos;m Ready
            </Button>
          </div>
        );
      
      case GamePhase.SOLUTION:
        return (
          <div className="text-center p-4 sm:p-8 bg-gray-800 rounded-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Solution Phase</h2>
            <p className="mb-8 text-gray-300">Recreate the position from memory.</p>
            <Button 
              onClick={submitSolution}
              variant="primary"
              className="w-full sm:w-auto"
            >
              Submit Solution
            </Button>
          </div>
        );
      
      case GamePhase.RESULT:
        return (
          <div className="text-center p-4 sm:p-8 bg-gray-800 rounded-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Results</h2>
            <div className="mb-6">
              <p className="text-lg mb-2 text-gray-300">Accuracy</p>
              <p className="text-4xl font-bold">{accuracy || 0}%</p>
            </div>
            <div className="mb-8">
              <p className="text-lg mb-2 text-gray-300">Correct Placements</p>
              <p className="text-4xl font-bold">{correctPlacements || 0} / {originalPosition.length}</p>
            </div>
            <Button 
              onClick={resetGame}
              variant="primary"
              className="w-full sm:w-auto"
            >
              Play Again
            </Button>
          </div>
        );
      
      default:
        return <div>Unknown game phase</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Memory Chess</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/50 text-white p-4 rounded-lg mb-8 max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
          <Button 
            onClick={resetGame}
            variant="destructive"
            className="mt-4 w-full sm:w-auto"
          >
            Reset Game
          </Button>
        </div>
      ) : (
        renderPhaseContent()
      )}
    </div>
  );
} 