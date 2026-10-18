'use client';

import { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/lib/store/gameStore';
import GameConfig from '@/components/game/GameConfig';
import GameResult from '@/components/game/GameResult';
import ActiveRound, { type ActiveRoundState } from '@/components/game/ActiveRound';
import type { GateFacts } from '@/components/game/RoundGate';
import { dailySettingOf } from '@/lib/daily/schedule';
import { DAILY_PLAYED_PARAM, readDailyOpened, utcDayOf } from '@/lib/lab/daily';
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
// Loaded with the page, not with the result figures the round warms: Next commits a stylesheet a lazy chunk brings
// through React, which holds the round's next render, the one that sizes the board, until the file arrives.
import '@/components/dashboard/trend.css';

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

const isFirstEverRound = (): Promise<boolean> =>
  import('@/lib/lab/storage').then(async ({ labStore }) => {
    const store = labStore();
    return store !== null && (await store.isAvailable()) && (await store.readSummary()).rounds === 0;
  });

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
function readUrlRound(): UrlRound | null {
  const params = new URLSearchParams(window.location.search);
  const pieceCountParam = params.get(ROUND_PARAMS.pieceCount);
  const memorizeTimeParam = params.get(ROUND_PARAMS.memorizeTime);
  if (!pieceCountParam && !memorizeTimeParam) return null;

  const source = roundSourceFrom(params.get(ROUND_PARAMS.source));
  const settings = parseGameSettings(
    {
      pieceCount: pieceCountParam ? parseInt(pieceCountParam) : 8,
      memorizeTime: memorizeTimeParam ? parseInt(memorizeTimeParam) : 10,
    },
    GAME_CONFIG_RULES,
  );
  return settings && { ...settings, source };
}

/** A refresh then opens the configuration screen instead of restarting the round. */
function clearRoundParams(): void {
  const params = new URLSearchParams(window.location.search);
  if (!Object.values(ROUND_PARAMS).some((name) => params.has(name))) return;
  Object.values(ROUND_PARAMS).forEach((name) => params.delete(name));
  const query = params.toString();
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
}

const subscribeNothing = () => () => {};

/** What today's board asks, known from the date alone, so it shows while the board itself is still read. */
const todayGate = (): GateFacts => {
  const day = utcDayOf(Date.now());
  return { kind: 'daily', day, ...dailySettingOf(day) };
};

function GamePageContent() {
  const t = useTranslations('daily.round');
  const router = useRouter();
  const round = useGameStore((state) => state.round);
  const gameState = useGameStore((state) => state.gameState);
  const startGame = useGameStore((state) => state.startGame);
  const prepareGame = useGameStore((state) => state.prepareGame);
  const countInGame = useGameStore((state) => state.countInGame);
  const dispatch = useGameStore((state) => state.dispatch);
  const resetGame = useGameStore((state) => state.resetGame);
  const submitSolution = useGameStore((state) => state.submitSolution);
  useRoundSounds(round);

  // The server has no address, so the first render matches its HTML and the board a daily link names follows at once;
  // on a navigation inside the app there is nothing to hydrate and the board is the first thing painted.
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  // undefined until read. A navigation inside the app moves the address only as it commits the page, so it is read in a
  // layout effect, which still lands before the first paint. The ref keeps the read over StrictMode's second mount.
  const [urlRound, setUrlRound] = useState<UrlRound | null | undefined>(undefined);
  const urlRoundRef = useRef<UrlRound | null | undefined>(undefined);
  const [refused, setRefused] = useState<SetBoardRefusal | null>(null);
  // Until today's board is read, a daily link shows the veiled board with Start held, never the configuration form.
  const [dailyRead, setDailyRead] = useState(false);
  const [triedToday, setTriedToday] = useState(false);
  const [firstRoundKnown, setFirstRoundKnown] = useState(false);
  // A daily round's record being written, before /daily takes over.
  const [savingDaily, setSavingDaily] = useState(false);
  // A round the player starts by hand wins over a set board still being read.
  const startedByHandRef = useRef(false);
  // The day's try is spent on Start, not on opening the page.
  const markOpenedRef = useRef<(() => void) | null>(null);
  const addressUnread = hydrated && urlRound === undefined;
  const dailyPending = hydrated && urlRound?.source === 'daily' && !dailyRead && round.phase === 'idle' && !refused;
  // A try already spent today is refused whatever the record says, so the board is never shown before the notice.
  const opening = dailyPending && !triedToday;
  const linkPending = hydrated && !!urlRound && !isSetBoardSource(urlRound.source) && !firstRoundKnown && round.phase === 'idle';

  // Memorising and placing are played without scrolling: the board is sized
  // from the room that is actually left, so the screen holds exactly what
  // fits. Configuration and the result page are ordinary scrolling pages.
  const isActivePhase = opening || round.phase === 'ready' || round.phase === 'countdown' || round.phase === 'study' || round.phase === 'rebuild';

  useLayoutEffect(() => {
    if (urlRoundRef.current === undefined) urlRoundRef.current = readUrlRound();
    setUrlRound(urlRoundRef.current);
    setTriedToday(readDailyOpened() === utcDayOf(Date.now()));
  }, []);

  useLayoutEffect(() => {
    if (hydrated && urlRound !== undefined) delete document.documentElement.dataset.roundEntry;
  }, [hydrated, urlRound]);

  useEffect(() => {
    // Clean up game state when leaving
    return () => {
      stopTimerSound(); // Stop any timer sound when leaving the page
      resetGame();
    };
  }, [resetGame]);

  useEffect(() => {
    if (urlRound === undefined) return;
    clearRoundParams();
    if (!urlRound) return;
    const { source } = urlRound;
    // StrictMode runs this twice; only the live run starts the board, or the second read would refuse it.
    let live = true;
    if (!isSetBoardSource(source)) {
      void isFirstEverRound()
        .catch(() => false)
        .then((first) => {
          if (!live) return;
          setFirstRoundKnown(true);
          (first ? prepareGame : startGame)(urlRound.pieceCount, urlRound.memorizeTime, source);
        });
      return () => {
        live = false;
      };
    }

    OPEN_SET_BOARD[source]()
      .then((opened) => {
        if (!live || startedByHandRef.current) return;
        setDailyRead(true);
        if (!opened) return;
        if (opened.kind === 'refused') {
          setRefused(opened.reason);
          return;
        }
        if (source === 'daily') {
          markOpenedRef.current = opened.markOpened;
          prepareGame(opened.pieceCount, opened.memorizeTime, source, opened.board);
          return;
        }
        opened.markOpened();
        startGame(opened.pieceCount, opened.memorizeTime, source, opened.board);
      })
      .catch((error) => {
        if (live) setDailyRead(true);
        console.error(`Could not open the ${source} board`, error);
      });
    return () => {
      live = false;
    };
  }, [urlRound, startGame, prepareGame]);

  useEffect(() => {
    if (round.phase !== 'study') return;
    warmLeaderboardCutoffs();
    warmResultDeltas();
  }, [round.phase]);

  const handleStart = () => {
    markOpenedRef.current?.();
    markOpenedRef.current = null;
    playSound('click');
    dispatch({ type: 'begin', now: performance.now() });
  };

  const handleSubmitSolution = () => {
    stopTimerSound();
    playSound('click');
    const daily = gameState.board?.kind === 'daily';
    setSavingDaily(daily);
    void submitSolution().then((kept) => {
      if (!daily) return;
      // Without a saved round /daily has nothing to show or join, so the result stays here.
      if (kept) router.replace({ pathname: '/daily', query: { [DAILY_PLAYED_PARAM]: '1' } });
      else setSavingDaily(false);
    });
  };

  const replay = (begin: () => void) => {
    startedByHandRef.current = true;
    setRefused(null);
    setSavingDaily(false);
    stopTimerSound();
    playSound('click');
    resetGame();
    begin();
  };

  const handlePlay = (pieceCount: number, memorizeTime: number, source: RoundSource) =>
    replay(() => startGame(pieceCount, memorizeTime, source));

  // The player has just pressed a button, so the new board counts in over the veil without a second one.
  const handleTryAgain = () => {
    if (round.phase === 'idle') return;
    const { pieceCount, studyMs } = round.config;
    replay(() => countInGame(pieceCount, studyMs / 1000, 'try_again'));
  };

  const handleNewGame = () => {
    stopTimerSound(); // Stop any playing timer sound
    playSound('click');
    setSavingDaily(false);
    resetGame();
  };

  const handleStartGame = (pieceCount: number, memorizeTime: number, source: RoundSource) => {
    playSound('click');
    startedByHandRef.current = true;
    countInGame(pieceCount, memorizeTime, source);
  };

  const renderGameContent = () => {
    const containerClass = "w-full max-w-4xl mx-auto flex flex-col items-center justify-center";
    // `flex-1` without `min-h-0`: the wrapper still takes the leftover
    // height, but no longer shrinks below what ActiveGameLayout says the
    // board needs. On a viewport too short for that floor it overflows, and
    // `main` below scrolls to it.
    const activePhaseClass = `${containerClass} flex-1`;
    const activeRound = (playing: ActiveRoundState, gate: GateFacts | null) => (
      <div className={activePhaseClass}>
        <ErrorBoundary>
          <ActiveRound round={playing} gate={gate} onStart={handleStart} onRestart={handleTryAgain} onSubmit={handleSubmitSolution} />
        </ErrorBoundary>
      </div>
    );

    switch (round.phase) {
      case 'idle': {
        if (opening) return activeRound(round, todayGate());
        // Before the address is read this is one commit that never paints; on a day already tried it waits for the notice.
        if (addressUnread || dailyPending || linkPending) return <div className={containerClass} />;
        // A daily link's notice waits on nothing rather than flashing the form it replaces.
        const noticeFallback = refused === 'daily' ? null : <GameConfig onStart={handleStartGame} />;
        return (
          <div className={containerClass}>
            {/* In the configuration form's place, so nothing above or beside it moves when it appears. */}
            {refused ? (
              <ErrorBoundary fallback={<GameConfig onStart={handleStartGame} />}>
                <Suspense fallback={noticeFallback}>
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
      }

      case 'ready':
      case 'countdown': {
        const { pieceCount, studyMs, board } = round.config;
        const memorizeTime = studyMs / 1000;
        if (board) return activeRound(round, { kind: 'daily', day: board.kind === 'daily' ? board.day : utcDayOf(Date.now()), pieceCount, memorizeTime });
        return activeRound(round, round.phase === 'ready' ? { kind: 'firstRound', pieceCount, memorizeTime } : null);
      }

      case 'study':
      case 'rebuild':
        return activeRound(round, null);

      case 'scored':
        return (
          <div className={containerClass}>
            {savingDaily ? (
              <p className="lab-note" role="status">
                {t('saving')}
              </p>
            ) : (
              <ErrorBoundary>
                <GameResult onTryAgain={handleTryAgain} onNewGame={handleNewGame} onPlay={handlePlay} />
              </ErrorBoundary>
            )}
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
