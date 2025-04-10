'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { ChessPiece } from '@/types/chess';
import ResponsiveChessBoard from './ResponsiveChessBoard';
import { mapChessJsPieceToType } from '@/utils/chessPieces';
import { Button } from '@/components/ui/button';
import { playSound } from '@/lib/utils/soundEffects';

export default function ResponsiveMemorizationBoard() {
  const { chess, gameState, endMemorizationPhase, startSolutionPhase } = useGameStore();
  const [pieces, setPieces] = useState<ChessPiece[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(gameState.memorizeTime * 1000); // Store time in milliseconds
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle skipping memorization phase
  const handleSkip = () => {
    console.log('Skipping memorization phase');
    playSound('timerEnd');
    endMemorizationPhase();
    startSolutionPhase();
  };

  // Convert chess.js position to ChessPiece array
  useEffect(() => {
    if (!chess) return;
    
    try {
      setIsLoading(true);
      console.log('Parsing chess position for memorization:', chess.fen());
      
      const newPieces: ChessPiece[] = [];
      const fen = chess.fen();
      const rows = fen.split(' ')[0].split('/');
      
      rows.forEach((row, rankIndex) => {
        let fileIndex = 0;
        for (const char of row) {
          if (isNaN(parseInt(char))) {
            // This is a piece
            const color = char === char.toUpperCase() ? 'white' : 'black';
            const type = mapChessJsPieceToType(char);
            
            newPieces.push({
              id: `${fileIndex}-${rankIndex}`,
              type,
              color,
              position: {
                file: fileIndex,
                rank: 7 - rankIndex, // Adjust rank to be 0-based from bottom
              },
            });
            fileIndex++;
          } else {
            // This is a number of empty squares
            fileIndex += parseInt(char);
          }
        }
      });
      
      setPieces(newPieces);
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing FEN:', error);
      setIsLoading(false);
    }
  }, [chess]);
  
  // Countdown timer with milliseconds for smoother animation
  useEffect(() => {
    if (!gameState.isMemorizationPhase) return;
    
    // Ensure we start with the exact memorization time
    console.log('Starting memorization countdown from', gameState.memorizeTime, 'seconds');
    
    // Set initial time (convert seconds to milliseconds)
    setTimeRemaining(gameState.memorizeTime * 1000);
    
    // Get the start time to calculate elapsed time
    const startTime = Date.now();
    const endTime = startTime + (gameState.memorizeTime * 1000);
    
    // Update time every 33ms (approximately 30fps) for smooth animation
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      
      setTimeRemaining(remaining);
      
      // Stop the timer when we reach 0
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 33);
    
    // Clean up timer when component unmounts or phase changes
    return () => {
      clearInterval(timer);
    };
  }, [gameState.isMemorizationPhase, gameState.memorizeTime]);
  
  // Calculate seconds and milliseconds for display
  const seconds = Math.floor(timeRemaining / 1000);
  const milliseconds = Math.floor((timeRemaining % 1000) / 10);
  
  // Calculate progress percentage for the timer
  const timerProgress = useMemo(() => {
    const totalTime = gameState.memorizeTime * 1000; // Total time in milliseconds
    const elapsedTime = totalTime - timeRemaining;
    return Math.max(0, Math.min(100, (elapsedTime / totalTime) * 100));
  }, [timeRemaining, gameState.memorizeTime]);
  
  // Get urgency class based on time left
  const getUrgencyClass = () => {
    if (seconds <= 3) return 'text-red-500 animate-pulse';
    if (seconds <= 5) return 'text-orange-500';
    return 'text-peach-500';
  };
  
  // Calculate status bar height for the timer and instructions
  const statusBarHeight = 120; // Height of timer and instructions
  
  return (
    <div className="flex flex-col items-center w-full max-w-screen-sm mx-auto">
      {/* Timer container - centered */}
      <div className="w-full mb-4 relative px-4 sm:px-6">
        {/* Skip button - aligned with the right edge of the contained area */}
        <div className="absolute right-4 sm:right-6 bottom-0 z-10">
          <Button 
            onClick={handleSkip}
            variant="outline"
            size="sm"
            className="bg-peach-500/10 text-peach-500 hover:text-peach-500 border-peach-500/30 hover:bg-peach-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm transform origin-right"
          >
            Skip
          </Button>
        </div>
        
        {/* Timer and instructions - centered with improved dynamic width */}
        <div 
          className="text-center mx-auto" 
          style={{ 
            width: "min(280px, calc(100% - 75px))",
            minWidth: "180px", 
            marginLeft: "auto", 
            marginRight: "auto"
          }}
        >
          <div className="text-md font-bold text-text-primary mb-1">Memorize the Position</div>
          
          {/* Timer */}
          <div className="mx-auto">
            <div className="text-center">
              <div className={`text-4xl sm:text-5xl font-bold ${getUrgencyClass()} transition-colors`}>
                {seconds}
                <span className="text-xl sm:text-2xl opacity-50">.{milliseconds.toString().padStart(2, '0')}</span>
              </div>
            </div>
            
            {/* Progress bar - narrower on mobile */}
            <div className="w-4/5 mx-auto h-1.5 overflow-hidden rounded-full bg-bg-light mt-1">
              <div 
                className="h-full bg-peach-500 transition-all"
                style={{ width: `${timerProgress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Instruction text ensured to be on one line with fallback */}
          <div className="mt-1 mb-1">
            <div className="text-xs text-text-secondary text-center whitespace-nowrap overflow-hidden text-ellipsis">
              Remember the position of all {gameState.pieceCount} pieces
            </div>
          </div>
        </div>
      </div>
      
      <ResponsiveChessBoard
        pieces={pieces}
        isLoading={isLoading}
        isInteractive={false}
        showCoordinates={true}
        statusBarHeight={statusBarHeight}
        minSize={280}
      />
      
      <div className="mt-2 text-center text-xs text-text-secondary">
        The board will clear after the timer ends
      </div>
    </div>
  );
} 