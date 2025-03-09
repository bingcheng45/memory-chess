'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export default function MemorizationBoard() {
  const { chess, gameState } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [timeLeft, setTimeLeft] = useState(gameState.memorizeTime);
  const [milliseconds, setMilliseconds] = useState(99);
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
    
    console.log('Starting memorization countdown from', timeLeft, 'seconds');
    setTimeLeft(gameState.memorizeTime); // Reset timer when phase starts
    setMilliseconds(99);
    
    // Update milliseconds every 10ms for smooth countdown
    const msTimer = setInterval(() => {
      setMilliseconds((prev) => {
        if (prev <= 0) {
          return 99;
        }
        return prev - 1;
      });
    }, 10);
    
    // Update seconds every second
    const secTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(secTimer);
          clearInterval(msTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(secTimer);
      clearInterval(msTimer);
    };
  }, [gameState.isMemorizationPhase, gameState.memorizeTime]);
  
  // Calculate progress percentage for the timer
  const timerProgress = useMemo(() => {
    const totalTime = gameState.memorizeTime;
    const elapsedTime = totalTime - timeLeft - (milliseconds / 100);
    return Math.max(0, Math.min(100, (elapsedTime / totalTime) * 100));
  }, [timeLeft, milliseconds, gameState.memorizeTime]);
  
  // Get piece symbol for display
  const getPieceSymbol = (piece: string): string => {
    const symbols: Record<string, string> = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    };
    return symbols[piece] || '';
  };
  
  // Count pieces by type for the piece inventory
  const pieceCounts = useMemo(() => {
    const counts = {
      white: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0, total: 0 },
      black: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0, total: 0 }
    };
    
    position.forEach(row => {
      row.forEach(piece => {
        if (!piece) return;
        
        const isWhite = piece === piece.toUpperCase();
        const pieceType = piece.toLowerCase();
        
        if (isWhite) {
          counts.white[pieceType as keyof typeof counts.white]++;
          counts.white.total++;
        } else {
          counts.black[pieceType as keyof typeof counts.black]++;
          counts.black.total++;
        }
      });
    });
    
    return counts;
  }, [position]);
  
  // Get urgency class based on time left
  const getUrgencyClass = () => {
    if (timeLeft <= 3) return 'text-red-500 animate-pulse';
    if (timeLeft <= 5) return 'text-orange-500';
    return 'text-peach-500';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <div className="text-xl font-bold text-text-primary">Memorize the Position</div>
        <div className={`mt-3 text-6xl font-bold ${getUrgencyClass()} transition-colors`}>
          {timeLeft}
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
        
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {position.map((row, i) =>
            row.map((piece, j) => {
              const squareColor = (i + j) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark';
              const squareName = `${String.fromCharCode(97 + j)}${8 - i}`;
              
              return (
                <div
                  key={`${i}-${j}`}
                  className={`flex items-center justify-center ${squareColor} relative`}
                  aria-label={`${squareName}${piece ? ' with ' + getPieceSymbol(piece) : ''}`}
                >
                  {/* Coordinate labels on the edges */}
                  {j === 0 && (
                    <span className="absolute left-1 top-0 text-xs opacity-50">
                      {8 - i}
                    </span>
                  )}
                  {i === 7 && (
                    <span className="absolute bottom-0 right-1 text-xs opacity-50">
                      {String.fromCharCode(97 + j)}
                    </span>
                  )}
                  
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
      
      {/* Piece inventory */}
      <div className="mt-6 flex w-full max-w-[600px] justify-between rounded-lg bg-bg-card p-3 text-sm">
        <div className="flex items-center">
          <span className="mr-2 font-medium text-text-primary">White:</span>
          {pieceCounts.white.k > 0 && <span className="mx-1">♔{pieceCounts.white.k > 1 ? pieceCounts.white.k : ''}</span>}
          {pieceCounts.white.q > 0 && <span className="mx-1">♕{pieceCounts.white.q > 1 ? pieceCounts.white.q : ''}</span>}
          {pieceCounts.white.r > 0 && <span className="mx-1">♖{pieceCounts.white.r > 1 ? pieceCounts.white.r : ''}</span>}
          {pieceCounts.white.b > 0 && <span className="mx-1">♗{pieceCounts.white.b > 1 ? pieceCounts.white.b : ''}</span>}
          {pieceCounts.white.n > 0 && <span className="mx-1">♘{pieceCounts.white.n > 1 ? pieceCounts.white.n : ''}</span>}
          {pieceCounts.white.p > 0 && <span className="mx-1">♙{pieceCounts.white.p > 1 ? pieceCounts.white.p : ''}</span>}
          <span className="ml-2 text-text-secondary">({pieceCounts.white.total})</span>
        </div>
        
        <div className="flex items-center">
          <span className="mr-2 font-medium text-peach-500">Black:</span>
          {pieceCounts.black.k > 0 && <span className="mx-1 text-peach-500">♚{pieceCounts.black.k > 1 ? pieceCounts.black.k : ''}</span>}
          {pieceCounts.black.q > 0 && <span className="mx-1 text-peach-500">♛{pieceCounts.black.q > 1 ? pieceCounts.black.q : ''}</span>}
          {pieceCounts.black.r > 0 && <span className="mx-1 text-peach-500">♜{pieceCounts.black.r > 1 ? pieceCounts.black.r : ''}</span>}
          {pieceCounts.black.b > 0 && <span className="mx-1 text-peach-500">♝{pieceCounts.black.b > 1 ? pieceCounts.black.b : ''}</span>}
          {pieceCounts.black.n > 0 && <span className="mx-1 text-peach-500">♞{pieceCounts.black.n > 1 ? pieceCounts.black.n : ''}</span>}
          {pieceCounts.black.p > 0 && <span className="mx-1 text-peach-500">♟{pieceCounts.black.p > 1 ? pieceCounts.black.p : ''}</span>}
          <span className="ml-2 text-text-secondary">({pieceCounts.black.total})</span>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-text-secondary">
        The board will clear after the timer ends
      </div>
    </div>
  );
} 