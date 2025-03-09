import { 
  DailyChallenge, 
  GameHistory, 
  WeakArea, 
  LearningRecommendation,
  RecommendationType,
  Difficulty,
  DIFFICULTY_LEVELS
} from '@/lib/types/game';

/**
 * Generate a daily challenge based on the user's skill level
 * @param skillRating User's current skill rating
 * @param history Game history
 * @returns Daily challenge
 */
export const generateDailyChallenge = (skillRating: number, history: GameHistory[]): DailyChallenge => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Find the appropriate difficulty level based on skill rating
  const difficultyLevel = DIFFICULTY_LEVELS.find(
    level => skillRating >= level.minSkillRating
  ) || DIFFICULTY_LEVELS[0];
  
  // Generate random piece count and memorize time within the difficulty range
  const pieceCount = Math.floor(
    Math.random() * (difficultyLevel.maxPieces - difficultyLevel.minPieces + 1) + 
    difficultyLevel.minPieces
  );
  
  const memorizeTime = Math.floor(
    Math.random() * (difficultyLevel.maxTime - difficultyLevel.minTime + 1) + 
    difficultyLevel.minTime
  );
  
  // Generate a random position (this would normally call the backend)
  // For now, we'll use a placeholder
  generateRandomPosition(pieceCount);
  
  // Generate a description based on difficulty
  const descriptions = [
    "Test your memory with this easy position",
    "Challenge yourself with this medium position",
    "Push your limits with this hard position",
    "Only grandmasters can memorize this position perfectly"
  ];
  
  const description = descriptions[DIFFICULTY_LEVELS.indexOf(difficultyLevel)];
  
  // Check if the user has already completed today's challenge
  // Using timestamp instead of date property
  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const completed = history.some(game => {
    const gameDate = new Date(game.timestamp);
    return gameDate >= todayStart && gameDate <= todayEnd;
  });
  
  // Create the challenge
  return {
    id: `challenge-${today}-${Math.floor(Math.random() * 1000)}`,
    description,
    pieceCount,
    memorizeTime,
    difficulty: difficultyLevel.name as Difficulty,
    completed
  };
};

/**
 * Identify weak areas based on game history
 * @param history Game history
 * @returns Array of weak areas
 */
export const identifyWeakAreas = (history: GameHistory[]): WeakArea[] => {
  if (history.length < 5) return [];
  
  const weakAreas: WeakArea[] = [];
  
  // Analyze performance by piece count
  const pieceCountPerformance: Record<number, number[]> = {};
  history.forEach(game => {
    if (!pieceCountPerformance[game.pieceCount]) {
      pieceCountPerformance[game.pieceCount] = [];
    }
    pieceCountPerformance[game.pieceCount].push(game.accuracy);
  });
  
  // Find the piece count with the lowest average accuracy
  let lowestAccuracy = 100;
  let weakestPieceCount = 0;
  
  Object.entries(pieceCountPerformance).forEach(([pieceCount, accuracies]) => {
    if (accuracies.length >= 3) { // Only consider if we have enough data
      const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
      if (avgAccuracy < lowestAccuracy) {
        lowestAccuracy = avgAccuracy;
        weakestPieceCount = parseInt(pieceCount);
      }
    }
  });
  
  if (weakestPieceCount > 0 && lowestAccuracy < 70) {
    weakAreas.push({
      type: 'pieceCount',
      score: Math.round(lowestAccuracy)
    });
  }
  
  // Analyze performance by memorize time
  const memorizeTimePerformance: Record<number, number[]> = {};
  history.forEach(game => {
    if (!memorizeTimePerformance[game.memorizeTime]) {
      memorizeTimePerformance[game.memorizeTime] = [];
    }
    memorizeTimePerformance[game.memorizeTime].push(game.accuracy);
  });
  
  // Find the memorize time with the lowest average accuracy
  lowestAccuracy = 100;
  let weakestMemorizeTime = 0;
  
  Object.entries(memorizeTimePerformance).forEach(([memorizeTime, accuracies]) => {
    if (accuracies.length >= 3) { // Only consider if we have enough data
      const avgAccuracy = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
      if (avgAccuracy < lowestAccuracy) {
        lowestAccuracy = avgAccuracy;
        weakestMemorizeTime = parseInt(memorizeTime);
      }
    }
  });
  
  if (weakestMemorizeTime > 0 && lowestAccuracy < 70) {
    weakAreas.push({
      type: 'memorizeTime',
      score: Math.round(lowestAccuracy)
    });
  }
  
  return weakAreas;
};

/**
 * Generate personalized learning recommendations
 * @param skillRating User's current skill rating
 * @param history Game history
 * @param weakAreas User's weak areas
 * @returns Array of learning recommendations
 */
