'use client';

import { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import GameConfig from '@/components/game/GameConfig';
import GameResult from '@/components/game/GameResult';
import ActiveRound from '@/components/game/ActiveRound';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SoundSettings from '@/components/ui/SoundSettings';
import { LabPaperHeader } from '@/components/lab-paper/LabPaperHeader';
import { LAB_PAPER_CLASS } from '@/components/lab-paper/shell';
import { playSound, stopTimerSound } from '@/lib/utils/soundEffects';
import { useRoundSounds } from '@/hooks/useRoundSounds';
import { PAGE_BELOW_BANNER_MIN_HEIGHT } from '@/lib/layout';
import { warmLeaderboardCutoffs } from '@/lib/leaderboard/cutoffsClient';
import { warmResultDeltas } from '@/components/game/resultDeltasWarm';
import { roundSourceFrom, type RoundSource } from '@/lib/analytics/events';
import { ROUND_PARAMS } from '@/lib/game/roundLink';
import { GAME_CONFIG_RULES, parseGameSettings } from '@/lib/game/configPrefill';
import '@/components/game/game-lab.css';

import type { SetBoard } from '@/lib/types/game';
import type { SetBoardRefusal } from '@/components/game/SetBoardNotice';

const SetBoardNotice = lazy(() => import('@/components/game/SetBoardNotice'));

type SetBoardSource = 'daily' | 'review';
const isSetBoardSource = (source: RoundSource): source is SetBoardSource => source === 'daily' || source === 'review';

/** What a set board's link opens: its round, with the marker to write once that round starts, or a refusal. */
type SetBoardOpen =
  | { kind: 'play'; pieceCount: number; memorizeTime: number; board: SetBoard; markOpened: () => void }
  | { kind: 'refused'; reason: SetBoardRefusal }
  | null;

// Each reads the lab record before the round, and is loaded only for its own link.
const OPEN_SET_BOARD: Record<SetBoardSource, () => Promise<SetBoardOpen>> = {
  daily: () =>
    import('@/lib/lab/dailyBoard').then(async ({ openDaily, markDailyOpened }) => {
      const daily = await openDaily(Date.now());
      if (!daily) return null;
      return daily.kind === 'played' ? { kind: 'refused', reason: 'daily' } : { ...daily, markOpened: () => markDailyOpened(daily.board.day) };
    }),
  review: () =>
    import('@/lib/lab/reviewBoard').then(async ({ openReview, markReviewOpened }) => {
      const review = await openReview(Date.now());
      if (review.kind !== 'play') return { kind: 'refused', reason: review.kind === 'capped' ? 'reviewCap' : 'review' };
      return { ...review, markOpened: () => markReviewOpened(review.board) };
    }),
};

/**
 * Pins the page while a round is memorised or placed. Pinning the scrolling
 * element, rather than only hiding its overflow, is what stops iOS
 * rubber-banding a page whose content already fits.
 *
 * The pin is what gives the board its full height, so it goes on in a layout
 * effect, before the first paint. Pinned any later, the board is laid out on
 * the unpinned page, at its floor, and then grows.
 */
function PinnedPage() {
  useLayoutEffect(() => {
    const { documentElement, body } = document;
    documentElement.classList.add('game-fixed');
    body.classList.add('game-fixed');

    return () => {
      documentElement.classList.remove('game-fixed');
      body.classList.remove('game-fixed');
    };
  }, []);

  return null;
}

type UrlRound = { pieceCount: number; memorizeTime: number; source: RoundSource };

// The query is read off the live location rather than via useSearchParams,
// which would bail /game out of static rendering and serve an empty page.
function takeUrlRound(): UrlRound | null {
  const params = new URLSearchParams(window.location.search);
  const pieceCountParam = params.get(ROUND_PARAMS.pieceCount);
  const memorizeTimeParam = params.get(ROUND_PARAMS.memorizeTime);
  if (!pieceCountParam && !memorizeTimeParam) return null;

  const source = roundSourceFrom(params.get(ROUND_PARAMS.source));
  // A refresh then opens the configuration screen instead of restarting the round.
  Object.values(ROUND_PARAMS).forEach((name) => params.delete(name));
  const query = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);

  const settings = parseGameSettings(
    {
      pieceCount: pieceCountParam ? parseInt(pieceCountParam) : 8,
      memorizeTime: memorizeTimeParam ? parseInt(memorizeTimeParam) : 10,
    },
    GAME_CONFIG_RULES,
  );
  return settings && { ...settings, source };
}

