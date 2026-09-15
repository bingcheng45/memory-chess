import type { LearnGuide } from "../schema";
import getBetter from "./how-to-get-better-at-chess-for-beginners";
import stopBlundering from "./how-to-stop-blundering-in-chess";
import puzzleRating from "./why-puzzle-rating-doesnt-transfer-to-games";
import coordinates from "./chess-coordinates-practice";
import visualization from "./chess-visualization-exercises";
import wholeBoard from "./how-to-see-the-whole-board-in-chess";
import calculation from "./chess-calculation-exercises-for-beginners";
import blindfold from "./blindfold-chess-training-for-beginners";
import memoryTraining from "./chess-memory-training";
import patternRecognition from "./chess-pattern-recognition-drills";
import thinking from "./how-to-think-in-chess-for-beginners";
import dailyPlan from "./20-minute-daily-chess-study-plan";
import analyzeGames from "./how-to-analyze-chess-games-for-beginners";
import puzzlesADay from "./how-many-chess-puzzles-a-day";

/**
 * Display order of the Learn guides. The only place order lives.
 *
 * The hub lists each goal's guides in this order, so within a goal a guide
 * comes after the guides it tells readers to do first, and easier guides
 * come before harder ones.
 */
export const LEARN_GUIDES: readonly LearnGuide[] = [
  getBetter,
  stopBlundering,
  puzzleRating,
  coordinates,
  visualization,
  wholeBoard,
  calculation,
  blindfold,
  memoryTraining,
  patternRecognition,
  thinking,
  dailyPlan,
  analyzeGames,
  puzzlesADay,
];
