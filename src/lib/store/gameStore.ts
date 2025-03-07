import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess, PieceSymbol, Square } from 'chess.js';
import { GameState, GameHistory, GamePhase } from '@/lib/types/game';

interface GameStore {
  // Game state
  gameState: GameState;
  gamePhase: GamePhase;
  history: GameHistory[];
  chess: Chess | null;
  memorizationChess: Chess | null; // Chess instance for the position to memorize
  
  // Actions
  startGame: (pieceCount: number, memorizeTime: number) => void;
  stopGame: () => void;
  makeMove: (move: string) => boolean;
  resetGame: () => void;
  addToHistory: (game: Omit<GameHistory, 'id'>) => void;
  
  // Memory game specific actions
  startMemorizationPhase: () => void;
  endMemorizationPhase: () => void;
  startSolutionPhase: () => void;
  submitSolution: () => void;
  placePiece: (square: string, piece: string) => void;
  removePiece: (square: string) => void;
  
  // Stats
  getTotalGames: () => number;
  getBestTime: () => number;
  getAverageAccuracy: () => number;
  getHighestLevel: () => number;
}

// Initial game state
const initialGameState: GameState = {
  isPlaying: false,
  isMemorizationPhase: false,
  isSolutionPhase: false,
  pieceCount: 8, // Default to 8 pieces
  memorizeTime: 10, // Default to 10 seconds
  timeElapsed: 0,
  currentLevel: 1,
  level: 1,
  moves: [],
};

// Initialize a chess instance outside the store to ensure it's created correctly
let initialChess: Chess | null = null;
try {
  initialChess = new Chess();
} catch (error) {
  console.error('Failed to initialize Chess:', error);
}

// Define a type for chess.js move objects
interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

// Function to generate a random chess position with a specified number of pieces
const generateRandomPosition = (pieceCount: number): Chess | null => {
  try {
    // Start with an empty board
    const chess = new Chess('8/8/8/8/8/8/8/8 w - - 0 1');
    
    // Define piece types and their relative frequencies
    const pieces = [
      { type: 'p', weight: 8 }, // pawns (most common)
      { type: 'n', weight: 2 }, // knights
      { type: 'b', weight: 2 }, // bishops
      { type: 'r', weight: 2 }, // rooks
      { type: 'q', weight: 1 }, // queen (least common)
      { type: 'k', weight: 1 }, // king (must have exactly one)
    ];
    
    // Create a weighted array for random selection
    const weightedPieces: string[] = [];
    pieces.forEach(piece => {
      for (let i = 0; i < piece.weight; i++) {
        weightedPieces.push(piece.type);
      }
    });
    
    // Always include one king of each color for a valid position
    let whiteKingPlaced = false;
    let blackKingPlaced = false;
    
    // Track occupied squares
    const occupiedSquares = new Set<string>();
    
    // Place pieces randomly
    let piecesPlaced = 0;
    const maxAttempts = 1000; // Prevent infinite loops
    let attempts = 0;
    
    while (piecesPlaced < pieceCount && attempts < maxAttempts) {
      attempts++;
      
      // Generate random square
      const file = String.fromCharCode(97 + Math.floor(Math.random() * 8)); // a-h
      const rank = Math.floor(Math.random() * 8) + 1; // 1-8
      const square = `${file}${rank}` as Square;
      
      // Skip if square is already occupied
      if (occupiedSquares.has(square)) {
        continue;
      }
      
      // Determine piece type and color
      let pieceType: string;
      const isWhite = Math.random() > 0.5;
      
      // Ensure we place kings
      if (!whiteKingPlaced && piecesPlaced < pieceCount - 1) {
        pieceType = isWhite ? 'K' : weightedPieces[Math.floor(Math.random() * weightedPieces.length)];
        if (pieceType === 'K') whiteKingPlaced = true;
      } else if (!blackKingPlaced && piecesPlaced < pieceCount - 1) {
        pieceType = isWhite ? weightedPieces[Math.floor(Math.random() * weightedPieces.length)] : 'k';
        if (pieceType === 'k') blackKingPlaced = true;
      } else if (!whiteKingPlaced) {
        pieceType = 'K';
        whiteKingPlaced = true;
      } else if (!blackKingPlaced) {
        pieceType = 'k';
        blackKingPlaced = true;
      } else {
        // Random piece
        pieceType = weightedPieces[Math.floor(Math.random() * weightedPieces.length)];
        pieceType = isWhite ? pieceType.toUpperCase() : pieceType;
      }
      
      // Place the piece
      try {
        chess.put({ 
          type: pieceType.toLowerCase() as PieceSymbol, 
          color: isWhite ? 'w' : 'b' 
        }, square);
        occupiedSquares.add(square);
        piecesPlaced++;
      } catch (error) {
        console.error(`Failed to place piece ${pieceType} on ${square}:`, error);
      }
    }
    
    // Ensure both kings are placed (required for a valid chess position)
    if (!whiteKingPlaced) {
      // Find an empty square for the white king
      for (let file = 'a'.charCodeAt(0); file <= 'h'.charCodeAt(0); file++) {
        for (let rank = 1; rank <= 8; rank++) {
          const square = `${String.fromCharCode(file)}${rank}` as Square;
          if (!occupiedSquares.has(square)) {
            chess.put({ type: 'k' as PieceSymbol, color: 'w' }, square);
            whiteKingPlaced = true;
            break;
          }
        }
        if (whiteKingPlaced) break;
      }
    }
    
    if (!blackKingPlaced) {
      // Find an empty square for the black king
      for (let file = 'a'.charCodeAt(0); file <= 'h'.charCodeAt(0); file++) {
        for (let rank = 1; rank <= 8; rank++) {
          const square = `${String.fromCharCode(file)}${rank}` as Square;
          if (!occupiedSquares.has(square)) {
            chess.put({ type: 'k' as PieceSymbol, color: 'b' }, square);
            blackKingPlaced = true;
            break;
          }
        }
        if (blackKingPlaced) break;
      }
    }
    
    return chess;
  } catch (error) {
    console.error('Error generating random position:', error);
    return null;
  }
};

