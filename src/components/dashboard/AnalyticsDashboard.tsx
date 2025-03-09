'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { 
  calculateAccuracyTrend, 
  calculateTimeTrend, 
  calculateSkillRatingTrend,
  calculatePerformanceByPieceCount,
  calculatePerformanceByMemorizeTime,
  calculatePerformanceByTimeOfDay,
  calculateStreakStats
} from '@/lib/utils/analyticsUtils';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Define filter types
type TimeFilter = 'week' | 'month' | 'year' | 'all';
type MetricFilter = 'accuracy' | 'time' | 'skill_rating' | 'piece_count' | 'memorize_time' | 'time_of_day';

// Define chart data types
interface AccuracyDataPoint {
  day: number;
  accuracy: number;
}

interface TimeDataPoint {
  day: number;
  time: number;
}

interface RatingDataPoint {
  day: number;
  rating: number;
}

interface NameValueDataPoint {
  name: string;
  value: number;
}

type ChartDataPoint = AccuracyDataPoint | TimeDataPoint | RatingDataPoint | NameValueDataPoint;

export default function AnalyticsDashboard() {
  const { history } = useGameStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('accuracy');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  
  // Colors for charts
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  
  // Convert time filter to days
  const getTimeFilterDays = (): number => {
    switch (timeFilter) {
      case 'week': return 7;
      case 'month': return 30;
      case 'year': return 365;
      case 'all': return 0; // 0 means all data
      default: return 30;
    }
  };
  
  // Update chart data when filters change
  useEffect(() => {
    if (history.length === 0) return;
    
    const days = getTimeFilterDays();
    
    switch (metricFilter) {
      case 'accuracy':
        setChartData(formatAccuracyTrendData(calculateAccuracyTrend(history, days)));
        break;
      case 'time':
        setChartData(formatTimeTrendData(calculateTimeTrend(history, days)));
        break;
      case 'skill_rating':
        setChartData(formatSkillRatingTrendData(calculateSkillRatingTrend(history, days)));
        break;
      case 'piece_count':
        setChartData(formatPieceCountData(calculatePerformanceByPieceCount(history)));
        break;
      case 'memorize_time':
        setChartData(formatMemorizeTimeData(calculatePerformanceByMemorizeTime(history)));
        break;
      case 'time_of_day':
        setChartData(formatTimeOfDayData(calculatePerformanceByTimeOfDay(history)));
        break;
      default:
        setChartData([]);
    }
  }, [history, timeFilter, metricFilter]);
  
  // Format accuracy trend data
  const formatAccuracyTrendData = (data: number[]): AccuracyDataPoint[] => {
    return data.map((value, index) => ({
      day: index + 1,
      accuracy: value
    }));
  };
  
  // Format time trend data
  const formatTimeTrendData = (data: number[]): TimeDataPoint[] => {
    return data.map((value, index) => ({
      day: index + 1,
      time: value
    }));
  };
  
  // Format skill rating trend data
  const formatSkillRatingTrendData = (data: number[]): RatingDataPoint[] => {
    return data.map((value, index) => ({
      day: index + 1,
      rating: value
    }));
  };
  
  // Format piece count data
  const formatPieceCountData = (data: Record<number, number>): NameValueDataPoint[] => {
    return Object.entries(data).map(([pieceCount, accuracy]) => ({
      name: `${pieceCount} pieces`,
      value: accuracy
    }));
  };
  
  // Format memorize time data
  const formatMemorizeTimeData = (data: Record<number, number>): NameValueDataPoint[] => {
    return Object.entries(data).map(([memorizeTime, accuracy]) => ({
      name: `${memorizeTime}s`,
      value: accuracy
    }));
  };
  
  // Format time of day data
  const formatTimeOfDayData = (data: Record<string, number>): NameValueDataPoint[] => {
    return Object.entries(data).map(([timeOfDay, accuracy]) => ({
      name: timeOfDay,
      value: accuracy
    }));
  };
  
  // Render appropriate chart based on metric filter
  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center rounded-lg bg-bg-card">
          <p className="text-text-secondary">Not enough data to display chart</p>
        </div>
      );
    }
    
    switch (metricFilter) {
      case 'accuracy':
      case 'time':
      case 'skill_rating':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="day" 
                label={{ value: 'Day', position: 'insideBottomRight', offset: -10 }}
                stroke="#888888"
              />
              <YAxis 
                stroke="#888888"
                domain={metricFilter === 'accuracy' ? [0, 100] : ['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333333',
                  color: '#e0e0e0'
                }}
              />
              <Legend />
              {metricFilter === 'accuracy' && (
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke={colors[0]} 
                  strokeWidth={2}
                  name="Accuracy (%)"
                  dot={{ fill: colors[0], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {metricFilter === 'time' && (
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke={colors[1]} 
                  strokeWidth={2}
                  name="Completion Time (s)"
                  dot={{ fill: colors[1], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {metricFilter === 'skill_rating' && (
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke={colors[2]} 
                  strokeWidth={2}
                  name="Skill Rating"
                  dot={{ fill: colors[2], r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'piece_count':
      case 'memorize_time':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="name" 
                stroke="#888888"
              />
              <YAxis 
                stroke="#888888"
                domain={[0, 100]}
                label={{ 
                  value: 'Accuracy (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#888888' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333333',
                  color: '#e0e0e0'
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                name={metricFilter === 'piece_count' ? 'Accuracy by Piece Count' : 'Accuracy by Memorize Time'} 
                fill={metricFilter === 'piece_count' ? colors[3] : colors[4]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'time_of_day':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333333',
                  color: '#e0e0e0'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };
  
  // Render streak stats
  const renderStreakStats = () => {
    if (history.length === 0) return null;
    
    const streakStats = calculateStreakStats(history);
    
    return (
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-bg-card p-4 text-center">
          <div className="text-sm text-text-muted">Current Streak</div>
          <div className="text-2xl font-bold text-peach-500">{streakStats.current}</div>
        </div>
        
        <div className="rounded-lg bg-bg-card p-4 text-center">
          <div className="text-sm text-text-muted">Longest Streak</div>
          <div className="text-2xl font-bold text-peach-500">{streakStats.longest}</div>
        </div>
        
        <div className="rounded-lg bg-bg-card p-4 text-center">
          <div className="text-sm text-text-muted">Total Games</div>
          <div className="text-2xl font-bold text-peach-500">{history.length}</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Analytics Dashboard</h2>
          <p className="text-sm text-text-secondary">Visualize your performance over time</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="rounded-lg bg-bg-card px-3 py-1 text-sm text-text-primary"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          
          <select
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value as MetricFilter)}
            className="rounded-lg bg-bg-card px-3 py-1 text-sm text-text-primary"
          >
            <option value="accuracy">Accuracy Trend</option>
            <option value="time">Completion Time Trend</option>
            <option value="skill_rating">Skill Rating Trend</option>
            <option value="piece_count">Performance by Piece Count</option>
            <option value="memorize_time">Performance by Memorize Time</option>
            <option value="time_of_day">Performance by Time of Day</option>
          </select>
        </div>
      </div>
      
      <div className="rounded-lg border border-bg-light bg-bg-dark p-6">
        {renderChart()}
      </div>
      
      {renderStreakStats()}
    </div>
  );
} 