import { act, fireEvent, render, screen, waitFor, within } from "@/test-utils/intl";
import { DailyBoard } from "@/components/daily/DailyBoard";
import type { DailyRound } from "@/lib/lab/daily";
import { DAILY_ENTRY_KEY } from "@/lib/lab/entries";
import type { CountryCode } from "@/lib/leaderboard/countries";
import { useSettingsStore } from "@/stores/settingsStore";

const ROUND_ON_13 = {
  v: 2,
  kind: "daily",
  dailyDay: "2026-10-13",
  endedAt: Date.parse("2026-10-13T23:58:00Z"),
  correct: 4,
  wrong: 2,
  extra: 0,
  solveMs: 12_340,
  memorizeMs: 8_000,
  config: { pieceCount: 6, memorizeSeconds: 10, difficulty: "medium" },
  squares: "cccc" + "ww" + ".".repeat(58),
} as unknown as DailyRound;

/** A render whose read failed, so the board reads its rows on the client as it did before rows were server rendered. */
const NOT_RENDERED = { today: "2026-10-14", board: null, readAt: 0 };

let mockRecords: readonly DailyRound[] = [];
jest.mock("@/hooks/useLabData", () => ({
  useLabData: () => ({ storage: "available", records: mockRecords }),
}));

const ENTRY_ID = "3c3c3c3c-0000-4000-8000-000000000003";
const OCTOBER_13 = "Daily board · Tuesday, October 13";

let posts: Record<string, unknown>[] = [];

beforeEach(() => {
  posts = [];
  window.localStorage.clear();
  useSettingsStore.setState({ countryCode: "SG" as CountryCode });
  mockRecords = [ROUND_ON_13];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      posts.push(body);
      return { ok: true, json: async () => ({ success: true, data: { id: ENTRY_ID, ...body } }) };
    }
    return { ok: true, json: async () => ({ data: [] }) };
  }) as unknown as typeof fetch;
});

afterEach(() => jest.useRealTimers());

const lateSection = () => screen.getByRole("region", { name: OCTOBER_13 });

describe("a daily round finished after midnight UTC", () => {
  it("offers the join form for the 13th's board at 00:02 on the 14th and posts it for the 13th", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-14T00:02:00Z"), doNotFake: ["queueMicrotask", "nextTick"] });

    render(<DailyBoard rendered={NOT_RENDERED} />);
    await act(async () => {});

    expect(screen.getByRole("heading", { name: "Today's board is open" })).toBeInTheDocument();
    const late = lateSection();
    expect(within(late).getByText("4 of 6 right")).toBeInTheDocument();
    fireEvent.change(within(late).getByLabelText("Name"), { target: { value: "Poteto" } });
    fireEvent.click(within(late).getByRole("button", { name: "Join the board" }));

    await waitFor(() => expect(within(lateSection()).getByRole("status")).toHaveTextContent("You are on the board for that day"));
    expect(posts).toMatchObject([{ difficulty: "daily", daily_day: "2026-10-13", piece_count: 6, memorize_time: 10 }]);
  });

  it("tells a player who played the 13th's board at 10:00 and did not join that they can still join it the next morning", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-14T09:00:00Z"), doNotFake: ["queueMicrotask", "nextTick"] });
    mockRecords = [{ ...ROUND_ON_13, endedAt: Date.parse("2026-10-13T10:00:00Z") }];

    render(<DailyBoard rendered={NOT_RENDERED} />);
    await act(async () => {});

    expect(within(lateSection()).getByText("You played yesterday's board and have not joined it yet.")).toBeInTheDocument();
  });

  it("keeps the form for a round finished at 23:58 when the clock passes midnight before the player joins", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-13T23:58:30Z"), doNotFake: ["queueMicrotask", "nextTick"] });

    render(<DailyBoard rendered={NOT_RENDERED} />);
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Join the board" })).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(120_000);
    });

    expect(within(lateSection()).getByRole("button", { name: "Join the board" })).toBeInTheDocument();
  });

  it("never puts the 13th's join card on the page, not even for one frame, once this device has joined that day's board", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-14T00:02:00Z"), doNotFake: ["queueMicrotask", "nextTick"] });
    window.localStorage.setItem(
      DAILY_ENTRY_KEY,
      JSON.stringify([{ id: ENTRY_ID, difficulty: "daily", dailyDay: "2026-10-13", country: "SG", score: { correctPieces: 4, totalWrongPieces: 2, memorizeTime: 10, solutionTime: 12.34 }, submittedAt: 1 }]),
    );
    const container = document.body.appendChild(document.createElement("div"));
    const added: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) record.addedNodes.forEach((node) => node instanceof HTMLElement && added.push(node.outerHTML));
    });
    observer.observe(container, { childList: true, subtree: true });

    render(<DailyBoard rendered={NOT_RENDERED} />, { container });
    await act(async () => {});
    observer.disconnect();

    expect(added.join("").includes("Daily board · Tuesday, October 13")).toBe(false);
    expect(added.join("").includes("Daily board · Wednesday, October 14")).toBe(true);
  });
});
