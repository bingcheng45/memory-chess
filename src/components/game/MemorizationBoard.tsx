'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export default function MemorizationBoard() {
  const { chess, gameState } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [timeLeft, setTimeLeft] = useState(gameState.memorizeTime);
  
  // Parse the FEN string to get the position
  useEffect(() => {
    if (!chess) return;
    
    try {
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
    } catch (error) {
      console.error('Error parsing FEN:', error);
    }
  }, [chess]);
  
  // Countdown timer
  useEffect(() => {
    if (!gameState.isMemorizationPhase) return;
    
    console.log('Starting memorization countdown from', timeLeft, 'seconds');
    setTimeLeft(gameState.memorizeTime); // Reset timer when phase starts
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState.isMemorizationPhase, gameState.memorizeTime, timeLeft]);
  
  // Get piece symbol for display
  const getPieceSymbol = (piece: string): string => {
    const symbols: Record<string, string> = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    };
    return symbols[piece] || '';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 text-center">
        <div className="text-xl font-bold text-text-primary">Memorize the Position</div>
        <div className="mt-3 text-5xl font-bold text-peach-500">{timeLeft}</div>
        <div className="mt-2 text-sm text-text-secondary">
          Remember the position of all {gameState.pieceCount} pieces
        </div>
      </div>
      
      <div className="aspect-square w-full max-w-[600px] overflow-hidden rounded-xl border border-bg-light bg-bg-card shadow-xl">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {position.map((row, i) =>
            row.map((piece, j) => {
              const squareColor = (i + j) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark';
              
              return (
                <div
                  key={`${i}-${j}`}
                  className={`flex items-center justify-center ${squareColor}`}
                >
                  {piece && (
                    <span className={`text-3xl ${piece === piece.toUpperCase() ? 'text-text-primary' : 'text-peach-500'}`}>
                      {getPieceSymbol(piece)}
                    </span>
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