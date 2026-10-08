import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { DailyPanel } from "@/components/home/LabDailyPanel";
import { buildRoundRecord, type RoundRecord } from "@/lib/lab/record";

const BOARD = "8/8/8/1pQ4k/P2p4/8/8/1K6";
const MISSED_QUEEN = "8/8/8/1p5k/P2p4/8/8/1K6";
const EVENING = Date.parse("2026-10-09T18:47:30Z");

function daily(day: string, placedFen = BOARD): RoundRecord {
  const endedAt = Date.parse(`${day}T09:00:00Z`);
  return buildRoundRecord(
    { id: `daily-${day}`, source: "game", endedAt, localDay: day, pieceCount: 6, memorizeSeconds: 10, targetFen: BOARD, placedFen, memorizeMs: 10000, solveMs: 15000 },
    { kind: "daily", dailyDay: day, startSource: "daily" },
  );
}

const playLink = () => screen.queryByRole("link", { name: "Play today's board →" });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(EVENING);
});

afterEach(() => {
  jest.useRealTimers();
  window.localStorage.clear();
});

describe("today's board panel", () => {
  it("shows only what is the same for everyone until the record is read, with the link to play", () => {
    render(<DailyPanel records={[]} ready={false} />);

    expect(screen.getByRole("heading", { name: "One board a day, the same for everyone." })).toBeInTheDocument();
    expect(playLink()).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=daily");
    expect(screen.queryByText("You have not played today's board yet.")).not.toBeInTheDocument();
  });

  it("offers today's board with the daily streak so far and the time until it resets", () => {
    render(<DailyPanel records={[daily("2026-10-06"), daily("2026-10-07"), daily("2026-10-08")]} ready />);

    expect(screen.getByText("You have not played today's board yet.")).toBeInTheDocument();
    expect(screen.getByText("Daily streak 3 days · longest 3 days")).toBeInTheDocument();
    expect(screen.getByText("Resets in 5 h 12 min")).toBeInTheDocument();
    expect(playLink()).toBeInTheDocument();
  });

  it("offers no second look at a board opened today and left before the result", () => {
    window.localStorage.setItem("memory-chess-lab-daily-opened", "2026-10-09");
    render(<DailyPanel records={[daily("2026-10-08")]} ready />);

    expect(screen.getByText("You opened today's board and left before the result. One try per day on this device.")).toBeInTheDocument();
    expect(screen.getByText("Daily streak 1 day · longest 1 day")).toBeInTheDocument();
    expect(playLink()).not.toBeInTheDocument();
  });

  it("shows the result in a few lines once the board is played, with the board grid folded away", () => {
    render(<DailyPanel records={[daily("2026-10-08"), daily("2026-10-09", MISSED_QUEEN)]} ready />);

    expect(screen.getByText("You placed 5 of 6 pieces right, 83 percent.")).toBeInTheDocument();
    expect(screen.getByText("Daily streak 2 days · longest 2 days")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy result" })).toBeInTheDocument();
    expect(screen.getByText("Resets in 5 h 12 min")).toBeInTheDocument();
    const grid = screen.getByRole("img", { name: "Your result on each square, a8 first: 5 correct, 0 wrong pieces, 1 missed, 0 extra." });
    expect(grid.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Show the grid").tagName).toBe("SUMMARY");
    expect(grid).toHaveTextContent(
      "⬜⬜⬜⬜⬜⬜⬜⬜ ⬜⬜⬜⬜⬜⬜⬜⬜ ⬜⬜⬜⬜⬜⬜⬜⬜ ⬜🟩🟥⬜⬜⬜⬜🟩 🟩⬜⬜🟩⬜⬜⬜⬜ ⬜⬜⬜⬜⬜⬜⬜⬜ ⬜⬜⬜⬜⬜⬜⬜⬜ ⬜🟩⬜⬜⬜⬜⬜⬜".replaceAll(" ", "\n"),
      { normalizeWhitespace: false },
    );
    expect(playLink()).not.toBeInTheDocument();
  });

  it("keeps the longest daily streak in view after the current one ends", () => {
    render(<DailyPanel records={[daily("2026-10-01"), daily("2026-10-02"), daily("2026-10-03")]} ready />);

    expect(screen.getByText("Longest daily streak 3 days")).toBeInTheDocument();
  });

  it("copies the result as one cell per piece in outcome order, never where the pieces stood", async () => {
    const writeText = jest.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    render(<DailyPanel records={[daily("2026-10-09", MISSED_QUEEN)]} ready />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy result" })));

    expect(writeText.mock.calls).toEqual([["Memory Chess daily board 2026-10-09\n5 of 6 right, 83%\n🟩🟩🟩🟩🟩🟥\nthememorychess.com"]]);
    expect(screen.getByRole("status")).toHaveTextContent("Copied. Paste it anywhere.");
  });

  it("selects the result text to copy by hand where the clipboard is refused", async () => {
    Object.assign(navigator, { clipboard: { writeText: () => Promise.reject(new Error("denied")) } });
    render(<DailyPanel records={[daily("2026-10-09", MISSED_QUEEN)]} ready />);

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy result" })));

    expect(screen.getByRole("status")).toHaveTextContent("Copy did not work here. The result is selected below, so copy it yourself.");
    expect(window.getSelection()?.toString()).toBe("Memory Chess daily board 2026-10-09\n5 of 6 right, 83%\n🟩🟩🟩🟩🟩🟥\nthememorychess.com");
  });

  it("opens the next board once midnight UTC passes, without a reload", () => {
    render(<DailyPanel records={[daily("2026-10-09")]} ready />);

    act(() => jest.advanceTimersByTime(5 * 3_600_000 + 13 * 60_000));

    expect(screen.getByText("You have not played today's board yet.")).toBeInTheDocument();
    expect(screen.getByText("Daily streak 1 day · longest 1 day")).toBeInTheDocument();
    expect(screen.getByText("Resets in 23 h 59 min")).toBeInTheDocument();
  });
});
