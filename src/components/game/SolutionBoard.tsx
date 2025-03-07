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
    const pieces = [
      { type: 'k', name: 'King' },
      { type: 'q', name: 'Queen' },
      { type: 'r', name: 'Rook' },
      { type: 'b', name: 'Bishop' },
      { type: 'n', name: 'Knight' },
      { type: 'p', name: 'Pawn' }
    ];
    
    return (
      <div className="mb-6">
        <div className="mb-2 text-center text-sm font-medium text-text-secondary">
          Select a piece to place
        </div>
        
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          {pieces.map(({ type, name }) => {
            const displayPiece = selectedColor === 'w' ? type.toUpperCase() : type;
            const isSelected = selectedPiece === type;
            
            return (
              <button
                key={type}
                onClick={() => setSelectedPiece(isSelected ? null : type)}
                className={`flex h-14 w-14 flex-col items-center justify-center rounded-md border ${
                  isSelected 
                    ? 'border-peach-500 bg-peach-500/10' 
                    : 'border-bg-light bg-bg-card'
                } transition-all hover:border-peach-400`}
                aria-label={`Select ${name} piece`}
                type="button"
              >
                <span className={`text-2xl ${selectedColor === 'w' ? 'text-text-primary' : 'text-peach-500'}`}>
                  {getPieceSymbol(displayPiece)}
                </span>
                <span className="mt-1 text-xs text-text-secondary">{name}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => setSelectedColor(selectedColor === 'w' ? 'b' : 'w')}
            className={`flex items-center justify-center rounded-md border px-4 py-2 transition-all ${
              selectedColor === 'w'
                ? 'border-peach-200/30 bg-peach-500/10 text-text-primary'
                : 'border-peach-500/30 bg-peach-500/5 text-peach-500'
            }`}
            aria-label="Toggle piece color"
            type="button"
          >
            {selectedColor === 'w' ? 'White Pieces' : 'Black Pieces'}
          </button>
        </div>
      </div>
    );
  };
  
  // Instructions for the user
  const Instructions = () => (
    <div className="mb-4 rounded-lg bg-peach-500/5 p-3 text-sm text-text-secondary">
      <p className="mb-1 font-medium text-text-primary">Instructions:</p>
      <ul className="list-inside list-disc">
        <li>Select a piece type from above</li>
        <li>Click on the board to place the piece</li>
        <li>Click on a placed piece to remove it</li>
        <li>Toggle between white and black pieces</li>
        <li>Submit your solution when finished</li>
      </ul>
    </div>
  );
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        <div className="text-xl font-bold text-text-primary">Recreate the Position</div>
        <div className="mt-1 text-sm text-text-secondary">
          Place the pieces as you remember them
        </div>
      </div>
      
      <Instructions />
      <PieceSelector />
      
      <div className="aspect-square w-full max-w-[600px] overflow-hidden rounded-xl border border-bg-light bg-bg-card shadow-xl">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {position.map((row, i) =>
            row.map((piece, j) => {
              const squareColor = (i + j) % 2 === 0 ? 'bg-bg-light' : 'bg-bg-card';
              const squareName = `${String.fromCharCode(97 + j)}${8 - i}`;
              
              return (
                <button
                  key={`${i}-${j}`}
                  className={`flex items-center justify-center border-none ${squareColor} ${
                    selectedPiece ? 'cursor-pointer hover:bg-peach-500/10' : ''
                  }`}
                  onClick={() => handleSquareClick(i, j)}
                  aria-label={`Square ${squareName}${piece ? ` with ${getPieceSymbol(piece)}` : ''}`}
                  type="button"
                >
                  {piece && (
                    <span className={`text-3xl ${piece === piece.toUpperCase() ? 'text-text-primary' : 'text-peach-500'}`}>
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-text-secondary">
        Placed {position.flat().filter(Boolean).length} of {gameState.pieceCount} pieces
      </div>
    </div>
  );
} 