export const generateLearningRecommendations = (
  skillRating: number, 
  history: GameHistory[],
  weakAreas: WeakArea[]
): LearningRecommendation[] => {
  const recommendations: LearningRecommendation[] = [];
  
  // Always recommend the daily challenge
  recommendations.push({
    type: RecommendationType.DAILY_CHALLENGE,
    description: "Complete today's daily challenge to earn bonus points",
    difficulty: DIFFICULTY_LEVELS.find(level => skillRating >= level.minSkillRating)?.name as Difficulty || 'Easy'
  });
  
  // Recommend focused practice based on weak areas
  weakAreas.forEach(weakArea => {
    if (weakArea.type === 'pieceCount') {
      recommendations.push({
        type: RecommendationType.FOCUSED_PRACTICE,
        description: `Practice with ${weakArea.score < 50 ? 'fewer' : 'more'} pieces to improve your memory`,
        pieceCount: weakArea.score < 50 ? 
          Math.max(2, Math.floor(weakArea.score / 10)) : 
          Math.min(32, Math.floor(weakArea.score / 5))
      });
    } else if (weakArea.type === 'memorizeTime') {
      recommendations.push({
        type: RecommendationType.FOCUSED_PRACTICE,
        description: `Practice with ${weakArea.score < 50 ? 'longer' : 'shorter'} memorization times`,
        memorizeTime: weakArea.score < 50 ? 
          Math.min(30, 30 - Math.floor(weakArea.score / 5)) : 
          Math.max(5, 30 - Math.floor(weakArea.score / 5))
      });
    }
  });
  
  // Recommend difficulty adjustment if needed
  const recentGames = history.slice(-5);
  const recentAccuracies = recentGames.map(game => game.accuracy);
  const avgRecentAccuracy = recentAccuracies.length > 0 ? 
    recentAccuracies.reduce((sum, acc) => sum + acc, 0) / recentAccuracies.length : 
    0;
  
  if (avgRecentAccuracy > 90) {
    recommendations.push({
      type: RecommendationType.DIFFICULTY_ADJUSTMENT,
      description: "Your accuracy is excellent! Try increasing the difficulty",
      difficulty: getNextDifficultyLevel(skillRating)
    });
  } else if (avgRecentAccuracy < 50 && recentAccuracies.length >= 3) {
    recommendations.push({
      type: RecommendationType.DIFFICULTY_ADJUSTMENT,
      description: "You're finding this challenging. Try decreasing the difficulty",
      difficulty: getPreviousDifficultyLevel(skillRating)
    });
  }
  
  // Recommend skill improvement if no recent games
  if (history.length === 0) {
    recommendations.push({
      type: RecommendationType.SKILL_IMPROVEMENT,
      description: "Start with a simple game to warm up",
      pieceCount: 8,
      memorizeTime: 15
    });
  } else {
    // Check if it's been a while since the last game
    const lastGameTime = Math.max(...history.map(game => game.timestamp));
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (Date.now() - lastGameTime > weekInMs) {
      recommendations.push({
        type: RecommendationType.SKILL_IMPROVEMENT,
        description: "It's been a while since you played. Start with a simple game to warm up",
        pieceCount: 8,
        memorizeTime: 15
      });
    }
  }
  
  return recommendations;
};

/**
 * Get the next difficulty level based on skill rating
 * @param skillRating User's current skill rating
 * @returns Name of the next difficulty level
 */
const getNextDifficultyLevel = (skillRating: number): Difficulty => {
  const currentLevel = DIFFICULTY_LEVELS.findIndex(
    level => skillRating >= level.minSkillRating
  );
  
  if (currentLevel < DIFFICULTY_LEVELS.length - 1) {
    return DIFFICULTY_LEVELS[currentLevel + 1].name as Difficulty;
  }
  
  return DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1].name as Difficulty;
};

/**
 * Get the previous difficulty level based on skill rating
 * @param skillRating User's current skill rating
 * @returns Name of the previous difficulty level
 */
const getPreviousDifficultyLevel = (skillRating: number): Difficulty => {
  const currentLevel = DIFFICULTY_LEVELS.findIndex(
    level => skillRating >= level.minSkillRating
  );
  
  if (currentLevel > 0) {
    return DIFFICULTY_LEVELS[currentLevel - 1].name as Difficulty;
  }
  
  return DIFFICULTY_LEVELS[0].name as Difficulty;
};

/**
 * Generate a random position
 * @param pieceCount Number of pieces
 * @returns FEN string of the position
 */
