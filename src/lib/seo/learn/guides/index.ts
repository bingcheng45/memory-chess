import type { LearnDocument } from "../schema";
import howToGetBetterAtChessForBeginners from "./how-to-get-better-at-chess-for-beginners";
import howToStopBlunderingInChess from "./how-to-stop-blundering-in-chess";
import whyPuzzleRatingDoesntTransferToGames from "./why-puzzle-rating-doesnt-transfer-to-games";
import chessCoordinatesPractice from "./chess-coordinates-practice";
import chessVisualizationExercises from "./chess-visualization-exercises";
import howToSeeTheWholeBoardInChess from "./how-to-see-the-whole-board-in-chess";
import chessCalculationExercisesForBeginners from "./chess-calculation-exercises-for-beginners";
import blindfoldChessTrainingForBeginners from "./blindfold-chess-training-for-beginners";
import chessMemoryTraining from "./chess-memory-training";
import chessPatternRecognitionDrills from "./chess-pattern-recognition-drills";
import howToThinkInChessForBeginners from "./how-to-think-in-chess-for-beginners";
import n20MinuteDailyChessStudyPlan from "./20-minute-daily-chess-study-plan";
import howToAnalyzeChessGamesForBeginners from "./how-to-analyze-chess-games-for-beginners";
import howManyChessPuzzlesADay from "./how-many-chess-puzzles-a-day";

/** Display order. Within a group the hub lists guides in this order, easiest first. */
export const LEARN_GUIDES: readonly LearnDocument[] = [
  howToGetBetterAtChessForBeginners,
  howToStopBlunderingInChess,
  whyPuzzleRatingDoesntTransferToGames,
  chessCoordinatesPractice,
  chessVisualizationExercises,
  howToSeeTheWholeBoardInChess,
  chessCalculationExercisesForBeginners,
  blindfoldChessTrainingForBeginners,
  chessMemoryTraining,
  chessPatternRecognitionDrills,
  howToThinkInChessForBeginners,
  n20MinuteDailyChessStudyPlan,
  howToAnalyzeChessGamesForBeginners,
  howManyChessPuzzlesADay,
];
