import type { LearnPosition } from "../positions";
import type { LearnGuide } from "../schema";
import getBetter, { positions as getBetterPositions } from "./how-to-get-better-at-chess-for-beginners";
import stopBlundering, { positions as stopBlunderingPositions } from "./how-to-stop-blundering-in-chess";
import puzzleRating, { positions as puzzleRatingPositions } from "./why-puzzle-rating-doesnt-transfer-to-games";
import coordinates, { positions as coordinatesPositions } from "./chess-coordinates-practice";
import visualization, { positions as visualizationPositions } from "./chess-visualization-exercises";
import wholeBoard, { positions as wholeBoardPositions } from "./how-to-see-the-whole-board-in-chess";
import calculation, { positions as calculationPositions } from "./chess-calculation-exercises-for-beginners";
import blindfold, { positions as blindfoldPositions } from "./blindfold-chess-training-for-beginners";
import memoryTraining from "./chess-memory-training";
import patternRecognition, { positions as patternRecognitionPositions } from "./chess-pattern-recognition-drills";
import thinking, { positions as thinkingPositions } from "./how-to-think-in-chess-for-beginners";
import dailyPlan from "./20-minute-daily-chess-study-plan";
import analyzeGames, { positions as analyzeGamesPositions } from "./how-to-analyze-chess-games-for-beginners";
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

/** The chess positions each guide states, keyed by slug. A guide with none lists an empty array. */
export const LEARN_POSITIONS: Readonly<Record<string, readonly LearnPosition[]>> = {
  [getBetter.slug]: getBetterPositions,
  [stopBlundering.slug]: stopBlunderingPositions,
  [puzzleRating.slug]: puzzleRatingPositions,
  [coordinates.slug]: coordinatesPositions,
  [visualization.slug]: visualizationPositions,
  [wholeBoard.slug]: wholeBoardPositions,
  [calculation.slug]: calculationPositions,
  [blindfold.slug]: blindfoldPositions,
  [memoryTraining.slug]: [],
  [patternRecognition.slug]: patternRecognitionPositions,
  [thinking.slug]: thinkingPositions,
  [dailyPlan.slug]: [],
  [analyzeGames.slug]: analyzeGamesPositions,
  [puzzlesADay.slug]: [],
};
