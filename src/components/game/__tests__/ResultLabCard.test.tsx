import { act, fireEvent, render, screen, within } from "@/test-utils/intl";
import ResultLabCard, { RESULT_LAB_WAIT_MS } from "@/components/game/ResultLabCard";
import { useLabData, type LabData } from "@/hooks/useLabData";
import { trackEvent } from "@/lib/analytics/events";
import { round } from "@/lib/lab/__tests__/fixtures";
import type { RoundRecord } from "@/lib/lab/record";
import { summarize } from "@/lib/lab/summary";
import { resetWeekGoalSession } from "@/components/home/useWeekGoal";
import { seconds } from "@/components/home/labFormat";

jest.mock("@/hooks/useLabData", () => ({ ...jest.requireActual("@/hooks/useLabData"), useLabData: jest.fn() }));
jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const TODAY = "2026-10-07";

let clock = 0;
function played(id: string, accuracy: number, { pieces = 6, day = 7, solveMs = 20000 } = {}): RoundRecord {
  clock += 1;
  const record = round({
    id,
    pieceCount: pieces,
    solveMs,
    endedAt: Date.UTC(2026, 9, day, 8) + clock * 60_000,
    localDay: `2026-10-${String(day).padStart(2, "0")}`,
  });
  return { ...record, accuracy };
}

function withRecord(records: readonly RoundRecord[], storage: LabData["storage"] = "available") {
  jest.mocked(useLabData).mockReturnValue({ storage, records, summary: summarize(records), lastBackup: null, today: storage === "available" ? TODAY : "" });
}

function renderCard(roundId: string) {
  const onPlay = jest.fn();
  const view = render(<ResultLabCard roundId={roundId} onPlay={onPlay} />);
  return { onPlay, ...view };
}

const linesOf = () =>
  within(screen.getByRole("list", { name: "This round in your record" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

beforeEach(() => {
  clock = 0;
  window.localStorage.clear();
  resetWeekGoalSession();
  jest.mocked(trackEvent).mockClear();
});

describe("ResultLabCard", () => {
  it("shows a first round only the streak and a link that replays the setting in place", () => {
    withRecord([played("first", 67)]);
    const { onPlay } = renderCard("first");

    expect(screen.getByRole("region", { name: "Your lab record" })).toBeInTheDocument();
    expect(linesOf()).toEqual(["·Day 1, 1 of 5 days this week"]);
    const link = screen.getByRole("link", { name: `Play again at 6 pieces, ${seconds(10)} →` });
    expect(link).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=result_next");

    fireEvent.click(link);

    expect(onPlay).toHaveBeenCalledWith(6, 10, "result_next");
    expect(jest.mocked(trackEvent).mock.calls).toEqual([[{ name: "lab_panel_action", params: { panel: "resultCard", action: "next" } }]]);
  });

  it("prints a new best, the change against recent rounds, a raised span and the streak, then one more piece", () => {
    const records = [played("a", 70, { day: 5 }), played("b", 85, { day: 6 }), played("c", 60, { day: 6 }), played("d", 92)];
    withRecord(records);
    renderCard("d");

    expect(linesOf()).toEqual([
      `·New best at 6 pieces, ${seconds(10)}: 92%, up from 85%`,
      "·20 points above your last 3 rounds at this setting",
      "·Span up to 6 pieces",
      "·Day 3 in a row, 3 of 5 days this week",
    ]);
    expect(screen.getByText(/^Next\./).closest("p")?.textContent).toBe(`Next. 90% or better, so one more piece at the same study time. Play 7 pieces, ${seconds(10)} →`);
    expect(screen.getByRole("link", { name: `Play 7 pieces, ${seconds(10)} →` })).toHaveAttribute("href", "/game?pieceCount=7&memorizeTime=10&source=result_next");
  });

  it("says a matched best was rebuilt faster, and a round under the recent mean is below it", () => {
    withRecord([played("a", 75, { solveMs: 20000 }), played("b", 75, { solveMs: 18800 })]);
    const { unmount } = renderCard("b");
    expect(linesOf()[0]).toBe(`·New best at 6 pieces, ${seconds(10)}: 75% again, ${seconds("1.2")} faster`);
    unmount();

    clock = 0;
    withRecord([played("a", 75), played("b", 76), played("c", 77), played("d", 75)]);
    renderCard("d");
    expect(linesOf()).toEqual(["·1 point below your last 3 rounds at this setting", "·Day 1, 1 of 5 days this week"]);
  });

  it("opens a modified click in a new tab instead of starting the round here", () => {
    withRecord([played("first", 40)]);
    const { onPlay } = renderCard("first");

    fireEvent.click(screen.getByRole("link", { name: `Play 5 pieces, ${seconds(10)} →` }), { metaKey: true });

    expect(onPlay).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("keeps the slot while the round is on its way and leaves quietly when it never arrives", () => {
    jest.useFakeTimers();
    try {
      withRecord([played("older", 60)]);
      const { container } = renderCard("missing");
      expect(screen.getByTestId("result-lab-slot")).toBeInTheDocument();

      act(() => jest.advanceTimersByTime(RESULT_LAB_WAIT_MS - 1));
      expect(screen.getByTestId("result-lab-slot")).toBeInTheDocument();
      act(() => jest.advanceTimersByTime(1));

      expect(container).toBeEmptyDOMElement();
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows the card once the round reaches the record within the wait", () => {
    jest.useFakeTimers();
    try {
      withRecord([]);
      const { rerender } = renderCard("late");
      act(() => jest.advanceTimersByTime(RESULT_LAB_WAIT_MS - 100));
      withRecord([played("late", 67)]);
      rerender(<ResultLabCard roundId="late" onPlay={jest.fn()} />);
      act(() => jest.advanceTimersByTime(RESULT_LAB_WAIT_MS));

      expect(screen.getByRole("region", { name: "Your lab record" })).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("draws nothing when this device keeps no record", () => {
    withRecord([], "unavailable");
    const { container } = renderCard("first");

    expect(container).toBeEmptyDOMElement();
  });
});
