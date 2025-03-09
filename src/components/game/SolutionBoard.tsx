'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';

// Memoized chess square component
const SolutionSquare = memo(({ 
  row, 
  col, 
  piece, 
  onClick, 
  onKeyDown,
  isLoading,
  disabled,
  ariaLabel
}: { 
  row: number;
  col: number;
  piece: string;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  disabled: boolean;
  ariaLabel: string;
}) => {
  const squareColor = (row + col) % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600';
  
  return (
    <button
      data-square={`${row}-${col}`}
      className={`flex items-center justify-center ${squareColor}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      tabIndex={0}
      type="button"
      disabled={isLoading || disabled}
    >
      {piece && (
        <span className="text-2xl">
          {getPieceSymbol(piece)}
        </span>
      )}
    </button>
  );
});

SolutionSquare.displayName = 'SolutionSquare';

// Memoized piece selector button
const PieceButton = memo(({ 
  piece, 
  color, 
  isSelected, 
  onClick, 
  index 
}: { 
  piece: string;
  color: 'w' | 'b';
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) => {
  const displayPiece = color === 'w' ? piece.toUpperCase() : piece;
  const pieceName = piece === 'p' ? 'pawn' : 
                    piece === 'n' ? 'knight' : 
                    piece === 'b' ? 'bishop' : 
                    piece === 'r' ? 'rook' : 
                    piece === 'q' ? 'queen' : 'king';
  
  return (
    <button
      className={`flex h-10 w-10 items-center justify-center rounded ${isSelected ? 'bg-blue-500' : 'bg-gray-600'}`}
      onClick={onClick}
      aria-label={`Select ${pieceName}`}
      aria-keyshortcuts={`${index + 1}`}
    >
      <span className="text-2xl">
        {getPieceSymbol(displayPiece)}
      </span>
      <span className="absolute bottom-0 right-0 text-xs">{index + 1}</span>
    </button>
  );
});

PieceButton.displayName = 'PieceButton';

export default function SolutionBoard() {
  const { chess, gameState, placePiece, removePiece } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<'w' | 'b'>('w');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parse the FEN string to get the current position
  useEffect(() => {
    if (!chess) {
      setError('Chess engine not available');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Safely check if fen method exists
      if (typeof chess.fen !== 'function') {
        console.error('Chess object does not have fen method');
        setError('Chess engine error');
        return;
      }
      
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
      setError(null);
    } catch (error) {
      console.error('Error parsing FEN:', error);
      setError('Failed to update board');
    } finally {
      setIsLoading(false);
    }
  }, [chess, gameState.userPosition]);
  
  // Handle square click
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!chess || !gameState.isSolutionPhase || isLoading) return;
    
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    const piece = position[row][col];
    
    if (piece) {
      // If there's already a piece on the square, remove it
      try {
        removePiece(square);
        // Play remove sound
        import('@/lib/utils/soundEffects').then(({ playSound }) => {
          playSound('remove');
        });
      } catch (error) {
        console.error('Error removing piece:', error);
        setError('Failed to remove piece');
      }
    } else if (selectedPiece) {
      // If a piece is selected, place it on the square
      try {
        placePiece(square, `${selectedColor === 'w' ? selectedPiece.toUpperCase() : selectedPiece.toLowerCase()}`);
        // Play place sound
        import('@/lib/utils/soundEffects').then(({ playSound }) => {
          playSound('place');
        });
      } catch (error) {
        console.error('Error placing piece:', error);
        setError('Failed to place piece');
      }
    }
  }, [chess, gameState.isSolutionPhase, isLoading, position, selectedPiece, selectedColor, placePiece, removePiece]);
  
  // Handle piece selection
  const handlePieceSelect = useCallback((piece: string) => {
    setSelectedPiece(piece);
    // Play click sound
    import('@/lib/utils/soundEffects').then(({ playSound }) => {
      playSound('click');
    });
  }, []);
  
  // Toggle piece color
  const togglePieceColor = useCallback(() => {
    setSelectedColor(prev => prev === 'w' ? 'b' : 'w');
    // Play click sound
    import('@/lib/utils/soundEffects').then(({ playSound }) => {
      playSound('click');
    });
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    // Handle arrow keys for navigation
    if (e.key === 'ArrowUp' && row > 0) {
      const element = document.querySelector(`[data-square="${row-1}-${col}"]`) as HTMLElement;
      element?.focus();
    } else if (e.key === 'ArrowDown' && row < 7) {
      const element = document.querySelector(`[data-square="${row+1}-${col}"]`) as HTMLElement;
      element?.focus();
    } else if (e.key === 'ArrowLeft' && col > 0) {
      const element = document.querySelector(`[data-square="${row}-${col-1}"]`) as HTMLElement;
      element?.focus();
    } else if (e.key === 'ArrowRight' && col < 7) {
      const element = document.querySelector(`[data-square="${row}-${col+1}"]`) as HTMLElement;
      element?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // Select square on Enter or Space
      handleSquareClick(row, col);
    } else if (e.key >= '1' && e.key <= '6') {
      // Keyboard shortcuts for piece selection
      const pieces = ['p', 'n', 'b', 'r', 'q', 'k'];
      const index = parseInt(e.key) - 1;
      if (index >= 0 && index < pieces.length) {
        handlePieceSelect(pieces[index]);
      }
    } else if (e.key === 'c') {
      // Toggle color with 'c' key
      togglePieceColor();
    }
  }, [handleSquareClick, handlePieceSelect, togglePieceColor]);
  
  // Memoize the board rendering
  const boardSquares = useMemo(() => {
    return position.map((row, i) =>
      row.map((piece, j) => {
        const squareAriaLabel = `${String.fromCharCode(97 + j)}${8 - i}${piece ? ' with ' + getPieceSymbol(piece) : ''}`;
        
        return (
          <SolutionSquare
            key={`${i}-${j}`}
            row={i}
            col={j}
            piece={piece}
            onClick={() => handleSquareClick(i, j)}
            onKeyDown={(e) => handleKeyDown(e, i, j)}
            isLoading={isLoading}
            disabled={!gameState.isSolutionPhase}
            ariaLabel={squareAriaLabel}
          />
        );
      })
    );
  }, [position, handleSquareClick, handleKeyDown, isLoading, gameState.isSolutionPhase]);
  
  // Memoize the piece selector buttons
  const pieceButtons = useMemo(() => {
    const pieces = ['p', 'n', 'b', 'r', 'q', 'k'];
    
    return pieces.map((piece, index) => (
      <PieceButton
        key={piece}
        piece={piece}
        color={selectedColor}
        isSelected={selectedPiece === piece}
        onClick={() => handlePieceSelect(piece)}
        index={index}
      />
    ));
  }, [selectedColor, selectedPiece, handlePieceSelect]);
  
  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="w-full rounded-lg bg-red-900/80 p-2 text-center text-white">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-2 rounded bg-white px-2 py-1 text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="relative aspect-square w-full max-w-[600px] overflow-hidden rounded-lg border border-white/10 bg-gray-800">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          </div>
        )}
        
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {boardSquares}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 p-2">
        <div className="flex items-center gap-2 rounded-lg bg-gray-700 p-2">
          <button
            className={`rounded px-3 py-1 ${selectedColor === 'w' ? 'bg-white text-gray-800' : 'bg-gray-600 text-white'}`}
            onClick={togglePieceColor}
            aria-label={`Selected color: ${selectedColor === 'w' ? 'white' : 'black'}`}
          >
            {selectedColor === 'w' ? 'White' : 'Black'}
          </button>
          
          {pieceButtons}
        </div>
        
        <div className="ml-2 text-sm text-gray-400">
          <p>Keyboard: 1-6 for pieces, C to toggle color, Space to place/remove</p>
        </div>
      </div>
    </div>
  );
}

// Get piece symbol for display
function getPieceSymbol(piece: string): string {
  const symbols: Record<string, string> = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  };
  return symbols[piece] || '';
} 