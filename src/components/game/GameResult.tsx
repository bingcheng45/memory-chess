'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { GameState } from '@/lib/types/game';
import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { playSound } from '@/lib/utils/soundEffects';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Extended GameState type with skillRatingChange
type GameStateWithRating = GameState & { 
  skillRatingChange?: number;
  timeBonusEarned?: number;
  perfectScore?: boolean;
  extraPieces?: number;
  totalPiecesPlaced?: number;
};

interface GameResultProps {
  readonly onTryAgain: () => void;
  readonly onNewGame: () => void;
}

export default function GameResult({ onTryAgain, onNewGame }: GameResultProps) {
  const { gameState } = useGameStore();
  
  // Leaderboard submission state
  const [showLeaderboardDialog, setShowLeaderboardDialog] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Debug state
  const [showDebug, setShowDebug] = useState(false);
  const [showPieceDebugDialog, setShowPieceDebugDialog] = useState(false);
  
  // Get the local copy of gameState with skill rating change info
  const extendedGameState = gameState as GameStateWithRating;
  
  // Calculate pieces info for debugging and display
  const piecesInfo = {
    accuracy: gameState.accuracy || 0,
    totalPieces: gameState.pieceCount,
    totalPiecesPlaced: extendedGameState.totalPiecesPlaced || 0,
    correctPieces: Math.round((gameState.accuracy || 0) * gameState.pieceCount / 100),
    // Extra pieces are only counted if more pieces were placed than required
    extraPieces: extendedGameState.extraPieces || 0,
    // Total wrong is the sum of missed original pieces and any extra pieces
    get totalWrong() { 
      // By default, wrong pieces is the inverse of correct pieces
      const basicWrongPieces = this.totalPieces - this.correctPieces;
      
      // Add any extra pieces that were placed but not in the original position
      return basicWrongPieces + this.extraPieces;
    }
  };
  
  // Log the calculation on every render
  useEffect(() => {
    console.log('GameResult rendered with pieces info:', piecesInfo);
    
    // Print detailed debug information about wrong pieces
    console.log('------ PIECE PLACEMENT RESULTS ------');
    console.log(`Total pieces in original position: ${piecesInfo.totalPieces}`);
    console.log(`Correct pieces placed: ${piecesInfo.correctPieces}`);
    console.log(`Wrong/missed pieces: ${piecesInfo.totalPieces - piecesInfo.correctPieces}`);
    console.log(`Extra pieces placed: ${piecesInfo.extraPieces}`);
    console.log(`Total wrong (missed + extra): ${piecesInfo.totalWrong}`);
    console.log(`Accuracy percentage: ${piecesInfo.accuracy}%`);
    console.log('-----------------------------------');
    
  }, [piecesInfo.accuracy, piecesInfo.totalPieces, piecesInfo.correctPieces, piecesInfo.extraPieces]);
  
  // Helper function to determine difficulty level based on piece count
  const determineDifficulty = (pieceCount: number): 'easy' | 'medium' | 'hard' | 'grandmaster' | 'custom' => {
    if (pieceCount === 2) {
      return 'easy';
    } else if (pieceCount === 6) {
      return 'medium';
    } else if (pieceCount === 12) {
      return 'hard';
    } else if (pieceCount === 20) {
      return 'grandmaster';
    } else {
      return 'custom';
    }
  };
  
  // Play success sound on component mount
  useEffect(() => {
    // Only play success sound if accuracy is high enough
    if (gameState.accuracy && gameState.accuracy >= 70) {
      playSound('success');
    } else if (gameState.accuracy !== undefined) {
      playSound('failure');
    }
  }, [gameState.accuracy]);
  
  // Time formatting helper
  const formatTimeParts = (seconds: number): { minutes: string; seconds: string; milliseconds: string } => {
    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (wholeSeconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds - wholeSeconds) * 1000).toString().padStart(3, '0');
    
    return {
      minutes,
      seconds: remainingSeconds,
      milliseconds: ms
    };
  };
  
  // Consistent time display component
  const TimeDisplay = ({ minutes, seconds, milliseconds }: { minutes: string; seconds: string; milliseconds: string }) => {
    return (
      <div className="inline-flex items-baseline font-mono">
        <span>{minutes}</span>
        <span>:</span>
        <span>{seconds}</span>
        <span>:</span>
        <span className="text-xs">{milliseconds}</span>
      </div>
    );
  };
  
  // Get a message based on accuracy
  const getResultMessage = () => {
    const accuracy = gameState.accuracy || 0;
    
    if (accuracy === 100) return "Perfect Score!";
    if (accuracy >= 90) return "Excellent Memory!";
    if (accuracy >= 80) return "Great Job!";
    if (accuracy >= 70) return "Well Done!";
    if (accuracy >= 50) return "Good Effort!";
    return "Keep Practicing!";
  };
  
  // Get color class based on accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-500";
    if (accuracy >= 70) return "text-peach-500";
    if (accuracy >= 50) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Check if the score is eligible for the leaderboard
  const isEligibleForLeaderboard = () => {
    // Only standard difficulties are eligible (not custom games)
    const difficulty = determineDifficulty(gameState.pieceCount);
    return difficulty !== 'custom';
  };
  
  // Prepare leaderboard entry data
  const prepareLeaderboardEntry = (playerName: string) => {
    // Determine difficulty based on piece count
    const difficulty = determineDifficulty(gameState.pieceCount);
    
    // Custom games shouldn't reach this point due to isEligibleForLeaderboard check,
    // but as a safeguard, use medium difficulty if somehow a custom game is submitted
    const submissionDifficulty = difficulty === 'custom' ? 'medium' : difficulty;
    
    // Use actual memorize time if available, otherwise fall back to configured time
    const memorizeTime = gameState.actualMemorizeTime || gameState.memorizeTime;
    
    return {
      player_name: playerName,
      difficulty: submissionDifficulty,
      piece_count: gameState.pieceCount,
      correct_pieces: Math.round((gameState.accuracy || 0) * gameState.pieceCount / 100),
      memorize_time: memorizeTime,
      solution_time: gameState.completionTime || 0,
    };
  };
  
  // Handle score submission
  const submitToLeaderboard = async () => {
    if (!playerName.trim()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const leaderboardEntry = prepareLeaderboardEntry(playerName.trim());
      
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leaderboardEntry),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit to leaderboard');
      }
      
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Error submitting to leaderboard:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-8 shadow-xl">
      {/* Debug toggle button */}
      <div className="flex justify-end mb-2 gap-2">
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
        >
          {showDebug ? 'Hide Debug' : 'Debug'}
        </button>
        <button 
          onClick={() => setShowPieceDebugDialog(true)}
          className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
        >
          Debug Pieces
        </button>
      </div>
      
      {/* Debug information section */}
      {showDebug && (
        <div className="mb-4 p-3 bg-gray-800 text-gray-300 rounded text-xs font-mono overflow-auto">
          <h3 className="font-bold mb-1">Debug Info:</h3>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify({
              gameState: {
                accuracy: gameState.accuracy,
                pieceCount: gameState.pieceCount,
                isPlaying: gameState.isPlaying,
                memorizeTime: gameState.memorizeTime,
                completionTime: gameState.completionTime,
                success: gameState.success,
                perfectScore: extendedGameState.perfectScore,
                extraPieces: extendedGameState.extraPieces,
                totalPiecesPlaced: extendedGameState.totalPiecesPlaced
              },
              calculations: {
                correctPieces: piecesInfo.correctPieces,
                totalPieces: piecesInfo.totalPieces,
                extraPieces: piecesInfo.extraPieces,
                totalWrong: piecesInfo.totalWrong,
                accuracyPercentage: gameState.accuracy,
                calculation: `${piecesInfo.totalPieces} - ${piecesInfo.correctPieces} + ${piecesInfo.extraPieces} = ${piecesInfo.totalWrong} wrong pieces`,
                accuracyFormula: `Accuracy = MAX(0, (${piecesInfo.correctPieces} / ${piecesInfo.totalPieces}) * 100 - ${piecesInfo.extraPieces} * 10)`
              }
            }, null, 2)}
          </pre>
        </div>
      )}
      
      <h2 className={`mb-4 text-center text-3xl font-bold ${getAccuracyColor(gameState.accuracy || 0)}`}>
        {getResultMessage()}
      </h2>
      
      {extendedGameState.perfectScore && (
        <div className="mb-6 rounded-lg bg-green-500/20 p-3 text-center">
          <div className="text-lg font-bold text-green-400">✨ Perfect Score!</div>
        </div>
      )}
      
      <div className="mb-6 space-y-4">
        {/* Accuracy */}
        <div className="flex flex-col border-b border-bg-light pb-3">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Accuracy:</span>
            <span className={`font-bold ${getAccuracyColor(gameState.accuracy || 0)}`}>
              {gameState.accuracy || 0}%
            </span>
          </div>
          
          {/* Pieces correct / total */}
          <div className="flex justify-between mt-1">
            <span className="text-text-secondary text-sm">Pieces correct:</span>
            <span className="text-sm font-medium text-text-primary">
              {piecesInfo.correctPieces}
              
              {piecesInfo.extraPieces > 0 && (
                <sup className="text-xs ml-1 text-red-500 font-bold">
                  -{piecesInfo.extraPieces}
                </sup>
              )}
              
              / {piecesInfo.totalPieces}
            </span>
          </div>
          
          {/* Accuracy progress bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-light">
            <div 
              className={`h-full transition-all ${
                gameState.accuracy && gameState.accuracy >= 90 ? 'bg-green-400' :
                gameState.accuracy && gameState.accuracy >= 70 ? 'bg-peach-400' :
                gameState.accuracy && gameState.accuracy >= 50 ? 'bg-peach-500' :
                'bg-peach-600'
              }`}
              style={{ width: `${gameState.accuracy || 0}%` }}
            ></div>
          </div>
        </div>
        
        {/* Memorization Time */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Memorization Time:</span>
          <span className="font-bold text-text-primary">
            {(() => {
              // Use actual memorize time if available, otherwise fall back to configured time
              const memorizeTime = gameState.actualMemorizeTime || gameState.memorizeTime;
              const { minutes, seconds, milliseconds } = formatTimeParts(memorizeTime);
              return <TimeDisplay minutes={minutes} seconds={seconds} milliseconds={milliseconds} />;
            })()}
          </span>
        </div>
        
        {/* Solution Time */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Solution Time:</span>
          <span className="font-bold text-text-primary">
            {(() => {
              const { minutes, seconds, milliseconds } = formatTimeParts(gameState.completionTime || 0);
              return <TimeDisplay minutes={minutes} seconds={seconds} milliseconds={milliseconds} />;
            })()}
          </span>
        </div>
        
        {/* Recall Speed - replacing Pieces section */}
        <div className="flex justify-between border-b border-bg-light pb-3">
          <span className="text-text-secondary font-medium">Recall Speed:</span>
          <span className="font-bold text-text-primary">
            {(() => {
              // Handle edge cases
              if (!gameState.completionTime || gameState.completionTime <= 0) {
                return "0.0 pieces/sec";
              }
              
              // Use actual memorization time if available, otherwise fall back to configured time
              const memorizeTime = gameState.actualMemorizeTime || gameState.memorizeTime;
              
              // Calculate correct pieces based on accuracy
              const accuracyPercentage = (gameState.accuracy || 0) / 100;
              const correctPieces = gameState.pieceCount * accuracyPercentage;
              
              // Calculate correct pieces per second - based on actual memorization time
              // This represents how efficiently pieces were memorized
              const piecesPerSecond = correctPieces / memorizeTime;
              
              // Format to 1 decimal place
              return `${piecesPerSecond.toFixed(1)} pieces/sec`;
            })()}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-3">
        <Button
          onClick={onTryAgain}
          variant={gameState.accuracy === 100 ? "outline" : "secondary"}
          size={gameState.accuracy === 100 ? "default" : "lg"}
          className={
            gameState.accuracy === 100 
              ? "w-full bg-peach-500/10 text-peach-500 hover:text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5"
              : "w-full border border-gray-600"
          }
        >
          Try Again
        </Button>
        
        <Button
          onClick={onNewGame}
          variant={gameState.accuracy === 100 ? "secondary" : "outline"}
          size={gameState.accuracy === 100 ? "lg" : "default"}
          className={
            gameState.accuracy === 100
              ? "w-full border border-gray-600"
              : "w-full bg-peach-500/10 text-peach-500 hover:text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5"
          }
        >
          New Game
        </Button>
        
        {isEligibleForLeaderboard() && (
          <Button
            onClick={() => setShowLeaderboardDialog(true)}
            variant="outline"
            className="w-full bg-green-500/10 text-green-500 hover:text-green-500 border-green-500/30 hover:bg-green-500/20 px-3 py-1.5"
          >
            Submit to Leaderboard
          </Button>
        )}
        
        <Link href="/leaderboard">
          <Button 
            variant="ghost"
            className="w-full text-peach-500 hover:text-peach-500 border-0 hover:border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5"
          >
            View Leaderboard
          </Button>
        </Link>
      </div>
      
      {/* Leaderboard Submission Dialog */}
      <Dialog open={showLeaderboardDialog} onOpenChange={setShowLeaderboardDialog}>
        <DialogContent className="bg-bg-card border border-bg-light text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">{submitSuccess ? 'Score Submitted!' : 'Submit to Leaderboard'}</DialogTitle>
            <DialogDescription className="text-text-secondary">
              {submitSuccess 
                ? 'Your score has been successfully submitted to the leaderboard.'
                : 'Enter your name to be displayed on the leaderboard.'}
            </DialogDescription>
          </DialogHeader>
          
          {!submitSuccess ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="player-name" className="text-text-secondary">Player Name</Label>
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isSubmitting}
                  className="bg-bg-light border-bg-light text-text-primary focus:border-green-500/50 focus:ring-green-500/30"
                />
              </div>
              
              {submitError && (
                <div className="text-sm text-red-500">
                  Error: {submitError}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowLeaderboardDialog(false)}
                  disabled={isSubmitting}
                  className="bg-bg-light text-text-secondary border-bg-light hover:bg-bg-light/80 hover:text-text-primary"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitToLeaderboard}
                  disabled={!playerName.trim() || isSubmitting}
                  className="bg-green-500 text-white hover:text-white hover:bg-green-600"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Score'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/20 p-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 text-green-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-text-primary">Thanks for participating, {playerName}!</p>
              </div>
              
              <div className="flex justify-center gap-2">
                <Link href={`/leaderboard?player=${encodeURIComponent(playerName)}&difficulty=${(() => {
                  const difficulty = determineDifficulty(gameState.pieceCount);
                  return encodeURIComponent(difficulty === 'custom' ? 'medium' : difficulty);
                })()}&memorizeTime=${gameState.actualMemorizeTime || gameState.memorizeTime}&solutionTime=${gameState.completionTime || 0}&pieceCount=${gameState.pieceCount}&correctPieces=${Math.round((gameState.accuracy || 0) * gameState.pieceCount / 100)}`}>
                  <Button className="bg-green-500 text-white hover:text-white hover:bg-green-600">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Piece Debug Dialog */}
      <Dialog open={showPieceDebugDialog} onOpenChange={setShowPieceDebugDialog}>
        <DialogContent className="bg-bg-card border border-bg-light text-text-primary max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Piece Placement Debug</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Detailed information about the piece placement.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-light">
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-bg-light">
                  <td className="py-2">Original Pieces Total</td>
                  <td className="text-right font-mono">{piecesInfo.totalPieces}</td>
                </tr>
                <tr className="border-b border-bg-light">
                  <td className="py-2 text-green-500">Correct Pieces</td>
                  <td className="text-right font-mono text-green-500">{piecesInfo.correctPieces}</td>
                </tr>
                <tr className="border-b border-bg-light">
                  <td className="py-2 text-red-500">Wrong/Missed Pieces</td>
                  <td className="text-right font-mono text-red-500">{piecesInfo.totalPieces - piecesInfo.correctPieces}</td>
                </tr>
                <tr className="border-b border-bg-light">
                  <td className="py-2 text-orange-500">Extra Pieces Placed</td>
                  <td className="text-right font-mono text-orange-500">{piecesInfo.extraPieces}</td>
                </tr>
                <tr className="border-b border-bg-light font-medium">
                  <td className="py-2 text-red-500">Total Wrong Pieces</td>
                  <td className="text-right font-mono text-red-500">{piecesInfo.totalWrong}</td>
                </tr>
                <tr className="border-b border-bg-light">
                  <td className="py-2">Accuracy</td>
                  <td className="text-right font-mono">{piecesInfo.accuracy}%</td>
                </tr>
              </tbody>
            </table>
            
            <div className="mt-4 p-3 bg-gray-800 text-gray-300 rounded text-xs">
              <h4 className="font-bold mb-2">Accuracy Formula:</h4>
              <div className="font-mono">
                Base Accuracy = (correctPieces / totalPieces) * 100<br/>
                Penalty = extraPieces * 10<br/>
                Final Accuracy = MAX(0, Base Accuracy - Penalty)
              </div>
              <div className="mt-2">
                <span className="text-blue-400">Example:</span> With {piecesInfo.correctPieces} correct out of {piecesInfo.totalPieces} pieces and {piecesInfo.extraPieces} extra pieces:<br/>
                Base = ({piecesInfo.correctPieces}/{piecesInfo.totalPieces}) * 100 = {Math.round((piecesInfo.correctPieces / piecesInfo.totalPieces) * 100)}%<br/>
                Penalty = {piecesInfo.extraPieces} * 10 = {piecesInfo.extraPieces * 10}%<br/>
                Final = MAX(0, {Math.round((piecesInfo.correctPieces / piecesInfo.totalPieces) * 100)} - {piecesInfo.extraPieces * 10}) = {Math.max(0, Math.round((piecesInfo.correctPieces / piecesInfo.totalPieces) * 100) - (piecesInfo.extraPieces * 10))}%
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setShowPieceDebugDialog(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 