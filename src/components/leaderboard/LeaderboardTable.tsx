'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  formatMemorizeTime, 
  formatSolutionTime,
  formatDate 
} from '@/lib/utils/timeFormatting';
import { LeaderboardEntry } from '@/types/leaderboard';
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

// Consistent time display component
const TimeDisplay = ({ time }: { time: string }) => {
  // For debugging - log the time string
  console.log("Time string received:", time);
  
  // Check if the time matches the specific pattern "00:02017" (missing colon)
  const missingColonPattern = /^(\d{2}):(\d{2})(\d{3})$/;
  if (missingColonPattern.test(time)) {
    // Skip the first element using array destructuring
    const matches = time.match(missingColonPattern) || [];
    const minutes = matches[1] || '';
    const secondsStart = matches[2] || '';
    const milliseconds = matches[3] || '';
    console.log("Fixed malformed time:", `${minutes}:${secondsStart}:${milliseconds}`);
    
    return (
      <span className="font-mono text-base">
        {minutes}:<wbr />{secondsStart}:<wbr />{milliseconds}
      </span>
    );
  }
  
  // Check if the time is in standard format
  const isCorrectFormat = /^\d{2}:\d{2}:\d{3}$/.test(time);
  
  if (isCorrectFormat) {
    // If already correctly formatted, just apply consistent styling
    const parts = time.split(':');
    const [minutes, seconds, milliseconds] = parts;
    
    return (
      <span className="font-mono text-base">
        {minutes}:<wbr />{seconds}:<wbr />{milliseconds}
      </span>
    );
  } else {
    // Handle other malformed time strings
    console.log("Other malformed time string:", time);
    
    // Try to parse and reformat the time string
    if (time.includes(':')) {
      const parts = time.split(':');
      if (parts.length === 2 && parts[1].length > 2) {
        // Format likely missing second colon (e.g., "00:02017")
        const minutes = parts[0];
        const seconds = parts[1].substring(0, 2);
        const milliseconds = parts[1].substring(2);
        
        console.log("Fixed split time:", `${minutes}:${seconds}:${milliseconds}`);
        
        return (
          <span className="font-mono text-base">
            {minutes}:<wbr />{seconds}:<wbr />{milliseconds}
          </span>
        );
      }
    }
    
    // Fallback for completely unexpected formats
    return <span className="font-mono text-base">{time}</span>;
  }
};

export default function LeaderboardTable({ data, isLoading, error }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-peach-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-text-secondary">Loading leaderboard data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 border border-red-500/30 rounded-lg bg-red-500/10">
        <div className="flex justify-center mb-4">
          <div className="rounded-full p-3 bg-red-500/20">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-red-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">Oops! Something Went Wrong</h3>
        <p className="text-text-secondary mb-4">
          We couldn&apos;t load the leaderboard right now. This might be a temporary issue.
        </p>
        <p className="text-sm text-red-300 mb-4">Error: {error}</p>
        <div className="flex justify-center">
          <Button 
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center p-8 border border-bg-light rounded-lg bg-bg-card">
        <div className="flex justify-center mb-4">
          <div className="rounded-full p-3 bg-indigo-500/10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-indigo-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-peach-400 mb-2">Be the First Champion!</h3>
        <p className="text-lg text-text-secondary mb-2">No entries on this leaderboard yet</p>
        <p className="text-text-muted mb-4">
          Challenge your memory skills and claim your spot at the top! 
          Play a game now and etch your name in Memory Chess history.
        </p>
        <Link href="/game" className="inline-block">
          <Button 
            variant="outline"
            className="bg-peach-500/10 text-peach-500 border-peach-500/30 hover:bg-peach-500/20 mt-2"
          >
            Start Playing Now
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-bg-light overflow-hidden">
      <Table>
        <TableHeader className="bg-bg-card">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-center">Pieces</TableHead>
            <TableHead className="text-center">Memorize Time</TableHead>
            <TableHead className="text-center">Solution Time</TableHead>
            <TableHead className="text-right">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow key={entry.id} className={index < 3 ? "bg-peach-500/5" : undefined}>
              <TableCell className="text-center font-bold">
                {index === 0 && <span className="text-yellow-400">🏆</span>}
                {index === 1 && <span className="text-gray-300">🥈</span>}
                {index === 2 && <span className="text-amber-700">🥉</span>}
                {index > 2 && index + 1}
              </TableCell>
              <TableCell className="font-medium">{entry.player_name}</TableCell>
              <TableCell className="text-center">
                {entry.correct_pieces}/{entry.piece_count}
              </TableCell>
              <TableCell className="text-center">
                <TimeDisplay time={formatMemorizeTime(entry.memorize_time)} />
              </TableCell>
              <TableCell className="text-center">
                <TimeDisplay time={formatSolutionTime(entry.solution_time)} />
              </TableCell>
              <TableCell className="text-right text-text-muted">
                {formatDate(entry.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 