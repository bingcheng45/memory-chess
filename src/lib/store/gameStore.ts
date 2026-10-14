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
import {
  isSkillRating,
  MAX_SKILL_RATING,
  NEW_PLAYER,
  parseCertainty,
  parseRatedRoundFacts,
  replay,
  START_RATING,
  WIN_ACCURACY,
  type PlayerRating,
  type RatedRoundFacts,
} from "@/lib/game/rating";
import { outcomeEffects, roundOutcomeOf } from "@/lib/game/roundOutcome";
import { localDayOf } from "@/lib/lab/record";
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

/** The newest rated rounds kept in the persisted history. A review or a free skip is left out, as it is from the rating and the streak. */
const HISTORY_LIMIT = 30;

/**
 * The persisted shape's version. Version 1 replaced a rating that only went up with an Elo rating, so a rating stored
 * before it starts again from START_RATING. Version 2 added the free-skip day, which starts unspent. Version 3 gave the
 * rating its uncertainty, found by replaying the stored rated rounds.
 */
const STORE_VERSION = 3;
const RATING_RESET_VERSION = 1;

const LOCAL_DAY = /^\d{4}-\d{2}-\d{2}$/;
const parseLocalDay = (value: unknown): string | null => (typeof value === 'string' && LOCAL_DAY.test(value) ? value : null);

export { WIN_ACCURACY };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

interface GameStore {
  gameState: GameState;
  lastSettings: GameSettings | null;
  history: GameHistory[];
  /** The local day the last free skip was used: that day's first empty board, which leaves the rating alone. */
  freeSkipDay: string | null;
  /** How sure the game is of `gameState.skillRating`, which together with it is the player's rating. */
  certainty: Omit<PlayerRating, 'rating'>;
  /** The round being played, run by the shared round reducer. Never persisted. */
  round: RoundState;

  startGame: (pieceCount: number, memorizeTime: number, source: RoundSource, board?: SetBoard) => void;
  /** Sets a board out behind its Start button. Start is `dispatch({ type: 'begin' })`; the round studies on endCountdown. */
  prepareGame: (pieceCount: number, memorizeTime: number, source: RoundSource, board: SetBoard) => void;
  /** Counts a new random board in over the veil, without a Start button; the round studies on endCountdown. */
  countInGame: (pieceCount: number, memorizeTime: number, source: RoundSource) => void;
  endCountdown: (now?: number) => void;
  /** Start, done, the study deadline, the palette, the board and the eraser. Submit goes through submitSolution. */
  dispatch: (action: Exclude<RoundAction, { type: 'start' | 'prepare' | 'countIn' | 'countdownEnded' | 'submit' }>) => void;
  /** Scores the round; resolves once the lab record has kept it, to whether it did. */
  submitSolution: (now?: number) => Promise<boolean>;
  resetGame: () => void;

