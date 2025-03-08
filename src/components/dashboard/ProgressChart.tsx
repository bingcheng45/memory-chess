'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GameHistory } from '@/lib/types/game';

interface ProgressChartProps {
  readonly history: readonly GameHistory[];
}

export default function ProgressChart({ history }: ProgressChartProps) {
  // Prepare data for the chart
  const chartData = history
    .slice(0, 20) // Take the last 20 games
    .reverse() // Show oldest to newest
    .map((game, index) => ({
      name: `Game ${index + 1}`,
      score: game.accuracy || 0,
      level: game.level,
      time: game.completionTime || 0,
    }));

  return (
    <div className="h-80 w-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#F0F0F0" />
            <YAxis stroke="#F0F0F0" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#222', 
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#FFF'
              }} 
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Score/Accuracy"
              stroke="#FFB380"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="level"
              name="Level"
              stroke="#6366F1"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="time"
              name="Time (s)"
              stroke="#14B8A6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-text-secondary">No game history available yet</p>
        </div>
      )}
    </div>
  );
} 