import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { NOTEBOOK_SEEN_KEY } from "@/components/home/useNotebookSeen";
import { trackEvent } from "@/lib/analytics/events";
import { persona } from "@/test-utils/labPersona";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const panel = (name: string) => screen.getByText(new RegExp(`^Fig\\. 6\\.\\d+ · ${name}$`)).closest(".lab-panel") as HTMLElement;
const lines = (list: HTMLElement) => within(list).getAllByRole("listitem").map((item) => item.textContent);

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe("insights panel", () => {
  it("shows one example finding, tagged Sample and phrased about a sample record, before any round", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);
    const insights = panel("Insights");

    expect(screen.getByText("Fig. 6.10 · Insights")).toBeInTheDocument();
    expect(within(insights).getByText("Sample")).toBeInTheDocument();
    expect(lines(within(insights).getByRole("list", { name: "Sample finding" }))).toEqual([
      "Example from a sample record: the a and h files missed about twice as often as the centre files, d and e, 38% of pieces against 19%.Play 8 pieces, 15 s →",
    ]);
    expect(within(insights).getByText("Sample finding, not from your rounds.")).toBeInTheDocument();
  });

  it("says how many more rounds it needs while warming", () => {
    renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);
    const insights = panel("Insights");

    expect(within(insights).getByText("Your record")).toBeInTheDocument();
    expect(within(insights).getByText("Insights read your record from 10 rounds. 8 more rounds to go.")).toBeInTheDocument();
    expect(within(insights).queryByRole("list")).toBeNull();
  });

  it("says plainly when nothing stands out, as the player's own record", () => {
    renderWithIntl(<LabRecordSection record={persona("threeDays")} />);
    const insights = panel("Insights");

    expect(within(insights).getByText("Your record")).toBeInTheDocument();
    expect(within(insights).getByText("Nothing stands out yet. Keep playing.")).toBeInTheDocument();
    expect(within(insights).getByText("From 12 rounds")).toBeInTheDocument();
  });

  it("writes each finding with the counts behind it and an action, for the thirty-day player", () => {
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);
    const list = within(panel("Insights")).getByRole("list", { name: "Findings from your record" });

    expect(lines(list)).toEqual([
      "You miss the a and h files about 5.5 times as often as the centre files, d and e: 68% of 151 pieces against 12% of 138.Play 8 pieces, 15 s →",
      "Of the pieces other than kings seen 20 times or more, queens slip most: you recalled 12 of 26, 46%.Read the pattern recognition drills →",
    ]);
    expect(within(list).getByRole("link", { name: "Play 8 pieces, 15 s →" })).toHaveAttribute("href", "/game?pieceCount=8&memorizeTime=15&source=insight");
    expect(within(list).getByRole("link", { name: "Read the pattern recognition drills →" })).toHaveAttribute("href", "/learn/chess-pattern-recognition-drills");
    expect(within(panel("Insights")).getByText("From 90 rounds")).toBeInTheDocument();
  });

  it("reports a drill and a guide from a finding as counts-only panel actions", () => {
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);
    const list = within(panel("Insights")).getByRole("list");

    fireEvent.click(within(list).getByRole("link", { name: "Play 8 pieces, 15 s →" }));
    fireEvent.click(within(list).getByRole("link", { name: "Read the pattern recognition drills →" }));

    expect(jest.mocked(trackEvent).mock.calls.slice(-2)).toEqual([
      [{ name: "lab_panel_action", params: { panel: "insights", action: "play" } }],
      [{ name: "lab_panel_action", params: { panel: "insights", action: "guide" } }],
    ]);
  });

  it("keeps a stale player's finding and says when they last played", () => {
    renderWithIntl(<LabRecordSection record={persona("stale")} />);
    const insights = panel("Insights");

    expect(lines(within(insights).getByRole("list"))).toEqual([
      "At 6 pieces, 10 s your last 10 rounds took 0.5 s less per correct piece than the 10 before, and accuracy fell 9 points.Play 6 pieces, 10 s →",
    ]);
    expect(within(insights).getByText(/Last played 20 days ago\./)).toBeInTheDocument();
  });
});

describe("lab notebook panel", () => {
  it("shows sample entries, tagged Sample, and says entries appear with play", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor", "")} />);
    const notebook = panel("Lab notebook");

    expect(screen.getByText("Fig. 6.7 · Lab notebook")).toBeInTheDocument();
    expect(within(notebook).getByText("Sample")).toBeInTheDocument();
    expect(lines(within(notebook).getByRole("list", { name: "Sample notebook entries" }))).toEqual([
      "Day 12. Memory span moved from 6 to 8 pieces.",
      "Day 9. First 90 percent or better at 8 pieces.",
      "Day 7. 7 days in a row.",
      "Day 4. Round 10 played.",
      "Day 1. First round: 67 percent at 6 pieces.",
    ]);
    expect(within(notebook).getByText("Entries appear as you play.")).toBeInTheDocument();
  });

  it("lists the player's entries newest first and tags in words those after the last visit", () => {
    localStorage.setItem(NOTEBOOK_SEEN_KEY, String(Date.UTC(2026, 9, 7, 23)));
    renderWithIntl(<LabRecordSection record={persona("threeDays")} />);
    const notebook = panel("Lab notebook");

    expect(within(notebook).getByText("Your record")).toBeInTheDocument();
    expect(lines(within(notebook).getByRole("list", { name: "Your notebook, newest first" }))).toEqual([
      "Day 3. Round 10 played. New",
      "Day 3. 3 days in a row. New",
      "Day 1. Memory span reached 6 pieces.",
      "Day 1. First round: 100 percent at 6 pieces.",
      "Day 1. First 90 percent or better at 6 pieces.",
    ]);
  });

  it("stores the time of this visit, so the next visit marks only what came after it", () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 9, 8, 18));
    renderWithIntl(<LabRecordSection record={persona("threeDays")} />);

    expect(localStorage.getItem(NOTEBOOK_SEEN_KEY)).toBe(String(Date.UTC(2026, 9, 8, 18)));
  });

  it("marks nothing new and still renders when storage cannot be read", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderWithIntl(<LabRecordSection record={persona("threeDays")} />);

    expect(within(panel("Lab notebook")).queryByText("New")).toBeNull();
    expect(lines(within(panel("Lab notebook")).getByRole("list"))).toHaveLength(5);
  });

  it("shows the newest five and renders the rest only when asked", () => {
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);
    const notebook = panel("Lab notebook");

    expect(within(notebook).getAllByRole("listitem")).toHaveLength(5);
    fireEvent.click(within(notebook).getByRole("button", { name: "Show all 20 entries" }));
    expect(within(notebook).getAllByRole("listitem")).toHaveLength(20);
    expect(within(notebook).getByRole("button", { name: "Show fewer" })).toHaveAttribute("aria-expanded", "true");
  });
});
