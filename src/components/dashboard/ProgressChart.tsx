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
      score: game.score,
      level: game.level,
    }));

  return (
    <div className="h-80 w-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#333', 
                border: '1px solid #555',
                borderRadius: '4px',
                color: 'white'
              }} 
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="level"
              stroke="#82ca9d"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400">No game history available yet</p>
        </div>
      )}
    </div>
  );
} 