import { fireEvent, render, screen, waitFor } from "@/test-utils/intl";
import { DailyJoinForm } from "@/components/daily/DailyJoinForm";
import type { DailyRound } from "@/lib/lab/daily";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CountryCode } from "@/lib/leaderboard/countries";

jest.mock("@/lib/lab/entries", () => {
  throw new Error("Loading chunk 77 failed");
});

const ROUND = {
  v: 2,
  kind: "daily",
  dailyDay: "2026-10-13",
  correct: 4,
  wrong: 2,
  extra: 0,
  solveMs: 12_340,
  memorizeMs: 8_000,
  config: { pieceCount: 6, memorizeSeconds: 10, difficulty: "medium" },
  squares: ".".repeat(64),
} as unknown as DailyRound;

const ENTRY_ID = "3c3c3c3c-0000-4000-8000-000000000003";

describe("joining the daily board when the stored-entries code fails to load", () => {
  it("joins with the row the server sent back", async () => {
    useSettingsStore.setState({ countryCode: "SG" as CountryCode });
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      json: async () => ({ success: true, data: { id: ENTRY_ID, ...JSON.parse(String(init?.body)) } }),
    })) as unknown as typeof fetch;
    const onJoined = jest.fn();

    render(<DailyJoinForm round={ROUND} onJoined={onJoined} />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Poteto" } });
    fireEvent.click(screen.getByRole("button", { name: "Join the board" }));

    await waitFor(() => expect(onJoined).toHaveBeenCalled());
    expect(onJoined.mock.calls[0][0]).toMatchObject({
      id: ENTRY_ID,
      difficulty: "daily",
      dailyDay: "2026-10-13",
      country: "SG",
      score: { correctPieces: 4, totalWrongPieces: 2, memorizeTime: 10, solutionTime: 12.34 },
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