// Function to calculate accuracy between two positions
const calculateAccuracy = (originalFen: string, userFen: string): number => {
  try {
    // Extract piece placement part from FEN strings
    const originalPieces = originalFen.split(' ')[0];
    const userPieces = userFen.split(' ')[0];
    
    // Convert FEN to a map of pieces on squares
    const getSquaresMap = (fen: string): Map<string, string> => {
      const map = new Map<string, string>();
      const rows = fen.split('/');
      
      rows.forEach((row, rowIndex) => {
        let colIndex = 0;
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (isNaN(parseInt(char))) {
            // It's a piece
            const square = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
            map.set(square, char);
            colIndex++;
          } else {
            // It's a number, skip that many squares
            colIndex += parseInt(char);
          }
        }
      });
      
      return map;
    };
    
    const originalMap = getSquaresMap(originalPieces);
    const userMap = getSquaresMap(userPieces);
    
    // Count correct placements
    let correctPlacements = 0;
    let totalPieces = 0;
    
    // Check user placements against original
    originalMap.forEach((piece, square) => {
      totalPieces++;
      if (userMap.get(square) === piece) {
        correctPlacements++;
      }
    });
    
    // Calculate accuracy as a percentage
    return Math.round((correctPlacements / totalPieces) * 100);
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return 0;
  }
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: initialGameState,
      gamePhase: GamePhase.CONFIGURATION,
      history: [],
      chess: initialChess,
      memorizationChess: null,

      startGame: (pieceCount = 8, memorizeTime = 10) => {
        // Create a new chess instance for the game
        let newChess: Chess | null = null;
        try {
          newChess = new Chess();
          console.log('Chess instance created successfully');
        } catch (error) {
          console.error('Failed to create Chess instance in startGame:', error);
        }
        
        // Generate a random position for memorization
        const memorizationPosition = generateRandomPosition(pieceCount);
        
        set({
          chess: newChess,
          memorizationChess: memorizationPosition,
          gameState: {
            ...initialGameState,
            isPlaying: true,
            pieceCount,
            memorizeTime,
            originalPosition: memorizationPosition?.fen() || '',
          },
          gamePhase: GamePhase.CONFIGURATION,
        });
      },

      stopGame: () => {
        const currentState = get().gameState;
        set({ 
          gameState: { ...currentState, isPlaying: false },
          gamePhase: GamePhase.CONFIGURATION,
        });
        
        // Only add to history if the game was completed
        if (currentState.completionTime && currentState.accuracy !== undefined) {
          get().addToHistory({
            date: new Date(),
            completionTime: currentState.completionTime,
            accuracy: currentState.accuracy,
            pieceCount: currentState.pieceCount,
            memorizeTime: currentState.memorizeTime,
            level: currentState.level || currentState.currentLevel || 1,
          });
        }
      },

      startMemorizationPhase: () => {
        const now = Date.now();
        set((state) => ({
          gameState: {
            ...state.gameState,
            isMemorizationPhase: true,
            isSolutionPhase: false,
            memorizeStartTime: now,
          },
          gamePhase: GamePhase.MEMORIZATION,
        }));
      },

      endMemorizationPhase: () => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            isMemorizationPhase: false,
          },
        }));
      },

      startSolutionPhase: () => {
        // Reset the chess board for the user to recreate the position
        let solutionChess: Chess | null = null;
        try {
          // Start with an empty board
          solutionChess = new Chess('8/8/8/8/8/8/8/8 w - - 0 1');
        } catch (error) {
          console.error('Failed to create solution chess instance:', error);
        }
        
        const now = Date.now();
        set((state) => ({
          chess: solutionChess,
          gameState: {
            ...state.gameState,
            isMemorizationPhase: false,
            isSolutionPhase: true,
            timeElapsed: 0, // Reset timer for solution phase
            solutionStartTime: now,
          },
          gamePhase: GamePhase.SOLUTION,
        }));
      },

      submitSolution: () => {
        const { gameState, chess } = get();
        
        if (!chess || !gameState.originalPosition) {
          console.error('Cannot submit solution: missing chess instance or original position');
          return;
        }
        
        // Get the user's solution
        const userPosition = chess.fen();
        
        // Calculate accuracy
        const accuracy = calculateAccuracy(gameState.originalPosition, userPosition);
        
        // Calculate completion time
        const now = Date.now();
        const solutionStartTime = gameState.solutionStartTime || now;
        const completionTime = Math.round((now - solutionStartTime) / 1000);
        
        // Determine success (e.g., accuracy > 80%)
        const success = accuracy >= 80;
        
        set((state) => ({
          gameState: {
            ...state.gameState,
            isSolutionPhase: false,
            userPosition,
            accuracy,
            completionTime,
            success,
          },
          gamePhase: GamePhase.RESULT,
        }));
      },

      placePiece: (square: string, piece: string) => {
        const { chess } = get();
        if (!chess) return;
        
        try {
          // Determine piece color and type
          const color = piece === piece.toLowerCase() ? 'b' : 'w';
          const type = piece.toLowerCase() as PieceSymbol;
          
          // Place the piece
          chess.put({ type, color }, square as Square);
          
          // Update the state
          set((state) => ({
            gameState: {
              ...state.gameState,
              userPosition: chess.fen(),
            },
          }));
        } catch (error) {
          console.error(`Failed to place piece ${piece} on ${square}:`, error);
        }
      },

      removePiece: (square: string) => {
        const { chess } = get();
        if (!chess) return;
        
        try {
          // Remove the piece
          chess.remove(square as Square);
          
          // Update the state
          set((state) => ({
            gameState: {
              ...state.gameState,
              userPosition: chess.fen(),
            },
          }));
        } catch (error) {
          console.error(`Failed to remove piece from ${square}:`, error);
        }
      },

      makeMove: (move: string) => {
        const chess = get().chess;
        if (!chess) {
          console.error('Chess object is null in makeMove');
          return false;
        }
        
        try {
          // Check if the move is in the standard algebraic notation (e.g., "e2e4")
          // If so, convert it to an object format that chess.js can understand
          let moveObj: string | ChessMove;
          if (move.length === 4) {
            moveObj = {
              from: move.substring(0, 2),
              to: move.substring(2, 4),
            };
          } else {
            moveObj = move;
          }
          
          // Try to make the move directly
          const result = chess.move(moveObj);
          
          if (result) {
            // Move was successful
            set((state) => ({
              gameState: {
                ...state.gameState,
                moves: [
                  ...(state.gameState.moves || []), 
                  typeof moveObj === 'string' ? moveObj : `${moveObj.from}${moveObj.to}`
                ],
              },
            }));
            return true;
          } else {
            console.log(`Move failed: ${JSON.stringify(moveObj)}`);
            return false;
          }
        } catch (error) {
          console.error('Invalid move:', error);
          return false;
        }
      },

      resetGame: () => {
        let newChess: Chess | null = null;
        try {
          newChess = new Chess();
        } catch (error) {
          console.error('Failed to create Chess instance in resetGame:', error);
        }
        
        set({
          chess: newChess,
          memorizationChess: null,
          gameState: { ...initialGameState },
          gamePhase: GamePhase.CONFIGURATION,
        });
      },

      addToHistory: (game) => {
        set((state) => ({
          history: [
            {
              ...game,
              id: crypto.randomUUID(),
            },
            ...state.history,
          ].slice(0, 100), // Keep last 100 games
        }));
      },

      getTotalGames: () => get().history.length,

      getBestTime: () => {
        const history = get().history;
        if (history.length === 0) return 0;
        
        // Find the fastest completion time for each piece count
        const bestTimes = new Map<number, number>();
        
        history.forEach(game => {
          const currentBest = bestTimes.get(game.pieceCount) || Infinity;
          if (game.completionTime < currentBest && game.accuracy >= 80) {
            bestTimes.set(game.pieceCount, game.completionTime);
          }
        });
        
        // Return the best time for the current piece count or overall best
        const currentPieceCount = get().gameState.pieceCount;
        return bestTimes.get(currentPieceCount) || 
               Math.min(...Array.from(bestTimes.values()), Infinity) || 
               0;
      },

      getAverageAccuracy: () => {
        const history = get().history;
        if (history.length === 0) return 0;
        return Math.round(
          history.reduce((acc, game) => acc + game.accuracy, 0) / history.length
        );
      },

      getHighestLevel: () => {
        const history = get().history;
        if (history.length === 0) return 1;
        return Math.max(...history.map((game) => game.level));
      },
    }),
    {
      name: 'memory-chess-storage',
      partialize: (state) => ({
        // Don't persist the chess object as it can't be serialized properly
        gameState: state.gameState,
        gamePhase: state.gamePhase,
        history: state.history,
      }),
    }
  )
); 