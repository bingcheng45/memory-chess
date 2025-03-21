'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import { GamePhase } from '@/lib/types/game';
import GameConfig from '@/components/game/GameConfig';
import MemorizationBoard from '@/components/game/MemorizationBoard';
import GameResult from '@/components/game/GameResult';
import GameStats from '@/components/game/GameStats';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import Link from 'next/link';
import { useAnalytics, AnalyticsEventType } from '@/lib/utils/analyticsTracker';
import { playSound } from '@/lib/utils/soundEffects';
import SoundSettings from '@/components/ui/SoundSettings';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import InteractiveChessBoard from '@/components/game/InteractiveChessBoard';
import { ChessPiece, PieceType } from '@/types/chess';
import { Button } from "@/components/ui/button";

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
    calculateSkillRatingChange,
    placePiece,
    removePiece,
    chess
  } = useGameStore();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerWarningPlayed, setTimerWarningPlayed] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [solutionPieces, setSolutionPieces] = useState<ChessPiece[]>([]);
  
  // Format time in seconds to mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
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
  }, [gamePhase, gameState, analytics, calculateSkillRatingChange, challengeId]);
  
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
        // Use the solutionPieces state instead of an empty array
        console.log('Starting solution phase with empty board');
        return (
          <div className="flex flex-col items-center">
            <div className="mb-6 flex items-center justify-between w-full max-w-[600px]">
              <div className="flex items-center">
                <span className="text-lg font-medium mr-2">Time:</span>
                <span className="text-xl font-bold">{formatTime(elapsedTime)}</span>
              </div>
              <Button
                onClick={handleSubmitSolution}
                variant="primary"
                size="default"
                type="button"
              >
                Submit Solution
              </Button>
            </div>
            <ErrorBoundary>
              <InteractiveChessBoard 
                playerSolution={solutionPieces}
                onPlacePiece={(piece) => {
                  // Update the solutionPieces state
                  setSolutionPieces(prevPieces => {
                    // Remove any existing piece at the same position
                    const filteredPieces = prevPieces.filter(
                      p => !(p.position.file === piece.position.file && p.position.rank === piece.position.rank)
                    );
                    // Add the new piece
                    return [...filteredPieces, piece];
                  });
                  
                  // Convert ChessPiece to chess.js format
                  const square = `${String.fromCharCode(97 + piece.position.file)}${piece.position.rank + 1}`;
                  const pieceCode = piece.color === 'white' ? piece.type.charAt(0).toUpperCase() : piece.type.charAt(0).toLowerCase();
                  console.log('Placing piece:', piece, 'at square:', square, 'with code:', pieceCode);
                  placePiece(square, pieceCode);
                }}
                onRemovePiece={(position) => {
                  // Update the solutionPieces state
                  setSolutionPieces(prevPieces => 
                    prevPieces.filter(
                      p => !(p.position.file === position.file && p.position.rank === position.rank)
                    )
                  );
                  
                  // Convert Position to chess.js square format
                  const square = `${String.fromCharCode(97 + position.file)}${position.rank + 1}`;
                  console.log('Removing piece at position:', position, 'square:', square);
                  removePiece(square);
                }}
              />
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