const generateRandomPosition = (pieceCount: number): string => {
  // Create a random position with the specified number of pieces
  console.log(`Generating position with ${pieceCount} pieces`);
  
  try {
    // Ensure piece count is valid (minimum 2 for the kings)
    const adjustedPieceCount = Math.max(2, Math.min(32, pieceCount));
    
    // Define piece types and their probabilities
    const pieces = ['p', 'n', 'b', 'r', 'q'];
    const weights = [8, 2, 2, 2, 1]; // Kings are handled separately
    
    // Create a weighted array for random selection
    const weightedPieces: string[] = [];
    pieces.forEach((piece, index) => {
      for (let i = 0; i < weights[index]; i++) {
        weightedPieces.push(piece);
      }
    });
    
    // Create a board representation (8x8 array)
    const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place kings first (required for a valid position)
    // Randomly place white king
    const whiteKingRank = Math.floor(Math.random() * 3); // Ranks 0-2 (bottom of board)
    const whiteKingFile = Math.floor(Math.random() * 8);
    board[whiteKingRank][whiteKingFile] = 'K';
    
    // Randomly place black king (ensuring it's not too close to white king)
    let blackKingRank, blackKingFile;
    do {
      blackKingRank = 5 + Math.floor(Math.random() * 3); // Ranks 5-7 (top of board)
      blackKingFile = Math.floor(Math.random() * 8);
    } while (Math.abs(blackKingFile - whiteKingFile) < 2 && Math.abs(blackKingRank - whiteKingRank) < 2);
    
    board[blackKingRank][blackKingFile] = 'k';
    
    // If we only want the kings (pieceCount = 2), return now
    if (adjustedPieceCount <= 2) {
      // Convert board to FEN
      const fenRows: string[] = [];
      for (let rank = 7; rank >= 0; rank--) {
        let fenRow = '';
        let emptyCount = 0;
        
        for (let file = 0; file < 8; file++) {
          const piece = board[rank][file];
          
          if (piece === null) {
            emptyCount++;
          } else {
            if (emptyCount > 0) {
              fenRow += emptyCount.toString();
              emptyCount = 0;
            }
            fenRow += piece;
          }
        }
        
        if (emptyCount > 0) {
          fenRow += emptyCount.toString();
        }
        
        fenRows.push(fenRow);
      }
      
      // Combine rows with slashes
      const fenPosition = fenRows.join('/');
      
      // Return complete FEN string
      return `${fenPosition} w - - 0 1`;
    }
    
    // Place remaining pieces
    let piecesPlaced = 2; // Kings already placed
    const maxAttempts = 1000;
    let attempts = 0;
    
    // Calculate how many pieces of each color to place
    const remainingPieces = adjustedPieceCount - 2; // Subtract the 2 kings
    const targetWhitePieces = Math.ceil(remainingPieces / 2);
    const targetBlackPieces = remainingPieces - targetWhitePieces;
    
    let whitePiecesPlaced = 1; // Start with 1 for the king
    let blackPiecesPlaced = 1; // Start with 1 for the king
    
    while (piecesPlaced < adjustedPieceCount && attempts < maxAttempts) {
      attempts++;
      
      // Generate random position
      const rank = Math.floor(Math.random() * 8);
      const file = Math.floor(Math.random() * 8);
      
      // Skip if position is already occupied
      if (board[rank][file] !== null) {
        continue;
      }
      
      // Skip king positions
      if ((rank === whiteKingRank && file === whiteKingFile) || 
          (rank === blackKingRank && file === blackKingFile)) {
        continue;
      }
      
      // Determine color based on balance
      const needMoreWhite = whitePiecesPlaced < targetWhitePieces + 1; // +1 for the king
      const needMoreBlack = blackPiecesPlaced < targetBlackPieces + 1; // +1 for the king
      
      let isWhite: boolean;
      if (needMoreWhite && !needMoreBlack) {
        isWhite = true;
      } else if (!needMoreWhite && needMoreBlack) {
        isWhite = false;
      } else {
        isWhite = Math.random() > 0.5;
      }
      
      // Select random piece type
      const pieceType = weightedPieces[Math.floor(Math.random() * weightedPieces.length)];
      const finalPiece = isWhite ? pieceType.toUpperCase() : pieceType;
      
      // Place the piece
      board[rank][file] = finalPiece;
      piecesPlaced++;
      
      if (isWhite) {
        whitePiecesPlaced++;
      } else {
        blackPiecesPlaced++;
      }
    }
    
    // Convert board to FEN
    const fenRows: string[] = [];
    for (let rank = 7; rank >= 0; rank--) {
      let fenRow = '';
      let emptyCount = 0;
      
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        
        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fenRow += emptyCount.toString();
            emptyCount = 0;
          }
          fenRow += piece;
        }
      }
      
      if (emptyCount > 0) {
        fenRow += emptyCount.toString();
      }
      
      fenRows.push(fenRow);
    }
    
    // Combine rows with slashes
    const fenPosition = fenRows.join('/');
    
    // Return complete FEN string
    return `${fenPosition} w - - 0 1`;
  } catch (error) {
    console.error('Error generating random position:', error);
    // Fallback to a simple position with just kings
    return '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
  }
}; 