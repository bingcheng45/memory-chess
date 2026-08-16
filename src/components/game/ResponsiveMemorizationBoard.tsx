"use client";

import { useState, useEffect, useMemo } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { ChessPiece } from "@/types/chess";
import ResponsiveChessBoard from "./ResponsiveChessBoard";
import { fenToChessPieces } from "@/utils/chessPieces";
import { Button } from "@/components/ui/button";
import { playSound } from "@/lib/utils/soundEffects";
import type { BoardDimensions } from "@/hooks/useResponsiveBoard";
import ActiveGameLayout from "./ActiveGameLayout";

interface ResponsiveMemorizationBoardProps {
  readonly dimensions: BoardDimensions;
}
export default function ResponsiveMemorizationBoard({
  dimensions,
}: ResponsiveMemorizationBoardProps) {
  const { chess, gameState, endMemorizationPhase, startSolutionPhase } =
    useGameStore();
  const [pieces, setPieces] = useState<ChessPiece[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(
    gameState.memorizeTime * 1000,
  ); // Store time in milliseconds
  const [isLoading, setIsLoading] = useState(true);

  // Handle skipping memorization phase
  const handleSkip = () => {
    console.log("Skipping memorization phase");
    playSound("timerEnd");
    endMemorizationPhase();
    startSolutionPhase();
  };

  // Convert chess.js position to ChessPiece array
  useEffect(() => {
    if (!chess) return;

    try {
      setIsLoading(true);
      console.log("Parsing chess position for memorization:", chess.fen());

      setPieces(fenToChessPieces(chess.fen()));
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing FEN:", error);
      setIsLoading(false);
    }
  }, [chess]);

  // Countdown timer with milliseconds for smoother animation
  useEffect(() => {
    if (!gameState.isMemorizationPhase) return;

    // Ensure we start with the exact memorization time
    console.log(
      "Starting memorization countdown from",
      gameState.memorizeTime,
      "seconds",
    );

    // Set initial time (convert seconds to milliseconds)
    setTimeRemaining(gameState.memorizeTime * 1000);

    // Get the start time to calculate elapsed time
    const startTime = Date.now();
    const endTime = startTime + gameState.memorizeTime * 1000;

    // Update time every 33ms (approximately 30fps) for smooth animation
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);

      setTimeRemaining(remaining);

      // Stop the timer when we reach 0
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 33);

    // Clean up timer when component unmounts or phase changes
    return () => {
      clearInterval(timer);
    };
  }, [gameState.isMemorizationPhase, gameState.memorizeTime]);

  // Calculate seconds and milliseconds for display
  const seconds = Math.floor(timeRemaining / 1000);
  const milliseconds = Math.floor((timeRemaining % 1000) / 10);

  // Calculate progress percentage for the timer
  const timerProgress = useMemo(() => {
    const totalTime = gameState.memorizeTime * 1000; // Total time in milliseconds
    const elapsedTime = totalTime - timeRemaining;
    return Math.max(0, Math.min(100, (elapsedTime / totalTime) * 100));
  }, [timeRemaining, gameState.memorizeTime]);

  // Get urgency class based on time left
  const getUrgencyClass = () => {
    if (seconds <= 3) return "text-red-500 animate-pulse";
    if (seconds <= 5) return "text-orange-500";
    return "text-peach-500";
  };

  return (
    <ActiveGameLayout
      dimensions={dimensions}
      status={
        <div className="relative flex h-full items-center justify-center px-2 sm:px-3">
          <div className="w-[calc(100%-88px)] max-w-64 text-center">
            <div className="mb-0.5 text-sm font-bold text-text-primary sm:text-base">
              Memorize the Position
            </div>

            <div
              className={`text-3xl font-bold leading-none transition-colors sm:text-4xl ${getUrgencyClass()}`}
            >
              <span>{seconds}</span>
              <span className="text-lg opacity-50 sm:text-xl">
                .{milliseconds.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="mx-auto mt-1 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-bg-light">
              <div
                className="h-full bg-peach-500 transition-all"
                style={{ width: `${timerProgress}%` }}
              ></div>
            </div>

            <div className="mt-1 truncate text-xs text-text-secondary">
              Remember all {gameState.pieceCount} pieces
            </div>
          </div>

          <Button
            onClick={handleSkip}
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 h-9 -translate-y-1/2 border-peach-500/30 bg-peach-500/10 px-2 text-xs text-peach-500 hover:bg-peach-500/20 hover:text-peach-500 sm:right-3 sm:text-sm"
          >
            Skip
          </Button>
        </div>
      }
      board={
        <ResponsiveChessBoard
          pieces={pieces}
          isLoading={isLoading}
          isInteractive={false}
          showCoordinates={true}
          dimensions={dimensions}
        />
      }
      controls={
        <p className="text-center text-xs text-text-secondary">
          The board will clear when the timer ends
        </p>
      }
    />
  );
}
