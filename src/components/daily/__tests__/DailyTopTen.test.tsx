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

    render(<DailyTopTen rows={{ state: "ready", board: { day: "2026-10-13", rows: ROWS, playedLike: null } }} today="2026-10-13" joined={joined} played />);

    const body = screen.getAllByRole("rowgroup")[1];
    const shown = within(body).getAllByRole("row").filter((tr) => !tr.classList.contains("daily-gap"));
    expect(shown.map((tr) => tr.querySelector(".daily-rank")?.textContent)).toEqual(["1", "2", "2", "4", "5", "6", "7", "8", "9", "10", "12"]);
    expect(shown.at(-1)).toHaveAttribute("data-you");
    expect(shown.at(-1)).toHaveTextContent("Player 12You1012 Elo");
    expect(screen.queryByText("Join the board to see your rank here.")).not.toBeInTheDocument();
  });

  it("asks a player who has played but not joined to join, and says so when no one has", () => {
    render(<DailyTopTen rows={{ state: "ready", board: { day: "2026-10-13", rows: [], playedLike: null } }} today="2026-10-13" joined={null} played />);

    expect(screen.getByText("No one has joined today's board yet. Play it and be the first.")).toBeInTheDocument();
    expect(screen.getByText("Join the board to see your rank here.")).toBeInTheDocument();
  });

  it("says how today's board played once the read carries it, and keeps the line empty before", () => {
    const { container, rerender } = render(<DailyTopTen rows={{ state: "ready", board: { day: "2026-10-13", rows: ROWS, playedLike: null } }} today="2026-10-13" joined={null} played={false} />);
    expect(container.querySelector(".daily-played")).toHaveTextContent(/^$/);

    rerender(<DailyTopTen rows={{ state: "ready", board: { day: "2026-10-13", rows: ROWS, playedLike: 1340 } }} today="2026-10-13" joined={null} played={false} />);
    expect(container.querySelector(".daily-played")).toHaveTextContent("Today's board played like 1,340 · Estimated from today's players.");
  });
  it("labels yesterday's rows as yesterday's while nobody has joined today's board, without yesterday's rating", () => {
    const { container } = render(
      <DailyTopTen rows={{ state: "ready", board: { day: "2026-10-13", rows: ROWS, playedLike: 1340 } }} today="2026-10-14" joined={null} played={false} />,
    );

    expect(screen.getByRole("heading", { name: "Yesterday's top 10" })).toBeInTheDocument();
    expect(screen.getByText("No one has joined today's board yet. Play it and be the first.")).toBeInTheDocument();
    expect(within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")).toHaveLength(10);
    expect(container.querySelector(".daily-played")).toHaveTextContent(/^$/);
  });

  it("calls today's rows today's top 10", () => {
    render(<DailyTopTen rows={{ state: "ready", board: { day: "2026-10-14", rows: ROWS, playedLike: null } }} today="2026-10-14" joined={null} played={false} />);

    expect(screen.getByRole("heading", { name: "Today's top 10" })).toBeInTheDocument();
    expect(screen.queryByText("No one has joined today's board yet. Play it and be the first.")).not.toBeInTheDocument();
  });
});

describe("the honest board", () => {
  const view = (rows: LeaderboardEntry[], today: string) =>
    render(<DailyTopTen rows={{ state: "ready", board: { day: "2026-10-13", rows, playedLike: null } }} today={today} joined={null} played={false} />);

  it("hides the table below three rows and prints the joined count instead", () => {
    view(ROWS.slice(0, 2), "2026-10-13");

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Today's board" })).toBeInTheDocument();
    expect(screen.getByText("Players who have joined today's board: 2")).toBeInTheDocument();
    expect(screen.getByText("The top 10 appears once 3 or more players have joined.")).toBeInTheDocument();
  });

  it("shows the table from exactly three rows", () => {
    view(ROWS.slice(0, 3), "2026-10-13");

    expect(screen.getByRole("heading", { name: "Today's top 10" })).toBeInTheDocument();
    expect(within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")).toHaveLength(3);
    expect(screen.queryByText(/Players who have joined/)).not.toBeInTheDocument();
  });

  it("counts yesterday's joiners above a listed yesterday table, and with one row shows no table", () => {
    const { unmount } = view(ROWS, "2026-10-14");
    expect(screen.getByText("Players who joined yesterday's board: 12")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    unmount();

    view(ROWS.slice(0, 1), "2026-10-14");
    expect(screen.getByRole("heading", { name: "Yesterday's board" })).toBeInTheDocument();
    expect(screen.getByText("Players who joined yesterday's board: 1")).toBeInTheDocument();
    expect(screen.getByText("No one has joined today's board yet. Play it and be the first.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("says 200+ rather than an exact count when the read hit its row limit", () => {
    const many = Array.from({ length: 200 }, (_, i) => row(i + 1, 6, 9 + i));
    view(many, "2026-10-14");

    expect(screen.getByText("Players who joined yesterday's board: 200+")).toBeInTheDocument();
  });
});
