'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LeaderboardTable, { type EntryDetails } from '@/components/leaderboard/LeaderboardTable';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col items-center justify-center space-y-8">
      <h1 className="text-3xl font-bold text-peach-400">{t("title")}</h1>

      <div className="max-w-2xl space-y-2">
        <p className="text-lg text-text-secondary text-center">{t("subtitle")}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isRankedDifficulty(value)) setActiveTab(value);
        }}
        className="w-full max-w-4xl"
      >
        <TabsList className="grid grid-cols-4 mb-8 bg-bg-light/30">
          {RANKED_DIFFICULTIES.map((difficulty) => (
            <TabsTrigger
              key={difficulty}
              value={difficulty}
              className="data-[state=active]:bg-peach-600 data-[state=active]:text-white"
            >{tg(`presets.${difficulty}.label`)}</TabsTrigger>
          ))}
        </TabsList>

        {RANKED_DIFFICULTIES.map((difficulty) => (
          <TabsContent key={difficulty} value={difficulty}>
            <LeaderboardTable
              data={boards[difficulty].data}
              error={boards[difficulty].error ?? null}
              entryDetails={entryDetails}
              activeTab={difficulty}
            />
          </TabsContent>
        ))}
      </Tabs>

      {activeBoard.data.length > 0 && !activeBoard.error && (
        <div className="w-full flex justify-center mt-4 mb-6">
          <Link href={`/game?difficulty=${activeTab}`} className="inline-block">
            <Button
              variant="secondary"
              className="bg-peach-500 text-white hover:bg-peach-600 px-6 py-2"
              size="lg"
            >{t("claimRank")}</Button>
          </Link>
        </div>
      )}

      <div className="w-full max-w-4xl flex justify-end">
        <p className="text-xs text-text-secondary/70 italic">{t("footnote")}</p>
      </div>
    </div>
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
