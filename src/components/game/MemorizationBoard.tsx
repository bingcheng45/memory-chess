'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export default function MemorizationBoard() {
  const { memorizationChess, gameState } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [timeLeft, setTimeLeft] = useState(gameState.memorizeTime);
  
  // Parse the FEN string to get the position
  useEffect(() => {
    if (!memorizationChess) return;
    
    try {
      const newPosition = Array(8).fill(0).map(() => Array(8).fill(''));
      const fen = memorizationChess.fen();
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
  }, [memorizationChess]);
  
  // Countdown timer
  useEffect(() => {
    if (!gameState.isMemorizationPhase) return;
    
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
  }, [gameState.isMemorizationPhase]);
  
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
      <div className="mb-4 text-center">
        <div className="text-xl font-bold text-white">Memorize the Position</div>
        <div className="text-3xl font-bold text-amber-500">{timeLeft}s</div>
      </div>
      
      <div className="aspect-square w-full max-w-[600px] overflow-hidden rounded-lg border border-white/10 bg-gray-800">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {position.map((row, i) =>
            row.map((piece, j) => {
              const squareColor = (i + j) % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600';
              
              return (
                <div
                  key={`${i}-${j}`}
                  className={`flex items-center justify-center ${squareColor}`}
                >
                  {piece && (
                    <span className="text-2xl">
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 