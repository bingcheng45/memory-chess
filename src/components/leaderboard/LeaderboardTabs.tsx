'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Tabs from '@radix-ui/react-tabs';
import LeaderboardTable, { playHrefOf, type EntryDetails } from '@/components/leaderboard/LeaderboardTable';
import { DailyResetNote } from '@/components/leaderboard/DailyResetNote';
import { CommunityInvite } from '@/components/community/CommunityLink';
import { useDailyState } from '@/hooks/useDailyState';
import { Link } from '@/i18n/navigation';
import { readDailyEntry } from '@/lib/lab/entries';
import { RANKED_DIFFICULTIES, type RankedDifficulty } from '@/lib/reference/facts';
import { BLINDFOLD_MODE, isBlindfoldSearch } from '@/lib/game/roundLink';
import { blindfoldBoardOpen } from '@/lib/leaderboard/mode';
import { DEFAULT_BOARD } from '@/lib/leaderboard/defaultBoard';
import { DAILY_BOARD, type BoardRow, type LeaderboardEntry } from '@/types/leaderboard';

const LEADERBOARD_TABS = [DAILY_BOARD, ...RANKED_DIFFICULTIES] as const;
type LeaderboardTab = (typeof LEADERBOARD_TABS)[number];

interface Board {
  data: BoardRow[];
  error?: string;
  day?: string;
}

type DailyBoard = Board & { day: string };

/**
 * The boards read so far. The served page carries only the default tab, since every board it embeds is written again
 * on each revalidation in every locale; the others are read in the browser when first opened.
 */
export type LeaderboardBoards = Partial<Record<RankedDifficulty, Board>> & { daily?: DailyBoard };

const DEFAULT_TAB: LeaderboardTab = DEFAULT_BOARD;

interface TabState {
  active: LeaderboardTab;
  visited: ReadonlySet<LeaderboardTab>;
}

function isLeaderboardTab(value: string | null): value is LeaderboardTab {
  return LEADERBOARD_TABS.includes(value as LeaderboardTab);
}

interface DailyFailure {
  day: string;
  since: number;
}

interface Reads {
  boards: LeaderboardBoards;
  dailyFailure: DailyFailure | null;
}

const DAILY_RETRY_MS = 5_000;
const DAILY_CLOCK_SKEW_GRACE_MS = 60_000;
const DAILY_OUTAGE_RETRY_MS = 60_000;

const retryDelayOf = (failedForMs: number) => (failedForMs < DAILY_CLOCK_SKEW_GRACE_MS ? DAILY_RETRY_MS : DAILY_OUTAGE_RETRY_MS);

/** A failed read keeps a board already on screen; a board not yet shown shows the failure. */
function applyRankedRead(reads: Reads, tab: RankedDifficulty, read: Board): Reads {
  return read.error === undefined || reads.boards[tab] === undefined ? { ...reads, boards: { ...reads.boards, [tab]: read } } : reads;
}

function applyDailyRead(reads: Reads, read: DailyBoard, at: number): Reads {
  if (read.error === undefined) return { boards: { ...reads.boards, daily: read }, dailyFailure: null };
  const shown = reads.boards.daily;
  if (shown?.day === read.day && shown.error === undefined) return { ...reads, dailyFailure: null };

  const since = reads.dailyFailure?.day === read.day ? reads.dailyFailure.since : at;
  const daily = at - since >= DAILY_CLOCK_SKEW_GRACE_MS ? { data: [], error: read.error, day: read.day } : shown;
  return { boards: { ...reads.boards, daily }, dailyFailure: { day: read.day, since } };
}

function isRankedTab(tab: LeaderboardTab): tab is RankedDifficulty {
  return tab !== DAILY_BOARD;
}

type BlindfoldBoards = Partial<Record<RankedDifficulty, Board>>;

/**
 * The blindfold boards, read in the browser one tab at a time when first shown. The served page carries only the
 * board-study boards, so a crawler reads what it read before. Null until the blindfold view is open.
 */
function useBlindfoldBoards(tab: RankedDifficulty | null, refresh: boolean): BlindfoldBoards {
  const [boards, setBoards] = useState<BlindfoldBoards>({});
  const loaded = tab !== null && boards[tab] !== undefined;

  useEffect(() => {
    if (tab === null || loaded) return;
    const controller = new AbortController();
    const after = refresh ? `&after=${Date.now()}` : '';
    fetch(`/api/leaderboard?difficulty=${tab}&mode=${BLINDFOLD_MODE}${after}`, { signal: controller.signal, cache: refresh ? 'no-store' : 'default' })
      .then((response) => response.json())
      .then(({ data, error }: { data?: LeaderboardEntry[]; error?: string }) => setBoards((current) => ({ ...current, [tab]: { data: data ?? [], error } })))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Error reading the blindfold leaderboard:', err);
        setBoards((current) => ({ ...current, [tab]: { data: [], error: String(err) } }));
      });
    return () => controller.abort();
  }, [tab, loaded, refresh]);

  return boards;
}

