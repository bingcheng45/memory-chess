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
import type { LabRound } from '@/lib/lab/recordRound';
import { now as monotonicNow } from '@/lib/game/clock';
import { isSkillRating, MAX_SKILL_RATING, START_RATING } from "@/lib/game/rating";
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

/** The newest rounds kept in the persisted history. A review round is left out, as it is from the rating and the streak. */
const HISTORY_LIMIT = 20;

/** The accuracy a rated round needs to extend the win streak; below it the streak starts again. */
export const WIN_ACCURACY = 70;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

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
  resetGame: () => void;

  getSkillRating: () => number;
  getCurrentStreak: () => number;
  getRecommendedDifficulty: () => DifficultyLevel;
  calculateSkillRatingChange: (accuracy: number, pieceCount: number, completionTime: number) => number;
}

// Initial game state
const initialGameState: GameState = {
  pieceCount: 8, // Default to 8 pieces
  memorizeTime: 10, // Default to 10 seconds
  currentLevel: 1,
  level: 1,
  skillRating: START_RATING,
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

/**
 * Solving in a third of the study time earns the most a speed bonus can give,
 * 30 points, the same as the 90% accuracy band. Faster than that is placing
 * pieces, not recalling them faster.
 */
const MAX_TIME_RATIO = 3;

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
  
  // Time efficiency bonus, earned only for the share of the board recalled.
  // A solve that takes no time at all divides by zero, so the ratio is capped.
  const timeRatio = Math.min(timeToCompare / completionTime, MAX_TIME_RATIO);
  if (timeRatio >= 1) {
    // Completed faster than memorize time
    points += Math.floor(timeRatio * 10 * (accuracy / 100));
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
            skillRating: get().gameState.skillRating || START_RATING,
            streak: get().gameState.streak || 0,
          },
          lastSettings: { pieceCount, memorizeTime },
        });
        trackEvent({ name: "round_start", params: { piece_count: pieceCount, memorize_time: memorizeTime, source } });
      },

      dispatch: (action) => set({ round: roundReducer(get().round, action) }),

      resetGame: () => {
        // Preserve skill rating and streak when resetting
        const currentSkillRating = get().gameState.skillRating || START_RATING;
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
        const success = score.accuracy >= WIN_ACCURACY;

        // A review replays a board the player has already seen, so it is not a fair test of skill.
        const rated = gameState.board?.kind !== 'review';

        // Calculate skill rating change
        const currentRating = gameState.skillRating || START_RATING;
        const ratingChange = rated ? calculateSkillRatingChange(
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

        const newSkillRating = Math.min(MAX_SKILL_RATING, Math.max(0, currentRating + ratingChange));
        const skillRatingChange = newSkillRating - currentRating;

        const labRoundId = uuidv4();
        const endedAt = Date.now();

        const labRound: LabRound = {
          endedAt,
          facts: {
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
          },
        };

        // Update game state with results
        const updatedGameState: GameStateWithRating = {
          ...gameState,
          labRound,
          standingBefore: { skillRating: currentRating, streak: gameState.streak || 0 },
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

        const played: GameHistory = {
          id: labRoundId,
          timestamp: Date.now(),
          pieceCount: gameState.pieceCount,
          memorizeTime: gameState.memorizeTime,
          actualMemorizeTime,
          completionTime,
          duration: completionTime,
          accuracy: score.accuracy,
          correctPlacements: score.correct,
          totalPlacements: gameState.pieceCount,
          perfectScore,
          level: gameState.level || gameState.currentLevel || 1,
          skillRatingChange,
          streak,
        };
        set(({ history }) => ({
          round,
          gameState: updatedGameState as GameState,
          history: rated ? [played, ...history].slice(0, HISTORY_LIMIT) : history,
        }));

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
        void import('@/lib/lab/recordRound').then(({ recordLabRound }) => recordLabRound(labRound.facts, new Date(endedAt))).catch(() => {});
      },

      // Stats and progression
      getSkillRating: () => {
        return get().gameState.skillRating || START_RATING;
      },
      
      getCurrentStreak: () => {
        return get().gameState.streak || 0;
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
          gameState.skillRating || START_RATING,
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
          streak: state.gameState.streak,
        },
        history: state.history,
        lastSettings: state.lastSettings,
      }),
      // localStorage is user-editable and outlives app versions, so a stored
      // value that would put the configuration form out of range is dropped.
      // The stored game state is laid over the defaults, so a field saved only
      // by a later version, such as the streak, starts from its default.
      merge: (persisted, current) => {
        const stored = (isRecord(persisted) ? persisted : {}) as Partial<GameStore>;
        const storedGameState: Record<string, unknown> = isRecord(stored.gameState) ? stored.gameState : {};
        return {
          ...current,
          ...stored,
          gameState: {
            ...current.gameState,
            ...storedGameState,
            skillRating: isSkillRating(storedGameState.skillRating) ? Math.min(storedGameState.skillRating, MAX_SKILL_RATING) : START_RATING,
          },
          lastSettings: parseGameSettings(stored.lastSettings, GAME_CONFIG_RULES),
        };
      },
    }
  )
);
