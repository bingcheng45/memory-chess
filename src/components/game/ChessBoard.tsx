'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { Chess } from 'chess.js';

interface ChessBoardProps {
  readonly onMove?: (move: string) => boolean;
}

export default function ChessBoard({ onMove }: ChessBoardProps) {
  const { chess, gameState } = useGameStore();
  const [position, setPosition] = useState<string[][]>(Array(8).fill(0).map(() => Array(8).fill('')));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [boardInitialized, setBoardInitialized] = useState(false);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [highlightedSquares, setHighlightedSquares] = useState<Set<string>>(new Set());

  // Update the list of valid moves
  const updateValidMoves = useCallback(() => {
    if (!chess || typeof chess.moves !== 'function') {
      setValidMoves([]);
      return;
    }

    try {
      // Get all valid moves in the current position
      const moves = chess.moves({ verbose: true });
      if (!moves) {
        setValidMoves([]);
        return;
      }
      
      // Format moves as "fromTo" strings (e.g., "e2e4")
      const formattedMoves = moves.map(move => `${move.from}${move.to}`);
      setValidMoves(formattedMoves);
    } catch (error) {
      console.error('Error getting valid moves:', error);
      setValidMoves([]);
    }
  }, [chess]);

  // Update the board when the chess state changes
  const updateBoard = useCallback(() => {
    if (!chess || typeof chess.fen !== 'function') {
      console.error('Chess object is not properly initialized');
      return;
    }

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
      console.error('Error updating chess board:', error);
    }
  }, [chess]);

  // Initialize the board with the starting position
  const initializeBoard = useCallback(() => {
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
      return;
    }
    
    try {
      updateBoard();
      updateValidMoves();
      setBoardInitialized(true);
    } catch (error) {
      console.error('Error initializing board:', error);
      setPosition(emptyBoard);
      setBoardInitialized(true);
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
  const handlePieceSelection = (row: number, col: number) => {
    const piece = position[row][col];
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    
    if (piece && isPieceOfCurrentTurn(piece, chess)) {
      setSelectedSquare(square);
      return true;
    }
    return false;
  };

  // Handle attempting a move
  const handleMovePiece = (fromSquare: string, toSquare: string) => {
    const move = `${fromSquare}${toSquare}`;
    
    // Check if the move is valid
    if (validMoves.includes(move)) {
      onMove?.(move);
      return true;
    }
    return false;
  };

  // Main click handler with reduced complexity
  const handleSquareClick = (row: number, col: number) => {
    if (!gameState.isPlaying) return;

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
  };

  // Determine if a square should be highlighted as a valid move destination
  const isValidMoveDestination = (row: number, col: number) => {
    const targetSquare = `${String.fromCharCode(97 + col)}${8 - row}`;
    return highlightedSquares.has(targetSquare);
  };

  // Generate aria-label for a square
  const getSquareAriaLabel = (row: number, col: number, piece: string) => {
    const squareName = `${String.fromCharCode(97 + col)}${8 - row}`;
    if (piece) {
      return `${squareName} with ${getPieceSymbol(piece)}`;
    }
    return squareName;
  };

  return (
    <div className="aspect-square w-full max-w-[600px] overflow-hidden rounded-lg border border-white/10 bg-gray-800">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {position.map((row, i) =>
          row.map((piece, j) => {
            const squareColor = (i + j) % 2 === 0 ? 'bg-gray-700' : 'bg-gray-600';
            const isSelected = selectedSquare === `${String.fromCharCode(97 + j)}${8 - i}`;
            const isValidMove = isValidMoveDestination(i, j);
            const squareAriaLabel = getSquareAriaLabel(i, j, piece);
            
            return (
              <button
                key={`${i}-${j}`}
                className={`flex items-center justify-center border-none ${squareColor} 
                  ${isSelected ? 'bg-blue-600/50' : ''} 
                  ${isValidMove ? 'bg-green-600/30' : ''}`}
                onClick={() => handleSquareClick(i, j)}
                aria-label={squareAriaLabel}
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
  );
}

// Helper function to determine if a piece belongs to the current turn
function isPieceOfCurrentTurn(piece: string, chess: Chess | null): boolean {
  if (!chess || typeof chess.turn !== 'function') return true;
  
  try {
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