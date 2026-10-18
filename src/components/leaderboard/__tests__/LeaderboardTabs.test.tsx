import { act, render, screen, fireEvent, waitFor, within } from "@/test-utils/intl";
import LeaderboardTabs, { type LeaderboardBoards } from "@/components/leaderboard/LeaderboardTabs";
import type { CountryCode } from "@/lib/leaderboard/countries";
import { LEADERBOARD_UNAVAILABLE, type LeaderboardEntry } from "@/types/leaderboard";
import { splitClientMessages } from "@/lib/articles/messageScope";
import type { AbstractIntlMessages } from "next-intl";
import enMessages from "../../../../messages/en.json";

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
  Promise.resolve({ json: () => Promise.resolve<ReadBody>({ data: [], error: LEADERBOARD_UNAVAILABLE }) });
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

function openAt(search: string) {
  window.history.replaceState(null, "", `/leaderboard${search}`);
}

beforeEach(() => {
  openAt("");
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
  openAt("?difficulty=daily");
  render(<LeaderboardTabs boards={boards} />, { messages: pageMessages });
  await act(async () => {});
}

describe("LeaderboardTabs keyboard access", () => {
  it("makes the active tab the one tab stop on first render", () => {
    render(<LeaderboardTabs boards={boards} />);

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
    render(<LeaderboardTabs boards={boards} />);
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
    render(<LeaderboardTabs boards={boards} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Daily", "Easy", "Medium", "Hard", "Grandmaster"]);
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Medium");
  });

  it("opens from ?difficulty=daily like the other boards", () => {
    openAt("?difficulty=daily");
    render(<LeaderboardTabs boards={boards} />);

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
    expect(within(screen.getByRole("tabpanel")).getByText("Be the First Champion!")).toBeInTheDocument();
    expect(screen.getByText("Resets at 00:00 UTC (00:00 your time), in 23 h 59 min")).toBeInTheDocument();
  });

  it("keeps the new day's board on screen while a read the server is not ready for is retried a few seconds later", async () => {
    fetchMock.mockImplementationOnce(notYet);
    await renderDailyAt("2026-10-14T00:00:05Z", "UTC");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(within(screen.getByRole("tabpanel")).getByText("Be the First Champion!")).toBeInTheDocument();
    expect(screen.queryByText(/Invalid difficulty level/)).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/leaderboard?difficulty=daily&daily_day=2026-10-14", expect.anything());
    expect(within(screen.getByRole("tabpanel")).getByText("Be the First Champion!")).toBeInTheDocument();
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
    openAt("?difficulty=daily");
    render(<LeaderboardTabs boards={{ ...boards, daily: { data: ROWS_BY_DAY["2026-10-13"], day: "2026-10-13" } }} />, {
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
    openAt("?difficulty=daily");
    render(<LeaderboardTabs boards={{ ...boards, medium: { data: [mediumRow] } }} />, { messages: pageMessages });
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

describe("a link from the result screen", () => {
  it("opens the board it names, highlights the round, and reads that board fresh, past any shared cache", async () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-13T09:00:00Z"));
    const hardRow: LeaderboardEntry = { ...mediumRow, id: "hana", player_name: "Hana Hard", difficulty: "hard" };
    fetchMock.mockImplementation(() => Promise.resolve({ json: () => Promise.resolve({ data: [hardRow] }) }));
    Element.prototype.scrollIntoView = jest.fn();
    openAt("?difficulty=hard&player=Hana%20Hard&memorizeTime=10&solutionTime=20&pieceCount=6&correctPieces=6&totalWrongPieces=0");

    render(<LeaderboardTabs boards={boards} />);
    await act(async () => {});

    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent("Hard");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenLastCalledWith("/api/leaderboard?difficulty=hard&after=1791882000000", expect.anything());
    jest.mocked(Date.now).mockRestore();
    const row = within(screen.getByRole("tabpanel")).getByText("Hana Hard").closest("tr");
    expect(row).toHaveAttribute("data-highlighted", "");
    expect(row).toHaveTextContent("You");
  });
});

describe("switching boards", () => {
  it("shows only the open board and keeps a board drawn once it has been opened", async () => {
    render(<LeaderboardTabs boards={{ ...boards, medium: { data: [mediumRow] } }} />);
    const mediumName = screen.getByText("Mo Medium");

    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Hard" }));
    });
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    expect(screen.queryByText("Mo Medium")).not.toBeVisible();

    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Medium" }));
    });
    expect(screen.getByRole("tabpanel")).toContainElement(mediumName);
    expect(mediumName).toBeVisible();
  });
});

describe("the Telegram line", () => {
  it("sits under the table as a plain outbound link", () => {
    render(<LeaderboardTabs boards={boards} />);

    expect(screen.getByText(/Talk with the players on this leaderboard\./)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Join the Telegram group" });
    expect(link).toHaveAttribute("href", "https://t.me/TheMemoryChess");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("id", "community-leaderboard");
  });
});
