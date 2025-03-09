'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Chess } from 'chess.js';

interface ChessBoardProps {
  readonly onMove?: (move: string) => boolean;
}

// Memoized chess square component
const ChessSquare = memo(({ 
  row, 
  col, 
  piece, 
  isSelected, 
  isValidMove, 
  onClick, 
  onKeyDown,
  isLoading,
  ariaLabel
}: { 
  row: number;
  col: number;
  piece: string;
  isSelected: boolean;
  isValidMove: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  ariaLabel: string;
}) => {
  const squareColor = (row + col) % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600';
  
  return (
    <button
      data-square={`${row}-${col}`}
      className={`flex items-center justify-center border-none ${squareColor} 
        ${isSelected ? 'bg-blue-600/50' : ''} 
        ${isValidMove ? 'bg-green-600/30' : ''}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      tabIndex={0}
      type="button"
      disabled={isLoading}
    >
      {piece && (
        <span className="text-2xl">
          {getPieceSymbol(piece)}
        </span>
      )}
    </button>
  );
});

ChessSquare.displayName = 'ChessSquare';

export default function ChessBoard({ onMove }: ChessBoardProps) {
  const { chess, gameState } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [boardInitialized, setBoardInitialized] = useState(false);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [highlightedSquares, setHighlightedSquares] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update the list of valid moves
  const updateValidMoves = useCallback(() => {
    if (!chess) {
      setValidMoves([]);
      return;
    }

    try {
      // Safely check if moves method exists
      if (typeof chess.moves !== 'function') {
        console.error('Chess object does not have moves method');
        setValidMoves([]);
        return;
      }

      // Get all valid moves in the current position
      const moves = chess.moves({ verbose: true });
      if (!moves || !Array.isArray(moves)) {
        setValidMoves([]);
        return;
      }
      
      // Format moves as "fromTo" strings (e.g., "e2e4")
      const formattedMoves = moves.map(move => `${move.from}${move.to}`);
      setValidMoves(formattedMoves);
    } catch (error) {
      console.error('Error getting valid moves:', error);
      setError('Failed to get valid moves');
      setValidMoves([]);
    }
  }, [chess]);

  // Update the board when the chess state changes
  const updateBoard = useCallback(() => {
    if (!chess) {
      console.error('Chess object is not available');
      return;
    }

    try {
      // Safely check if fen method exists
      if (typeof chess.fen !== 'function') {
        console.error('Chess object does not have fen method');
        return;
      }

      setIsLoading(true);
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
      console.error('Error updating chess board:', error);
      setError('Failed to update board');
    } finally {
      setIsLoading(false);
    }
  }, [chess]);

  // Initialize the board with the starting position
  const initializeBoard = useCallback(() => {
    setIsLoading(true);
    
    // Create an empty 8x8 board
    const emptyBoard = Array(8).fill(0).map(() => Array(8).fill(''));
    
    // Set up the standard chess starting position if chess is not available
    if (!chess) {
      // Pawns
      for (let i = 0; i < 8; i++) {
        emptyBoard[1][i] = 'p'; // Black pawns
        emptyBoard[6][i] = 'P'; // White pawns
      }
      
      // Black pieces
      emptyBoard[0][0] = 'r'; emptyBoard[0][7] = 'r'; // Rooks
      emptyBoard[0][1] = 'n'; emptyBoard[0][6] = 'n'; // Knights
      emptyBoard[0][2] = 'b'; emptyBoard[0][5] = 'b'; // Bishops
      emptyBoard[0][3] = 'q'; // Queen
      emptyBoard[0][4] = 'k'; // King
      
      // White pieces
      emptyBoard[7][0] = 'R'; emptyBoard[7][7] = 'R'; // Rooks
      emptyBoard[7][1] = 'N'; emptyBoard[7][6] = 'N'; // Knights
      emptyBoard[7][2] = 'B'; emptyBoard[7][5] = 'B'; // Bishops
      emptyBoard[7][3] = 'Q'; // Queen
      emptyBoard[7][4] = 'K'; // King
      
      setPosition(emptyBoard);
      setBoardInitialized(true);
      setIsLoading(false);
      return;
    }
    
    try {
      updateBoard();
      updateValidMoves();
      setBoardInitialized(true);
      setError(null);
    } catch (error) {
      console.error('Error initializing board:', error);
      setPosition(emptyBoard);
      setBoardInitialized(true);
      setError('Failed to initialize board');
    } finally {
      setIsLoading(false);
    }
  }, [chess, updateBoard, updateValidMoves]);

  // Update highlighted squares based on selected square
  const updateHighlightedSquares = useCallback(() => {
    if (!selectedSquare) {
      setHighlightedSquares(new Set());
      return;
    }

    const newHighlightedSquares = new Set<string>();
    
    // Find all valid moves from the selected square
    validMoves.forEach(move => {
      if (move.startsWith(selectedSquare)) {
        // Add the destination square to highlighted squares
        newHighlightedSquares.add(move.substring(2));
      }
    });
    
    setHighlightedSquares(newHighlightedSquares);
  }, [selectedSquare, validMoves]);

  // Initialize the board on first render
  useEffect(() => {
    if (!boardInitialized) {
      initializeBoard();
    }
  }, [boardInitialized, initializeBoard]);

  // Update the board when the chess object changes
  useEffect(() => {
    if (chess && boardInitialized) {
      updateBoard();
      updateValidMoves();
    }
  }, [chess, updateBoard, updateValidMoves, boardInitialized]);

  // Update highlighted squares when selected square changes
  useEffect(() => {
    updateHighlightedSquares();
  }, [selectedSquare, updateHighlightedSquares]);

  // Handle selecting a piece
  const handlePieceSelection = useCallback((row: number, col: number) => {
    const piece = position[row][col];
    if (!piece) return false;
    
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    
    if (isPieceOfCurrentTurn(piece, chess)) {
      setSelectedSquare(square);
      return true;
    }
    return false;
  }, [position, chess]);

  // Handle attempting a move
  const handleMovePiece = useCallback((fromSquare: string, toSquare: string) => {
    if (!onMove) return false;
    
    const move = `${fromSquare}${toSquare}`;
    
    // Check if the move is valid
    if (validMoves.includes(move)) {
      return onMove(move);
    }
    return false;
  }, [onMove, validMoves]);

  // Main click handler with reduced complexity
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!gameState.isPlaying || isLoading) return;

    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    
    // If a square is already selected, try to make a move
    if (selectedSquare) {
      const moveSuccessful = handleMovePiece(selectedSquare, square);
      
      // If move failed, check if clicked on another piece of same color
      if (!moveSuccessful) {
        const pieceSelected = handlePieceSelection(row, col);
        
        // If not selecting another piece, deselect current piece
        if (!pieceSelected) {
          setSelectedSquare(null);
        }
      } else {
        // Move was successful, deselect
        setSelectedSquare(null);
      }
    } else {
      // No square selected yet, try to select a piece
      handlePieceSelection(row, col);
    }
  }, [gameState.isPlaying, isLoading, selectedSquare, handleMovePiece, handlePieceSelection]);

  // Determine if a square should be highlighted as a valid move destination
  const isValidMoveDestination = useCallback((row: number, col: number) => {
    const targetSquare = `${String.fromCharCode(97 + col)}${8 - row}`;
    return highlightedSquares.has(targetSquare);
  }, [highlightedSquares]);

  // Generate aria-label for a square
  const getSquareAriaLabel = useCallback((row: number, col: number, piece: string) => {
    const squareName = `${String.fromCharCode(97 + col)}${8 - row}`;
    if (piece) {
      return `${squareName} with ${getPieceSymbol(piece)}`;
    }
    return squareName;
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
      // Select or move on Enter or Space
      handleSquareClick(row, col);
    }
  }, [handleSquareClick]);

  // Memoize the board rendering
  const boardSquares = useMemo(() => {
    return position.map((row, i) =>
      row.map((piece, j) => {
        const isSelected = selectedSquare === `${String.fromCharCode(97 + j)}${8 - i}`;
        const isValidMove = isValidMoveDestination(i, j);
        const squareAriaLabel = getSquareAriaLabel(i, j, piece);
        
        return (
          <ChessSquare
            key={`${i}-${j}`}
            row={i}
            col={j}
            piece={piece}
            isSelected={isSelected}
            isValidMove={isValidMove}
            onClick={() => handleSquareClick(i, j)}
            onKeyDown={(e) => handleKeyDown(e, i, j)}
            isLoading={isLoading}
            ariaLabel={squareAriaLabel}
          />
        );
      })
    );
  }, [position, selectedSquare, isValidMoveDestination, getSquareAriaLabel, handleSquareClick, handleKeyDown, isLoading]);

  return (
    <div className="aspect-square w-full max-w-[600px] overflow-hidden rounded-lg border border-white/10 bg-gray-800">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 text-white">
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              initializeBoard();
            }}
            className="ml-2 rounded bg-white px-2 py-1 text-red-900"
          >
            Retry
          </button>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        </div>
      )}
      
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {boardSquares}
      </div>
    </div>
  );
}

// Helper function to determine if a piece belongs to the current turn
function isPieceOfCurrentTurn(piece: string, chess: Chess | null): boolean {
  if (!chess) return true;
  
  try {
    // Safely check if turn method exists
    if (typeof chess.turn !== 'function') {
      console.error('Chess object does not have turn method');
      return true;
    }
    
    const isWhitePiece = piece === piece.toUpperCase();
    const isWhiteTurn = chess.turn() === 'w';
    return isWhitePiece === isWhiteTurn;
  } catch (error) {
    console.error('Error checking piece turn:', error);
    return true;
  }
}

function getPieceSymbol(piece: string): string {
  const symbols: Record<string, string> = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  };
  return symbols[piece] || '';
} 