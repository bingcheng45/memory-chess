'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { 
  calculateAccuracyTrend, 
  calculateTimeTrend, 
  calculateSkillRatingTrend,
  calculatePerformanceByPieceCount,
  calculatePerformanceByMemorizeTime,
  calculateLearningCurve,
  calculatePiecePlacementHeatmap,
  calculatePerformanceByTimeOfDay,
  calculateStreakStats,
  generatePerformanceSummary
} from '@/lib/utils/analyticsUtils';

// Time period options for filtering
const TIME_PERIODS = [
  { label: 'All Time', value: 0 },
  { label: 'Last 10 Games', value: 10 },
  { label: 'Last 20 Games', value: 20 },
  { label: 'Last 30 Games', value: 30 }
];

export default function PerformanceDashboard() {
  const { history } = useGameStore();
  const [selectedPeriod, setSelectedPeriod] = useState(0); // 0 means all time
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate analytics data
  const accuracyTrend = calculateAccuracyTrend(history, selectedPeriod);
  const timeTrend = calculateTimeTrend(history, selectedPeriod);
  const skillRatingTrend = calculateSkillRatingTrend(history, selectedPeriod);
  const performanceByPieceCount = calculatePerformanceByPieceCount(history);
  const performanceByMemorizeTime = calculatePerformanceByMemorizeTime(history);
  const learningCurve = calculateLearningCurve(history);
  const heatmapData = calculatePiecePlacementHeatmap();
  const performanceByTimeOfDay = calculatePerformanceByTimeOfDay(history);
  const streakStats = calculateStreakStats(history);
  const performanceSummary = generatePerformanceSummary(history);
  
  // Handle period change
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(Number(e.target.value));
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // If no games played yet, show a message
  if (history.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-lg bg-bg-card p-6 text-center">
        <div>
          <h3 className="mb-2 text-xl font-bold text-text-primary">No Games Played Yet</h3>
          <p className="text-text-secondary">
            Play some games to see your performance analytics here.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full rounded-lg bg-bg-card p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-bold text-text-primary">Performance Analytics</h2>
        
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="text-sm font-medium text-text-secondary">
            Time Period:
          </label>
          <select
            id="period"
            value={selectedPeriod}
            onChange={handlePeriodChange}
            className="rounded-md border border-bg-light bg-bg-dark px-3 py-1 text-sm text-text-primary"
          >
            {TIME_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-bg-light">
        <nav className="flex space-x-4">
          <button
            onClick={() => handleTabChange('overview')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-peach-500 text-peach-500'
                : 'border-transparent text-text-secondary hover:border-bg-light hover:text-text-primary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange('trends')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'trends'
                ? 'border-peach-500 text-peach-500'
                : 'border-transparent text-text-secondary hover:border-bg-light hover:text-text-primary'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => handleTabChange('analysis')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'analysis'
                ? 'border-peach-500 text-peach-500'
                : 'border-transparent text-text-secondary hover:border-bg-light hover:text-text-primary'
            }`}
          >
            Analysis
          </button>
          <button
            onClick={() => handleTabChange('heatmap')}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === 'heatmap'
                ? 'border-peach-500 text-peach-500'
                : 'border-transparent text-text-secondary hover:border-bg-light hover:text-text-primary'
            }`}
          >
            Heatmap
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-1 text-sm font-medium text-text-secondary">Games Played</h3>
                <p className="text-2xl font-bold text-text-primary">{performanceSummary.gamesPlayed}</p>
              </div>
              
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-1 text-sm font-medium text-text-secondary">Average Accuracy</h3>
                <p className="text-2xl font-bold text-text-primary">{performanceSummary.averageAccuracy}%</p>
              </div>
              
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-1 text-sm font-medium text-text-secondary">Average Time</h3>
                <p className="text-2xl font-bold text-text-primary">{performanceSummary.averageTime}s</p>
              </div>
              
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-1 text-sm font-medium text-text-secondary">Perfect Scores</h3>
                <p className="text-2xl font-bold text-text-primary">{performanceSummary.perfectScores}</p>
              </div>
            </div>
            
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-3 text-sm font-medium text-text-secondary">Current Streak</h3>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-peach-500">{streakStats.current}</p>
                  <p className="text-sm text-text-secondary">
                    games with 70%+ accuracy
                  </p>
                </div>
                <div className="mt-2 flex justify-between text-xs text-text-muted">
                  <span>Longest: {streakStats.longest}</span>
                  <span>Average: {streakStats.average}</span>
                </div>
              </div>
              
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-3 text-sm font-medium text-text-secondary">Improvement Rate</h3>
                <div className="flex items-end gap-2">
                  <p className={`text-3xl font-bold ${performanceSummary.improvementRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {performanceSummary.improvementRate > 0 ? '+' : ''}{performanceSummary.improvementRate}%
                  </p>
                  <p className="text-sm text-text-secondary">
                    from first to recent games
                  </p>
                </div>
                <div className="mt-2 text-xs text-text-muted">
                  {performanceSummary.improvementRate >= 0 
                    ? 'Your memory skills are improving!' 
                    : 'Keep practicing to improve your skills'}
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-3 text-sm font-medium text-text-secondary">Performance by Piece Count</h3>
                <div className="h-40">
                  {Object.keys(performanceByPieceCount).length > 0 ? (
                    <div className="flex h-full items-end justify-between">
                      {Object.entries(performanceByPieceCount).map(([pieceCount, accuracy]) => (
                        <div key={pieceCount} className="flex h-full flex-col items-center justify-end">
                          <div 
                            className="w-8 bg-peach-500"
                            style={{ height: `${accuracy}%` }}
                          ></div>
                          <div className="mt-1 text-xs text-text-muted">{pieceCount}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      Not enough data
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-3 text-sm font-medium text-text-secondary">Performance by Time of Day</h3>
                <div className="h-40">
                  {Object.keys(performanceByTimeOfDay).length > 0 ? (
                    <div className="flex h-full items-end justify-between">
                      {Object.entries(performanceByTimeOfDay).map(([period, accuracy]) => (
                        <div key={period} className="flex h-full flex-col items-center justify-end">
                          <div 
                            className="w-12 bg-peach-500"
                            style={{ height: `${accuracy}%` }}
                          ></div>
                          <div className="mt-1 text-xs text-text-muted text-center">{period.split(' ')[0]}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      Not enough data
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div>
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-text-secondary">Accuracy Trend</h3>
              <div className="h-64 rounded-lg bg-bg-dark p-4">
                {accuracyTrend.length > 0 ? (
                  <div className="relative h-full w-full">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-text-muted">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                    
                    {/* Chart */}
                    <div className="ml-8 h-full">
                      <div className="flex h-full items-end">
                        {accuracyTrend.map((accuracy, index) => (
                          <div key={index} className="flex h-full flex-1 flex-col items-center justify-end">
                            <div 
                              className="w-full bg-peach-500"
                              style={{ 
                                height: `${accuracy}%`,
                                maxWidth: '20px',
                                margin: '0 auto'
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    Not enough data
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-text-secondary">Completion Time Trend</h3>
              <div className="h-64 rounded-lg bg-bg-dark p-4">
                {timeTrend.length > 0 ? (
                  <div className="relative h-full w-full">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-text-muted">
                      <span>{Math.max(...timeTrend)}s</span>
                      <span>{Math.round(Math.max(...timeTrend) * 0.75)}s</span>
                      <span>{Math.round(Math.max(...timeTrend) * 0.5)}s</span>
                      <span>{Math.round(Math.max(...timeTrend) * 0.25)}s</span>
                      <span>0s</span>
                    </div>
                    
                    {/* Chart */}
                    <div className="ml-8 h-full">
                      <div className="flex h-full items-end">
                        {timeTrend.map((time, index) => (
                          <div key={index} className="flex h-full flex-1 flex-col items-center justify-end">
                            <div 
                              className="w-full bg-blue-500"
                              style={{ 
                                height: `${(time / Math.max(...timeTrend)) * 100}%`,
                                maxWidth: '20px',
                                margin: '0 auto'
                              }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    Not enough data
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="mb-3 text-sm font-medium text-text-secondary">Skill Rating Trend</h3>
              <div className="h-64 rounded-lg bg-bg-dark p-4">
                {skillRatingTrend.length > 0 ? (
                  <div className="relative h-full w-full">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-text-muted">
                      <span>{Math.max(...skillRatingTrend)}</span>
                      <span>{Math.round((Math.max(...skillRatingTrend) + Math.min(...skillRatingTrend)) / 2)}</span>
                      <span>{Math.min(...skillRatingTrend)}</span>
                    </div>
                    
                    {/* Chart */}
                    <div className="ml-8 h-full">
                      <svg className="h-full w-full" viewBox={`0 0 ${skillRatingTrend.length} 100`} preserveAspectRatio="none">
                        <polyline
                          points={skillRatingTrend.map((rating, i) => {
                            const x = i;
                            const y = 100 - ((rating - Math.min(...skillRatingTrend)) / (Math.max(...skillRatingTrend) - Math.min(...skillRatingTrend))) * 100;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#FFB380"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-text-muted">
                    Not enough data
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-3 text-sm font-medium text-text-secondary">Performance by Memorize Time</h3>
                <div className="h-40">
                  {Object.keys(performanceByMemorizeTime).length > 0 ? (
                    <div className="flex h-full items-end justify-between">
                      {Object.entries(performanceByMemorizeTime).map(([time, accuracy]) => (
                        <div key={time} className="flex h-full flex-col items-center justify-end">
                          <div 
                            className="w-8 bg-peach-500"
                            style={{ height: `${accuracy}%` }}
                          ></div>
                          <div className="mt-1 text-xs text-text-muted">{time}s</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      Not enough data
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg bg-bg-dark p-4">
                <h3 className="mb-3 text-sm font-medium text-text-secondary">Learning Curve</h3>
                <div className="h-40">
                  {history.length >= 5 ? (
                    <div className="relative h-full w-full">
                      <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Actual data points */}
                        <polyline
                          points={accuracyTrend.map((accuracy, i) => {
                            const x = (i / (accuracyTrend.length - 1)) * 80;
                            const y = 100 - accuracy;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#FFB380"
                          strokeWidth="2"
                        />
                        
                        {/* Prediction line */}
                        {learningCurve.prediction.length > 0 && (
                          <polyline
                            points={[
                              // Connect to the last actual data point
                              `${(accuracyTrend.length - 1) / (accuracyTrend.length - 1) * 80},${100 - accuracyTrend[accuracyTrend.length - 1]}`,
                              // Add prediction points
                              ...learningCurve.prediction.map((accuracy, i) => {
                                const x = ((accuracyTrend.length + i) / (accuracyTrend.length - 1)) * 80;
                                const y = 100 - accuracy;
                                return `${x},${y}`;
                              })
                            ].join(' ')}
                            fill="none"
                            stroke="#FFB380"
                            strokeWidth="2"
                            strokeDasharray="4"
                          />
                        )}
                      </svg>
                      
                      <div className="mt-2 text-xs text-text-muted">
                        {learningCurve.slope > 0 
                          ? 'Your skills are improving over time' 
                          : 'Your performance is stable'}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      Need at least 5 games for learning curve
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-bg-dark p-4">
              <h3 className="mb-3 text-sm font-medium text-text-secondary">Recommendations</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                {history.length < 5 ? (
                  <li>Play more games to get personalized recommendations</li>
                ) : (
                  <>
                    {performanceSummary.averageAccuracy < 70 && (
                      <li>Try reducing the number of pieces to improve accuracy</li>
                    )}
                    {performanceSummary.averageAccuracy > 90 && (
                      <li>Challenge yourself with more pieces or less memorization time</li>
                    )}
                    {Object.entries(performanceByPieceCount).length > 0 && 
                     Math.max(...Object.values(performanceByPieceCount)) - Math.min(...Object.values(performanceByPieceCount)) > 20 && (
                      <li>Focus on improving with {
                        Object.entries(performanceByPieceCount)
                          .sort((a, b) => a[1] - b[1])[0][0]
                      } pieces</li>
                    )}
                    {Object.entries(performanceByTimeOfDay).length > 0 && 
                     Math.max(...Object.values(performanceByTimeOfDay)) - Math.min(...Object.values(performanceByTimeOfDay)) > 20 && (
                      <li>Your performance is best during {
                        Object.entries(performanceByTimeOfDay)
                          .sort((a, b) => b[1] - a[1])[0][0]
                      }</li>
                    )}
                    {learningCurve.slope < 0 && (
                      <li>Try taking a break or changing your practice approach</li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </div>
        )}
        
        {/* Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-text-secondary">Piece Placement Accuracy Heatmap</h3>
            <div className="aspect-square max-w-[400px] mx-auto">
              <div className="grid h-full w-full grid-cols-8 grid-rows-8 gap-1 rounded-lg bg-bg-dark p-4">
                {heatmapData.map((row, i) => 
                  row.map((accuracy, j) => {
                    const squareColor = (i + j) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark';
                    const heatColor = accuracy >= 90 ? 'bg-green-500/50' : 
                                     accuracy >= 70 ? 'bg-peach-500/50' : 
                                     accuracy >= 50 ? 'bg-yellow-500/50' : 
                                     'bg-red-500/50';
                    
                    return (
                      <div 
                        key={`${i}-${j}`} 
                        className={`relative flex items-center justify-center ${squareColor}`}
                      >
                        <div 
                          className={`absolute inset-0 ${heatColor}`}
                          style={{ opacity: accuracy / 100 }}
                        ></div>
                        <span className="relative z-10 text-xs font-medium text-text-primary">
                          {accuracy}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-4 flex justify-center">
                <div className="flex items-center space-x-4 text-xs text-text-muted">
                  <div className="flex items-center">
                    <div className="mr-1 h-3 w-3 bg-red-500/50"></div>
                    <span>Low</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-1 h-3 w-3 bg-yellow-500/50"></div>
                    <span>Medium</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-1 h-3 w-3 bg-peach-500/50"></div>
                    <span>Good</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-1 h-3 w-3 bg-green-500/50"></div>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-center text-xs text-text-muted">
                Note: This is a simulated heatmap. Actual piece placement tracking will be implemented in a future update.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 