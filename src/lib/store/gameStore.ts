import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, GameHistory, DIFFICULTY_LEVELS, DifficultyLevel, type SetBoard } from '@/lib/types/game';
import { generateMemorizationPosition } from '@/lib/utils/memorizationPosition';
import { v4 as uuidv4 } from 'uuid';
import {
  GAME_CONFIG_RULES,
  GAME_STORAGE_KEY,
  parseGameSettings,
  type GameSettings,
} from '@/lib/game/configPrefill';
import { placementFromFen, scorePlacement } from '@/lib/game/scoring';
import { trackEvent, type RoundSource } from '@/lib/analytics/events';
import { now as monotonicNow } from '@/lib/game/clock';
import { isSoundEnabled } from '@/lib/utils/soundEffects';
import {
  IDLE_ROUND,
  labPositionFromFen,
  labPositionToFen,
  roundReducer,
  type RoundAction,
  type RoundState,
} from '@/lib/round/round';

// Extended GameState type with skillRatingChange
type GameStateWithRating = GameState & {
  skillRatingChange?: number;
  wrongPieces?: number;
  extraPieces?: number;
  totalPiecesPlaced?: number;
  correctPlacements?: number;
};

/** The suffix chess.js gave the solution board's FEN, kept so the lab record's placed FEN reads as it always has. */
const SOLUTION_FEN_SUFFIX = ' w - - 0 1';

interface GameStore {
  gameState: GameState;
  lastSettings: GameSettings | null;
  history: GameHistory[];
  /** The round being played, run by the shared round reducer. Never persisted. */
  round: RoundState;

  startGame: (pieceCount: number, memorizeTime: number, source: RoundSource, board?: SetBoard) => void;
  /** Done, the study deadline, the palette, the board and the eraser. Submit goes through submitSolution. */
  dispatch: (action: Exclude<RoundAction, { type: 'start' } | { type: 'submit' }>) => void;
  submitSolution: (now?: number) => void;
  stopGame: () => void;
  resetGame: () => void;
  addToHistory: (game: Omit<GameHistory, 'id'>) => void;

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
  pieceCount: 8, // Default to 8 pieces
  memorizeTime: 10, // Default to 10 seconds
  currentLevel: 1,
  level: 1,
  skillRating: 1000, // Starting skill rating
  streak: 0,
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
      gameState: initialGameState,
      history: [], // Empty history array
      lastSettings: null,
      round: IDLE_ROUND,

      startGame: (pieceCount, memorizeTime, source, board) => {
        const generated = board ? null : generateMemorizationPosition(pieceCount);
        const originalPosition = board ? board.fen : generated?.fen();
        if (!originalPosition) {
          console.error('Failed to generate random position');
          return;
        }

        set({
          round: roundReducer(get().round, {
            type: 'start',
            config: { pieceCount, studyMs: memorizeTime * 1000, source, board },
            target: labPositionFromFen(originalPosition),
            now: monotonicNow(),
          }),
          gameState: {
            ...initialGameState,
            pieceCount,
            memorizeTime,
            startSource: source,
            board,
            originalPosition,
            skillRating: get().gameState.skillRating || 1000,
            streak: get().gameState.streak || 0,
          },
          lastSettings: { pieceCount, memorizeTime },
        });
        trackEvent({ name: "round_start", params: { piece_count: pieceCount, memorize_time: memorizeTime, source } });
      },

      dispatch: (action) => set({ round: roundReducer(get().round, action) }),

