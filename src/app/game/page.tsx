'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { GamePhase } from '@/lib/types/game';
import GameConfig from '@/components/game/GameConfig';
import MemorizationBoard from '@/components/game/MemorizationBoard';
import SolutionBoard from '@/components/game/SolutionBoard';
import GameResult from '@/components/game/GameResult';
import GameStats from '@/components/game/GameStats';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SoundSettings from '@/components/ui/SoundSettings';
import { playSound } from '@/lib/utils/soundEffects';
import Link from 'next/link';
import { useAnalytics, AnalyticsEventType } from '@/lib/utils/analyticsTracker';

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();
  
  // Get query parameters
  const challengeId = searchParams.get('challenge');
  const pieceCountParam = searchParams.get('pieceCount');
  const memorizeTimeParam = searchParams.get('memorizeTime');
  
  // Parse parameters with defaults
  const pieceCount = pieceCountParam ? parseInt(pieceCountParam) : 8;
  const memorizeTime = memorizeTimeParam ? parseInt(memorizeTimeParam) : 10;
  
  const { 
    gameState, 
    gamePhase, 
    startGame, 
    resetGame, 
    startMemorizationPhase, 
    endMemorizationPhase, 
    startSolutionPhase, 
    submitSolution,
    calculateSkillRatingChange
  } = useGameStore();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerWarningPlayed, setTimerWarningPlayed] = useState(false);
  
  // Track initial page load
  useEffect(() => {
    analytics.trackFeatureUsage('game_page', 'view');
    
    // Clean up game state when leaving
    return () => {
      resetGame();
    };
  }, []);
  
  // Start game with parameters from URL if provided
  useEffect(() => {
    if (pieceCountParam || memorizeTimeParam) {
      startGame(pieceCount, memorizeTime);
      
      // Track game start
      analytics.trackGameStart(
        pieceCount, 
        memorizeTime, 
        !!challengeId
      );
    }
  }, [pieceCountParam, memorizeTimeParam, challengeId]);
  
  // Track phase changes
  useEffect(() => {
    if (gamePhase === GamePhase.MEMORIZATION) {
      analytics.track(AnalyticsEventType.MEMORIZATION_PHASE, {
        pieceCount: gameState.pieceCount,
        memorizeTime: gameState.memorizeTime
      });
    } else if (gamePhase === GamePhase.SOLUTION) {
      analytics.track(AnalyticsEventType.SOLUTION_PHASE, {
        pieceCount: gameState.pieceCount,
        memorizeTime: gameState.memorizeTime
      });
    } else if (gamePhase === GamePhase.RESULT && gameState.accuracy !== undefined) {
      // Calculate skill rating change
      const skillRatingChange = calculateSkillRatingChange(
        gameState.accuracy,
        gameState.pieceCount,
        gameState.completionTime || 0
      );
      
      // Create a game history object for analytics
      const gameHistoryForAnalytics = {
        id: '',
        timestamp: Date.now(),
        pieceCount: gameState.pieceCount,
        memorizeTime: gameState.memorizeTime,
        accuracy: gameState.accuracy || 0,
        correctPlacements: 0,
        totalPlacements: 0,
        level: gameState.level || 1,
        duration: gameState.completionTime ? 
          Math.floor((gameState.completionTime - (gameState.memorizeStartTime || 0)) / 1000) : 0
      };
      
      // Track game completion
      analytics.trackGameComplete(gameHistoryForAnalytics, skillRatingChange);
      
      // Track daily challenge completion if applicable
      if (challengeId) {
        analytics.trackDailyChallengeComplete(gameHistoryForAnalytics, skillRatingChange);
      }
    }
  }, [gamePhase, gameState]);
  
  // Start memorization phase when game is started
  useEffect(() => {
    if (gameState.isPlaying && gamePhase === GamePhase.CONFIGURATION) {
      console.log('Starting memorization phase');
      playSound('click');
      startMemorizationPhase();
    }
  }, [gameState.isPlaying, gamePhase, startMemorizationPhase]);
  
  // Auto-transition from memorization to solution phase
  useEffect(() => {
    if (gameState.isMemorizationPhase) {
      console.log(`Setting timeout for ${gameState.memorizeTime} seconds`);
      setTimerWarningPlayed(false);
      
      // Play timer start sound
      playSound('timer');
      
      const timer = setTimeout(() => {
        console.log('Memorization time ended, transitioning to solution phase');
        playSound('timerEnd');
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
      setElapsedTime(0);
      
      const timer = setInterval(() => {
        setElapsedTime(prev => {
          // Play warning sound when 75% of the memorization time has elapsed
          if (!timerWarningPlayed && prev >= Math.floor(gameState.memorizeTime * 0.75)) {
            playSound('timer');
            setTimerWarningPlayed(true);
          }
          return prev + 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setElapsedTime(0);
    }
  }, [gameState.isSolutionPhase, gameState.memorizeTime, timerWarningPlayed]);
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle submitting the solution
  const handleSubmitSolution = () => {
    console.log('Submitting solution');
    playSound('click');
    submitSolution();
    
    // Play success or failure sound based on accuracy
    setTimeout(() => {
      if (gameState.accuracy && gameState.accuracy >= 70) {
        playSound('success');
      } else {
        playSound('failure');
      }
    }, 500);
  };
  
  // Handle trying again with the same configuration
  const handleTryAgain = () => {
    console.log('Trying again with same configuration');
    playSound('click');
    resetGame();
    startGame(gameState.pieceCount, gameState.memorizeTime);
  };
  
  // Handle starting a new game with different configuration
  const handleNewGame = () => {
    console.log('Starting new game with different configuration');
    playSound('click');
    resetGame();
  };
  
  // Handle starting the game from configuration
  const handleStartGame = (pieceCount: number, memorizeTime: number) => {
    console.log(`Starting game with ${pieceCount} pieces and ${memorizeTime}s memorize time`);
    playSound('click');
    startGame(pieceCount, memorizeTime);
  };
  
  // Handle back button
  const handleBack = () => {
    analytics.trackFeatureUsage('game_navigation', 'back_to_home');
    router.push('/');
  };
  
  console.log('Current game phase:', gamePhase);
  
  // Render the appropriate component based on game phase
  const renderGameContent = () => {
    switch (gamePhase) {
      case GamePhase.CONFIGURATION:
        return (
          <div className="flex flex-col items-center">
            <ErrorBoundary>
              <GameConfig onStart={handleStartGame} />
            </ErrorBoundary>
            {gameState.completionTime !== undefined && (
              <div className="mt-8">
                <ErrorBoundary>
                  <GameStats />
                </ErrorBoundary>
              </div>
            )}
          </div>
        );
        
      case GamePhase.MEMORIZATION:
        return (
          <ErrorBoundary>
            <MemorizationBoard />
          </ErrorBoundary>
        );
        
      case GamePhase.SOLUTION:
        return (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex w-full max-w-[600px] items-center justify-between">
              <div className="text-xl font-bold text-text-primary">
                Time: {formatTime(elapsedTime)}
              </div>
              <button
                onClick={handleSubmitSolution}
                className="rounded-lg bg-peach-500 px-4 py-2 font-medium text-bg-dark transition-all hover:bg-peach-400 focus:outline-none focus:ring-2 focus:ring-peach-300"
                type="button"
              >
                Submit Solution
              </button>
            </div>
            <ErrorBoundary>
              <SolutionBoard />
            </ErrorBoundary>
          </div>
        );
        
      case GamePhase.RESULT:
        return (
          <ErrorBoundary>
            <GameResult onTryAgain={handleTryAgain} onNewGame={handleNewGame} />
          </ErrorBoundary>
        );
        
      default:
        return (
          <ErrorBoundary>
            <GameConfig onStart={handleStartGame} />
          </ErrorBoundary>
        );
    }
  };
  
  return (
    <main className="min-h-screen bg-bg-dark text-text-primary">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        <div className="mb-8 flex w-full max-w-4xl items-center justify-between">
          <Link 
            href="/"
            className="rounded-lg border border-peach-500/20 px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-peach-500/10"
            onClick={handleBack}
          >
            ← Back to Home
          </Link>
          
          <h1 className="text-center text-3xl font-bold text-text-primary">
            Memory <span className="text-peach-500">Chess</span>
          </h1>
          
          <SoundSettings className="w-[100px]" />
        </div>
        
        <ErrorBoundary>
          {renderGameContent()}
        </ErrorBoundary>
      </div>
    </main>
  );
} 