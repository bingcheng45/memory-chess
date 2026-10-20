import { fireEvent, render, screen, within } from "@/test-utils/intl";
import LeaderboardTabs, { type LeaderboardBoards } from "@/components/leaderboard/LeaderboardTabs";
import type { CountryCode } from "@/lib/leaderboard/countries";
import type { LeaderboardEntry } from "@/types/leaderboard";

const row = (name: string, mode?: "blindfold"): LeaderboardEntry => ({
  id: name,
  player_name: name,
  difficulty: "medium",
  daily_day: null,
  country_code: "SG" as CountryCode,
  piece_count: 6,
  correct_pieces: 6,
  total_wrong_pieces: 0,
  memorize_time: 10,
  solution_time: 20,
  skill_rating: 1040,
  ...(mode ? { mode } : {}),
  created_at: "2026-10-13T09:00:00Z",
});

const boards: LeaderboardBoards = {
  daily: { data: [], day: "2026-10-13" },
  easy: { data: [] },
  medium: { data: [row("Board Bo")] },
  hard: { data: [] },
  grandmaster: { data: [] },
};

const fetchMock = jest.fn((input: string) => {
  const blindfold = new URL(input, "http://localhost").searchParams.get("mode") === "blindfold";
  return Promise.resolve({ json: () => Promise.resolve({ data: blindfold ? [row("Notation Ny", "blindfold")] : [] }) });
});

const OPEN = process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/leaderboard");
  fetchMock.mockClear();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  if (OPEN === undefined) delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
  else process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = OPEN;
});

const shownPlayers = () => within(screen.getByRole("tabpanel")).queryAllByRole("row").map((tableRow) => tableRow.textContent ?? "");

describe("the blindfold leaderboard", () => {
  it("is not offered while closed, and the board-study boards read as before", () => {
    delete process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD;
    render(<LeaderboardTabs boards={boards} />);

    expect(screen.queryByRole("group", { name: "Study mode" })).toBeNull();
    expect(shownPlayers().some((text) => text.includes("Board Bo"))).toBe(true);
    expect(fetchMock.mock.calls.filter(([url]) => url.includes("mode="))).toEqual([]);
  });

  it("switches to blindfold boards read with the mode, without the daily tab, and back", async () => {
    process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";
    render(<LeaderboardTabs boards={boards} />);

    fireEvent.click(screen.getByRole("button", { name: "Blindfold" }));

    expect(await screen.findByText("Notation Ny")).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/leaderboard?difficulty=medium&mode=blindfold"]);
    expect(screen.queryByRole("tab", { name: "Daily" })).toBeNull();
    expect(screen.queryByText("Board Bo")).toBeNull();
    expect(screen.getByRole("button", { name: "Blindfold" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Board" }));

    expect(screen.getByText("Board Bo")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Daily" })).toBeInTheDocument();
  });

  it("opens on the blindfold board a result screen links to", async () => {
    process.env.NEXT_PUBLIC_BLINDFOLD_LEADERBOARD = "1";
    window.history.replaceState(null, "", "/leaderboard?difficulty=medium&mode=blindfold&player=Notation%20Ny");

    render(<LeaderboardTabs boards={boards} />);

    expect(await screen.findByText("Notation Ny")).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => url)[0]).toMatch(/^\/api\/leaderboard\?difficulty=medium&mode=blindfold&after=\d+$/);
  });
});
