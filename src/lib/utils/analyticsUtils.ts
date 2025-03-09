import { GameHistory } from '@/lib/types/game';

/**
 * Calculate accuracy trend over time
 * @param history Game history array
 * @param period Number of days to include (0 for all)
 * @returns Array of accuracy values
 */
export const calculateAccuracyTrend = (history: GameHistory[], period: number = 0): number[] => {
  if (history.length === 0) return [];
  
  // Filter history by period if specified
  const filteredHistory = filterHistoryByPeriod(history, period);
  if (filteredHistory.length === 0) return [];
  
  // Sort history by date
  const sortedHistory = [...filteredHistory].sort((a, b) => a.timestamp - b.timestamp);
  
  // Group by day
  const dayGroups = groupHistoryByDay(sortedHistory);
  
  // Calculate average accuracy for each day
  return dayGroups.map(games => {
    const totalAccuracy = games.reduce((sum, game) => sum + game.accuracy, 0);
    return Math.round(totalAccuracy / games.length);
  });
};

/**
 * Calculate completion time trend over time
 * @param history Game history array
 * @param period Number of days to include (0 for all)
 * @returns Array of completion time values
 */
export const calculateTimeTrend = (history: GameHistory[], period: number = 0): number[] => {
  if (history.length === 0) return [];
  
  // Filter history by period if specified
  const filteredHistory = filterHistoryByPeriod(history, period);
  if (filteredHistory.length === 0) return [];
  
  // Sort history by date
  const sortedHistory = [...filteredHistory].sort((a, b) => a.timestamp - b.timestamp);
  
  // Group by day
  const dayGroups = groupHistoryByDay(sortedHistory);
  
  // Calculate average completion time for each day
  return dayGroups.map(games => {
    const totalTime = games.reduce((sum, game) => sum + game.duration, 0);
    return Math.round(totalTime / games.length);
  });
};

/**
 * Calculate skill rating trend over time
 * @param history Game history array
 * @param period Number of days to include (0 for all)
 * @returns Array of skill rating values
 */
export const calculateSkillRatingTrend = (history: GameHistory[], period: number = 0): number[] => {
  if (history.length === 0) return [];
  
  // Filter history by period if specified
  const filteredHistory = filterHistoryByPeriod(history, period);
  if (filteredHistory.length === 0) return [];
  
  // Sort history by date
  const sortedHistory = [...filteredHistory].sort((a, b) => a.timestamp - b.timestamp);
  
  // Group by day
  const dayGroups = groupHistoryByDay(sortedHistory);
  
  // Use the last game's level for each day as a proxy for skill rating
  // In a real implementation, we would track the actual skill rating
  return dayGroups.map(games => {
    const lastGame = games[games.length - 1];
    return lastGame.level * 100; // Simple conversion for visualization
  });
};

/**
 * Calculate performance by piece count
 * @param history Game history array
 * @returns Record of piece count to average accuracy
 */
export const calculatePerformanceByPieceCount = (history: GameHistory[]): Record<number, number> => {
  if (history.length === 0) return {};
  
  // Group games by piece count
  const pieceCountGroups: Record<number, GameHistory[]> = {};
  
  history.forEach(game => {
    if (!pieceCountGroups[game.pieceCount]) {
      pieceCountGroups[game.pieceCount] = [];
    }
    pieceCountGroups[game.pieceCount].push(game);
  });
  
  // Calculate average accuracy for each piece count
  const result: Record<number, number> = {};
  
  Object.entries(pieceCountGroups).forEach(([pieceCount, games]) => {
    const totalAccuracy = games.reduce((sum, game) => sum + game.accuracy, 0);
    result[Number(pieceCount)] = Math.round(totalAccuracy / games.length);
  });
  
  return result;
};

/**
 * Calculate performance by memorize time
 * @param history Game history array
 * @returns Record of memorize time to average accuracy
 */
export const calculatePerformanceByMemorizeTime = (history: GameHistory[]): Record<number, number> => {
  if (history.length === 0) return {};
  
  // Group games by memorize time
  const memorizeTimeGroups: Record<number, GameHistory[]> = {};
  
  history.forEach(game => {
    if (!memorizeTimeGroups[game.memorizeTime]) {
      memorizeTimeGroups[game.memorizeTime] = [];
    }
    memorizeTimeGroups[game.memorizeTime].push(game);
  });
  
  // Calculate average accuracy for each memorize time
  const result: Record<number, number> = {};
  
  Object.entries(memorizeTimeGroups).forEach(([memorizeTime, games]) => {
    const totalAccuracy = games.reduce((sum, game) => sum + game.accuracy, 0);
    result[Number(memorizeTime)] = Math.round(totalAccuracy / games.length);
  });
  
  return result;
};

/**
 * Calculate performance by time of day
 * @param history Game history array
 * @returns Record of time of day to average accuracy
 */
export const calculatePerformanceByTimeOfDay = (history: GameHistory[]): Record<string, number> => {
  if (history.length === 0) return {};
  
  // Define time of day periods
  const periods = [
    { name: 'Morning (6-12)', start: 6, end: 12 },
    { name: 'Afternoon (12-18)', start: 12, end: 18 },
    { name: 'Evening (18-24)', start: 18, end: 24 },
    { name: 'Night (0-6)', start: 0, end: 6 }
  ];
  
  // Group games by time of day
  const timeOfDayGroups: Record<string, GameHistory[]> = {};
  periods.forEach(period => {
    timeOfDayGroups[period.name] = [];
  });
  
  history.forEach(game => {
    const date = new Date(game.timestamp);
    const hour = date.getHours();
    
    const period = periods.find(p => hour >= p.start && hour < p.end);
    if (period) {
      timeOfDayGroups[period.name].push(game);
    }
  });
  
  // Calculate average accuracy for each time of day
  const result: Record<string, number> = {};
  
  Object.entries(timeOfDayGroups).forEach(([timeOfDay, games]) => {
    if (games.length === 0) {
      result[timeOfDay] = 0;
    } else {
      const totalAccuracy = games.reduce((sum, game) => sum + game.accuracy, 0);
      result[timeOfDay] = Math.round(totalAccuracy / games.length);
    }
  });
  
  return result;
};

