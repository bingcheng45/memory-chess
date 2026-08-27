"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { GameState } from "@/lib/types/game";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { playSound } from "@/lib/utils/soundEffects";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FirstGameFeedbackDialog from "@/components/game/FirstGameFeedbackDialog";
import ResultBoardComparison from "@/components/game/ResultBoardComparison";

// Extended GameState type with skillRatingChange
type GameStateWithRating = GameState & {
  skillRatingChange?: number;
  timeBonusEarned?: number;
  perfectScore?: boolean;
  extraPieces?: number;
  totalPiecesPlaced?: number;
};

interface GameResultProps {
  readonly onTryAgain: () => void;
  readonly onNewGame: () => void;
}

export default function GameResult({ onTryAgain, onNewGame }: GameResultProps) {
  const t = useTranslations("game.result");
  const { gameState } = useGameStore();

  // Leaderboard submission state
  const [showLeaderboardDialog, setShowLeaderboardDialog] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Use a ref instead of state to prevent double increments due to StrictMode
  const playsCountedRef = useRef(false);

  // Get the local copy of gameState with skill rating change info
  const extendedGameState = gameState as GameStateWithRating;

  // Update play count on component mount (runs once when game result is shown)
  useEffect(() => {
    // Skip if we've already counted this play
    if (playsCountedRef.current) return;

    // Set ref to true immediately to prevent duplicate calls
    playsCountedRef.current = true;

    // Increment the total plays counter in Supabase
    async function incrementPlaysCounter() {
      try {
        const response = await fetch("/api/game-stats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            metric: "total_plays",
            increment: 1,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to increment plays counter:", errorData.error);
          return;
        }

        const data = await response.json();
        console.log(
          `Total plays updated to: ${data?.data?.value || "unknown"}`,
        );
      } catch (err) {
        console.error("Error incrementing plays counter:", err);
      }
    }

    incrementPlaysCounter();
  }, []); // Empty dependency array since we're using a ref

  // Calculate pieces info for debugging and display
  const piecesInfo = {
    accuracy: gameState.accuracy || 0,
    totalPieces: gameState.pieceCount,
    totalPiecesPlaced: extendedGameState.totalPiecesPlaced || 0,
    correctPieces: extendedGameState.correctPlacements || 0,
    // Extra pieces are only counted if more pieces were placed than required
    extraPieces: extendedGameState.extraPieces || 0,
    // Total wrong is the sum of missed original pieces and any extra pieces
    get totalWrong() {
      // By default, wrong pieces is the inverse of correct pieces
      const basicWrongPieces = this.totalPieces - this.correctPieces;

      // Add any extra pieces that were placed but not in the original position
      return basicWrongPieces + this.extraPieces;
    },
  };

  // Helper function to determine difficulty level based on piece count
  const determineDifficulty = (
    pieceCount: number,
  ): "easy" | "medium" | "hard" | "grandmaster" | "custom" => {
    if (pieceCount === 2) {
      return "easy";
    } else if (pieceCount === 6) {
      return "medium";
    } else if (pieceCount === 12) {
      return "hard";
    } else if (pieceCount === 20) {
      return "grandmaster";
    } else {
      return "custom";
    }
  };

  // Play success sound on component mount
  useEffect(() => {
    // Only play success sound if accuracy is high enough
    if (gameState.accuracy && gameState.accuracy >= 70) {
      playSound("success");
    } else if (gameState.accuracy !== undefined) {
      playSound("failure");
    }
  }, [gameState.accuracy]);

  // Time formatting helper
  const formatTimeParts = (
    seconds: number,
  ): { minutes: string; seconds: string; milliseconds: string } => {
    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60)
      .toString()
      .padStart(2, "0");
    const remainingSeconds = (wholeSeconds % 60).toString().padStart(2, "0");
    const ms = Math.floor((seconds - wholeSeconds) * 1000)
      .toString()
      .padStart(3, "0");

    return {
      minutes,
      seconds: remainingSeconds,
      milliseconds: ms,
    };
  };

  // Consistent time display component
  const TimeDisplay = ({
    minutes,
    seconds,
    milliseconds,
  }: {
    minutes: string;
    seconds: string;
    milliseconds: string;
  }) => {
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

  // Get a message based on accuracy
  const getResultMessage = () => {
    const accuracy = gameState.accuracy || 0;

    if (accuracy === 100) return t("messages.perfect");
    if (accuracy >= 90) return t("messages.excellent");
    if (accuracy >= 80) return t("messages.great");
    if (accuracy >= 70) return t("messages.wellDone");
    if (accuracy >= 50) return t("messages.goodEffort");
    return t("messages.keepPracticing");
  };

  // Get color class based on accuracy
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return "text-green-500";
    if (accuracy >= 70) return "text-peach-500";
    if (accuracy >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  // Check if the score is eligible for the leaderboard
  const isEligibleForLeaderboard = () => {
    // Only standard difficulties are eligible (not custom games)
    const difficulty = determineDifficulty(gameState.pieceCount);
    return difficulty !== "custom";
  };

  // Prepare leaderboard entry data
  const prepareLeaderboardEntry = (playerName: string) => {
    // Determine difficulty based on piece count
    const difficulty = determineDifficulty(gameState.pieceCount);

    // Custom games shouldn't reach this point due to isEligibleForLeaderboard check,
    // but as a safeguard, use medium difficulty if somehow a custom game is submitted
    const submissionDifficulty =
      difficulty === "custom" ? "medium" : difficulty;

    // Use actual memorize time if available, otherwise fall back to configured time
    const memorizeTime = gameState.actualMemorizeTime || gameState.memorizeTime;

    // Include the total_wrong_pieces field now that it's added to the database
    return {
      player_name: playerName,
      difficulty: submissionDifficulty,
      piece_count: gameState.pieceCount,
      correct_pieces: extendedGameState.correctPlacements || 0,
      memorize_time: memorizeTime,
      solution_time: gameState.completionTime || 0,
      total_wrong_pieces: piecesInfo.totalWrong,
    };
  };

  // Handle score submission
  const submitToLeaderboard = async () => {
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const leaderboardEntry = prepareLeaderboardEntry(playerName.trim());

      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leaderboardEntry),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("dialog.submitFailed"));
      }

      setSubmitSuccess(true);
    } catch (err) {
      console.error("Error submitting to leaderboard:", err);
      setSubmitError(
        err instanceof Error ? err.message : t("dialog.submitFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const accuracy = gameState.accuracy || 0;
  const memorizationTime =
    gameState.actualMemorizeTime || gameState.memorizeTime;
  const memorizationTimeParts = formatTimeParts(memorizationTime);
  const solutionTimeParts = formatTimeParts(gameState.completionTime || 0);
  const recallSpeed =
    gameState.completionTime && gameState.completionTime > 0
      ? t("piecesPerSecond", {
          value: (
            (gameState.pieceCount * (accuracy / 100)) /
            memorizationTime
          ).toFixed(1),
        })
      : t("piecesPerSecond", { value: "0.0" });
  const leaderboardEligible = isEligibleForLeaderboard();

  return (
    <div className="w-full max-w-4xl space-y-6 pb-4">
      <section
        aria-labelledby="game-result-heading"
        className="w-full rounded-xl border border-bg-light bg-bg-card p-4 shadow-xl sm:p-6"
      >
        <h2
          id="game-result-heading"
          className={`text-center text-2xl font-bold sm:text-3xl ${getAccuracyColor(accuracy)}`}
        >
          {getResultMessage()}
        </h2>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-secondary">
              {t("accuracy")}
            </p>
            <p
              className={`text-4xl font-bold leading-none sm:text-5xl ${getAccuracyColor(accuracy)}`}
            >
              {accuracy}%
            </p>
          </div>
          <p className="text-right text-sm text-text-secondary">
            <span className="block font-semibold text-text-primary">
              {piecesInfo.correctPieces}
              {piecesInfo.extraPieces > 0 && (
                <sup className="ml-1 text-xs font-bold text-red-500">
                  -{piecesInfo.extraPieces}
                </sup>
              )}{" "}
              / {piecesInfo.totalPieces}
            </span>
            {t("piecesCorrectCaption")}
          </p>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-light">
          <div
            className={`h-full transition-all ${
              accuracy >= 90
                ? "bg-green-400"
                : accuracy >= 70
                  ? "bg-peach-400"
                  : accuracy >= 50
                    ? "bg-peach-500"
                    : "bg-peach-600"
            }`}
            style={{ width: `${accuracy}%` }}
          />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded-lg bg-bg-light/45 p-3">
            <dt className="text-xs text-text-secondary">{t("piecesCorrect")}</dt>
            <dd className="mt-1 font-semibold text-text-primary">
              {piecesInfo.correctPieces} / {piecesInfo.totalPieces}
            </dd>
          </div>
          <div className="rounded-lg bg-bg-light/45 p-3">
            <dt className="text-xs text-text-secondary">{t("memorizationTime")}</dt>
            <dd className="mt-1 font-semibold text-text-primary">
              <TimeDisplay {...memorizationTimeParts} />
            </dd>
          </div>
          <div className="rounded-lg bg-bg-light/45 p-3">
            <dt className="text-xs text-text-secondary">{t("solutionTime")}</dt>
            <dd className="mt-1 font-semibold text-text-primary">
              <TimeDisplay {...solutionTimeParts} />
            </dd>
          </div>
          <div className="rounded-lg bg-bg-light/45 p-3">
            <dt className="text-xs text-text-secondary">{t("recallSpeed")}</dt>
            <dd className="mt-1 text-sm font-semibold text-text-primary sm:text-base">
              {recallSpeed}
            </dd>
          </div>
        </dl>

        <nav
          aria-label={t("actions")}
          className="mt-5 grid grid-cols-2 gap-2 border-t border-bg-light pt-5 lg:grid-cols-4"
        >
          <Button
            onClick={onTryAgain}
            variant={accuracy === 100 ? "outline" : "secondary"}
            className={
              accuracy === 100
                ? "h-10 w-full border-peach-500/30 bg-peach-500/10 px-3 text-peach-500 hover:bg-peach-500/20 hover:text-peach-500"
                : "h-10 w-full border border-gray-600 px-3"
            }
          >
            {t("tryAgain")}
          </Button>

          <Button
            onClick={onNewGame}
            variant={accuracy === 100 ? "secondary" : "outline"}
            className={
              accuracy === 100
                ? "h-10 w-full border border-gray-600 px-3"
                : "h-10 w-full border-peach-500/30 bg-peach-500/10 px-3 text-peach-500 hover:bg-peach-500/20 hover:text-peach-500"
            }
          >
            {t("newGame")}
          </Button>

          {leaderboardEligible && (
            <Button
              onClick={() => setShowLeaderboardDialog(true)}
              variant="outline"
              className="h-10 w-full border-green-500/30 bg-green-500/10 px-3 text-green-500 hover:bg-green-500/20 hover:text-green-500"
            >
              {t("submitToLeaderboard")}
            </Button>
          )}

          <Link
            href="/leaderboard"
            className={leaderboardEligible ? "w-full" : "col-span-2 w-full"}
          >
            <Button
              variant="ghost"
              className="h-10 w-full border-0 px-3 text-peach-500 hover:bg-peach-500/20 hover:text-peach-500"
            >
              {t("viewLeaderboard")}
            </Button>
          </Link>
        </nav>
      </section>

      <ResultBoardComparison
        originalPosition={gameState.originalPosition}
        userPosition={gameState.userPosition}
      />

      <FirstGameFeedbackDialog
        game={{
          accuracy: gameState.accuracy || 0,
          correctPieces: piecesInfo.correctPieces,
          pieceCount: gameState.pieceCount,
          difficulty: determineDifficulty(gameState.pieceCount),
          memorizationTime:
            gameState.actualMemorizeTime || gameState.memorizeTime,
          solutionTime: gameState.completionTime || 0,
        }}
      />

      {/* Leaderboard Submission Dialog */}
      <Dialog
        open={showLeaderboardDialog}
        onOpenChange={setShowLeaderboardDialog}
      >
        <DialogContent className="bg-bg-card border border-bg-light text-text-primary">
          <DialogHeader>
            <DialogTitle className="text-text-primary">
              {submitSuccess ? t("dialog.successTitle") : t("dialog.submitTitle")}
            </DialogTitle>
            <DialogDescription className="text-text-secondary">
              {submitSuccess
                ? t("dialog.successDescription")
                : t("dialog.submitDescription")}
            </DialogDescription>
          </DialogHeader>

          {!submitSuccess ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="player-name" className="text-text-secondary">
                  {t("dialog.playerName")}
                </Label>
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder={t("dialog.playerNamePlaceholder")}
                  disabled={isSubmitting}
                  className="bg-bg-light border-bg-light text-text-primary focus:border-green-500/50 focus:ring-green-500/30"
                />
              </div>

              {submitError && (
                <div className="text-sm text-red-500">
                  {t("dialog.error", { message: submitError })}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowLeaderboardDialog(false)}
                  disabled={isSubmitting}
                  className="bg-bg-light text-text-secondary border-bg-light hover:bg-bg-light/80 hover:text-text-primary"
                >
                  {t("dialog.cancel")}
                </Button>
                <Button
                  onClick={submitToLeaderboard}
                  disabled={!playerName.trim() || isSubmitting}
                  className="bg-green-500 text-white hover:text-white hover:bg-green-600"
                >
                  {isSubmitting ? t("dialog.submitting") : t("dialog.submit")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-500/20 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <p className="text-text-primary">
                  {t("dialog.thanks", { name: playerName })}
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <Link
                  href={`/leaderboard?player=${encodeURIComponent(playerName)}&difficulty=${(() => {
                    const difficulty = determineDifficulty(
                      gameState.pieceCount,
                    );
                    return encodeURIComponent(
                      difficulty === "custom" ? "medium" : difficulty,
                    );
                  })()}&memorizeTime=${gameState.actualMemorizeTime || gameState.memorizeTime}&solutionTime=${gameState.completionTime || 0}&pieceCount=${gameState.pieceCount}&correctPieces=${Math.round(((gameState.accuracy || 0) * gameState.pieceCount) / 100)}&totalWrongPieces=${piecesInfo.totalWrong}`}
                >
                  <Button className="bg-green-500 text-white hover:text-white hover:bg-green-600">
                    {t("viewLeaderboard")}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
