"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { accuracyBandKey } from "@/lib/reference/facts";
import { GameState } from "@/lib/types/game";
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { playSound } from "@/lib/utils/soundEffects";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CountryPicker from "@/components/leaderboard/CountryPicker";
import { loadLeaderboardCutoffs, readCachedCutoffs } from "@/lib/leaderboard/cutoffsClient";
import type { RoundSource } from "@/lib/analytics/events";
import { postLeaderboardEntry } from "@/lib/leaderboard/postEntry";
import { hasLabCopy } from "@/lib/home/labLocales";
import { browserIndexedDB } from "@/lib/lab/support";
import {
  qualifies,
  type LeaderboardCutoffs,
  type RankingScore,
} from "@/lib/leaderboard/ranking";
import type { LeaderboardDifficulty } from "@/types/leaderboard";
import { useSettingsStore } from "@/stores/settingsStore";
import FirstGameFeedbackDialog from "@/components/game/FirstGameFeedbackDialog";
import { RoundBoard } from "@/components/round/RoundBoard";
import { ReadoutCard } from "@/components/round/ReadoutCard";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import type { BoardAction } from "@/lib/round/round";
import ArticleTile from "@/components/game/ArticleTile";
import { countWrong } from "@/lib/game/scoring";
import ResultLabSlot, { ResultLabEnd } from "@/components/game/ResultLabSlot";
import { warmedResultDeltas } from "@/components/game/resultDeltasWarm";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ShareResult from "@/components/game/ShareResult";
import { roundShareOf } from "@/components/game/roundShare";
import { START_RATING } from "@/lib/game/rating";

// Loaded only once a round has a result, so /game pays nothing for the lab record before then. The result screen
// never renders on the server, so React.lazy is enough, and it costs /game none of next/dynamic's loader code.
const ResultLabCard = lazy(() => import("@/components/game/ResultLabCard"));

// The scored board only shows the round: it takes no input.
const ignoreBoard: (action: BoardAction) => void = () => {};

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
  readonly onPlay: (pieceCount: number, memorizeTime: number, source: RoundSource) => void;
}

function qualifiesForLeaderboard(
  difficulty: LeaderboardDifficulty | "custom",
  score: RankingScore,
  cutoffs: LeaderboardCutoffs | null,
): boolean {
  if (cutoffs === null || difficulty === "custom") {
    return false;
  }
  return qualifies(score, cutoffs[difficulty]);
}

