'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as Tabs from '@radix-ui/react-tabs';
import LeaderboardTable, { playHrefOf, type EntryDetails } from '@/components/leaderboard/LeaderboardTable';
import { DailyResetNote } from '@/components/leaderboard/DailyResetNote';
import { useDailyState } from '@/hooks/useDailyState';
import { Link } from '@/i18n/navigation';
import { RANKED_DIFFICULTIES, type RankedDifficulty } from '@/lib/reference/facts';
import { DAILY_BOARD, type LeaderboardEntry } from '@/types/leaderboard';

const LEADERBOARD_TABS = [DAILY_BOARD, ...RANKED_DIFFICULTIES] as const;
type LeaderboardTab = (typeof LEADERBOARD_TABS)[number];

interface Board {
  data: LeaderboardEntry[];
  error?: string;
  day?: string;
}

export type LeaderboardBoards = Record<RankedDifficulty, Board> & { daily: Board & { day: string } };

interface LeaderboardTabsProps {
  boards: LeaderboardBoards;
  entryDetails?: EntryDetails;
  initialTab?: LeaderboardTab;
}

function isLeaderboardTab(value: string | null): value is LeaderboardTab {
  return LEADERBOARD_TABS.includes(value as LeaderboardTab);
}

type DailyBoard = LeaderboardBoards[typeof DAILY_BOARD];

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

function applyRankedRead(reads: Reads, tab: RankedDifficulty, read: Board): Reads {
  return read.error === undefined ? { ...reads, boards: { ...reads.boards, [tab]: read } } : reads;
}

function applyDailyRead(reads: Reads, read: DailyBoard, at: number): Reads {
  if (read.error === undefined) return { boards: { ...reads.boards, daily: read }, dailyFailure: null };
  const shown = reads.boards.daily;
  if (shown.day === read.day && shown.error === undefined) return { ...reads, dailyFailure: null };

  const since = reads.dailyFailure?.day === read.day ? reads.dailyFailure.since : at;
  const daily = at - since >= DAILY_CLOCK_SKEW_GRACE_MS ? { data: [], error: read.error, day: read.day } : shown;
  return { boards: { ...reads.boards, daily }, dailyFailure: { day: read.day, since } };
}

function parseParam(value: string | null, parse: (value: string) => number): number | null {
  return value ? parse(value) : null;
}

export function LeaderboardTabs({ boards: serverBoards, entryDetails, initialTab = 'medium' }: LeaderboardTabsProps) {
  const t = useTranslations("leaderboard");
  // Difficulty names are the same strings the game config shows; reuse them
  // rather than translating "Easy" twice and letting the two drift.
  const tg = useTranslations("game");
  const [reads, setReads] = useState<Reads>({ boards: serverBoards, dailyFailure: null });
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialTab);
  const daily = useDailyState();
  const today = daily?.day ?? null;
  const dailyDay = activeTab === DAILY_BOARD ? today : null;

  // The server boards are up to one revalidation window old. A player arriving
  // from the result screen needs the score they just submitted, so only that
  // visit refreshes the open tab.
  const isJustSubmitted = Boolean(entryDetails?.player);

  const isRefreshing = activeTab === DAILY_BOARD ? dailyDay !== null : isJustSubmitted;

  useEffect(() => {
    if (!isRefreshing) return;
    const controller = new AbortController();
    const query = dailyDay === null ? `difficulty=${activeTab}` : `difficulty=${DAILY_BOARD}&daily_day=${dailyDay}`;
    const settle = (read: Board) => {
      if (controller.signal.aborted) return;
      setReads((current) => {
        if (dailyDay !== null) return applyDailyRead(current, { ...read, day: dailyDay }, Date.now());
        return activeTab === DAILY_BOARD ? current : applyRankedRead(current, activeTab, read);
      });
    };

    fetch(`/api/leaderboard?${query}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.json())
      .then(({ data, error }: { data?: LeaderboardEntry[]; error?: string }) => settle({ data: data ?? [], error }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Error refreshing leaderboard data:', err);
        settle({ data: [], error: String(err) });
      });

    return () => controller.abort();
  }, [activeTab, dailyDay, isRefreshing, retryAttempt]);

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
    today === null || reads.boards.daily.day === today ? reads.boards : { ...reads.boards, daily: { data: [], day: today } };
  const activeBoard = boards[activeTab];

  return (
    <>
      <div className="lb-head">
        <h1 className="lb-title">{t("title")}</h1>
        <p className="lb-lede">{t("subtitle")}</p>
      </div>

      <Tabs.Root
        value={activeTab}
        onValueChange={(value) => {
          if (isLeaderboardTab(value)) setActiveTab(value);
        }}
      >
        <Tabs.List className="lb-tabs">
          {LEADERBOARD_TABS.map((difficulty) => (
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
          <Tabs.Content key={difficulty} value={difficulty}>
            {difficulty === DAILY_BOARD && <DailyResetNote day={today ?? boards.daily.day} left={daily?.left ?? null} />}
            <LeaderboardTable
              data={boards[difficulty].data}
              error={boards[difficulty].error ?? null}
              entryDetails={entryDetails}
              activeTab={difficulty}
            />
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <p className="lb-note">{t("footnote")}</p>

      {activeBoard.data.length > 0 && !activeBoard.error && (
        <div className="lb-cta">
          <Link href={playHrefOf(activeTab)} className="lab-btn lab-btn-primary">
            {t("claimRank")}
          </Link>
        </div>
      )}
    </>
  );
}

export default function LeaderboardTabsFromSearchParams({ boards }: { boards: LeaderboardBoards }) {
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty');

  const entryDetails: EntryDetails = {
    player: searchParams.get('player'),
    difficulty,
    memorizeTime: parseParam(searchParams.get('memorizeTime'), parseFloat),
    solutionTime: parseParam(searchParams.get('solutionTime'), parseFloat),
    pieceCount: parseParam(searchParams.get('pieceCount'), parseInt),
    correctPieces: parseParam(searchParams.get('correctPieces'), parseInt),
    totalWrongPieces: parseParam(searchParams.get('totalWrongPieces'), parseInt),
  };

  return (
    <LeaderboardTabs
      boards={boards}
      entryDetails={entryDetails}
      initialTab={isLeaderboardTab(difficulty) ? difficulty : 'medium'}
    />
  );
}
