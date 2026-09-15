import { render, screen } from "@/test-utils/intl";
import { getLeaderboard } from "@/lib/services/leaderboardService";
import LeaderboardPage from "@/app/[locale]/leaderboard/page";
import enMessages from "../../../../../messages/en.json";

jest.mock("@/lib/services/leaderboardService", () => ({
  getLeaderboard: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>Memory Chess header</div>;
  }

  return MockPageHeader;
});

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
