"use client";

import { useGameStore } from "@/lib/store/gameStore";
import { accuracyBandKey } from "@/lib/reference/facts";
import { GameState } from "@/lib/types/game";
import { lazy, Suspense, useDeferredValue, useState, useEffect, useRef, useId, type MouseEvent } from "react";
import { playSound } from "@/lib/utils/soundEffects";
import { Link } from "@/i18n/navigation";
import { useFormatter, useTranslations } from "next-intl";
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
import { trackEvent, type RoundSource } from "@/lib/analytics/events";
import { studyFloorSeconds } from "@/lib/leaderboard/studyFloor";
import { postLeaderboardEntry } from "@/lib/leaderboard/postEntry";
import { browserIndexedDB } from "@/lib/lab/support";
import {
  compareRanking,
  pushesOffLast,
  type LeaderboardCutoffs,
  type RankingScore,
} from "@/lib/leaderboard/ranking";
import type { LeaderboardDifficulty } from "@/types/leaderboard";
import { useSettingsStore } from "@/stores/settingsStore";
import FirstGameFeedbackDialog from "@/components/game/FirstGameFeedbackDialog";
import { feedbackDue, isSessionFirstResult } from "@/components/game/feedbackSchedule";
import { localDayOf } from "@/lib/lab/record";
import type { LabRound } from "@/lib/lab/recordRound";
import { nextBoardOf, type BoardSize } from "@/lib/game/nextBoard";
import type { RecordBefore } from "@/components/game/ResultDeltas";
import ResultBoards from "@/components/game/ResultBoards";
import { ResultReadout } from "./ResultReadout";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { BLINDFOLD_MODE } from "@/lib/game/roundLink";
import { blindfoldBoardOpen } from "@/lib/leaderboard/mode";
import ArticleTile from "@/components/game/ArticleTile";
import TomorrowBoardCard from "@/components/game/TomorrowBoardCard";
import { countWrong } from "@/lib/game/scoring";
import ResultLabSlot, { ResultLabEnd } from "@/components/game/ResultLabSlot";
import { recordReadDuringRound, warmedResultDeltas } from "@/components/game/resultDeltasWarm";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { CommunityInvite } from "@/components/community/CommunityLink";
import { isReturningPlayer } from "@/lib/community";
import ShareResult from "@/components/game/ShareResult";
import { SubmittedStanding } from "@/components/game/SubmittedStanding";
import { Check } from "lucide-react";
import { roundShareOf } from "@/components/game/roundShare";
import { START_RATING } from "@/lib/game/rating";
import type { RoundOutcome } from "@/lib/game/roundOutcome";

// Loaded only once a round has a result, so /game pays nothing for the lab record before then. The result screen
// never renders on the server, so React.lazy is enough, and it costs /game none of next/dynamic's loader code.
const ResultLabCard = lazy(() => import("@/components/game/ResultLabCard"));

// Extended GameState type with skillRatingChange
type GameStateWithRating = GameState & {
  skillRatingChange?: number;
  timeBonusEarned?: number;
  perfectScore?: boolean;
  extraPieces?: number;
  totalPiecesPlaced?: number;
};

/** The line under the score that says why the rating moved as it did, or null when the change says it all. */
function ratingNoteOf(outcome: RoundOutcome | undefined, t: ReturnType<typeof useTranslations<"game.result">>): string | null {
  switch (outcome?.phase) {
    case "provisional":
      return t("provisional");
    case "freeSkip":
      return t("freeSkip");
    default:
      return null;
  }
}

const resultOf = (labRound: LabRound) => ({ day: localDayOf(new Date(labRound.endedAt)), sessionFirst: isSessionFirstResult(labRound.facts.id) });

const summaryBefore = ({ records, summary }: RecordBefore, labRound: LabRound) =>
  records.some(({ id }) => id === labRound.facts.id) ? { ...summary, rounds: summary.rounds - 1 } : summary;

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
  // A board with room takes every score, so any score makes it.
  const cutoff = cutoffs[difficulty];
  return cutoff.kind === "open" || pushesOffLast(score, cutoff);
}

