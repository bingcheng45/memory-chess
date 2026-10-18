/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { DailyBoard } from "@/components/daily/DailyBoard";
import type { LeaderboardEntry } from "@/types/leaderboard";
import messages from "../../../../messages/en.json";

const ADA = {
  id: "3c3c3c3c-0000-4000-8000-000000000001",
  player_name: "Ada Lovelace",
  country_code: "SG",
  difficulty: "daily",
  daily_day: "2026-10-13",
  piece_count: 6,
  correct_pieces: 5,
  total_wrong_pieces: 1,
  memorize_time: 10,
  solution_time: 11,
  skill_rating: 1200,
  created_at: "2026-10-13T09:00:00Z",
} as LeaderboardEntry;

const serverHtml = (board: { day: string; rows: LeaderboardEntry[] }) =>
  renderToString(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <DailyBoard rendered={{ today: "2026-10-13", board: { ...board, playedLike: null }, readAt: 0 }} />
    </NextIntlClientProvider>,
  );

describe("the daily board as the server renders it", () => {
  it("puts today's date, the day's setting, the play link and today's rows in the HTML", () => {
    const html = serverHtml({ day: "2026-10-13", rows: [ADA] });

    expect(html).toContain("Daily board · Tuesday, October 13");
    expect(html).toContain("Today&#x27;s top 10");
    expect(html).toContain("Ada Lovelace");
    expect(html).toMatch(/<li>\d+ pieces<\/li>/);
    expect(html).toContain("Play today&#x27;s board");
  });

  it("labels yesterday's rows as yesterday's when the server found nobody on today's board", () => {
    const html = serverHtml({ day: "2026-10-12", rows: [{ ...ADA, daily_day: "2026-10-12" }] });

    expect(html).toContain("Yesterday&#x27;s top 10");
    expect(html).toContain("Ada Lovelace");
  });
});
