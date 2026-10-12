'use client';

import { UNRECORDED_SKILL_RATING, type LeaderboardEntry } from '@/types/leaderboard';
import { Link } from "@/i18n/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { CloudOff, TriangleAlert } from "lucide-react";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { countryName, flagEmoji, parseCountryCode, WORLD_CODE } from "@/lib/leaderboard/countries";

export interface EntryDetails {
  player: string | null;
  difficulty: string | null;
  memorizeTime: number | null;
  solutionTime: number | null;
  pieceCount: number | null;
  correctPieces: number | null;
  totalWrongPieces: number | null;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  error: string | null;
  entryDetails?: EntryDetails;
  activeTab?: string;
}

const COLUMN_COUNT = 7;
const PODIUM_MEDALS = ["🏆", "🥈", "🥉"];

export function TimeDisplay({ seconds }: { seconds: number }) {
  const totalMs = Math.round(seconds * 1000);
  const minutes = String(Math.floor(totalMs / 60000)).padStart(2, "0");
  const wholeSeconds = String(Math.floor(totalMs / 1000) % 60).padStart(2, "0");
  const milliseconds = String(totalMs % 1000).padStart(3, "0");

  return (
    <span className="lb-time">
      <span>{minutes}</span>
      <span>:</span>
      <span>{wholeSeconds}</span>
      <span>:</span>
      <span className="lb-ms">{milliseconds}</span>
    </span>
  );
}

/** Every state of a board draws the same frame and column head, so switching tabs or failing to load keeps the page's shape. */
function BoardFrame({ isState, children }: { isState: boolean; children: ReactNode }) {
  const t = useTranslations("leaderboard");
  return (
    <div className="lb-plate">
      <div className="lb-scroll">
        <table className={isState ? "lb-table lb-table-state" : "lb-table"}>
          <thead>
            <tr>
              <th scope="col" className="lb-num lb-rank">{t("columns.rank")}</th>
              <th scope="col" className="lb-who">{t("columns.player")}</th>
              <th scope="col" className="lb-num">{t("columns.elo")}</th>
              <th scope="col" className="lb-num">{t("columns.pieces")}</th>
              <th scope="col" className="lb-num">{t("columns.memorizeTime")}</th>
              <th scope="col" className="lb-num">{t("columns.solutionTime")}</th>
              <th scope="col" className="lb-end">{t("columns.date")}</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function BoardState({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <BoardFrame isState>
      <tr>
        <td colSpan={COLUMN_COUNT} className="lb-state-cell">
          <div className="lb-state">
            <span className="lb-state-icon" aria-hidden="true">{icon}</span>
            <div>{children}</div>
          </div>
        </td>
      </tr>
    </BoardFrame>
  );
}

export default function LeaderboardTable({ data, error, entryDetails, activeTab }: LeaderboardTableProps) {
  const t = useTranslations("leaderboard");
  const tCountry = useTranslations("country");
  const locale = useLocale();
  const format = useFormatter();
  // Create a ref to store the highlighted row element
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  // Scroll to highlighted row when data loads
  useEffect(() => {
    if (entryDetails?.player && highlightedRowRef.current) {
      // Use a small timeout to ensure the DOM is fully updated
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [entryDetails, data]);

  if (error) {
    // Check if this is a database connection error and provide a more user-friendly message
    const isConnectionError = error.includes('Database connection unavailable') ||
                              error.includes('Unable to connect') ||
                              error.includes('connection issue');

    if (isConnectionError) {
      return (
        <BoardState icon={<CloudOff size={20} strokeWidth={1.75} />}>
          <p className="lb-state-title">{t("unavailableTitle")}</p>
          <p className="lb-state-body">{t("unavailableBody")}</p>
          <p className="lb-state-note">{t("unavailableNote")}</p>
        </BoardState>
      );
    }

    return (
      <BoardState icon={<TriangleAlert size={20} strokeWidth={1.75} />}>
        <p className="lb-state-title lb-state-error">{t("errorLoading", { error })}</p>
        <p className="lb-state-body">{t("retryLater")}</p>
      </BoardState>
    );
  }

  if (data.length === 0) {
    return (
      <BoardState
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        }
      >
        <p className="lb-state-title">{t("emptyTitle")}</p>
        <p className="lb-state-body">{t("emptyBody")}</p>
        <p className="lb-state-note">{t("emptyCta")}</p>
        <Link href={`/game?difficulty=${activeTab || 'medium'}`} className="lab-btn lab-btn-secondary">
          {t("startPlaying")}
        </Link>
      </BoardState>
    );
  }

  return (
    <BoardFrame isState={false}>
      {data.map((entry, index) => {
        // A name alone matches every round that player submitted, so a row is
        // only highlighted when the link also carries that round's times.
        const isHighlighted =
          entryDetails?.player != null &&
          entryDetails.memorizeTime != null &&
          entryDetails.solutionTime != null &&
          entry.player_name === entryDetails.player &&
          Math.abs(entry.memorize_time - entryDetails.memorizeTime) < 0.001 &&
          Math.abs(entry.solution_time - entryDetails.solutionTime) < 0.001 &&
          (entryDetails.pieceCount === null || entry.piece_count === entryDetails.pieceCount) &&
          (entryDetails.correctPieces === null || entry.correct_pieces === entryDetails.correctPieces) &&
          (entryDetails.totalWrongPieces === null ||
            entry.total_wrong_pieces === undefined ||
            entry.total_wrong_pieces === entryDetails.totalWrongPieces);

        const code = parseCountryCode(entry.country_code) ?? WORLD_CODE;
        const name = code === WORLD_CODE ? tCountry("world") : countryName(code, locale);
        const medal = PODIUM_MEDALS[index];

        return (
          <tr
            key={entry.id}
            data-podium={medal ? "" : undefined}
            data-highlighted={isHighlighted ? "" : undefined}
            className={isHighlighted ? "animate-pulse" : undefined}
            ref={isHighlighted ? highlightedRowRef : null}
          >
            <td className="lb-num lb-rank">
              {medal && <span className="lb-medal" aria-hidden="true">{medal}</span>}
              {index + 1}
            </td>
            <td className="lb-who">
              <div className="lb-player">
                <span role="img" aria-label={name} title={name} className="lb-flag">{flagEmoji(code)}</span>
                <span className="lb-name">{entry.player_name}</span>
                {isHighlighted && <span className="lb-you">{t("you")}</span>}
              </div>
            </td>
            <td className="lb-num">{entry.skill_rating ?? UNRECORDED_SKILL_RATING}</td>
            <td className="lb-num">
              {entry.correct_pieces}
              {entry.total_wrong_pieces !== undefined &&
               entry.total_wrong_pieces > (entry.piece_count - entry.correct_pieces) ? (
                <sup className="lb-penalty">
                  -{entry.total_wrong_pieces - (entry.piece_count - entry.correct_pieces)}
                </sup>
              ) : (
                " "
              )}/ {entry.piece_count}
            </td>
            <td className="lb-num">
              <TimeDisplay seconds={entry.memorize_time} />
            </td>
            <td className="lb-num">
              <TimeDisplay seconds={entry.solution_time} />
            </td>
            <td className="lb-end lb-date">
              {format.dateTime(new Date(entry.created_at), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </td>
          </tr>
        );
      })}
    </BoardFrame>
  );
}