/**
 * Calculate streak statistics
 * @param history Game history array
 * @returns Object with streak statistics
 */
export const calculateStreakStats = (history: GameHistory[]) => {
  if (history.length === 0) {
    return {
      current: 0,
      longest: 0,
      average: 0
    };
  }
  
  // Sort history by date
  const sortedHistory = [...history].sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate streaks (consecutive games with accuracy >= 70%)
  let currentStreak = 0;
  let longestStreak = 0;
  let totalStreaks = 0;
  let streakCount = 0;
  
  sortedHistory.forEach(game => {
    if (game.accuracy >= 70) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      if (currentStreak > 0) {
        totalStreaks += currentStreak;
        streakCount++;
      }
      currentStreak = 0;
    }
  });
  
  // Include the current streak in the average calculation if it's ongoing
  if (currentStreak > 0) {
    totalStreaks += currentStreak;
    streakCount++;
  }
  
  const averageStreak = streakCount > 0 ? Math.round(totalStreaks / streakCount) : 0;
  
  return {
    current: currentStreak,
    longest: longestStreak,
    average: averageStreak
  };
};

/**
 * Generate a performance summary
 * @param history Game history array
 * @returns Object with performance summary
 */
export const generatePerformanceSummary = (history: GameHistory[]) => {
  if (history.length === 0) {
    return {
      totalGames: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
      worstAccuracy: 0,
      averageTime: 0,
      bestTime: 0,
      bestPieceCount: 0,
      worstPieceCount: 0,
      improvementRate: 0
    };
  }
  
  // Calculate basic stats
  const totalGames = history.length;
  const totalAccuracy = history.reduce((sum, game) => sum + game.accuracy, 0);
  const averageAccuracy = Math.round(totalAccuracy / totalGames);
  const bestAccuracy = Math.max(...history.map(game => game.accuracy));
  const worstAccuracy = Math.min(...history.map(game => game.accuracy));
  
  const totalTime = history.reduce((sum, game) => sum + game.duration, 0);
  const averageTime = Math.round(totalTime / totalGames);
  const bestTime = Math.min(...history.map(game => game.duration));
  
  // Calculate performance by piece count
  const pieceCountPerformance = calculatePerformanceByPieceCount(history);
  const pieceCountEntries = Object.entries(pieceCountPerformance);
  
  let bestPieceCount = 0;
  let worstPieceCount = 0;
  
  if (pieceCountEntries.length > 0) {
    const sortedByAccuracy = [...pieceCountEntries].sort((a, b) => b[1] - a[1]);
    bestPieceCount = Number(sortedByAccuracy[0][0]);
    worstPieceCount = Number(sortedByAccuracy[sortedByAccuracy.length - 1][0]);
  }
  
  // Calculate improvement rate (comparing first half vs second half of games)
  let improvementRate = 0;
  
  if (totalGames >= 4) {
    const midpoint = Math.floor(totalGames / 2);
    const firstHalf = history.slice(0, midpoint);
    const secondHalf = history.slice(midpoint);
    
    const firstHalfAccuracy = firstHalf.reduce((sum, game) => sum + game.accuracy, 0) / firstHalf.length;
    const secondHalfAccuracy = secondHalf.reduce((sum, game) => sum + game.accuracy, 0) / secondHalf.length;
    
    improvementRate = Math.round((secondHalfAccuracy - firstHalfAccuracy) * 10) / 10;
  }
  
  return {
    totalGames,
    averageAccuracy,
    bestAccuracy,
    worstAccuracy,
    averageTime,
    bestTime,
    bestPieceCount,
    worstPieceCount,
    improvementRate
  };
};

/**
 * Filter history by period
 * @param history Game history array
 * @param period Number of days to include (0 for all)
 * @returns Filtered game history array
 */
const filterHistoryByPeriod = (history: GameHistory[], period: number): GameHistory[] => {
  if (period === 0) return history;
  
  const now = Date.now();
  const cutoff = now - period * 24 * 60 * 60 * 1000;
  
  return history.filter(game => game.timestamp >= cutoff);
};

/**
 * Group history by day
 * @param history Game history array (sorted by date)
 * @returns Array of game history arrays grouped by day
 */
const groupHistoryByDay = (history: GameHistory[]): GameHistory[][] => {
  if (history.length === 0) return [];
  
  const dayGroups: GameHistory[][] = [];
  let currentDay: GameHistory[] = [history[0]];
  let currentDate = new Date(history[0].timestamp).toDateString();
  
  for (let i = 1; i < history.length; i++) {
    const gameDate = new Date(history[i].timestamp).toDateString();
    
    if (gameDate === currentDate) {
      currentDay.push(history[i]);
    } else {
      dayGroups.push(currentDay);
      currentDay = [history[i]];
      currentDate = gameDate;
    }
  }
  
  // Add the last day
  if (currentDay.length > 0) {
    dayGroups.push(currentDay);
  }
  
  return dayGroups;
}; 