export default function GameResult({ onTryAgain, onNewGame, onPlay }: GameResultProps) {
  const t = useTranslations("game.result");
  // Without IndexedDB nothing can be recorded, so no space is held for a card that could only leave again.
  const keepsRecord = browserIndexedDB() !== undefined;
  const showsLab = keepsRecord;
  const tCommunity = useTranslations("common.community");
  const tCountry = useTranslations("country");
  const tDaily = useTranslations("daily.round");
  const tConfig = useTranslations("game.config");
  const tPresets = useTranslations("game.presets");
  const format = useFormatter();
  const { gameState, round, history, resultView, setResultView } = useGameStore();
  const { labRound } = gameState;
  const blindfold = round.phase === "scored" && round.config.blindfold === true;
  const scored = round.phase === "scored" ? round : null;
  const { countryCode, setCountryCode, playerName: savedName, setPlayerName: saveName } = useSettingsStore();

  // Leaderboard submission state
  const [showLeaderboardDialog, setShowLeaderboardDialog] = useState(false);
  const [playerName, setPlayerName] = useState(savedName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [personalBest, setPersonalBest] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const claimTextId = useId();
  const leaderboardLinkRef = useRef<HTMLAnchorElement>(null);
  // The round warmed the cache, so the qualifying banner is usually known before the first paint. Waiting for the
  // effect below would insert it a frame later and push down everything under it.
  const [cutoffs, setCutoffs] = useState<LeaderboardCutoffs | null>(readCachedCutoffs);
  // Likewise the dashboard figures: their code and the record were loaded during the round, or they are not shown.
  const [deltas] = useState(warmedResultDeltas);
  // False in the first commit, so the tap that ends a round paints its score at once. What sits below the score, which
  // asks for most of the work, follows in a deferred render that yields to the next tap.
  const painted = useDeferredValue(true, false);
  const [asksFeedback, setAsksFeedback] = useState(() => deltas !== null && labRound !== undefined && feedbackDue(summaryBefore(deltas.before, labRound), resultOf(labRound)));

  useEffect(() => {
    if (deltas || !labRound) return;
    let live = true;
    void recordReadDuringRound().then((before) => {
      if (live && feedbackDue(before && summaryBefore(before, labRound), resultOf(labRound))) setAsksFeedback(true);
    });
    return () => {
      live = false;
    };
  }, [deltas, labRound]);

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
    // A blindfold round ranks only on the blindfold boards, which take scores once they are open.
    // A study shorter than the floor is refused by the server, so such a round is never offered a spot.
    const difficulty = determineDifficulty(gameState.pieceCount);
    return difficulty !== "custom" && (extendedGameState.correctPlacements ?? 0) > 0 && gameState.board === undefined && (!blindfold || blindfoldBoardOpen())
      && (gameState.actualMemorizeTime || gameState.memorizeTime) >= studyFloorSeconds(gameState.pieceCount);
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
      skill_rating: gameState.skillRating ?? START_RATING,
      ...(blindfold ? ({ mode: BLINDFOLD_MODE } as const) : {}),
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
      saveName(playerName);
      setSubmittedId(posted.entry?.id ?? null);
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
  // The cutoffs are the board-study boards', so a blindfold round never claims it makes the board; it can still submit.
  const roundScore: RankingScore = {
    correctPieces: extendedGameState.correctPlacements || 0,
    totalWrongPieces: piecesInfo.totalWrong,
    memorizeTime: gameState.actualMemorizeTime || gameState.memorizeTime,
    solutionTime: gameState.completionTime || 0,
  };
  const roundDifficulty = determineDifficulty(gameState.pieceCount);
  const ranks = leaderboardEligible && !blindfold && qualifiesForLeaderboard(roundDifficulty, roundScore, cutoffs);
  // Beats the best score this device sent to the same board. Read once per result: the stored entries load lazily, as
  // they do on submit, so a result with nothing to submit pays nothing for them.
  useEffect(() => {
    if (!leaderboardEligible || roundDifficulty === "custom") return;
    let live = true;
    void import("@/lib/lab/entries")
      .then(({ ENTRIES_KEY, entryKey, parseEntries }) => {
        const kept = parseEntries(window.localStorage.getItem(ENTRIES_KEY))?.[entryKey({ difficulty: roundDifficulty, ...(blindfold && { mode: BLINDFOLD_MODE }) })];
        if (live && kept && compareRanking(roundScore, kept.score) < 0) setPersonalBest(true);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the round's score is fixed for the life of this result
  }, [labRound?.facts.id]);
  const ratingNote = ratingNoteOf(gameState.rating, t);
  const isPlayerSizedBoard = gameState.board === undefined;
  const next = isPlayerSizedBoard && nextBoardOf({ pieceCount: gameState.pieceCount, memorizeSeconds: gameState.memorizeTime }, accuracy);
  const playNext = ({ pieceCount, memorizeSeconds }: BoardSize) => {
    trackEvent({ name: "lab_panel_action", params: { panel: "resultCard", action: "next_round" } });
    onPlay(pieceCount, memorizeSeconds, "result_next");
  };
  const returnFocus = (event: Event) => {
    event.preventDefault();
    // A submitted score takes both prompts away, so focus moves on to the leaderboard link.
    (openerRef.current?.isConnected ? openerRef.current : leaderboardLinkRef.current)?.focus();
  };
  const openLeaderboardDialog = (event: MouseEvent<HTMLButtonElement>) => {
    openerRef.current = event.currentTarget;
    setShowLeaderboardDialog(true);
  };
  const claimsFirst = ranks && !submitSuccess;
  const claimLine = scored && leaderboardEligible && roundDifficulty !== "custom" && (
    <div className="lab-result-claim" data-result-claim data-claim-state={submitSuccess ? "claimed" : ranks ? "qualifies" : "open"}>
      {submitSuccess ? (
        <>
          <Check aria-hidden size={20} className="lab-result-claim-check" />
          <p role="status" className="lab-result-claim-text">
            {t("claimLine.claimed", { difficulty: tPresets(`${roundDifficulty}.label`), accuracy: scored.score.accuracy })}
          </p>
        </>
      ) : (
        <>
          <span id={claimTextId} className="lab-result-claim-text">
            {ranks
              ? t("claimLine.qualifies", { difficulty: tPresets(`${roundDifficulty}.label`), accuracy: scored.score.accuracy })
              : personalBest
                ? t("personalBest")
                : t("claimLine.open", { difficulty: tPresets(`${roundDifficulty}.label`), accuracy: scored.score.accuracy })}
          </span>
          <button
            type="button"
            onClick={openLeaderboardDialog}
            aria-describedby={claimTextId}
            className={`lab-btn lab-result-claim-action ${ranks ? "lab-btn-primary" : "lab-btn-secondary"}`}
          >
            {t(ranks ? "claimLine.claim" : "claimLine.submit")}
          </button>
        </>
      )}
    </div>
  );
  const nextButtonClass = `lab-btn lab-result-main ${claimsFirst ? "lab-btn-secondary" : "lab-btn-primary"}`;

  const shareResult = round.phase === "scored" && (
    <ShareResult
      key={labRound?.facts.id}
      share={roundShareOf(round, {
        rating: gameState.skillRating ?? START_RATING,
        change: extendedGameState.skillRatingChange ?? 0,
        winStreak: gameState.streak ?? 0,
      })}
    />
  );

  return (
    <div className="lab-result w-full space-y-6 pb-4">
      <section aria-labelledby="game-result-heading" className="lab-card lab-result-card">
        <div className="lab-result-title">
          <h2 id="game-result-heading" className="lab-result-h">
            {getResultMessage()}
          </h2>
          {scored && (
            <span className="lab-result-score">
              {scored.score.accuracy}
              <small>%</small>
            </span>
          )}
        </div>
        {scored && (
          <p className="lab-result-summary" data-result-summary>
            {t("summary", {
              correct: scored.score.correct,
              total: scored.score.total,
              wrong: scored.score.wrong,
              seconds: format.number(scored.rebuildMs / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            })}
          </p>
        )}
        {claimLine}

        <div className="lab-result-notes">
          <p className="lab-result-sub">
            <span className="lab-mono">
              {piecesInfo.correctPieces} / {piecesInfo.totalPieces}
            </span>{" "}
            {t("piecesCorrectCaption")}
            <span aria-hidden="true"> · </span>
            <span>{t("recallSpeed")}</span> <span className="lab-mono">{recallSpeed}</span>
          </p>
          {blindfold && (
            <p className="lab-result-sub" data-round-mode="blindfold">
              {t("blindfoldRound")}
            </p>
          )}
          {ratingNote && (
            <p className="lab-result-sub" data-rating-phase={gameState.rating?.phase}>
              {ratingNote}
            </p>
          )}

        </div>

        {scored && (
          <>
            <ResultBoards round={scored} view={resultView} onViewChange={setResultView} />
            <div className="lab-result-readout">
              <ResultReadout round={scored} />
            </div>
          </>
        )}

        <div className="lab-result-next">
          {next ? (
            <button type="button" onClick={() => playNext(next)} className={nextButtonClass}>
              {t("nextRound")}
              <span className="lab-result-next-board">{tConfig("presetSummary", { pieces: next.pieceCount, seconds: next.memorizeSeconds })}</span>
            </button>
          ) : (
            <button type="button" onClick={onTryAgain} className={nextButtonClass}>
              {t("tryAgain")}
            </button>
          )}
          {shareResult}
        </div>

        <nav aria-label={t("actions")} className="lab-result-actions">
          {next && (
            <button type="button" onClick={onTryAgain} className="lab-btn lab-btn-secondary">
              {t("tryAgain")}
            </button>
          )}
          <button type="button" onClick={onNewGame} className="lab-btn lab-btn-secondary">
            {t("changeSettings")}
          </button>
          {gameState.board?.kind === "daily" && keepsRecord && (
            <Link href="/daily" className="lab-btn lab-btn-secondary">
              {tDaily("join")}
            </Link>
          )}
          <Link ref={leaderboardLinkRef} href="/leaderboard" className="lab-result-link">
            {t("viewLeaderboard")}
          </Link>
        </nav>
        {isReturningPlayer(history.length) && (
          <CommunityInvite placement="result" line={tCommunity("resultLine")} link={tCommunity("link")} />
        )}
      </section>

      {painted && (
        <div className="lab-ui-face space-y-6">
          {showsLab && labRound && (
            <ErrorBoundary key={`lab-${labRound.facts.id}`} fallback={<ResultLabEnd />}>
              <Suspense fallback={<ResultLabSlot />}>
                <ResultLabCard roundId={labRound.facts.id} onPlay={onPlay} />
              </Suspense>
            </ErrorBoundary>
          )}

          <TomorrowBoardCard />

          {deltas && labRound && (
            <ErrorBoundary key={`deltas-${labRound.facts.id}`} fallback={<></>}>
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
      )}

      {painted && asksFeedback && (
        <FirstGameFeedbackDialog
          game={{
            accuracy: gameState.accuracy || 0,
            correctPieces: piecesInfo.correctPieces,
            pieceCount: gameState.pieceCount,
            difficulty: gameState.board?.kind === "daily" ? "daily" : determineDifficulty(gameState.pieceCount),
            memorizationTime:
              gameState.actualMemorizeTime || gameState.memorizeTime,
            solutionTime: gameState.completionTime || 0,
          }}
        />
      )}

      {/* Leaderboard Submission Dialog */}
      <Dialog
        open={showLeaderboardDialog}
        onOpenChange={setShowLeaderboardDialog}
      >
        <DialogContent className={`${LAB_PAPER_CLASS} lab-dialog`} onCloseAutoFocus={returnFocus}>
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
                {submittedId && <SubmittedStanding entryId={submittedId} country={countryCode} />}
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
                  })()}${blindfold ? `&mode=${BLINDFOLD_MODE}` : ""}&memorizeTime=${gameState.actualMemorizeTime || gameState.memorizeTime}&solutionTime=${gameState.completionTime || 0}&pieceCount=${gameState.pieceCount}&correctPieces=${Math.round(((gameState.accuracy || 0) * gameState.pieceCount) / 100)}&totalWrongPieces=${piecesInfo.totalWrong}`}
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
