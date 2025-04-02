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
  
  // Get the local copy of gameState with skill rating change info
  const extendedGameState = gameState as GameStateWithRating;
  
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
    // Only standard difficulties are eligible
    return true; // Simplified for now; normally would check difficulty
  };
  
  // Prepare leaderboard entry data
  const prepareLeaderboardEntry = (playerName: string) => {
    return {
      player_name: playerName,
      difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'grandmaster', // Default to medium for this demo
      piece_count: gameState.pieceCount,
      correct_pieces: Math.round((gameState.accuracy || 0) * gameState.pieceCount / 100),
      memorize_time: gameState.memorizeTime,
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
              {Math.round((gameState.accuracy || 0) * gameState.pieceCount / 100)} / {gameState.pieceCount}
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
        
        {/* Time */}
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
          variant="outline"
          className="w-full bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-3 py-1.5"
        >
          Try Again
        </Button>
        
        <Button
          onClick={onNewGame}
          variant="secondary"
          size="lg"
          className="w-full border border-gray-600"
        >
          New Game
        </Button>
        
        {isEligibleForLeaderboard() && (
          <Button
            onClick={() => setShowLeaderboardDialog(true)}
            variant="outline"
            className="w-full bg-indigo-500/10 text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/20 px-3 py-1.5 mt-2"
          >
            Submit to Leaderboard
          </Button>
        )}
        
        <Link href="/leaderboard">
          <Button 
            variant="ghost"
            className="w-full text-text-secondary hover:text-text-primary mt-2"
          >
            View Leaderboard
          </Button>
        </Link>
      </div>
      
      {/* Leaderboard Submission Dialog */}
      <Dialog open={showLeaderboardDialog} onOpenChange={setShowLeaderboardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{submitSuccess ? 'Score Submitted!' : 'Submit to Leaderboard'}</DialogTitle>
            <DialogDescription>
              {submitSuccess 
                ? 'Your score has been successfully submitted to the leaderboard.'
                : 'Enter your name to be displayed on the leaderboard.'}
            </DialogDescription>
          </DialogHeader>
          
          {!submitSuccess ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="player-name">Player Name</Label>
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isSubmitting}
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
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitToLeaderboard}
                  disabled={!playerName.trim() || isSubmitting}
                  className="bg-peach-500 text-white hover:bg-peach-600"
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
                <Link href="/leaderboard">
                  <Button className="bg-indigo-500 text-white hover:bg-indigo-600">
                    View Leaderboard
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 