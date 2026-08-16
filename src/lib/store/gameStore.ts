import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess, PieceSymbol, Square } from 'chess.js';
import { GameState, GameHistory, GamePhase, DIFFICULTY_LEVELS, DifficultyLevel } from '@/lib/types/game';
import { generateMemorizationPosition } from '@/lib/utils/memorizationPosition';
import { v4 as uuidv4 } from 'uuid';

// Extended GameState type with skillRatingChange
type GameStateWithRating = GameState & { 
  skillRatingChange?: number;
  wrongPieces?: number;
  extraPieces?: number;
  totalPiecesPlaced?: number;
  correctPlacements?: number;
};

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
  submitSolution: (completionTimeOverride?: number) => void;
  placePiece: (square: string, piece: string) => void;
  removePiece: (square: string) => void;
  
  // Stats and progression (kept because they're used in game components)
  getTotalGames: () => number;
  getBestTime: () => number;
  getAverageAccuracy: () => number;
  getHighestLevel: () => number;
  getSkillRating: () => number;
  getCurrentStreak: () => number;
  getLongestStreak: () => number;
  getRecommendedDifficulty: () => DifficultyLevel;
  calculateSkillRatingChange: (accuracy: number, pieceCount: number, completionTime: number) => number;
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
  skillRating: 1000, // Starting skill rating
  streak: 0,
  moves: [], // Initialize empty moves array
};

// Initialize a chess instance outside the store to ensure it's created correctly
let initialChess: Chess | null = null;
try {
  // Initialize with a minimal valid board (just kings)
  initialChess = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
} catch (error) {
  console.error('Failed to initialize chess instance:', error);
  initialChess = null;
}

// Define a type for chess.js move objects
interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

// Function to calculate accuracy between two positions
const calculateAccuracy = (originalFen: string, userFen: string): {
  accuracy: number;
  extraPieces: number;
  totalPiecesPlaced: number;
  correctPlacements: number;
} => {
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
    
    // Count correct placements and total pieces
    let correctPlacements = 0;
    const totalOriginalPieces = originalMap.size;
    const totalPiecesPlaced = userMap.size;
    
    // Check user placements against original
    originalMap.forEach((piece, square) => {
      if (userMap.get(square) === piece) {
        correctPlacements++;
      }
    });
    
    // Calculate extra pieces (only count excess pieces)
    const extraPieces = Math.max(0, totalPiecesPlaced - totalOriginalPieces);
    
    // Calculate base accuracy as a percentage
    const baseAccuracy = Math.round((correctPlacements / totalOriginalPieces) * 100);
    
    // Apply penalty for extra pieces: -10% for each extra piece
    const extraPiecesPenalty = extraPieces * 10;
    
    // Ensure accuracy doesn't go below 0%
    const accuracy = Math.max(0, baseAccuracy - extraPiecesPenalty);
    
    console.log('Accuracy calculation:', {
      totalOriginalPieces,
      totalPiecesPlaced,
      correctPlacements,
      extraPieces,
      baseAccuracy,
      extraPiecesPenalty,
      finalAccuracy: accuracy
    });
    
    return {
      accuracy,
      extraPieces,
      totalPiecesPlaced,
      correctPlacements
    };
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return {
      accuracy: 0,
      extraPieces: 0,
      totalPiecesPlaced: 0,
      correctPlacements: 0
    };
  }
};

// Calculate time bonus based on completion time and actual memorize time
const calculateTimeBonus = (completionTime: number, memorizeTime: number, actualMemorizeTime?: number): number => {
  // Use actual memorize time if available, otherwise fall back to configured time
  const timeToCompare = actualMemorizeTime || memorizeTime;
  
  // If completed within the memorize time, award bonus points
  if (completionTime <= timeToCompare) {
    return Math.round((timeToCompare - completionTime) * 10); // 10 points per second under memorize time
  }
  return 0;
};

