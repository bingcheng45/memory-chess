'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import * as Tabs from '@radix-ui/react-tabs';
import LeaderboardTable, { type EntryDetails } from '@/components/leaderboard/LeaderboardTable';
import { Link } from '@/i18n/navigation';
import { RANKED_DIFFICULTIES, type RankedDifficulty } from '@/lib/reference/facts';
import { LeaderboardEntry } from '@/types/leaderboard';

export type LeaderboardBoards = Record<RankedDifficulty, { data: LeaderboardEntry[]; error?: string }>;

interface LeaderboardTabsProps {
  boards: LeaderboardBoards;
  entryDetails?: EntryDetails;
  initialTab?: RankedDifficulty;
}

function isRankedDifficulty(value: string | null): value is RankedDifficulty {
  return RANKED_DIFFICULTIES.includes(value as RankedDifficulty);
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
  const [activeTab, setActiveTab] = useState<RankedDifficulty>(initialTab);

  // The server boards are up to one revalidation window old. A player arriving
  // from the result screen needs the score they just submitted, so only that
  // visit refreshes the open tab, and a failed refresh keeps the rows.
  const isJustSubmitted = Boolean(entryDetails?.player);

  useEffect(() => {
    if (!isJustSubmitted) return;
    const controller = new AbortController();

    fetch(`/api/leaderboard?difficulty=${activeTab}`, { signal: controller.signal })
      .then((response) => response.json())
      .then(({ data, error }: { data?: LeaderboardEntry[]; error?: string }) => {
        if (error || !data) return;
        setBoards((current) => ({ ...current, [activeTab]: { data } }));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Error refreshing leaderboard data:', err);
        }
      });

    return () => controller.abort();
  }, [activeTab, isJustSubmitted]);

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
          if (isRankedDifficulty(value)) setActiveTab(value);
        }}
      >
        <Tabs.List className="lb-tabs">
          {RANKED_DIFFICULTIES.map((difficulty) => (
            <Tabs.Trigger
              key={difficulty}
              value={difficulty}
              // Radix makes a trigger tabbable only once focus has entered the
              // list, and the list itself only after hydration, so a served
              // page had no tab stop at all. The active tab is the stop;
              // Radix's arrow keys still move between the rest.
              tabIndex={difficulty === activeTab ? 0 : -1}
              className="lb-tab"
            >{tg(`presets.${difficulty}.label`)}</Tabs.Trigger>
          ))}
        </Tabs.List>

        {RANKED_DIFFICULTIES.map((difficulty) => (
          <Tabs.Content key={difficulty} value={difficulty}>
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
          <Link href={`/game?difficulty=${activeTab}`} className="lab-btn lab-btn-primary">
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
      initialTab={isRankedDifficulty(difficulty) ? difficulty : 'medium'}
    />
  );
}
