import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { getLeaderboard } from "@/lib/services/leaderboardService";
import LeaderboardPage from "@/app/[locale]/leaderboard/page";
import { LEADERBOARD_UNAVAILABLE } from "@/types/leaderboard";
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
  jest.useRealTimers();
  env.NODE_ENV = original.NODE_ENV;
  env.NEXT_PHASE = original.NEXT_PHASE;
});

beforeEach(() => {
  jest.mocked(getLeaderboard).mockResolvedValue({ data: [], error: LEADERBOARD_UNAVAILABLE });
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

  it("renders a production revalidation while another board is down, since only Medium is served", async () => {
    env.NODE_ENV = "production";
    delete env.NEXT_PHASE;
    jest.mocked(getLeaderboard).mockImplementation(async (board) =>
      board.difficulty === "medium" ? { data: [] } : { data: [], error: LEADERBOARD_UNAVAILABLE },
    );

    await renderPage();

    expect(screen.getByText(enMessages.leaderboard.emptyTitle)).toBeInTheDocument();
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

describe("LeaderboardPage served boards", () => {
  it("reads only the Medium board, so each revalidation writes one board per locale", async () => {
    jest.mocked(getLeaderboard).mockClear().mockResolvedValue({ data: [] });

    await renderPage();

    expect(jest.mocked(getLeaderboard)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(getLeaderboard)).toHaveBeenCalledWith({ difficulty: "medium" });
  });
});

describe("LeaderboardPage daily board", () => {
  it("reads today's rows in the browser when the Daily tab opens", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-13T10:00:00Z") });
    global.fetch = jest.fn(() => new Promise<Response>(() => {}));
    jest.mocked(getLeaderboard).mockResolvedValue({ data: [] });

    await renderPage();
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Daily" }));
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/leaderboard?difficulty=daily&daily_day=2026-10-13", expect.anything());
  });
});
