'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaderboardEntry } from '@/types/leaderboard';
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useEffect, useRef } from "react";

import { useFormatter, useTranslations } from "next-intl";

export interface EntryDetails {
  player: string | null;
  difficulty: string | null;
  memorizeTime: number | null;
  solutionTime: number | null;
  pieceCount: number | null;
  correctPieces: number | null;
  totalWrongPieces: number | null;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  error: string | null;
  entryDetails?: EntryDetails;
  activeTab?: string;
}

export function TimeDisplay({ seconds }: { seconds: number }) {
  const totalMs = Math.round(seconds * 1000);
  const minutes = String(Math.floor(totalMs / 60000)).padStart(2, "0");
  const wholeSeconds = String(Math.floor(totalMs / 1000) % 60).padStart(2, "0");
  const milliseconds = String(totalMs % 1000).padStart(3, "0");

  return (
    <div className="inline-flex items-baseline font-mono">
      <span>{minutes}</span>
      <span>:</span>
      <span>{wholeSeconds}</span>
      <span>:</span>
      <span className="text-xs">{milliseconds}</span>
    </div>
  );
}

export default function LeaderboardTable({ data, error, entryDetails, activeTab }: LeaderboardTableProps) {
  const t = useTranslations("leaderboard");
  const format = useFormatter();
  // Create a ref to store the highlighted row element
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  // Scroll to highlighted row when data loads
  useEffect(() => {
    if (entryDetails?.player && highlightedRowRef.current) {
      // Use a small timeout to ensure the DOM is fully updated
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [entryDetails, data]);

  if (error) {
    // Check if this is a database connection error and provide a more user-friendly message
    const isConnectionError = error.includes('Database connection unavailable') || 
                              error.includes('Unable to connect') ||
                              error.includes('connection issue');
    
    return (
      <div className="text-center p-8 border border-red-500/30 rounded-lg bg-red-500/10">
        {isConnectionError ? (
          <>
            <p className="text-amber-400 font-semibold mb-2">{t("unavailableTitle")}</p>
            <p className="text-text-secondary">{t("unavailableBody")}</p>
            <p className="mt-4 text-text-muted text-sm">{t("unavailableNote")}</p>
          </>
        ) : (
          <>
            <p className="text-red-400">{t("errorLoading", { error })}</p>
            <p className="mt-2 text-text-secondary">{t("retryLater")}</p>
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
        <h3 className="text-xl font-bold text-peach-400 mb-2">{t("emptyTitle")}</h3>
        <p className="text-lg text-text-secondary mb-2">{t("emptyBody")}</p>
        <p className="text-text-muted mb-4">{t("emptyCta")}</p>
        <Link href={`/game?difficulty=${activeTab || 'medium'}`} className="inline-block">
          <Button 
            variant="outline"
            className="bg-peach-500/10 text-peach-500 hover:text-peach-500 border-peach-500/30 hover:bg-peach-500/20 mt-2"
          >{t("startPlaying")}</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-bg-light overflow-hidden">
      <Table>
        <TableHeader className="bg-bg-card">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16 text-center">{t("columns.rank")}</TableHead>
            <TableHead>{t("columns.player")}</TableHead>
            <TableHead className="text-center">{t("columns.pieces")}</TableHead>
            <TableHead className="text-center">{t("columns.memorizeTime")}</TableHead>
            <TableHead className="text-center">{t("columns.solutionTime")}</TableHead>
            <TableHead className="text-right">{t("columns.date")}</TableHead>
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
              (entryDetails.correctPieces === null || entry.correct_pieces === entryDetails.correctPieces) &&
              // Match total wrong pieces if available
              (entryDetails.totalWrongPieces === null || 
               entry.total_wrong_pieces === undefined || 
               entry.total_wrong_pieces === entryDetails.totalWrongPieces)
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
                  {isHighlighted && <span className="ml-2 text-xs bg-peach-500/20 text-peach-500 px-2 py-0.5 rounded-full">{t("you")}</span>}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">
                    {entry.correct_pieces}
                    {entry.total_wrong_pieces !== undefined && 
                     entry.total_wrong_pieces > (entry.piece_count - entry.correct_pieces) ? (
                      <sup className="text-xs ml-1 text-red-500 font-bold">
                        -{entry.total_wrong_pieces - (entry.piece_count - entry.correct_pieces)}
                      </sup>
                    ) : (
                      " "
                    )}/ {entry.piece_count}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <TimeDisplay seconds={entry.memorize_time} />
                </TableCell>
                <TableCell className="text-center">
                  <TimeDisplay seconds={entry.solution_time} />
                </TableCell>
                <TableCell className="text-right text-text-muted">
                  {format.dateTime(new Date(entry.created_at), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 