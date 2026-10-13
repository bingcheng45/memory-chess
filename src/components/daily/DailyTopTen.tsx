"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { START_RATING } from "@/lib/game/rating";
import type { DailyEntry } from "@/lib/lab/entries";
import { flagEmoji, parseCountryCode, WORLD_CODE } from "@/lib/leaderboard/countries";
import { compareRanking, type RankingScore } from "@/lib/leaderboard/ranking";
import type { LeaderboardEntry } from "@/types/leaderboard";
import type { DailyRows } from "./useDailyRows";

const TOP = 10;

const scoreOf = (entry: LeaderboardEntry): RankingScore => ({
  correctPieces: entry.correct_pieces,
  totalWrongPieces: entry.total_wrong_pieces ?? null,
  memorizeTime: entry.memorize_time,
  solutionTime: entry.solution_time,
});

/** Competition ranks, as the standing counts them: rows that tie share a rank, and the next row skips past them. */
export function ranksOf(rows: readonly LeaderboardEntry[]): number[] {
  const ranks: number[] = [];
  rows.forEach((row, index) => {
    ranks.push(index > 0 && compareRanking(scoreOf(rows[index - 1]), scoreOf(row)) === 0 ? ranks[index - 1] : index + 1);
  });
  return ranks;
}

interface DailyTopTenProps {
  readonly rows: DailyRows;
  readonly joined: DailyEntry | null;
  readonly played: boolean;
}

function Row({ entry, rank, you }: { entry: LeaderboardEntry; rank: number; you: boolean }) {
  const t = useTranslations("daily.board");
  const format = useFormatter();
  const country = parseCountryCode(entry.country_code) ?? WORLD_CODE;

  return (
    <tr data-you={you ? "" : undefined}>
      <td className="daily-num daily-rank">{rank}</td>
      <td className="daily-who">
        <span className="daily-name">
          {country !== WORLD_CODE && <span aria-hidden="true">{flagEmoji(country)} </span>}
          {entry.player_name}
          {you && <span className="daily-you">{t("you")}</span>}
        </span>
        <span className="daily-rating">{t("rating", { rating: entry.skill_rating ?? START_RATING })}</span>
      </td>
      <td className="daily-num">
        {entry.correct_pieces}/{entry.piece_count}
      </td>
      <td className="daily-num">{entry.total_wrong_pieces ?? "–"}</td>
      <td className="daily-num">{format.number(entry.solution_time, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
    </tr>
  );
}

/** The day's best ten, and this device's own row under them when it ranks lower. */
export function DailyTopTen({ rows, joined, played }: DailyTopTenProps) {
  const t = useTranslations("daily.board");
  const all = rows.state === "ready" ? rows.rows : [];
  const ranks = ranksOf(all);
  const ownIndex = joined ? all.findIndex((entry) => entry.id === joined.id) : -1;
  const own = ownIndex >= TOP ? all[ownIndex] : null;

  return (
    <section className="daily-card daily-top" aria-labelledby="daily-top-title">
      <h2 id="daily-top-title" className="daily-card-title">{t("title")}</h2>
      <div className="daily-table-wrap">
        <table className="daily-table">
          <thead>
            <tr>
              <th scope="col" className="daily-num">{t("rank")}</th>
              <th scope="col">{t("player")}</th>
              <th scope="col" className="daily-num">{t("right")}</th>
              <th scope="col" className="daily-num">{t("wrong")}</th>
              <th scope="col" className="daily-num">{t("time")}</th>
            </tr>
          </thead>
          <tbody>
            {all.slice(0, TOP).map((entry, index) => (
              <Row key={entry.id} entry={entry} rank={ranks[index]} you={entry.id === joined?.id} />
            ))}
            {own && (
              <>
                <tr className="daily-gap" aria-hidden="true">
                  <td colSpan={5}>⋯</td>
                </tr>
                <Row entry={own} rank={ranks[ownIndex]} you />
              </>
            )}
          </tbody>
        </table>
      </div>
      {rows.state === "ready" && all.length === 0 && <p className="daily-note">{t("empty")}</p>}
      {rows.state === "failed" && (
        <p className="daily-note daily-error" role="alert">
          {t("error")}
        </p>
      )}
      {played && !joined && <p className="daily-note">{t("joinToRank")}</p>}
      <div className="daily-top-foot">
        <p className="daily-hint">{t("order")}</p>
        <Link href="/leaderboard">{t("all")}</Link>
      </div>
    </section>
  );
}