export default function GameResult({ onTryAgain, onNewGame, onPlay }: GameResultProps) {
  const t = useTranslations("game.result");
  // Without IndexedDB nothing can be recorded, so no space is held for a card that could only leave again.
  const keepsRecord = browserIndexedDB() !== undefined;
  const showsLab = hasLabCopy(useLocale()) && keepsRecord;
  const tCountry = useTranslations("country");
  const tComparison = useTranslations("game.comparison");
  const tDaily = useTranslations("daily.round");
  const { gameState, round } = useGameStore();
  const { labRound } = gameState;
  const { countryCode, setCountryCode, showCoordinates } = useSettingsStore();

  // Leaderboard submission state
  const [showLeaderboardDialog, setShowLeaderboardDialog] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // The round warmed the cache, so the qualifying banner is usually known before the first paint. Waiting for the
  // effect below would insert it a frame later and push down everything under it.
  const [cutoffs, setCutoffs] = useState<LeaderboardCutoffs | null>(readCachedCutoffs);
  // Likewise the dashboard figures: their code and the record were loaded during the round, or they are not shown.
  const [deltas] = useState(warmedResultDeltas);

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

  useEffect(() => {
    let active = true;

    loadLeaderboardCutoffs()
      .catch(() => null)
      .then((loaded) => {
        if (active) {
          setCutoffs(loaded);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Calculate pieces info for debugging and display
  const piecesInfo = {
    accuracy: gameState.accuracy || 0,
    totalPieces: gameState.pieceCount,
    totalPiecesPlaced: extendedGameState.totalPiecesPlaced || 0,
    correctPieces: extendedGameState.correctPlacements || 0,
    // Extra pieces are only counted if more pieces were placed than required
    extraPieces: extendedGameState.extraPieces || 0,
    get totalWrong() {
      return countWrong({ total: this.totalPieces, correct: this.correctPieces, extra: this.extraPieces });
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

  const getResultMessage = () =>
    t(`messages.${accuracyBandKey(gameState.accuracy || 0)}`);

  // Check if the score is eligible for the leaderboard
  const isEligibleForLeaderboard = () => {
    // Only standard difficulties are eligible (not custom games). The board
    // hides rows with no correct piece, so such a round is not submittable.
    // A set board is not ranked: the daily board is the same position for every player, and a review is one the player has seen.
    const difficulty = determineDifficulty(gameState.pieceCount);
    return difficulty !== "custom" && (extendedGameState.correctPlacements ?? 0) > 0 && gameState.board === undefined;
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
      country_code: countryCode,
      difficulty: submissionDifficulty,
      piece_count: gameState.pieceCount,
      correct_pieces: extendedGameState.correctPlacements || 0,
      memorize_time: memorizeTime,
      solution_time: gameState.completionTime || 0,
      total_wrong_pieces: piecesInfo.totalWrong,
      skill_rating: gameState.skillRating || START_RATING,
    };
  };

  // Handle score submission
  const submitToLeaderboard = async () => {
    if (!playerName.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const posted = await postLeaderboardEntry(prepareLeaderboardEntry(playerName.trim()));
      if (!posted.ok) throw new Error(posted.message ?? t("dialog.submitFailed"));
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
  const showLeaderboardQualifier =
    leaderboardEligible &&
    !submitSuccess &&
    qualifiesForLeaderboard(
      determineDifficulty(gameState.pieceCount),
      {
        correctPieces: extendedGameState.correctPlacements || 0,
        totalWrongPieces: piecesInfo.totalWrong,
        memorizeTime: gameState.actualMemorizeTime || gameState.memorizeTime,
        solutionTime: gameState.completionTime || 0,
      },
      cutoffs,
    );
  // A perfect round makes trying again the next step; otherwise a new setting is.
  const tryAgainFirst = accuracy === 100;

  return (
    <div className="lab-result w-full space-y-6 pb-4">
      <section aria-labelledby="game-result-heading" className="lab-card lab-result-card">
        <h2 id="game-result-heading" className="lab-result-h">
          {getResultMessage()}
        </h2>
        <p className="lab-result-sub">
          <span className="lab-mono">
            {piecesInfo.correctPieces} / {piecesInfo.totalPieces}
          </span>{" "}
          {t("piecesCorrectCaption")}
          <span aria-hidden="true"> · </span>
          <span>{t("recallSpeed")}</span> <span className="lab-mono">{recallSpeed}</span>
        </p>

        {showLeaderboardQualifier && (
          <p role="status" className="lab-result-qualifies">
            {t("leaderboardQualifies")}
          </p>
        )}

        {round.phase === "scored" && (
          <div className="lab-result-grid">
            <figure data-result-board="scored" className="lab-plate lab-plate-grid lab-result-board">
              <figcaption className="lab-k">{tComparison("title")}</figcaption>
              <RoundBoard state={round} dispatch={ignoreBoard} copy="game.round" coordinates={showCoordinates} />
            </figure>
            <ReadoutCard state={round} copy="game.round" expected={round.config} />
          </div>
        )}

        <nav aria-label={t("actions")} className="lab-result-actions">
          <button type="button" onClick={onTryAgain} className={`lab-btn ${tryAgainFirst ? "lab-btn-primary" : "lab-btn-secondary"}`}>
            {t("tryAgain")}
          </button>
          <button type="button" onClick={onNewGame} className={`lab-btn ${tryAgainFirst ? "lab-btn-secondary" : "lab-btn-primary"}`}>
            {t("newGame")}
          </button>
          {gameState.board?.kind === "daily" && keepsRecord && (
            <Link href="/daily" className="lab-btn lab-btn-secondary lab-result-submit">
              {tDaily("join")}
            </Link>
          )}
          {leaderboardEligible && (
            <button type="button" onClick={() => setShowLeaderboardDialog(true)} className="lab-btn lab-btn-secondary lab-result-submit">
              {t("submitToLeaderboard")}
            </button>
          )}
          {round.phase === "scored" && (
            <ShareResult
              key={labRound?.facts.id}
              share={roundShareOf(round, {
                rating: gameState.skillRating || START_RATING,
                change: extendedGameState.skillRatingChange ?? 0,
                winStreak: gameState.streak ?? 0,
              })}
            />
          )}
          <Link href="/leaderboard" className="lab-result-link">
            {t("viewLeaderboard")}
          </Link>
        </nav>
      </section>

      <div className="lab-ui-face space-y-6">
        {showsLab && labRound && (
          <ErrorBoundary key={labRound.facts.id} fallback={<ResultLabEnd />}>
            <Suspense fallback={<ResultLabSlot />}>
              <ResultLabCard roundId={labRound.facts.id} onPlay={onPlay} />
            </Suspense>
          </ErrorBoundary>
        )}

        {deltas && labRound && (
          <ErrorBoundary key={labRound.facts.id} fallback={<></>}>
            <deltas.Deltas before={deltas.before} labRound={labRound} />
          </ErrorBoundary>
        )}

        <ArticleTile
          round={{
            pieceCount: gameState.pieceCount,
            memorizeTime: gameState.memorizeTime,
          }}
        />
      </div>

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
        <DialogContent className={`${LAB_PAPER_CLASS} lab-dialog`}>
          <DialogHeader>
            <DialogTitle className="lab-dialog-title">
              {submitSuccess ? t("dialog.successTitle") : t("dialog.submitTitle")}
            </DialogTitle>
            <DialogDescription className="lab-dialog-text">
              {submitSuccess
                ? t("dialog.successDescription")
                : t("dialog.submitDescription")}
            </DialogDescription>
          </DialogHeader>

          {!submitSuccess ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="player-name" className="lab-dialog-label">
                  {t("dialog.playerName")}
                </Label>
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder={t("dialog.playerNamePlaceholder")}
                  disabled={isSubmitting}
                  className="lab-dialog-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player-country" className="lab-dialog-label">
                  {tCountry("label")}
                </Label>
                <CountryPicker
                  id="player-country"
                  value={countryCode}
                  onChange={setCountryCode}
                  disabled={isSubmitting}
                />
              </div>

              {submitError && (
                <p role="alert" className="lab-dialog-error">
                  {t("dialog.error", { message: submitError })}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaderboardDialog(false)}
                  disabled={isSubmitting}
                  className="lab-btn lab-btn-secondary"
                >
                  {t("dialog.cancel")}
                </button>
                <button
                  type="button"
                  onClick={submitToLeaderboard}
                  disabled={!playerName.trim() || isSubmitting}
                  className="lab-btn lab-btn-primary"
                >
                  {isSubmitting ? t("dialog.submitting") : t("dialog.submit")}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="lab-dialog-done">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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
                <p className="lab-dialog-text">
                  {t("dialog.thanks", { name: playerName })}
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <Link
                  className="lab-btn lab-btn-primary"
                  href={`/leaderboard?player=${encodeURIComponent(playerName.trim())}&difficulty=${(() => {
                    const difficulty = determineDifficulty(
                      gameState.pieceCount,
                    );
                    return encodeURIComponent(
                      difficulty === "custom" ? "medium" : difficulty,
                    );
                  })()}&memorizeTime=${gameState.actualMemorizeTime || gameState.memorizeTime}&solutionTime=${gameState.completionTime || 0}&pieceCount=${gameState.pieceCount}&correctPieces=${Math.round(((gameState.accuracy || 0) * gameState.pieceCount) / 100)}&totalWrongPieces=${piecesInfo.totalWrong}`}
                >
                  {t("viewLeaderboard")}
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
