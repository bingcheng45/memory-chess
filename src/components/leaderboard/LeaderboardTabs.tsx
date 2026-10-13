'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as Tabs from '@radix-ui/react-tabs';
import LeaderboardTable, { playHrefOf, type EntryDetails } from '@/components/leaderboard/LeaderboardTable';
import { DailyResetNote } from '@/components/leaderboard/DailyResetNote';
import { useNow } from '@/components/home/DailyResetsIn';
import { Link } from '@/i18n/navigation';
import { utcDayOf } from '@/lib/lab/daily';
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

function applyRead(boards: LeaderboardBoards, tab: LeaderboardTab, read: Board): LeaderboardBoards {
  const isFailedReadOfSameDay = read.error !== undefined && boards[tab].day === read.day;
  return isFailedReadOfSameDay ? boards : { ...boards, [tab]: read };
}

function parseParam(value: string | null, parse: (value: string) => number): number | null {
  return value ? parse(value) : null;
}

export function LeaderboardTabs({ boards: serverBoards, entryDetails, initialTab = 'medium' }: LeaderboardTabsProps) {
  const t = useTranslations("leaderboard");
  // Difficulty names are the same strings the game config shows; reuse them
  // rather than translating "Easy" twice and letting the two drift.
  const tg = useTranslations("game");
  const [boards, setBoards] = useState(serverBoards);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>(initialTab);
  const now = useNow();
  const today = now === null ? null : utcDayOf(now);
  const dailyDay = activeTab === DAILY_BOARD ? today : null;

  // The server boards are up to one revalidation window old. A player arriving
  // from the result screen needs the score they just submitted, so only that
  // visit refreshes the open tab.
  const isJustSubmitted = Boolean(entryDetails?.player);

  const isRefreshing = activeTab === DAILY_BOARD ? dailyDay !== null : isJustSubmitted;
  // A viewer's clock a little ahead of the server asks for a day the server
  // does not serve yet, so a failed daily read tries again on every tick.
  const dailyRetry = dailyDay !== null && boards.daily.error ? now : null;

  useEffect(() => {
    if (!isRefreshing) return;
    const controller = new AbortController();
    const query = dailyDay === null ? `difficulty=${activeTab}` : `difficulty=${DAILY_BOARD}&daily_day=${dailyDay}`;
    const day = dailyDay ?? undefined;

    fetch(`/api/leaderboard?${query}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.json())
      .then(({ data, error }: { data?: LeaderboardEntry[]; error?: string }) => {
        setBoards((current) => applyRead(current, activeTab, { data: data ?? [], error, day }));
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Error refreshing leaderboard data:', err);
        setBoards((current) => applyRead(current, activeTab, { data: [], error: String(err), day }));
      });

    return () => controller.abort();
  }, [activeTab, dailyDay, isRefreshing, dailyRetry]);

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
            {difficulty === DAILY_BOARD && <DailyResetNote day={today ?? boards.daily.day} now={now} />}
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
