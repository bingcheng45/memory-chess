'use client';

import { useGameStore } from '@/lib/store/gameStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ProgressChart() {
  const history = useGameStore((state) => state.history);

  const data = history
    .slice()
    .reverse()
    .map((game) => ({
      date: new Date(game.date).toLocaleDateString(),
      score: game.score,
      level: game.level,
    }));

  return (
    <div className="rounded-lg border border-white/10 bg-gray-800 p-6">
      <h2 className="mb-4 text-xl font-semibold">Progress Over Time</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="level"
              stroke="#10B981"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 