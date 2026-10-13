import { act, render, screen, fireEvent, waitFor } from "@/test-utils/intl";
import LeaderboardTabsFromSearchParams, { LeaderboardTabs, type LeaderboardBoards } from "@/components/leaderboard/LeaderboardTabs";
import type { CountryCode } from "@/lib/leaderboard/countries";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { splitClientMessages } from "@/lib/articles/messageScope";
import type { AbstractIntlMessages } from "next-intl";
import enMessages from "../../../../messages/en.json";

let searchParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

const boards: LeaderboardBoards = {
  daily: { data: [], day: "2026-10-13" },
  easy: { data: [] },
  medium: { data: [] },
  hard: { data: [] },
  grandmaster: { data: [] },
};

const dailyRow = (name: string, day: string): LeaderboardEntry => ({
  id: `${name}-${day}`,
  player_name: name,
  difficulty: "daily",
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

const ROWS_BY_DAY: Record<string, LeaderboardEntry[]> = {
  "2026-10-13": [dailyRow("Ada Today", "2026-10-13")],
  "2026-10-14": [],
};

type ReadBody = { data?: LeaderboardEntry[]; error?: string };

const notYet = () => Promise.resolve({ json: () => Promise.resolve<ReadBody>({ error: "Invalid difficulty level" }) });
const offline = () =>
  Promise.resolve({ json: () => Promise.resolve<ReadBody>({ data: [], error: "Database connection unavailable. Please check the application configuration." }) });
const mediumRow: LeaderboardEntry = { ...dailyRow("Mo Medium", "2026-10-13"), difficulty: "medium", daily_day: null };

const readByDay = (input: string): Promise<{ json: () => Promise<ReadBody> }> => {
  const day = new URL(input, "http://localhost").searchParams.get("daily_day") ?? "";
  return Promise.resolve({ json: () => Promise.resolve({ data: ROWS_BY_DAY[day] ?? [] }) });
};
const fetchMock = jest.fn(readByDay);

const SystemDateTimeFormat = Intl.DateTimeFormat;

/** Jest's sandboxed process.env cannot move V8's default zone, so the viewer's zone is emulated where formatters read it. */
function emulateTimeZone(timeZone: string) {
  jest
    .spyOn(Intl, "DateTimeFormat")
    .mockImplementation((locale, options) => new SystemDateTimeFormat(locale, { ...options, timeZone: options?.timeZone ?? timeZone }));
}

beforeEach(() => {
  searchParams = new URLSearchParams();
  fetchMock.mockReset().mockImplementation(readByDay);
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  Reflect.deleteProperty(document, "visibilityState");
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// The leaderboard page receives only the shared groups; the daily page groups stay on /daily.
const pageMessages = splitClientMessages(enMessages as unknown as AbstractIntlMessages).shared;

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

async function renderDailyAt(iso: string, timeZone: string) {
  emulateTimeZone(timeZone);
  jest.useFakeTimers({ now: new Date(iso) });
  render(<LeaderboardTabs boards={boards} initialTab="daily" />, { messages: pageMessages });
  await act(async () => {});
}

describe("LeaderboardTabs keyboard access", () => {
  it("makes the active tab the one tab stop on first render", () => {
    render(<LeaderboardTabs boards={boards} initialTab="medium" />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute("tabindex")])).toEqual([
      ["Daily", "-1"],
      ["Easy", "-1"],
      ["Medium", "0"],
      ["Hard", "-1"],
      ["Grandmaster", "-1"],
    ]);
  });

  it("moves to the next tab with ArrowRight and makes it the tab stop", async () => {
    render(<LeaderboardTabs boards={boards} initialTab="medium" />);
    const medium = screen.getByRole("tab", { name: "Medium" });
    const hard = screen.getByRole("tab", { name: "Hard" });

    medium.focus();
    fireEvent.keyDown(medium, { key: "ArrowRight" });

    await waitFor(() => expect(hard).toHaveFocus());
    expect(hard).toHaveAttribute("data-state", "active");
    expect(hard).toHaveAttribute("tabindex", "0");
    expect(medium).toHaveAttribute("tabindex", "-1");
  });
});

describe("the Daily tab", () => {
  it("sits before Easy while the page still opens on Medium", () => {
    render(<LeaderboardTabsFromSearchParams boards={boards} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Daily", "Easy", "Medium", "Hard", "Grandmaster"]);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Medium");
  });

  it("opens from ?difficulty=daily like the other boards", () => {
    searchParams = new URLSearchParams("difficulty=daily");
    render(<LeaderboardTabsFromSearchParams boards={boards} />);

    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Daily");
  });

  it("shows the day's setting and a reset at 08:00 for a viewer in Singapore", async () => {
    await renderDailyAt("2026-10-13T19:47:30Z", "Asia/Singapore");

    expect(screen.getByText("6 pieces · 10 s to study")).toBeInTheDocument();
    expect(screen.getByText("Resets at 00:00 UTC (08:00 your time), in 4 h 12 min")).toBeInTheDocument();
  });

  it("shows the same reset at 20:00 the evening before for a viewer in New York", async () => {
    await renderDailyAt("2026-10-13T19:47:30Z", "America/New_York");

    expect(screen.getByText("Resets at 00:00 UTC (20:00 your time), in 4 h 12 min")).toBeInTheDocument();
  });

  it("rounds the last minute down to under a minute", async () => {
    await renderDailyAt("2026-10-13T23:59:30Z", "UTC");

    expect(screen.getByText("Resets at 00:00 UTC (00:00 your time), in under a minute")).toBeInTheDocument();
  });

  it("reads only today's rows and swaps to the new day's board at UTC midnight without a reload", async () => {
    await renderDailyAt("2026-10-13T23:59:45Z", "UTC");

    expect(fetchMock).toHaveBeenLastCalledWith("/api/leaderboard?difficulty=daily&daily_day=2026-10-13", expect.anything());
    expect(screen.getByText("Ada Today")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(fetchMock).toHaveBeenLastCalledWith("/api/leaderboard?difficulty=daily&daily_day=2026-10-14", expect.anything());
    expect(screen.queryByText("Ada Today")).not.toBeInTheDocument();
    expect(screen.getByText("Be the First Champion!")).toBeInTheDocument();
    expect(screen.getByText("Resets at 00:00 UTC (00:00 your time), in 23 h 59 min")).toBeInTheDocument();
  });

  it("keeps the new day's board on screen while a read the server is not ready for is retried a few seconds later", async () => {
    fetchMock.mockImplementationOnce(notYet);
    await renderDailyAt("2026-10-14T00:00:05Z", "UTC");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Be the First Champion!")).toBeInTheDocument();
    expect(screen.queryByText(/Invalid difficulty level/)).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/leaderboard?difficulty=daily&daily_day=2026-10-14", expect.anything());
    expect(screen.getByText("Be the First Champion!")).toBeInTheDocument();
  });

  it("shows the unavailable state, not the server's message, only once the day's reads have failed for over a minute", async () => {
    fetchMock.mockImplementation(notYet);
    await renderDailyAt("2026-10-14T00:00:05Z", "UTC");

    await act(async () => {
      jest.advanceTimersByTime(55_000);
    });
    expect(screen.queryByText("Leaderboard Temporarily Unavailable")).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(screen.getByText("Leaderboard Temporarily Unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/Invalid difficulty level/)).not.toBeInTheDocument();
  });

  it("shows the unavailable state when the daily read has no database", async () => {
    fetchMock.mockImplementation(offline);
    await renderDailyAt("2026-10-14T10:00:00Z", "UTC");

    await act(async () => {
      jest.advanceTimersByTime(65_000);
    });

    expect(screen.getByText("Leaderboard Temporarily Unavailable")).toBeInTheDocument();
  });

  it("does not show yesterday's rows under today's reset line before today's read returns", async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    emulateTimeZone("UTC");
    jest.useFakeTimers({ now: new Date("2026-10-14T00:00:05Z") });
    render(<LeaderboardTabs boards={{ ...boards, daily: { data: ROWS_BY_DAY["2026-10-13"], day: "2026-10-13" } }} initialTab="daily" />, {
      messages: pageMessages,
    });
    await act(async () => {});

    expect(screen.getByText("Resets at 00:00 UTC (00:00 your time), in 23 h 59 min")).toBeInTheDocument();
    expect(screen.queryByText("Ada Today")).not.toBeInTheDocument();
  });

  it("stops retrying the daily read once the viewer leaves the Daily tab", async () => {
    fetchMock.mockImplementation(notYet);
    await renderDailyAt("2026-10-14T00:00:05Z", "UTC");

    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Medium" }));
    });
    await act(async () => {
      jest.advanceTimersByTime(120_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries every 5 s for the first minute of failure, then once a minute", async () => {
    fetchMock.mockImplementation(offline);
    await renderDailyAt("2026-10-14T10:00:00Z", "UTC");

    for (let second = 0; second < 180; second++) {
      await act(async () => {
        jest.advanceTimersByTime(1_000);
      });
    }

    expect(fetchMock).toHaveBeenCalledTimes(15);
  });

  it("makes no daily reads while the tab is hidden and one as soon as it is visible again", async () => {
    fetchMock.mockImplementation(offline);
    await renderDailyAt("2026-10-14T10:00:00Z", "UTC");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    await act(async () => {
      jest.advanceTimersByTime(300_000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setVisibility("visible");
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("leaves Medium untouched when a slow daily read lands after the viewer switched to it", async () => {
    let land: (body: ReadBody) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (land = (body) => resolve({ json: () => Promise.resolve(body) }))));
    emulateTimeZone("UTC");
    jest.useFakeTimers({ now: new Date("2026-10-13T10:00:00Z") });
    render(<LeaderboardTabs boards={{ ...boards, medium: { data: [mediumRow] } }} initialTab="daily" />, { messages: pageMessages });
    await act(async () => {});

    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Medium" }));
    });
    await act(async () => {
      land({ data: ROWS_BY_DAY["2026-10-13"] });
    });

    expect(screen.getByText("Mo Medium")).toBeInTheDocument();
    expect(screen.queryByText("Ada Today")).not.toBeInTheDocument();
  });

  it("points the empty daily board at /daily rather than a /game preset", async () => {
    await renderDailyAt("2026-10-14T10:00:00Z", "UTC");

    expect(screen.getByRole("link", { name: "Start Playing Now" })).toHaveAttribute("href", "/daily");
  });
});