      stopGame: () => {
        const currentState = get().gameState;
        set({ round: IDLE_ROUND });

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

      resetGame: () => {
        // Preserve skill rating and streak when resetting
        const currentSkillRating = get().gameState.skillRating || 1000;
        const currentStreak = get().gameState.streak || 0;

        set({
          round: IDLE_ROUND,
          gameState: {
            ...initialGameState,
            skillRating: currentSkillRating,
            streak: currentStreak,
          },
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

      submitSolution: (now = monotonicNow()) => {
        const { gameState } = get();
        const playing = get().round;
        if (playing.phase !== 'rebuild' || !gameState.originalPosition) return;
        const round = roundReducer(playing, { type: 'submit', now });
        if (round.phase !== 'scored') return;

        const userPosition = `${labPositionToFen(round.placed)}${SOLUTION_FEN_SUFFIX}`;
        const placed = placementFromFen(userPosition);
        const score = scorePlacement(placementFromFen(gameState.originalPosition), placed);
        const completionTime = round.rebuildMs / 1000;
        const actualMemorizeTime = round.studyMs / 1000;

        // Calculate time bonus using actual memorize time if available
        const timeBonus = calculateTimeBonus(completionTime, gameState.memorizeTime, actualMemorizeTime);

        // Determine if this is a perfect score
        const perfectScore = score.accuracy === 100 && score.extra === 0;

        // Determine success (e.g., accuracy >= 70%)
        const success = score.accuracy >= 70;

        // A review replays a board the player has already seen, so it is not a fair test of skill.
        const rated = gameState.board?.kind !== 'review';

        // Calculate skill rating change
        const currentRating = gameState.skillRating || 1000;
        const skillRatingChange = rated ? calculateSkillRatingChange(
          score.accuracy,
          gameState.pieceCount,
          completionTime,
          gameState.memorizeTime,
          currentRating,
          actualMemorizeTime
        ) : 0;

        // Update streak
        let streak = gameState.streak || 0;
        if (rated) {
          streak = success ? streak + 1 : 0;
        }

        // Update skill rating
        const newSkillRating = Math.max(0, currentRating + skillRatingChange);

        const labRoundId = uuidv4();

        // Update game state with results
        const updatedGameState: GameStateWithRating = {
          ...gameState,
          labRoundId,
          userPosition,
          accuracy: score.accuracy,
          completionTime,
          actualMemorizeTime,
          success,
          perfectScore,
          timeBonusEarned: timeBonus,
          skillRating: newSkillRating,
          streak,
          skillRatingChange,
          extraPieces: score.extra,
          totalPiecesPlaced: Object.keys(placed).length,
          correctPlacements: score.correct
        };

        set({ round, gameState: updatedGameState as GameState });

        const soundEnabled = isSoundEnabled();
        window.gtag?.('event', 'sound_settings', {
          event_category: 'user_preferences',
          event_label: soundEnabled ? 'sound_on' : 'sound_off',
          value: soundEnabled ? 1 : 0,
        });
        trackEvent({
          name: 'round_complete',
          params: {
            piece_count: gameState.pieceCount,
            memorize_time: gameState.memorizeTime,
            correct_pieces: score.correct,
            accuracy: score.accuracy,
            source: gameState.startSource ?? 'link',
          },
        });

        // Loaded on demand so the lab storage stays out of the /game bundle until a round ends.
        const facts = {
          id: labRoundId,
          source: 'game',
          startSource: gameState.startSource,
          pieceCount: gameState.pieceCount,
          memorizeSeconds: gameState.memorizeTime,
          targetFen: gameState.originalPosition,
          placedFen: userPosition,
          memorizeMs: Math.round(round.studyMs),
          solveMs: Math.round(round.rebuildMs),
          placements: round.log.placements,
          removals: round.log.removals,
          board: gameState.board,
        } as const;
        void import('@/lib/lab/recordRound').then(({ recordLabRound }) => recordLabRound(facts)).catch(() => {});
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
      name: GAME_STORAGE_KEY,
      partialize: (state) => ({
        gameState: {
          pieceCount: state.gameState.pieceCount,
          memorizeTime: state.gameState.memorizeTime,
          level: state.gameState.level,
          skillRating: state.gameState.skillRating,
        },
        history: state.history,
        lastSettings: state.lastSettings,
      }),
      // localStorage is user-editable and outlives app versions, so a stored
      // value that would put the configuration form out of range is dropped.
      merge: (persisted, current) => {
        const stored = (typeof persisted === 'object' && persisted !== null
          ? persisted
          : {}) as Partial<GameStore>;
        return { ...current, ...stored, lastSettings: parseGameSettings(stored.lastSettings, GAME_CONFIG_RULES) };
      },
    }
  )
);