  getSkillRating: () => number;
  getCurrentStreak: () => number;
  getRecommendedDifficulty: () => DifficultyLevel;
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

/** The held rated rounds that carry the facts the rating reads, newest first. Rows saved before them are left out. */
export const ratedFactsOf = (history: readonly Pick<GameHistory, 'facts'>[]): RatedRoundFacts[] =>
  history.flatMap(({ facts }) => {
    const parsed = parseRatedRoundFacts(facts);
    return parsed ? [parsed] : [];
  });

export const playerRatingOf = ({ gameState, certainty }: Pick<GameStore, 'gameState' | 'certainty'>): PlayerRating => ({
  rating: gameState.skillRating ?? START_RATING,
  ...certainty,
});

/**
 * A rating stored before version 3 has no uncertainty, so its stored rated rounds are replayed, oldest first, from it
 * as a new player's uncertainty. With no rounds to replay the player starts as a new player.
 */
function withCertainty(persisted: Record<string, unknown>, version: number): Record<string, unknown> {
  const gameState = isRecord(persisted.gameState) ? persisted.gameState : {};
  const rows = Array.isArray(persisted.history) ? persisted.history.filter(isRecord) : [];
  const rounds = ratedFactsOf(rows).reverse();
  const stored = version < RATING_RESET_VERSION ? START_RATING : gameState.skillRating;
  const from = rounds.length > 0 && isSkillRating(stored) ? Math.min(stored, MAX_SKILL_RATING) : START_RATING;
  const { rating, ...certainty } = replay({ ...NEW_PLAYER, rating: from }, rounds);
  return { ...persisted, gameState: { ...gameState, skillRating: rating }, certainty };
}

interface StudyStart {
  readonly pieceCount: number;
  readonly memorizeTime: number;
  readonly source: RoundSource;
  readonly board?: SetBoard;
  readonly originalPosition: string;
}

/** The game state a round studies under, carried over the player's standing. */
const studyGameState = (previous: GameState, { pieceCount, memorizeTime, source, board, originalPosition }: StudyStart): GameState => ({
  ...initialGameState,
  pieceCount,
  memorizeTime,
  startSource: source,
  board,
  originalPosition,
  skillRating: previous.skillRating ?? START_RATING,
  streak: previous.streak || 0,
});

const trackRoundStart = (pieceCount: number, memorizeTime: number, source: RoundSource) =>
  trackEvent({ name: "round_start", params: { piece_count: pieceCount, memorize_time: memorizeTime, source } });

// Initialize the store
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: initialGameState,
      history: [], // Empty history array
      freeSkipDay: null,
      certainty: { rd: NEW_PLAYER.rd, rounds: NEW_PLAYER.rounds },
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
          gameState: studyGameState(get().gameState, { pieceCount, memorizeTime, source, board, originalPosition }),
          lastSettings: { pieceCount, memorizeTime },
        });
        trackRoundStart(pieceCount, memorizeTime, source);
      },

      prepareGame: (pieceCount, memorizeTime, source, board) =>
        set({ round: roundReducer(get().round, { type: 'prepare', config: { pieceCount, studyMs: memorizeTime * 1000, source, board } }) }),

      countInGame: (pieceCount, memorizeTime, source) => {
        const fen = generateMemorizationPosition(pieceCount)?.fen();
        if (!fen) {
          console.error('Failed to generate random position');
          return;
        }
        set({
          round: roundReducer(get().round, {
            type: 'countIn',
            config: { pieceCount, studyMs: memorizeTime * 1000, source },
            fen,
            now: monotonicNow(),
          }),
        });
      },

      endCountdown: (now = monotonicNow()) => {
        const counting = get().round;
        if (counting.phase !== 'countdown') return;
        const { pieceCount, studyMs, source, board } = counting.config;
        const memorizeTime = studyMs / 1000;
        set({
          round: roundReducer(counting, { type: 'countdownEnded', now }),
          gameState: studyGameState(get().gameState, { pieceCount, memorizeTime, source, board, originalPosition: counting.fen }),
          lastSettings: { pieceCount, memorizeTime },
        });
        trackRoundStart(pieceCount, memorizeTime, source);
      },

      dispatch: (action) => set({ round: roundReducer(get().round, action) }),

      resetGame: () => {
        // Preserve skill rating and streak when resetting
        const currentSkillRating = get().gameState.skillRating ?? START_RATING;
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
        if (playing.phase !== 'rebuild' || !gameState.originalPosition) return Promise.resolve(false);
        const round = roundReducer(playing, { type: 'submit', now });
        if (round.phase !== 'scored') return Promise.resolve(false);

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

        const labRoundId = uuidv4();
        const endedAt = Date.now();
        const day = localDayOf(new Date(endedAt));

        const currentRating = gameState.skillRating ?? START_RATING;
        const facts: RatedRoundFacts = {
          pieceCount: gameState.pieceCount,
          studySeconds: actualMemorizeTime,
          rebuildSeconds: completionTime,
          accuracy: score.accuracy,
        };
        const rating = roundOutcomeOf(playerRatingOf(get()), {
          review: gameState.board?.kind === 'review',
          placedPieces: Object.keys(placed).length,
          day,
          freeSkipDay: get().freeSkipDay,
          facts,
        });
        const effects = outcomeEffects[rating.phase];

        const previousStreak = gameState.streak || 0;
        const streak = effects.rated ? (success ? previousStreak + 1 : 0) : previousStreak;
        const newSkillRating = rating.rating;
        const skillRatingChange = rating.change;

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
          rating,
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
          facts,
        };
        set(({ history, freeSkipDay, certainty }) => ({
          round,
          gameState: updatedGameState as GameState,
          history: effects.rated ? [played, ...history].slice(0, HISTORY_LIMIT) : history,
          freeSkipDay: effects.spendsFreeSkip ? day : freeSkipDay,
          certainty: 'player' in rating ? { rd: rating.player.rd, rounds: rating.player.rounds } : certainty,
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
        return import('@/lib/lab/recordRound')
          .then(({ recordLabRound }) => recordLabRound(labRound.facts, new Date(endedAt)))
          .catch(() => false);
      },

      // Stats and progression
      getSkillRating: () => {
        return get().gameState.skillRating ?? START_RATING;
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
    }),
    {
      name: GAME_STORAGE_KEY,
      version: STORE_VERSION,
      // A rating stored before version 1 was earned under a formula that only went up, so it starts again. The win
      // streak and the history rows stay; rows without rated facts are shown but are not replayed.
      migrate: (persisted, version) => (isRecord(persisted) ? withCertainty(persisted, version) : persisted),
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
        freeSkipDay: state.freeSkipDay,
        certainty: state.certainty,
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
          freeSkipDay: parseLocalDay(stored.freeSkipDay),
          certainty: parseCertainty(stored.certainty),
        };
      },
    }
  )
);