// Calculate skill rating change based on performance
const calculateSkillRatingChange = (
  accuracy: number, 
  pieceCount: number, 
  completionTime: number, 
  memorizeTime: number,
  currentRating: number,
  actualMemorizeTime?: number
): number => {
  // Base points for accuracy
  let points = 0;
  
  // Points for accuracy (0-100 scale)
  if (accuracy >= 100) {
    points += 50; // Perfect score bonus
  } else if (accuracy >= 90) {
    points += 30;
  } else if (accuracy >= 80) {
    points += 20;
  } else if (accuracy >= 70) {
    points += 10;
  } else if (accuracy >= 50) {
    points += 5;
  } else if (accuracy < 30) {
    points -= 10; // Penalty for very low accuracy
  }
  
  // Points for piece count (more pieces = more points)
  points += Math.floor(pieceCount / 2);
  
  // Use actual memorize time if available, otherwise fall back to configured time
  const timeToCompare = actualMemorizeTime || memorizeTime;
  
  // Time efficiency bonus
  const timeRatio = timeToCompare / completionTime;
  if (timeRatio >= 1) {
    // Completed faster than memorize time
    points += Math.floor(timeRatio * 10);
  }
  
  // Scale based on current rating (higher rated players gain/lose more slowly)
  const scaleFactor = Math.max(0.5, Math.min(1.5, 2000 / currentRating));
  
  return Math.round(points * scaleFactor);
};

