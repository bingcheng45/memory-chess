'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { GamePhase } from '@/lib/types/game';
import GameConfig from '@/components/game/GameConfig';
import GameResult from '@/components/game/GameResult';
import GameStats from '@/components/game/GameStats';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Link from 'next/link';
import { useAnalytics, AnalyticsEventType } from '@/lib/utils/analyticsTracker';
import { playSound } from '@/lib/utils/soundEffects';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import SoundSettings from '@/components/ui/SoundSettings';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { ChessPiece, PieceType } from '@/types/chess';
import { Button } from "@/components/ui/button";
import ResponsiveMemorizationBoard from '@/components/game/ResponsiveMemorizationBoard';
import ResponsiveInteractiveBoard from '@/components/game/ResponsiveInteractiveBoard';
import { formatTimeExact } from '@/utils/timer';

// Component to handle URL parameters
function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useAnalytics();
  
  // Initialize sound effects hook to handle sound based on game state changes
  useSoundEffects();
  
  // Add state to track client-side rendering
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
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
    calculateSkillRatingChange,
    placePiece,
    removePiece,
    chess
  } = useGameStore();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerWarningPlayed, setTimerWarningPlayed] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [solutionPieces, setSolutionPieces] = useState<ChessPiece[]>([]);
  const solutionStartTimeRef = useRef<number | null>(null);
  
  // Track initial page load
  useEffect(() => {
    analytics.trackFeatureUsage('game_page', 'view');
    
    // Clean up game state when leaving
    return () => {
      resetGame();
    };
  }, [analytics, resetGame]);
  
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
  }, [pieceCountParam, memorizeTimeParam, challengeId, analytics, memorizeTime, pieceCount, startGame]);
  
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
    } else if (gamePhase === GamePhase.RESULT && gameState.accuracy !== undefined && isClient) {
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
  }, [gamePhase, gameState, analytics, calculateSkillRatingChange, challengeId, isClient]);
  
  // Start memorization phase when game is started
  useEffect(() => {
    if (gameState.isPlaying && gamePhase === GamePhase.CONFIGURATION) {
      console.log('Starting memorization phase');
      playSound('success');
      startMemorizationPhase();
      
      // Reset the sound played flag when starting a new game
      setSoundPlayed(false);
    }
  }, [gameState.isPlaying, gamePhase, startMemorizationPhase]);
  
  // Auto-transition from memorization to solution phase
  useEffect(() => {
    if (gameState.isMemorizationPhase) {
      console.log(`Setting timeout for ${gameState.memorizeTime} seconds`);
      setTimerWarningPlayed(false);
      
      // Play timer start sound only if it hasn't been played yet
      if (!soundPlayed) {
        // Add a small delay to ensure the success sound finishes first
        setTimeout(() => {
          console.log('Playing timer sound at start of memorization phase');
          playSound('timer');
          setSoundPlayed(true);
        }, 500); // Increased delay to ensure the success sound finishes
      }
      
      // Add a small buffer (50ms) to ensure the visual timer reaches 0 before the phase changes
      const timer = setTimeout(() => {
        console.log('Memorization time ended, transitioning to solution phase');
        playSound('timerEnd');
        endMemorizationPhase();
        startSolutionPhase();
      }, gameState.memorizeTime * 1000 + 50);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [gameState.isMemorizationPhase, gameState.memorizeTime, endMemorizationPhase, startSolutionPhase, soundPlayed]);
  
  // Reset solution pieces when entering solution phase
  useEffect(() => {
    if (gamePhase === GamePhase.SOLUTION) {
      setSolutionPieces([]);
    }
  }, [gamePhase]);
  
  // Track elapsed time during solution phase
  useEffect(() => {
    if (gameState.isSolutionPhase) {
      console.log('Starting solution phase timer');
      
      // Only initialize the start time when first entering solution phase
      if (solutionStartTimeRef.current === null) {
        solutionStartTimeRef.current = Date.now();
        setElapsedTime(0);
      }
      
      const timer = setInterval(() => {
        if (solutionStartTimeRef.current !== null) {
          // Calculate time based on the stored start time
          const rawElapsedSeconds = (Date.now() - solutionStartTimeRef.current) / 1000;
          const elapsedSeconds = Math.floor(rawElapsedSeconds);
          setElapsedTime(elapsedSeconds);
          
          // Play warning sound when 75% of the memorization time has elapsed
          if (!timerWarningPlayed && elapsedSeconds >= Math.floor(gameState.memorizeTime * 0.75)) {
            playSound('timer');
            setTimerWarningPlayed(true);
          }
        }
      }, 1000); // Update once per second
      
      return () => clearInterval(timer);
    } else {
      // Reset the ref when leaving solution phase
      solutionStartTimeRef.current = null;
      setElapsedTime(0);
    }
  }, [gameState.isSolutionPhase, gameState.memorizeTime, timerWarningPlayed, playSound, setTimerWarningPlayed]);
  
  // Handle submitting the solution
  const handleSubmitSolution = () => {
    console.log('Submitting solution');
    playSound('click');
    submitSolution();
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
  
  // Add this helper function to convert chess.js board to ChessPiece array
  // Currently not used as we start with an empty board in solution phase,
  // but kept for future reference if we need to pre-populate the board
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function chessToPieces(chess: Chess | null): ChessPiece[] {
    if (!chess) return [];
    
    const pieces: ChessPiece[] = [];
    const board = chess.board();
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = board[rank][file];
        if (square) {
          pieces.push({
            id: uuidv4(),
            type: square.type as PieceType,
            color: square.color === 'w' ? 'white' : 'black',
            position: { file, rank }
          });
        }
      }
    }
    
    return pieces;
  }
  
  // Add a useEffect to log the chess instance when it changes
  useEffect(() => {
    console.log('Chess instance updated:', chess);
  }, [chess]);
  
  // Render the appropriate content based on game phase
  const renderGameContent = () => {
    console.log('Rendering game content for phase:', gamePhase);
    
    // Shared container for consistent width and centering across all phases
    const containerClass = "w-full max-w-4xl mx-auto flex flex-col items-center justify-center";
    
    switch (gamePhase) {
      case GamePhase.CONFIGURATION:
        return (
          <div className={containerClass}>
            <ErrorBoundary>
              <GameConfig onStart={handleStartGame} />
            </ErrorBoundary>
            {gameState.completionTime !== undefined && (
              <div className="mt-8 w-full max-w-md md:max-w-lg mx-auto">
                <ErrorBoundary>
                  <GameStats />
                </ErrorBoundary>
              </div>
            )}
          </div>
        );
        
      case GamePhase.MEMORIZATION:
        return (
          <div className={containerClass}>
            <ErrorBoundary>
              <ResponsiveMemorizationBoard />
            </ErrorBoundary>
          </div>
        );
        
      case GamePhase.SOLUTION:
        return (
          <div className={containerClass}>
            <ErrorBoundary>
              {/* Use a wrapper with the same max width as the chess board component */}
              <div className="w-full max-w-screen-sm mx-auto">
                {/* Timer and submit button row, with precise padding to match chess board edges */}
                <div className="flex items-center justify-between mb-4 w-full">
                  {/* Timer moved slightly to the right from the left edge of chess board */}
                  <div className="text-lg font-medium pl-4">
                    TIME: <span className="text-xl font-mono font-bold">
                      {(() => {
                        if (typeof elapsedTime !== 'number' || isNaN(elapsedTime)) {
                          return formatTimeExact(0);
                        }
                        return formatTimeExact(elapsedTime);
                      })()}
                    </span>
                  </div>
                  
                  {/* Submit button aligned with right edge of chess board */}
                  <Button 
                    onClick={handleSubmitSolution}
                    variant="outline"
                    size="sm"
                    className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5 text-sm"
                  >
                    Submit
                  </Button>
                </div>
                
                {/* Chess board */}
                <ResponsiveInteractiveBoard
                  playerSolution={solutionPieces}
                  onPlacePiece={(piece) => {
                    console.log('Placing piece:', piece);
                    setSolutionPieces(prev => [...prev, piece]);
                    // Convert ChessPiece to chess.js format for the game store
                    const square = `${String.fromCharCode(97 + piece.position.file)}${piece.position.rank + 1}`;
                    const pieceCode = piece.color === 'white' ? piece.type.charAt(0).toUpperCase() : piece.type.charAt(0).toLowerCase();
                    placePiece(square, pieceCode);
                  }}
                  onRemovePiece={(position) => {
                    console.log('Removing piece at:', position);
                    setSolutionPieces(prev => prev.filter(p => 
                      p.position.file !== position.file || p.position.rank !== position.rank
                    ));
                    // Convert Position to chess.js square format
                    const square = `${String.fromCharCode(97 + position.file)}${position.rank + 1}`;
                    removePiece(square);
                  }}
                />
              </div>
            </ErrorBoundary>
          </div>
        );
        
      case GamePhase.RESULT:
        return (
          <div className={containerClass}>
            <ErrorBoundary>
              <GameResult onTryAgain={handleTryAgain} onNewGame={handleNewGame} />
            </ErrorBoundary>
          </div>
        );
        
      default:
        return (
          <div className={containerClass}>
            <ErrorBoundary>
              <GameConfig onStart={handleStartGame} />
            </ErrorBoundary>
          </div>
        );
    }
  };
  
  return (
    <main className="min-h-screen bg-bg-dark text-text-primary">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        {/* Header with title and centered sound controls */}
        <div className="relative w-full max-w-4xl mb-8 px-1">
          {/* Title centered in the available space */}
          <div className="flex items-center justify-center">
            <Link 
              href="/"
              onClick={handleBack}
              className="text-center text-xl sm:text-3xl font-bold text-text-primary whitespace-nowrap cursor-pointer transition-all hover:opacity-80"
            >
              Memory <span className="text-peach-500">Chess</span>
            </Link>
          </div>
          
          {/* Sound settings positioned at the absolute right edge */}
          <div className="absolute top-1/2 -translate-y-1/2 right-0">
            <SoundSettings className="w-[46px] sm:w-[50px]" />
          </div>
        </div>
        
        <ErrorBoundary>
          {renderGameContent()}
        </ErrorBoundary>
      </div>
    </main>
  );
}

export default function GamePage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading game...</div>}>
        <GamePageContent />
      </Suspense>
    </ErrorBoundary>
  );
} 