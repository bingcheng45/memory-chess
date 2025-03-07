'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

export default function SolutionBoard() {
  const { chess, gameState, placePiece, removePiece } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<'w' | 'b'>('w');
  
  // Parse the FEN string to get the current position
  useEffect(() => {
    if (!chess) return;
    
    try {
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
  }, [chess, gameState.userPosition]);
  
  // Handle square click
  const handleSquareClick = (row: number, col: number) => {
    if (!chess || !gameState.isSolutionPhase) return;
    
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    const piece = position[row][col];
    
    if (piece) {
      // If there's already a piece on the square, remove it
      removePiece(square);
    } else if (selectedPiece) {
      // If a piece is selected, place it on the square
      const pieceToPlace = selectedColor === 'w' 
        ? selectedPiece.toUpperCase() 
        : selectedPiece.toLowerCase();
      
      placePiece(square, pieceToPlace);
    }
  };
  
  // Get piece symbol for display
  const getPieceSymbol = (piece: string): string => {
    const symbols: Record<string, string> = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    };
    return symbols[piece] || '';
  };
  
  // Piece selector
  const PieceSelector = () => {
    const pieces = ['k', 'q', 'r', 'b', 'n', 'p'];
    
    return (
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {pieces.map((piece) => {
          const displayPiece = selectedColor === 'w' ? piece.toUpperCase() : piece;
          const isSelected = selectedPiece === piece;
          
          return (
            <button
              key={piece}
              onClick={() => setSelectedPiece(isSelected ? null : piece)}
              className={`flex h-12 w-12 items-center justify-center rounded-md border ${
                isSelected 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : 'border-gray-600 bg-gray-700'
              }`}
              aria-label={`Select ${piece} piece`}
              type="button"
            >
              <span className="text-2xl">{getPieceSymbol(displayPiece)}</span>
            </button>
          );
        })}
        
        <button
          onClick={() => setSelectedColor(selectedColor === 'w' ? 'b' : 'w')}
          className="flex h-12 items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-3"
          aria-label="Toggle piece color"
          type="button"
        >
          <span className="text-sm font-medium">
            {selectedColor === 'w' ? 'White' : 'Black'}
          </span>
        </button>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        <div className="text-xl font-bold text-white">Recreate the Position</div>
      </div>
      
      <PieceSelector />
      
      <div className="aspect-square w-full max-w-[600px] overflow-hidden rounded-lg border border-white/10 bg-gray-800">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {position.map((row, i) =>
            row.map((piece, j) => {
              const squareColor = (i + j) % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600';
              
              return (
                <button
                  key={`${i}-${j}`}
                  className={`flex items-center justify-center border-none ${squareColor}`}
                  onClick={() => handleSquareClick(i, j)}
                  aria-label={`Square ${String.fromCharCode(97 + j)}${8 - i}`}
                  type="button"
                >
                  {piece && (
                    <span className="text-2xl">
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 