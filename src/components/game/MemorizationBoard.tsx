'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/lib/store/gameStore';
import { getPieceImageUrl, mapChessJsPieceToType } from '@/utils/chessPieces';

export default function MemorizationBoard() {
  const { chess, gameState } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [timeRemaining, setTimeRemaining] = useState(gameState.memorizeTime * 1000); // Store time in milliseconds
  const [isLoading, setIsLoading] = useState(true);
  
  // Parse the FEN string to get the position
  useEffect(() => {
    if (!chess) return;
    
    try {
      setIsLoading(true);
      console.log('Parsing chess position for memorization:', chess.fen());
      const newPosition = Array(8).fill(0).map(() => Array(8).fill(''));
      const fen = chess.fen();
      const rows = fen.split(' ')[0].split('/');
      
      rows.forEach((row, i) => {
        let j = 0;
        for (const char of row) {
          if (isNaN(parseInt(char))) {
            newPosition[i][j] = char;
            j++;
          } else {
            j += parseInt(char);
          }
        }
      });
      
      setPosition(newPosition);
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
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <div className="text-xl font-bold text-text-primary">Memorize the Position</div>
        <div className={`mt-3 text-6xl font-bold ${getUrgencyClass()} transition-colors`}>
          {seconds}
          <span className="text-3xl opacity-50">.{milliseconds.toString().padStart(2, '0')}</span>
        </div>
        
        {/* Progress bar */}
        <div className="mx-auto mt-2 h-2 w-64 overflow-hidden rounded-full bg-bg-light">
          <div 
            className="h-full bg-peach-500 transition-all"
            style={{ width: `${timerProgress}%` }}
          ></div>
        </div>
        
        <div className="mt-3 text-sm text-text-secondary">
          Remember the position of all {gameState.pieceCount} pieces
        </div>
      </div>
      
      <div className="relative aspect-square w-full max-w-[600px] overflow-hidden rounded-xl border border-bg-light bg-bg-card shadow-xl">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/80 z-10">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-peach-500 border-t-transparent"></div>
          </div>
        )}
        
        <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-0 border border-gray-700 shadow-inner">
          {position.map((row, i) =>
            row.map((piece, j) => {
              const squareColor = (i + j) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark';
              const squareName = `${String.fromCharCode(97 + j)}${8 - i}`;
              
              return (
                <div
                  key={`${i}-${j}`}
                  className={`flex items-center justify-center ${squareColor} relative border border-gray-800/50 transition-all`}
                  aria-label={`${squareName}${piece ? ' with ' + (piece === piece.toUpperCase() ? 'white' : 'black') + ' ' + mapChessJsPieceToType(piece) : ''}`}
                >
                  {/* Coordinate labels on the edges */}
                  {j === 0 && (
                    <span className="absolute left-1 top-0 text-xs opacity-50 text-black">
                      {8 - i}
                    </span>
                  )}
                  {i === 7 && (
                    <span className="absolute bottom-0 right-1 text-xs opacity-50 text-black">
                      {String.fromCharCode(97 + j)}
                    </span>
                  )}
                  
                  {piece && (
                    <div className="flex items-center justify-center">
                      <Image 
                        src={getPieceImageUrl(
                          mapChessJsPieceToType(piece), 
                          piece === piece.toUpperCase() ? 'white' : 'black'
                        )}
                        alt={`${piece === piece.toUpperCase() ? 'White' : 'Black'} ${mapChessJsPieceToType(piece)}`}
                        width={32}
                        height={32}
                        className="drop-shadow-md"
                        priority
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-text-secondary">
        The board will clear after the timer ends
      </div>
    </div>
  );
} 