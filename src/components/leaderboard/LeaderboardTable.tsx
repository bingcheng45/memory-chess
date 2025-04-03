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
import { useEffect, useRef } from "react";

// Interface for entry details from URL params
interface EntryDetails {
  player: string | null;
  difficulty: string | null;
  memorizeTime: number | null;
  solutionTime: number | null;
  pieceCount: number | null;
  correctPieces: number | null;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  entryDetails?: EntryDetails;
  activeTab?: string;
}

// Consistent time display component
const TimeDisplay = ({ time }: { time: string }) => {
  // Extract time parts
  let minutes = "00";
  let seconds = "00";
  let milliseconds = "000";
  
  // Handle different time formats
  if (typeof time === 'string') {
    // Special handling for decimal format (e.g., "1.245")
    if (time.includes('.') && !time.includes(':')) {
      const [secondsPart, msPart] = time.split('.');
      const totalSeconds = parseInt(secondsPart || "0");
      minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      seconds = (totalSeconds % 60).toString().padStart(2, '0');
      milliseconds = msPart?.padStart(3, '0') || "000";
    }
    // Handle MM:SS:XXX format
    else if (time.includes(':')) {
      const parts = time.split(':');
      
      // Standard format MM:SS:XXX
      if (parts.length === 3) {
        [minutes, seconds, milliseconds] = parts;
        
        // Fix for memorize time format where seconds appear as milliseconds ("00:00:010")
        if (minutes === "00" && seconds === "00" && milliseconds.length === 3) {
          // Check if milliseconds represents seconds (e.g., "010" means 10 seconds)
          const msValue = parseInt(milliseconds);
          if (msValue > 0) {
            seconds = msValue.toString().padStart(2, '0');
            milliseconds = "000";
          }
        }
        
        // Check if milliseconds contains a decimal (e.g., "1.245")
        if (milliseconds.includes('.')) {
          const [secPart, msPart] = milliseconds.split('.');
          if (secPart && secPart !== '0') {
            // Add the additional seconds to the seconds part
            seconds = (parseInt(seconds) + parseInt(secPart)).toString().padStart(2, '0');
          }
          milliseconds = msPart?.padStart(3, '0') || "000";
        }
      } 
      // Handle MM:SSXXX format (missing second colon)
      else if (parts.length === 2) {
        minutes = parts[0];
        // Check if the second part is longer than 2 characters
        if (parts[1].length > 2) {
          seconds = parts[1].substring(0, 2);
          milliseconds = parts[1].substring(2);
        } else {
          seconds = parts[1];
          milliseconds = "000";
        }
      }
    }
  }
  
  return (
    <div className="inline-flex items-baseline font-mono">
      <span>{minutes}</span>
      <span>:</span>
      <span>{seconds}</span>
      <span>:</span>
      <span className="text-xs">{milliseconds}</span>
    </div>
  );
};

export default function LeaderboardTable({ data, isLoading, error, entryDetails, activeTab }: LeaderboardTableProps) {
  // Create a ref to store the highlighted row element
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);
  
  // Scroll to highlighted row when data loads
  useEffect(() => {
    if (!isLoading && entryDetails?.player && highlightedRowRef.current) {
      // Use a small timeout to ensure the DOM is fully updated
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [isLoading, entryDetails, data]);
  
  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-peach-500 rounded-full border-t-transparent mx-auto"></div>
        <p className="mt-4 text-text-secondary">Loading leaderboard data...</p>
      </div>
    );
  }
  
  if (error) {
    // Check if this is a database connection error and provide a more user-friendly message
    const isConnectionError = error.includes('Database connection unavailable') || 
                              error.includes('Unable to connect') ||
                              error.includes('connection issue');
    
    return (
      <div className="text-center p-8 border border-red-500/30 rounded-lg bg-red-500/10">
        {isConnectionError ? (
          <>
            <p className="text-amber-400 font-semibold mb-2">Leaderboard Temporarily Unavailable</p>
            <p className="text-text-secondary">The leaderboard service is currently offline. Your game data is still being saved locally.</p>
            <p className="mt-4 text-text-muted text-sm">You can continue playing without disruption.</p>
          </>
        ) : (
          <>
            <p className="text-red-400">Error loading leaderboard: {error}</p>
            <p className="mt-2 text-text-secondary">Please try again later</p>
          </>
        )}
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
        <Link href={`/game?difficulty=${activeTab || 'medium'}`} className="inline-block">
          <Button 
            variant="outline"
            className="bg-peach-500/10 text-peach-500 hover:text-peach-500 border-peach-500/30 hover:bg-peach-500/20 mt-2"
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
          {data.map((entry, index) => {
            // More precise matching with multiple criteria
            const isHighlighted = entryDetails?.player && (
              // Match all relevant criteria if available
              entry.player_name === entryDetails.player &&
              // Match times with a small tolerance to account for precision differences
              (entryDetails.memorizeTime === null || Math.abs(entry.memorize_time - entryDetails.memorizeTime) < 0.001) &&
              (entryDetails.solutionTime === null || Math.abs(entry.solution_time - entryDetails.solutionTime) < 0.001) &&
              // Match piece counts
              (entryDetails.pieceCount === null || entry.piece_count === entryDetails.pieceCount) &&
              (entryDetails.correctPieces === null || entry.correct_pieces === entryDetails.correctPieces)
            );
            
            return (
              <TableRow 
                key={entry.id} 
                className={`
                  ${index < 3 ? "bg-peach-500/5" : ""}
                  ${isHighlighted ? "bg-peach-500/20 animate-pulse" : ""}
                `}
                ref={isHighlighted ? highlightedRowRef : null}
              >
                <TableCell className="text-center font-bold">
                  {index === 0 && <span className="text-yellow-400">🏆</span>}
                  {index === 1 && <span className="text-gray-300">🥈</span>}
                  {index === 2 && <span className="text-amber-700">🥉</span>}
                  {index > 2 && index + 1}
                </TableCell>
                <TableCell className={`font-medium ${isHighlighted ? "text-peach-500" : ""}`}>
                  {entry.player_name}
                  {isHighlighted && <span className="ml-2 text-xs bg-peach-500/20 text-peach-500 px-2 py-0.5 rounded-full">You</span>}
                </TableCell>
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 