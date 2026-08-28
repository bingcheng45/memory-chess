'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useGameStore } from '@/lib/store/gameStore';
import { GamePhase } from '@/lib/types/game';
import GameConfig from '@/components/game/GameConfig';
import GameResult from '@/components/game/GameResult';
import GameStats from '@/components/game/GameStats';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAnalytics, AnalyticsEventType } from '@/lib/utils/analyticsTracker';
import { playSound, stopTimerSound } from '@/lib/utils/soundEffects';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import { ChessPiece, PieceType } from '@/types/chess';
import { pieceTypeToFenChar } from '@/utils/chessPieces';
import { Button } from "@/components/ui/button";
import ResponsiveMemorizationBoard from '@/components/game/ResponsiveMemorizationBoard';
import ResponsiveInteractiveBoard from '@/components/game/ResponsiveInteractiveBoard';
import { formatTimeWithMilliseconds } from '@/utils/timer';
import PageHeader from '@/components/ui/PageHeader';
import {
  ACTIVE_GAME_RESERVED_HEIGHT,
  useResponsiveBoard,
} from '@/hooks/useResponsiveBoard';
import GameSubmissionFlash, { GAME_SUBMISSION_FLASH_DURATION_MS } from '@/components/game/GameSubmissionFlash';

import { useTranslations } from "next-intl";
// Component to handle URL parameters
function GamePageContent() {
  const t = useTranslations("game");
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
  const [isSubmissionFlashVisible, setIsSubmissionFlashVisible] = useState(false);
  const solutionStartTimeRef = useRef<number | null>(null);
  const submissionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeBoardDimensions = useResponsiveBoard(280, 600, ACTIVE_GAME_RESERVED_HEIGHT);
  
  // Track initial page load
  useEffect(() => {
    analytics.trackFeatureUsage('game_page', 'view');
    
    // Clean up game state when leaving
    return () => {
      stopTimerSound(); // Stop any timer sound when leaving the page
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
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
        stopTimerSound(); // Stop the timer sound before playing the end sound
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
    if (gameState.isSolutionPhase && !isSubmissionFlashVisible) {
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
          setElapsedTime(rawElapsedSeconds);
          
          // Play warning sound when 75% of the memorization time has elapsed
          if (!timerWarningPlayed && elapsedSeconds >= Math.floor(gameState.memorizeTime * 0.75)) {
            playSound('timer');
            setTimerWarningPlayed(true);
          }
        }
      }, 33); // Update at approximately 30fps for a smooth milliseconds display
      
      return () => {
        clearInterval(timer);
      };
    } else if (!gameState.isSolutionPhase) {
      // Reset the ref when leaving solution phase
      stopTimerSound(); // Stop any timer sound when leaving solution phase
      solutionStartTimeRef.current = null;
      setElapsedTime(0);
    }
  }, [gameState.isSolutionPhase, gameState.memorizeTime, timerWarningPlayed, isSubmissionFlashVisible]);
  
  // Handle submitting the solution
  const handleSubmitSolution = () => {
    if (isSubmissionFlashVisible) return;

    console.log('Submitting solution');
    stopTimerSound(); // Stop any playing timer sound
    playSound('click');
    const frozenElapsedTime = solutionStartTimeRef.current
      ? (Date.now() - solutionStartTimeRef.current) / 1000
      : elapsedTime;
    setElapsedTime(frozenElapsedTime);
    setIsSubmissionFlashVisible(true);

    submissionTimeoutRef.current = setTimeout(() => {
      submissionTimeoutRef.current = null;
      submitSolution(frozenElapsedTime);
      setIsSubmissionFlashVisible(false);
    }, GAME_SUBMISSION_FLASH_DURATION_MS);
  };
  
  // Handle trying again with the same configuration
  const handleTryAgain = () => {
    console.log('Trying again with same configuration');
    stopTimerSound(); // Stop any playing timer sound
    playSound('click');
    resetGame();
    startGame(gameState.pieceCount, gameState.memorizeTime);
  };
  
  // Handle starting a new game with different configuration
  const handleNewGame = () => {
    console.log('Starting new game with different configuration');
    stopTimerSound(); // Stop any playing timer sound
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
    stopTimerSound(); // Stop any playing timer sound
    analytics.trackFeatureUsage('game_navigation', 'back_to_home');
    router.push('/');
  };
  
  // Handle skipping memorization phase
  // Note: This function is used in ResponsiveMemorizationBoard component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSkip = () => {
    console.log('Skipping memorization phase');
    stopTimerSound(); // Stop any playing timer sound
    playSound('timerEnd');
    endMemorizationPhase();
    startSolutionPhase();
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
              <ResponsiveMemorizationBoard dimensions={activeBoardDimensions} />
            </ErrorBoundary>
          </div>
        );
        
      case GamePhase.SOLUTION:
        return (
          <div className={containerClass}>
            <ErrorBoundary>
              <ResponsiveInteractiveBoard
                dimensions={activeBoardDimensions}
                status={
                  <div className="relative flex h-full items-center justify-center px-3 sm:px-4">
                    <div className="text-center text-sm font-medium sm:text-base">{t("hud.time")}<div className="font-mono text-2xl font-bold leading-tight sm:text-3xl">
                        {(() => {
                          if (typeof elapsedTime !== 'number' || isNaN(elapsedTime)) {
                            return formatTimeWithMilliseconds(0);
                          }
                          return formatTimeWithMilliseconds(elapsedTime);
                        })()}
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitSolution}
                      disabled={isSubmissionFlashVisible}
                      variant="outline"
                      size="sm"
                      className="absolute right-0 top-1/2 h-9 -translate-y-1/2 border-peach-500/30 bg-peach-500/10 px-3 text-sm text-peach-500 hover:bg-peach-500/20 hover:text-peach-500"
                    >{t("hud.submit")}</Button>
                  </div>
                }
                playerSolution={solutionPieces}
                onPlacePiece={(piece) => {
                  setSolutionPieces(prev => [...prev, piece]);
                  // Convert ChessPiece to chess.js format for the game store
                  const square = `${String.fromCharCode(97 + piece.position.file)}${piece.position.rank + 1}`;
                  const pieceCode = pieceTypeToFenChar(piece.type, piece.color);
                  placePiece(square, pieceCode);
                }}
                onRemovePiece={(position) => {
                  setSolutionPieces(prev =>
                    prev.filter(p =>
                      p.position.file !== position.file || p.position.rank !== position.rank
                    )
                  );
                  // Convert Position to chess.js format
                  const square = `${String.fromCharCode(97 + position.file)}${position.rank + 1}`;
                  removePiece(square);
                }}
              />
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
    <main className="min-h-[calc(100dvh-2.5rem-1px)] bg-bg-dark text-text-primary">
      {isSubmissionFlashVisible && <GameSubmissionFlash />}

      <div className="container mx-auto flex min-h-[calc(100dvh-2.5rem-1px)] flex-col items-center justify-start px-1 py-2 sm:px-4 sm:py-4">
        <PageHeader
          onBackClick={handleBack}
          pageType="game-memorize-solution"
          className="!mb-3"
          style={{
            // Match the board exactly. The CSS-only frame width has to guess
            // the reserved height, and that guess differs between the compact
            // and full layouts; the measured board size never drifts from it.
            width: `${activeBoardDimensions.size}px`,
            maxWidth: '100%'
          }}
        />

        <ErrorBoundary>
          {renderGameContent()}
        </ErrorBoundary>
      </div>
    </main>
  );
}

export default function GamePage() {
  const t = useTranslations("game");
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">{t("hud.loading")}</div>}>
        <GamePageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