const opened =
  (tab: LeaderboardTab) =>
  ({ visited }: TabState): TabState => ({ active: tab, visited: new Set(visited).add(tab) });

function parseParam(value: string | null, parse: (value: string) => number): number | null {
  return value ? parse(value) : null;
}

function entryDetailsOf(searchParams: URLSearchParams): EntryDetails {
  return {
    player: searchParams.get('player'),
    difficulty: searchParams.get('difficulty'),
    memorizeTime: parseParam(searchParams.get('memorizeTime'), parseFloat),
    solutionTime: parseParam(searchParams.get('solutionTime'), parseFloat),
    pieceCount: parseParam(searchParams.get('pieceCount'), parseInt),
    correctPieces: parseParam(searchParams.get('correctPieces'), parseInt),
    totalWrongPieces: parseParam(searchParams.get('totalWrongPieces'), parseInt),
  };
}

export default function LeaderboardTabs({ boards: serverBoards }: { boards: LeaderboardBoards }) {
  const t = useTranslations("leaderboard");
  // Difficulty names are the same strings the game config shows; reuse them
  // rather than translating "Easy" twice and letting the two drift.
  const tg = useTranslations("game");
  const tCommunity = useTranslations('common.community');
  const [reads, setReads] = useState<Reads>({ boards: serverBoards, dailyFailure: null });
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [entryDetails, setEntryDetails] = useState<EntryDetails>();
  const [tabs, setTabs] = useState<TabState>({ active: DEFAULT_TAB, visited: new Set([DEFAULT_TAB]) });
  const [blindfold, setBlindfold] = useState(false);
  const activeTab = tabs.active;
  const shownTabs = blindfold ? LEADERBOARD_TABS.filter(isRankedTab) : LEADERBOARD_TABS;
  const blindfoldBoards = useBlindfoldBoards(blindfold && isRankedTab(activeTab) ? activeTab : null, Boolean(entryDetails?.player));
  const chooseMode = (on: boolean) => {
    setBlindfold(on);
    if (on && activeTab === DAILY_BOARD) setTabs(opened(DEFAULT_TAB));
  };
  const daily = useDailyState();
  const today = daily?.day ?? null;
  const dailyDay = activeTab === DAILY_BOARD ? today : null;

  // The server board is up to one revalidation window old. A player arriving
  // from the result screen needs the score they just submitted, so that visit
  // refreshes the open tab; any other visit reads a board only it has none.
  const isJustSubmitted = Boolean(entryDetails?.player);
  const isUnread = isRankedTab(activeTab) && reads.boards[activeTab] === undefined;

  const isRefreshing = activeTab === DAILY_BOARD ? dailyDay !== null : (isJustSubmitted || isUnread) && !blindfold;

  // Read after mount, not through useSearchParams: that hook makes the static
  // prerender serve only a Suspense fallback, which hydration discards and
  // redraws, so the served table was painted twice.
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const difficulty = searchParams.get('difficulty');
    if (blindfoldBoardOpen() && isBlindfoldSearch(window.location.search)) setBlindfold(true);
    if (isLeaderboardTab(difficulty)) setTabs(opened(difficulty));
    if (searchParams.get('player')) setEntryDetails(entryDetailsOf(searchParams));
  }, []);

  useEffect(() => {
    if (!isRefreshing) return;
    const controller = new AbortController();
    const board = dailyDay === null ? `difficulty=${activeTab}` : `difficulty=${DAILY_BOARD}&daily_day=${dailyDay}`;
    const joinedId = dailyDay === null ? null : (readDailyEntry(dailyDay)?.id ?? null);
    const after = isJustSubmitted ? Date.now() : joinedId;
    const query = after === null ? board : `${board}&after=${after}`;
    const settle = (read: Board) => {
      if (controller.signal.aborted) return;
      setReads((current) => {
        if (dailyDay !== null) return applyDailyRead(current, { ...read, day: dailyDay }, Date.now());
        return activeTab === DAILY_BOARD ? current : applyRankedRead(current, activeTab, read);
      });
    };

    // An unread board may come from the shared cache; a refresh must not.
    const cache = dailyDay === null && !isJustSubmitted ? 'default' : 'no-store';
    fetch(`/api/leaderboard?${query}`, { signal: controller.signal, cache })
      .then((response) => response.json())
      .then(({ data, error }: { data?: LeaderboardEntry[]; error?: string }) => settle({ data: data ?? [], error }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Error refreshing leaderboard data:', err);
        settle({ data: [], error: String(err) });
      });

    return () => controller.abort();
  }, [activeTab, dailyDay, isJustSubmitted, isRefreshing, retryAttempt]);

  const { dailyFailure } = reads;
  useEffect(() => {
    if (dailyDay === null || dailyFailure?.day !== dailyDay) return;
    let timer: number | undefined;
    const retry = () => setRetryAttempt((attempt) => attempt + 1);
    const schedule = () => {
      if (document.visibilityState === 'hidden') return;
      timer = window.setTimeout(retry, retryDelayOf(Date.now() - dailyFailure.since));
    };
    const onVisibilityChange = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === 'visible') retry();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [dailyDay, dailyFailure]);

  const boards: LeaderboardBoards =
    today === null || reads.boards.daily?.day === today ? reads.boards : { ...reads.boards, daily: undefined };
  const blindfoldBoard = (tab: LeaderboardTab): Board | undefined => (isRankedTab(tab) ? blindfoldBoards[tab] : undefined);
  const activeBoard = blindfold ? blindfoldBoard(activeTab) : boards[activeTab];

  return (
    <>
      <div className="lb-head">
        <h1 className="lb-title">{t("title")}</h1>
        <p className="lb-lede">{t("subtitle")}</p>
      </div>

      {blindfoldBoardOpen() && (
        <div className="lb-mode" role="group" aria-label={t('mode.label')}>
          <button type="button" className="lb-mode-option" aria-pressed={!blindfold} onClick={() => chooseMode(false)}>
            {t('mode.board')}
          </button>
          <button type="button" className="lb-mode-option" aria-pressed={blindfold} onClick={() => chooseMode(true)}>
            {t('mode.blindfold')}
          </button>
        </div>
      )}
      {blindfold && <p className="lb-note lb-mode-note">{t('mode.note')}</p>}

      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => {
          if (isLeaderboardTab(value)) setTabs(opened(value));
        }}
      >
        <Tabs.List className="lb-tabs">
          {shownTabs.map((difficulty) => (
            <Tabs.Trigger
              key={difficulty}
              value={difficulty}
              // Radix makes a trigger tabbable only once focus has entered the
              // list, and the list itself only after hydration, so a served
              // page had no tab stop at all. The active tab is the stop;
              // Radix's arrow keys still move between the rest.
              tabIndex={difficulty === activeTab ? 0 : -1}
              className="lb-tab"
            >{difficulty === DAILY_BOARD ? t("daily.tab") : tg(`presets.${difficulty}.label`)}</Tabs.Trigger>
          ))}
        </Tabs.List>

        {LEADERBOARD_TABS.map((difficulty) => (
          // A visited board stays mounted while hidden, so going back to it
          // shows the drawn table instead of rebuilding every row.
          <Tabs.Content
            key={difficulty}
            value={difficulty}
            forceMount={tabs.visited.has(difficulty) || undefined}
            hidden={difficulty !== activeTab}
          >
            {difficulty === DAILY_BOARD && today !== null && <DailyResetNote day={today} left={daily?.left ?? null} />}
            {!blindfold ? (
              boards[difficulty] ? (
                <LeaderboardTable
                  data={boards[difficulty].data}
                  error={boards[difficulty].error ?? null}
                  entryDetails={entryDetails}
                  activeTab={difficulty}
                />
              ) : (
                <p className="lb-note" role="status">
                  {t('loading')}
                </p>
              )
            ) : blindfoldBoard(difficulty) ? (
              <LeaderboardTable
                data={blindfoldBoard(difficulty)?.data ?? []}
                error={blindfoldBoard(difficulty)?.error ?? null}
                entryDetails={entryDetails}
                activeTab={difficulty}
                blindfold
              />
            ) : (
              <p className="lb-note" role="status">
                {t('mode.loading')}
              </p>
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <p className="lb-note">{t("footnote")}</p>
      <CommunityInvite placement="leaderboard" line={tCommunity('leaderboardLine')} link={tCommunity('link')} />

      {activeBoard && activeBoard.data.length > 0 && !activeBoard.error && (
        <div className="lb-cta">
          <Link href={playHrefOf(activeTab, blindfold)} className="lab-btn lab-btn-primary">
            {t("claimRank")}
          </Link>
        </div>
      )}
    </>
  );
}
