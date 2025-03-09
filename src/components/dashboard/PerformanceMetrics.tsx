'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function PerformanceMetrics() {
  const { 
    history, 
    getTotalGames, 
    getAverageAccuracy, 
    getHighestLevel, 
    getBestTime, 
    getSkillRating, 
    getCurrentStreak 
  } = useGameStore();
  
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  
  // Filter history based on time range
  const filteredHistory = () => {
    const now = new Date();
    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return history.filter(game => new Date(game.timestamp) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return history.filter(game => new Date(game.timestamp) >= monthAgo);
    }
    return history;
  };
  
  // Prepare chart data
  const chartData = filteredHistory().map((game, index) => ({
    id: index,
    date: new Date(game.timestamp).toLocaleDateString(),
    accuracy: game.accuracy,
    pieceCount: game.pieceCount,
    memorizeTime: game.memorizeTime
  }));
  
  // Calculate stats
  const totalGames = getTotalGames();
  const averageAccuracy = getAverageAccuracy();
  const highestLevel = getHighestLevel();
  const bestTime = getBestTime();
  const skillRating = getSkillRating();
  const currentStreak = getCurrentStreak();
  
  // Calculate improvement
  const calculateImprovement = () => {
    if (history.length < 2) return 0;
    
    const recentGames = history.slice(-5);
    const olderGames = history.slice(-10, -5);
    
    if (olderGames.length === 0) return 0;
    
    const recentAvg = recentGames.reduce((sum, game) => sum + game.accuracy, 0) / recentGames.length;
    const olderAvg = olderGames.reduce((sum, game) => sum + game.accuracy, 0) / olderGames.length;
    
    return Math.round((recentAvg - olderAvg) * 10) / 10;
  };
  
  const improvement = calculateImprovement();
  
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-bg-card p-4">
          <div className="text-sm text-text-muted">Total Games</div>
          <div className="text-2xl font-bold text-text-primary">{totalGames}</div>
        </div>
        
        <div className="rounded-lg bg-bg-card p-4">
          <div className="text-sm text-text-muted">Avg. Accuracy</div>
          <div className="text-2xl font-bold text-text-primary">{averageAccuracy}%</div>
          {improvement !== 0 && (
            <div className={`text-xs ${improvement > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {improvement > 0 ? '+' : ''}{improvement}% vs previous games
            </div>
          )}
        </div>
        
        <div className="rounded-lg bg-bg-card p-4">
          <div className="text-sm text-text-muted">Highest Level</div>
          <div className="text-2xl font-bold text-text-primary">{highestLevel}</div>
        </div>
        
        <div className="rounded-lg bg-bg-card p-4">
          <div className="text-sm text-text-muted">Best Time</div>
          <div className="text-2xl font-bold text-text-primary">{bestTime}s</div>
        </div>
      </div>
      
      {/* Skill Rating and Streak */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-bg-card p-4">
          <div className="mb-2 text-sm text-text-muted">Skill Rating</div>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-peach-500">{skillRating}</div>
            <div className="ml-4">
              <div className="text-xs text-text-secondary">
                {skillRating < 1000 ? 'Easy' :
                 skillRating < 1500 ? 'Medium' :
                 skillRating < 2000 ? 'Hard' : 'Grandmaster'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg bg-bg-card p-4">
          <div className="mb-2 text-sm text-text-muted">Current Streak</div>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-peach-500">{currentStreak}</div>
            <div className="ml-4">
              <div className="text-xs text-text-secondary">
                consecutive games with 70%+ accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">Performance Over Time</h3>
        <div className="flex rounded-lg bg-bg-card">
          <button
            onClick={() => setTimeRange('week')}
            className={`rounded-l-lg px-3 py-1 text-sm ${
              timeRange === 'week' 
                ? 'bg-peach-500 text-bg-dark' 
                : 'text-text-secondary hover:bg-bg-light'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 text-sm ${
              timeRange === 'month' 
                ? 'bg-peach-500 text-bg-dark' 
                : 'text-text-secondary hover:bg-bg-light'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`rounded-r-lg px-3 py-1 text-sm ${
              timeRange === 'all' 
                ? 'bg-peach-500 text-bg-dark' 
                : 'text-text-secondary hover:bg-bg-light'
            }`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {/* Accuracy Chart */}
      {chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                tick={{ fill: '#888888' }}
                tickLine={{ stroke: '#888888' }}
              />
              <YAxis 
                stroke="#888888" 
                tick={{ fill: '#888888' }}
                tickLine={{ stroke: '#888888' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333333',
                  color: '#e0e0e0'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg bg-bg-card">
          <p className="text-text-secondary">Not enough data to display chart</p>
        </div>
      )}
      
      {/* Piece Count Distribution */}
      {chartData.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-medium text-text-primary">Piece Count Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  tick={{ fill: '#888888' }}
                  tickLine={{ stroke: '#888888' }}
                />
                <YAxis 
                  stroke="#888888" 
                  tick={{ fill: '#888888' }}
                  tickLine={{ stroke: '#888888' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #333333',
                    color: '#e0e0e0'
                  }} 
                />
                <Bar dataKey="pieceCount" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
} 