// Initialize the store
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // State initialization
      gameState: initialGameState,
      gamePhase: 'configuration' as GamePhase,
      history: [], // Empty history array
      chess: initialChess, // Use the initialized chess instance
      memorizationChess: null,
      
      // Actions
      startGame: (pieceCount, memorizeTime) => {
        console.log(`Starting game with ${pieceCount} pieces and ${memorizeTime}s memorize time`);
        
        // Generate a random position for memorization
        const memorizationPosition = generateMemorizationPosition(pieceCount);
        
        if (!memorizationPosition) {
          console.error('Failed to generate random position');
          return;
        }
        
        console.log('Random position generated:', memorizationPosition.fen());
        
        set({
          chess: memorizationPosition, // Use the random position for the current board
          memorizationChess: memorizationPosition,
          gameState: {
            ...initialGameState,
            isPlaying: true,
            pieceCount,
            memorizeTime,
            originalPosition: memorizationPosition.fen(),
            skillRating: get().gameState.skillRating || 1000,
            streak: get().gameState.streak || 0,
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
          // Use the extended type to access skillRatingChange
          const gameStateWithRating = currentState as GameStateWithRating;
          
          get().addToHistory({
            timestamp: new Date().getTime(),
            completionTime: currentState.completionTime,
            accuracy: currentState.accuracy,
            pieceCount: currentState.pieceCount,
            memorizeTime: currentState.memorizeTime,
            actualMemorizeTime: currentState.actualMemorizeTime,
            level: currentState.level || currentState.currentLevel || 1,
            skillRatingChange: gameStateWithRating.skillRatingChange,
            streak: currentState.streak,
            perfectScore: currentState.perfectScore,
            correctPlacements: Math.round((currentState.accuracy || 0) * currentState.pieceCount / 100),
            totalPlacements: currentState.pieceCount,
            duration: currentState.completionTime || 0,
          });
        }
      },
      
      makeMove: (move) => {
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
          // Initialize with a minimal valid board (just kings)
          newChess = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
          
          // Clear the board by removing all pieces
          const squares = [
            'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
            'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
            'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
            'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
            'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
            'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
            'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
            'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'
          ];
          
          // Remove all pieces from the board
          squares.forEach(square => {
            if (newChess?.get(square as Square)) {
              newChess?.remove(square as Square);
            }
          });
        } catch (error) {
          console.error('Failed to create Chess instance in resetGame:', error);
        }
        
        // Preserve skill rating and streak when resetting
        const currentSkillRating = get().gameState.skillRating || 1000;
        const currentStreak = get().gameState.streak || 0;
        
        set({
          chess: newChess,
          memorizationChess: null,
          gameState: { 
            ...initialGameState,
            skillRating: currentSkillRating,
            streak: currentStreak,
          },
          gamePhase: GamePhase.CONFIGURATION,
        });
      },
      
      addToHistory: (game) => {
        set((state) => ({
          history: [
            {
              ...game,
              id: uuidv4(),
            },
            ...state.history,
          ].slice(0, 20), // Keep only the last 20 games (reduced from 100)
        }));
      },
      
      // Memory game specific actions
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
        const now = Date.now();
        const state = get().gameState;
        const memorizeStartTime = state.memorizeStartTime || now;
        const actualMemorizeTime = (now - memorizeStartTime) / 1000; // Calculate actual time spent in seconds
        
        set((state) => ({
          gameState: {
            ...state.gameState,
            isMemorizationPhase: false,
            actualMemorizeTime,
          },
        }));
      },
      
      startSolutionPhase: () => {
        // Reset the chess board for the user to recreate the position
        let solutionChess: Chess | null = null;
        try {
          // Start with an empty board
          solutionChess = new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
          
          // Clear the board by removing all pieces
          const squares = [
            'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
            'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
            'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
            'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
            'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
            'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
            'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
            'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'
          ];
          
          // Remove all pieces from the board
          squares.forEach(square => {
            if (solutionChess?.get(square as Square)) {
              solutionChess?.remove(square as Square);
            }
          });
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
      
      submitSolution: (completionTimeOverride) => {
        const { gameState, chess } = get();
        
        if (!chess || !gameState.originalPosition) {
          console.error('Cannot submit solution: missing chess instance or original position');
          return;
        }
        
        // Get the user's solution
        const userPosition = chess.fen();
        
        // Calculate accuracy
        const accuracyResult = calculateAccuracy(gameState.originalPosition, userPosition);
        
        // Calculate completion time with millisecond precision
        const now = Date.now();
        const solutionStartTime = gameState.solutionStartTime || now;
        const completionTime = completionTimeOverride ?? (now - solutionStartTime) / 1000;
        
        // Calculate time bonus using actual memorize time if available
        const timeBonus = calculateTimeBonus(completionTime, gameState.memorizeTime, gameState.actualMemorizeTime);
        
        // Determine if this is a perfect score
        const perfectScore = accuracyResult.accuracy === 100 && accuracyResult.extraPieces === 0;
        
        // Determine success (e.g., accuracy >= 70%)
        const success = accuracyResult.accuracy >= 70;
        
        // Calculate skill rating change
        const currentRating = gameState.skillRating || 1000;
        const skillRatingChange = calculateSkillRatingChange(
          accuracyResult.accuracy, 
          gameState.pieceCount, 
          completionTime, 
          gameState.memorizeTime,
          currentRating,
          gameState.actualMemorizeTime
        );
        
        // Update streak
        let streak = gameState.streak || 0;
        if (success) {
          streak += 1;
        } else {
          streak = 0;
        }
        
        // Update skill rating
        const newSkillRating = Math.max(0, currentRating + skillRatingChange);
        
        // Create a type that extends GameState with skillRatingChange
        type GameStateWithRating = GameState & { 
          skillRatingChange?: number;
          wrongPieces?: number;
          extraPieces?: number;
          totalPiecesPlaced?: number;
          correctPlacements?: number;
        };
        
        // Update game state with results
        const updatedGameState: GameStateWithRating = {
          ...gameState,
          isSolutionPhase: false,
          userPosition,
          accuracy: accuracyResult.accuracy,
          completionTime,
          success,
          perfectScore,
          timeBonusEarned: timeBonus,
          skillRating: newSkillRating,
          streak,
          skillRatingChange,
          extraPieces: accuracyResult.extraPieces,
          totalPiecesPlaced: accuracyResult.totalPiecesPlaced,
          correctPlacements: accuracyResult.correctPlacements
        };
        
        set({
          gameState: updatedGameState as GameState,
          gamePhase: GamePhase.RESULT,
        });
      },
      
      placePiece: (square, piece) => {
        const { chess } = get();
        console.log('placePiece called with square:', square, 'piece:', piece, 'chess instance:', chess);
        if (!chess) {
          console.error('Chess instance is null in placePiece');
          return;
        }
        
        try {
          // Determine piece color and type
          const color = piece === piece.toLowerCase() ? 'b' : 'w';
          const type = piece.toLowerCase() as PieceSymbol;
          
          console.log(`Placing ${color} ${type} on ${square}`);
          
          // Place the piece
          chess.put({ type, color }, square as Square);
          
          // Update the state
          set((state) => {
            const newState = {
              gameState: {
                ...state.gameState,
                userPosition: chess.fen(),
              },
            };
            console.log('Updated state after placing piece:', newState);
            return newState;
          });
        } catch (error) {
          console.error(`Failed to place piece ${piece} on ${square}:`, error);
        }
      },
      
      removePiece: (square) => {
        const { chess } = get();
        console.log('removePiece called with square:', square, 'chess instance:', chess);
        if (!chess) {
          console.error('Chess instance is null in removePiece');
          return;
        }
        
        try {
          console.log(`Removing piece from ${square}`);
          
          // Remove the piece
          chess.remove(square as Square);
          
          // Update the state
          set((state) => {
            const newState = {
              gameState: {
                ...state.gameState,
                userPosition: chess.fen(),
              },
            };
            console.log('Updated state after removing piece:', newState);
            return newState;
          });
        } catch (error) {
          console.error(`Failed to remove piece from ${square}:`, error);
        }
      },
      
      // Stats and progression
      getTotalGames: () => get().history.length,
      
      getBestTime: () => {
        const history = get().history;
        if (history.length === 0) return 0;
        
        // Find the fastest completion time for each piece count
        const bestTimes = new Map<number, number>();
        
        history.forEach(game => {
          const currentBest = bestTimes.get(game.pieceCount) || Infinity;
          if (game.completionTime !== undefined && game.completionTime < currentBest && game.accuracy >= 80) {
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
      
      getSkillRating: () => {
        return get().gameState.skillRating || 1000;
      },
      
      getCurrentStreak: () => {
        return get().gameState.streak || 0;
      },
      
      getLongestStreak: () => {
        const history = get().history;
        if (history.length === 0) return 0;
        
        let longestStreak = 0;
        let currentStreak = 0;
        
        // Sort history by timestamp
        const sortedHistory = [...history].sort((a, b) => 
          a.timestamp - b.timestamp
        );
        
        sortedHistory.forEach(game => {
          if (game.accuracy >= 70) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        });
        
        return Math.max(longestStreak, get().gameState.streak || 0);
      },
      
      getRecommendedDifficulty: () => {
        const skillRating = get().getSkillRating();
        
        // Find the appropriate difficulty level based on skill rating
        const recommendedLevel = DIFFICULTY_LEVELS.find(
          level => skillRating >= level.minSkillRating
        ) || DIFFICULTY_LEVELS[0];
        
        return recommendedLevel;
      },
      
      calculateSkillRatingChange: (accuracy, pieceCount, completionTime) => {
        const { gameState } = get();
        return calculateSkillRatingChange(
          accuracy, 
          pieceCount, 
          completionTime, 
          gameState.memorizeTime,
          gameState.skillRating || 1000,
          gameState.actualMemorizeTime
        );
      }
    }),
    {
      name: 'memory-chess-storage',
      partialize: (state) => ({
        gameState: {
          pieceCount: state.gameState.pieceCount,
          memorizeTime: state.gameState.memorizeTime,
          level: state.gameState.level,
          skillRating: state.gameState.skillRating,
        },
        history: state.history,
      }),
    }
  )
);
