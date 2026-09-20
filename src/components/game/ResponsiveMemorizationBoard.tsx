"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { ChessPiece } from "@/types/chess";
import ResponsiveChessBoard from "./ResponsiveChessBoard";
import { fenToChessPieces } from "@/utils/chessPieces";
import { Button } from "@/components/ui/button";
import { playSound, stopTimerSound } from "@/lib/utils/soundEffects";
import {
  deadlineFrom,
  elapsedMs,
  fireAtDeadline,
  now,
  remainingMs,
  subscribe,
  type Monotonic,
} from "@/lib/game/clock";
import ActiveGameLayout from "./ActiveGameLayout";

import { useTranslations } from "next-intl";

const URGENT_SECONDS = 3;
const WARNING_SECONDS = 5;
const ALL_URGENCY_CLASSES = ["text-peach-500", "text-orange-500", "text-red-500", "animate-pulse"];

function urgencyClasses(seconds: number): string[] {
  if (seconds <= URGENT_SECONDS) return ["text-red-500", "animate-pulse"];
  if (seconds <= WARNING_SECONDS) return ["text-orange-500"];
  return ["text-peach-500"];
}

export default function ResponsiveMemorizationBoard() {
  const t = useTranslations("game");
  const { chess, gameState, endMemorizationPhase, startSolutionPhase } =
    useGameStore();
  const showCoordinates = useSettingsStore((state) => state.showCoordinates);
  const [pieces, setPieces] = useState<ChessPiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clockRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<HTMLSpanElement>(null);
  const hundredthsRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<Monotonic | null>(null);
  const endedRef = useRef(false);

  const { isMemorizationPhase, memorizeTime, pieceCount } = gameState;

  const endPhase = useCallback(
    (memorizedSeconds: number | undefined) => {
      if (endedRef.current) return;
      endedRef.current = true;
      endMemorizationPhase(memorizedSeconds);
      startSolutionPhase();
    },
    [endMemorizationPhase, startSolutionPhase],
  );

  const handleSkip = () => {
    if (endedRef.current) return;
    const startedAt = startedAtRef.current;
    playSound("timerEnd");
    endPhase(startedAt === null ? undefined : elapsedMs(startedAt, now()) / 1000);
  };

  useEffect(() => {
    if (!chess) return;

    try {
      setIsLoading(true);
      setPieces(fenToChessPieces(chess.fen()));
      setIsLoading(false);
    } catch (error) {
      console.error("Error parsing FEN:", error);
      setIsLoading(false);
    }
  }, [chess]);

  useEffect(() => {
    if (!isMemorizationPhase) return;

    const durationMs = memorizeTime * 1000;
    const startedAt = now();
    const deadline = deadlineFrom(startedAt, durationMs);
    startedAtRef.current = startedAt;
    endedRef.current = false;

    const atDeadline = fireAtDeadline(deadline, () => {
      stopTimerSound();
      playSound("timerEnd");
      // A hidden tab gets no frames, so the wake-up frame can be minutes past
      // the deadline. The player only ever saw the configured duration, and
      // this figure feeds the time bonus and the leaderboard.
      endPhase(Math.min(elapsedMs(startedAt, now()), durationMs) / 1000);
    });

    let paintedSeconds = -1;

    return subscribe((at) => {
      const remaining = remainingMs(deadline, at);
      const seconds = Math.floor(remaining / 1000);

      if (secondsRef.current && seconds !== paintedSeconds) {
        secondsRef.current.textContent = String(seconds);
        clockRef.current?.classList.remove(...ALL_URGENCY_CLASSES);
        clockRef.current?.classList.add(...urgencyClasses(seconds));
        paintedSeconds = seconds;
      }
      if (hundredthsRef.current) {
        hundredthsRef.current.textContent = `.${Math.floor((remaining % 1000) / 10)
          .toString()
          .padStart(2, "0")}`;
      }
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${(durationMs - remaining) / durationMs})`;
      }

      atDeadline(at);
    });
  }, [isMemorizationPhase, memorizeTime, endPhase]);

  return (
    <ActiveGameLayout
      status={
        <div className="relative flex h-full items-center justify-center px-2 sm:px-3">
          <div className="w-[calc(100%-88px)] max-w-64 text-center">
            <div className="mb-0.5 text-sm font-bold text-text-primary sm:text-base">{t("memorize.title")}</div>

            <div
              ref={clockRef}
              className={`text-3xl font-bold leading-none transition-colors sm:text-4xl ${urgencyClasses(memorizeTime).join(" ")}`}
            >
              <span ref={secondsRef}>{memorizeTime}</span>
              <span ref={hundredthsRef} className="text-lg opacity-50 sm:text-xl">
                .00
              </span>
            </div>

            <div className="mx-auto mt-1 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-bg-light">
              <div
                ref={barRef}
                className="h-full w-full origin-left bg-peach-500 will-change-transform"
                style={{ transform: "scaleX(0)" }}
              ></div>
            </div>

            <div className="mt-1 truncate text-xs text-text-secondary">
              {t("memorize.rememberPieces", { count: pieceCount })}
            </div>
          </div>

          <Button
            onClick={handleSkip}
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 h-9 -translate-y-1/2 border-peach-500/30 bg-peach-500/10 px-2 text-xs text-peach-500 hover:bg-peach-500/20 hover:text-peach-500 sm:right-3 sm:text-sm"
          >{t("memorize.skip")}</Button>
        </div>
      }
      board={
        <ResponsiveChessBoard
          pieces={pieces}
          isLoading={isLoading}
          isInteractive={false}
          showCoordinates={showCoordinates}
        />
      }
      controls={
        <p className="text-center text-xs text-text-secondary">{t("memorize.hint")}</p>
      }
    />
  );
}
