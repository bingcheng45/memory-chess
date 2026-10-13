import type { ReactNode } from "react";
import { render, screen, within } from "@/test-utils/intl";
import { DailyTopTen, ranksOf } from "@/components/daily/DailyTopTen";
import type { DailyEntry } from "@/lib/lab/entries";
import type { LeaderboardEntry } from "@/types/leaderboard";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const row = (n: number, correct: number, solve: number): LeaderboardEntry => ({
  id: `3c3c3c3c-0000-4000-8000-${String(n).padStart(12, "0")}`,
  player_name: `Player ${n}`,
  country_code: "SG" as LeaderboardEntry["country_code"],
  difficulty: "daily",
  daily_day: "2026-10-13",
  piece_count: 6,
  correct_pieces: correct,
  total_wrong_pieces: 6 - correct,
  memorize_time: 10,
  solution_time: solve,
  skill_rating: 1000 + n,
  created_at: "2026-10-13T09:00:00Z",
});

const ROWS = [row(1, 6, 9), row(2, 5, 12), row(3, 5, 12), row(4, 5, 14), ...Array.from({ length: 8 }, (_, i) => row(5 + i, 4, 20 + i))];

describe("today's top 10", () => {
  it("gives tied rows one rank, as the standing does: 1, 2, 2, 4", () => {
    expect(ranksOf(ROWS).slice(0, 5)).toEqual([1, 2, 2, 4, 5]);
  });

  it("shows ten rows, then this device's own twelfth row highlighted with its rating", () => {
    const joined = { id: ROWS[11].id, difficulty: "daily", dailyDay: "2026-10-13" } as DailyEntry;

    render(<DailyTopTen rows={{ state: "ready", rows: ROWS, playedLike: null }} joined={joined} played />);

    const body = screen.getAllByRole("rowgroup")[1];
    const shown = within(body).getAllByRole("row").filter((tr) => !tr.classList.contains("daily-gap"));
    expect(shown.map((tr) => tr.querySelector(".daily-rank")?.textContent)).toEqual(["1", "2", "2", "4", "5", "6", "7", "8", "9", "10", "12"]);
    expect(shown.at(-1)).toHaveAttribute("data-you");
    expect(shown.at(-1)).toHaveTextContent("Player 12You1012 Elo");
    expect(screen.queryByText("Join the board to see your rank here.")).not.toBeInTheDocument();
  });

  it("asks a player who has played but not joined to join, and says so when no one has", () => {
    render(<DailyTopTen rows={{ state: "ready", rows: [], playedLike: null }} joined={null} played />);

    expect(screen.getByText("No one has joined today's board yet. Play it and be the first.")).toBeInTheDocument();
    expect(screen.getByText("Join the board to see your rank here.")).toBeInTheDocument();
  });

  it("says how today's board played once the read carries it, and keeps the line empty before", () => {
    const { container, rerender } = render(<DailyTopTen rows={{ state: "ready", rows: ROWS, playedLike: null }} joined={null} played={false} />);
    expect(container.querySelector(".daily-played")).toHaveTextContent(/^$/);

    rerender(<DailyTopTen rows={{ state: "ready", rows: ROWS, playedLike: 1340 }} joined={null} played={false} />);
    expect(container.querySelector(".daily-played")).toHaveTextContent("Today's board played like 1,340 · Estimated from today's players.");
  });
});
