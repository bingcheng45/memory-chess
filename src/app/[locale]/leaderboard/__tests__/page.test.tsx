import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { getLeaderboard } from "@/lib/services/leaderboardService";
import LeaderboardPage from "@/app/[locale]/leaderboard/page";
import type { CountryCode } from "@/lib/leaderboard/countries";
import enMessages from "../../../../../messages/en.json";

jest.mock("@/lib/services/leaderboardService", () => ({
  getLeaderboard: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const env = process.env as Record<string, string | undefined>;
const original = { NODE_ENV: env.NODE_ENV, NEXT_PHASE: env.NEXT_PHASE };

afterEach(() => {
  env.NODE_ENV = original.NODE_ENV;
  env.NEXT_PHASE = original.NEXT_PHASE;
});

beforeEach(() => {
  jest.mocked(getLeaderboard).mockResolvedValue({ data: [], error: "Database connection issue" });
});

async function renderPage() {
  render(await LeaderboardPage());
}

describe("LeaderboardPage when a board fails to load", () => {
  it("throws in a production revalidation, so the last good page keeps serving", async () => {
    env.NODE_ENV = "production";
    delete env.NEXT_PHASE;

    await expect(LeaderboardPage()).rejects.toThrow("Leaderboard refresh failed");
  });

  it("renders the unavailable state during the production build", async () => {
    env.NODE_ENV = "production";
    env.NEXT_PHASE = "phase-production-build";

    await renderPage();

    expect(screen.getByText(enMessages.leaderboard.unavailableTitle)).toBeInTheDocument();
  });

  it("renders the unavailable state under next dev", async () => {
    env.NODE_ENV = "development";
    delete env.NEXT_PHASE;

    await renderPage();

    expect(screen.getByText(enMessages.leaderboard.unavailableTitle)).toBeInTheDocument();
  });
});

describe("LeaderboardPage daily board", () => {
  const row = (name: string, day: string) => ({
    id: `${name}-${day}`,
    player_name: name,
    difficulty: "daily" as const,
    daily_day: day,
    country_code: "SG" as CountryCode,
    piece_count: 6,
    correct_pieces: 6,
    total_wrong_pieces: 0,
    memorize_time: 10,
    solution_time: 20,
    skill_rating: 1040,
    created_at: `${day}T09:00:00Z`,
  });
  const DAILY_ROWS = [row("Bea Yesterday", "2026-10-12"), row("Ada Today", "2026-10-13")];

  afterEach(() => jest.useRealTimers());

  it("serves only the rows of the server's UTC day under the Daily tab", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-13T10:00:00Z") });
    global.fetch = jest.fn(() => new Promise<Response>(() => {}));
    jest.mocked(getLeaderboard).mockImplementation(async (board) => ({
      data: board.difficulty === "daily" ? DAILY_ROWS.filter((entry) => entry.daily_day === board.daily_day) : [],
    }));

    await renderPage();
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Daily" }));
    });

    expect(jest.mocked(getLeaderboard)).toHaveBeenCalledWith({ difficulty: "daily", daily_day: "2026-10-13" });
    expect(screen.getByText("Ada Today")).toBeInTheDocument();
    expect(screen.queryByText("Bea Yesterday")).not.toBeInTheDocument();
  });
});
