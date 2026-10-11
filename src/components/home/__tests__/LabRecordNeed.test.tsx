import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { trackEvent } from "@/lib/analytics/events";
import { summarize } from "@/lib/lab/summary";
import { round } from "@/lib/lab/__tests__/fixtures";
import { persona } from "@/test-utils/labPersona";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const FIG = ".lab-panel-h > .lab-k";
const panel = (name: string) => screen.getByText(new RegExp(`^Fig\\. \\d+ · ${name}$`), { selector: FIG }).closest(".lab-panel") as HTMLElement;
const playLinks = (name: string) => within(panel(name)).queryAllByRole("link", { name: "Play a round →" }).map((link) => link.getAttribute("href"));

const QUICK_START = "/game?pieceCount=6&memorizeTime=10&source=home_quick";

function showRounds(source: "game" | "calibration", pieceCount: number, memorizeSeconds: number) {
  const records = Array.from({ length: 3 }, (_, index) =>
    round({ id: `r${index}`, source, pieceCount, memorizeSeconds, localDay: "2026-10-07", endedAt: Date.UTC(2026, 9, 7, 9 + index) }),
  );
  renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor", "2026-10-07"), records, summary: summarize(records) }} />);
}

describe("a warming record panel", () => {
  beforeEach(() => jest.mocked(trackEvent).mockClear());

  it.each(["Memory span", "Pieces held", "Miss map", "Recall by piece type", "Insights", "Days in a row"])(
    "offers a round beside what %s still needs",
    (name) => {
      renderWithIntl(<LabRecordSection record={persona("twoRounds")} />);

      expect(playLinks(name)).toEqual([QUICK_START]);
    },
  );

  it("plays the exact game setting the trend and the speed line are waiting on", () => {
    showRounds("game", 8, 15);

    expect(playLinks("Accuracy over time")).toEqual(["/game?pieceCount=8&memorizeTime=15&source=home_quick"]);
    expect(playLinks("Speed")).toEqual(["/game?pieceCount=8&memorizeTime=15&source=home_quick"]);
  });

  it("sends a practice trend and speed line to the practice rounds on the home page", () => {
    showRounds("calibration", 6, 10);

    expect(playLinks("Accuracy over time")).toEqual(["/#calibrate"]);
    expect(playLinks("Speed")).toEqual(["/#calibrate"]);
  });

  it("records which panel the round was started from", () => {
    showRounds("game", 8, 15);
    fireEvent.click(within(panel("Speed")).getByRole("link", { name: "Play a round →" }));

    expect(trackEvent).toHaveBeenCalledWith({ name: "lab_panel_action", params: { panel: "speed", action: "play" } });
  });

  it("leaves the Sample panels of a new visitor without one", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor")} />);
    const sample = ["Memory span", "Pieces held", "Accuracy over time", "Speed", "Miss map", "Recall by piece type", "Insights", "Days in a row"].flatMap(playLinks);
    expect(sample).toEqual([]);
  });

  it("leaves a ready panel to its figure", () => {
    renderWithIntl(<LabRecordSection record={persona("spanClimber")} />);

    expect(playLinks("Memory span")).toEqual([]);
    expect(playLinks("Accuracy over time")).toEqual([]);
  });
});