function GamePageContent() {
  const round = useGameStore((state) => state.round);
  const gameState = useGameStore((state) => state.gameState);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const submitSolution = useGameStore((state) => state.submitSolution);
  useRoundSounds(round);

  // Memorising and placing are played without scrolling: the board is sized
  // from the room that is actually left, so the screen holds exactly what
  // fits. Configuration and the result page are ordinary scrolling pages.
  const isActivePhase = round.phase === 'study' || round.phase === 'rebuild';

  useEffect(() => {
    // Clean up game state when leaving
    return () => {
      stopTimerSound(); // Stop any timer sound when leaving the page
      resetGame();
    };
  }, [resetGame]);

  // StrictMode re-runs this effect after the cleanup above has reset the store,
  // by which time the URL is cleared, so the round is kept for the second run.
  const urlRoundRef = useRef<UrlRound | null | undefined>(undefined);
  const [refused, setRefused] = useState<SetBoardRefusal | null>(null);
  // A round the player starts by hand wins over a set board still being read.
  const startedByHandRef = useRef(false);

  useEffect(() => {
    if (urlRoundRef.current === undefined) urlRoundRef.current = takeUrlRound();
    const urlRound = urlRoundRef.current;
    if (!urlRound) return;
    const { source } = urlRound;
    if (!isSetBoardSource(source)) {
      startGame(urlRound.pieceCount, urlRound.memorizeTime, source);
      return;
    }

    // StrictMode runs this twice; only the live run marks the board opened, or the second read would refuse it.
    let live = true;
    OPEN_SET_BOARD[source]()
      .then((opened) => {
        if (!live || !opened || startedByHandRef.current) return;
        if (opened.kind === 'refused') {
          setRefused(opened.reason);
          return;
        }
        opened.markOpened();
        startGame(opened.pieceCount, opened.memorizeTime, source, opened.board);
      })
      .catch((error) => console.error(`Could not open the ${source} board`, error));
    return () => {
      live = false;
    };
  }, [startGame]);

  useEffect(() => {
    if (round.phase !== 'study') return;
    warmLeaderboardCutoffs();
    warmResultDeltas();
  }, [round.phase]);

  const handleSubmitSolution = () => {
    stopTimerSound();
    playSound('click');
    submitSolution();
  };

  const handlePlay = (pieceCount: number, memorizeTime: number, source: RoundSource) => {
    startedByHandRef.current = true;
    setRefused(null);
    stopTimerSound();
    playSound('click');
    resetGame();
    startGame(pieceCount, memorizeTime, source);
  };

  const handleTryAgain = () => handlePlay(gameState.pieceCount, gameState.memorizeTime, 'try_again');

  const handleNewGame = () => {
    stopTimerSound(); // Stop any playing timer sound
    playSound('click');
    resetGame();
  };

  const handleStartGame = (pieceCount: number, memorizeTime: number, source: RoundSource) => {
    playSound('click');
    startedByHandRef.current = true;
    startGame(pieceCount, memorizeTime, source);
  };

  const renderGameContent = () => {
    const containerClass = "w-full max-w-4xl mx-auto flex flex-col items-center justify-center";
    // `flex-1` without `min-h-0`: the wrapper still takes the leftover
    // height, but no longer shrinks below what ActiveGameLayout says the
    // board needs. On a viewport too short for that floor it overflows, and
    // `main` below scrolls to it.
    const activePhaseClass = `${containerClass} flex-1`;

    switch (round.phase) {
      case 'idle':
        return (
          <div className={containerClass}>
            {/* In the configuration form's place, so nothing above or beside it moves when it appears. */}
            {refused ? (
              <ErrorBoundary fallback={<GameConfig onStart={handleStartGame} />}>
                <Suspense fallback={<GameConfig onStart={handleStartGame} />}>
                  <SetBoardNotice reason={refused} onChoose={() => setRefused(null)} />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <ErrorBoundary>
                <GameConfig onStart={handleStartGame} />
              </ErrorBoundary>
            )}
          </div>
        );

      case 'study':
      case 'rebuild':
        return (
          <div className={activePhaseClass}>
            <ErrorBoundary>
              <ActiveRound round={round} onRestart={handleTryAgain} onSubmit={handleSubmitSolution} />
            </ErrorBoundary>
          </div>
        );

      case 'scored':
        return (
          <div className={containerClass}>
            <ErrorBoundary>
              <GameResult onTryAgain={handleTryAgain} onNewGame={handleNewGame} onPlay={handlePlay} />
            </ErrorBoundary>
          </div>
        );
    }
  };

  return (
    <div className={`${LAB_PAPER_CLASS} lab-game`}>
      {isActivePhase && <PinnedPage />}
      <LabPaperHeader showPlay={false} tools={<SoundSettings className="lab-sound" />} />
      <main
        className={
          isActivePhase
            ? // Where the game fits, this scrolls no more than the clipped
              // version did -- there is nothing to scroll to. Where it does not
              // fit, this is the only way to reach the board.
              //
              // `main` is the scrolling element, so a drag inside it is settled
              // by the touch-action stated here: the browser intersects
              // touch-action from the touched node up to the first containing
              // scroller and stops there, leaving the document's own refusal
              // (globals.css) intact for everything outside. `overscroll-contain`
              // keeps the bounce from chaining out to that document.
              'min-h-0 flex-1 overflow-y-auto overscroll-contain [touch-action:pan-y_pinch-zoom]'
            : PAGE_BELOW_BANNER_MIN_HEIGHT
        }
      >
        {/*
          `h-full`, not `min-h-full`. A minimum does not make a height definite,
          and everything below here asks for a percentage of it: the column's
          own `h-full`, and the board area it hands the board. Under a minimum
          those resolve to `auto`, the column falls to its floor, and the board
          area lands on exactly MIN_BOARD_SIZE however much room the screen has.

          A viewport too short for the column is still reachable: the column
          overflows this box and `main` above scrolls to it.
        */}
        <div
          className={`container mx-auto flex flex-col items-center justify-start ${
            isActivePhase ? 'h-full px-4 py-2' : `${PAGE_BELOW_BANNER_MIN_HEIGHT} px-4 py-8 sm:py-12`
          }`}
        >
          <ErrorBoundary>
            {renderGameContent()}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default function GamePage() {
  return (
    <ErrorBoundary>
      <GamePageContent />
    </ErrorBoundary>
  );
}
