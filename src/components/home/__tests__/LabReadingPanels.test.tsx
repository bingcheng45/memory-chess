import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import type { PersonaName } from "@/lib/lab/personas";
import { summarize } from "@/lib/lab/summary";
import { persona } from "@/test-utils/labPersona";
import { round } from "@/lib/lab/__tests__/fixtures";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const panel = (name: string) => screen.getByText(new RegExp(`^Fig\\. 6\\.\\d+ · ${name}$`)).closest(".lab-panel") as HTMLElement;
const texts = (element: HTMLElement, selector: string) => [...element.querySelectorAll(selector)].map((node) => node.textContent);
const tagOf = (element: HTMLElement) => element.querySelector(".lab-tag")?.textContent ?? null;

function show(name: PersonaName, today?: string) {
  renderWithIntl(<LabRecordSection record={persona(name, today)} />);
}

/** Three rounds today with nothing placed right. */
function showNothingRight() {
  const records = Array.from({ length: 3 }, (_, index) =>
    round({ id: `blank${index}`, placedFen: "8/8/8/8/8/8/8/8", localDay: "2026-10-08", endedAt: Date.UTC(2026, 9, 8, 9 + index) }),
  );
  renderWithIntl(<LabRecordSection record={{ ...persona("newVisitor"), records, summary: summarize(records) }} />);
}

describe("memory span", () => {
  it("shows an example staircase, tagged Sample, before any round", () => {
    show("newVisitor", "");
    const span = panel("Memory span");

    expect(tagOf(span)).toBe("Sample");
    expect(within(span).getByText("8 pieces at 10 s")).toHaveClass("lab-span-figure");
    expect(within(span).getByRole("img")).toHaveAccessibleName("Sample staircase of memory span over 12 sessions, stepping up from 4 to 8 pieces.");
    expect(texts(span, ".lab-note")).toEqual(["Sample record · 12 sessions"]);
  });

  it("reads the span in large type, how far it rose in a week, and the rounds behind it", () => {
    show("spanClimber");
    const span = panel("Memory span");

    expect(tagOf(span)).toBe("Your record");
    expect(within(span).getByText("14 pieces at 10 s")).toHaveClass("lab-span-figure");
    expect(within(span).getByText("Up 4 pieces since last week")).toBeInTheDocument();
    expect(within(span).getByRole("img")).toHaveAccessibleName("Your memory span over 45 sessions, rising from 4 to 14 pieces.");
    expect(texts(span, ".lab-note")).toEqual(["From 135 rounds · 19 of them at 14 pieces scored 80 percent or better"]);
  });

  it("says no change when the span is what it was a week ago, at the shortest study time held", () => {
    show("thirtyDays");
    const span = panel("Memory span");

    expect(within(span).getByText("12 pieces at 8 s")).toBeInTheDocument();
    expect(within(span).getByText("No change since last week")).toBeInTheDocument();
    expect(within(span).getByRole("img")).toHaveAccessibleName("Your memory span over 29 sessions, rising from 6 to 12 pieces.");
  });

  it("says nothing about last week when there was no span a week ago", () => {
    show("threeDays");
    const span = panel("Memory span");

    expect(within(span).getByText("6 pieces at 10 s")).toBeInTheDocument();
    expect(span.querySelector(".lab-span-change")?.textContent).toBe("");
    expect(within(span).getByRole("img")).toHaveAccessibleName("Your memory span over 3 sessions, holding at 6 pieces.");
  });

  it("tells an easy-only player that two kings cannot show a span", () => {
    show("easyOnly");
    const span = panel("Memory span");

    expect(tagOf(span)).toBe("Your record");
    expect(within(span).queryByRole("img")).toBeNull();
    expect(texts(span, ".lab-empty")).toEqual(["Your rounds so far were just the two kings. Play a round with more pieces to see your span."]);
  });

  it("says how many more rounds at 80 percent the span needs", () => {
    show("twoRounds");

    expect(texts(panel("Memory span"), ".lab-empty")).toEqual(["Score 80 percent or better once more at one size of 3 or more pieces."]);
  });

  it("drops the change since last week once stale, since that week ended long before today", () => {
    show("thirtyDays", "2026-11-08");
    const span = panel("Memory span");

    expect(texts(span, ".lab-stale")).toEqual(["Last played 31 days ago. Play a round →"]);
    expect(span.querySelector(".lab-span-change")?.textContent).toBe("");
  });

  it("keeps the span and says how long ago the last round was once it is stale", () => {
    show("stale");
    const span = panel("Memory span");

    expect(within(span).getByText("6 pieces at 10 s")).toBeInTheDocument();
    expect(texts(span, ".lab-stale")).toEqual(["Last played 20 days ago. Play a round →"]);
  });
});

describe("pieces held", () => {
  it("shows an example line, tagged Sample, with the dashed start explained", () => {
    show("newVisitor", "");
    const held = panel("Pieces held");

    expect(tagOf(held)).toBe("Sample");
    expect(within(held).getByRole("img")).toHaveAccessibleName("Sample line of pieces held over 12 rounds, a 5-round average rising from 4.0 to 7.0 pieces.");
    expect(texts(held, ".lab-note")).toEqual(["Dashed line: averaged over fewer than 5 rounds", "Sample record · 12 rounds · any setting"]);
  });

  it("reads the recent average and its change on the 10 rounds before, at any setting", () => {
    show("spanClimber");
    const held = panel("Pieces held");

    expect(tagOf(held)).toBe("Your record");
    expect(within(held).getByText("Recent average 13.8 pieces · up 1.0 on the 10 rounds before")).toBeInTheDocument();
    expect(within(held).getByRole("img")).toHaveAccessibleName("Your pieces held over your last 30 rounds at any setting, as a 5-round average, latest 13.8 pieces.");
    expect(held.querySelector(".lab-c-partial")).toBeNull();
    expect(texts(held, ".lab-note")).toEqual(["Any setting · From 135 rounds"]);
  });

  it("says when the average fell", () => {
    show("easyOnly");

    expect(within(panel("Pieces held")).getByText("Recent average 1.4 pieces · down 0.5 on the 10 rounds before")).toBeInTheDocument();
  });

  it("dashes the averages taken over fewer than 5 rounds, and says so in words", () => {
    show("threeDays");
    const held = panel("Pieces held");

    expect(within(held).getByText("Recent average 5.2 pieces")).toBeInTheDocument();
    expect(held.querySelector(".lab-c-partial")).not.toBeNull();
    expect(texts(held, ".lab-note")).toEqual(["Dashed line: averaged over fewer than 5 rounds", "Any setting · From 12 rounds"]);
  });

  it("says how many more rounds and days draw the line", () => {
    show("twoRounds");

    expect(texts(panel("Pieces held"), ".lab-empty")).toEqual(["3 more rounds, at least one on another day, draw your line."]);
  });
});

describe("speed", () => {
  it("shows an example line, tagged Sample, before any round", () => {
    show("newVisitor", "");
    const speed = panel("Speed");

    expect(tagOf(speed)).toBe("Sample");
    expect(texts(speed, ".lab-reading-stat")).toEqual(["Recent average 3.1\u00a0s per piece", "Accuracy on the same rounds 88%"]);
    expect(within(speed).getByRole("img")).toHaveAccessibleName("Sample line of rebuild seconds per correct piece over 12 rounds, falling from 4.1 to 2.6 seconds.");
    expect(texts(speed, ".lab-note")).toEqual(["Sample record · 12 rounds · Medium"]);
  });

  it("prints accuracy over the same rounds beside a faster pace", () => {
    show("spanClimber");
    const speed = panel("Speed");

    expect(texts(speed, ".lab-reading-stat")).toEqual([
      "Recent average 1.6\u00a0s per piece · 0.1\u00a0s faster than the 10 rounds before",
      "Accuracy on the same rounds 99% · up 7 points",
    ]);
    expect(within(speed).getByRole("img")).toHaveAccessibleName(
      "Your rebuild seconds per correct piece over your last 21 game rounds at 14 pieces and 10 seconds, latest 1.7 seconds.",
    );
    expect(texts(speed, ".lab-note")).toEqual(["Game · 14 pieces · 10s, your most played setting lately · From 21 rounds"]);
  });

  it("warns that fast and wrong is not improvement when accuracy fell as the pace quickened", () => {
    show("stale");
    const speed = panel("Speed");

    expect(texts(speed, ".lab-reading-stat")).toEqual([
      "Recent average 3.4\u00a0s per piece · 0.5\u00a0s faster than the 10 rounds before",
      "Accuracy on the same rounds 83% · down 9 points",
    ]);
    expect(texts(speed, ".lab-speed-warn")).toEqual(["Fast and wrong is not improvement."]);
    expect(texts(speed, ".lab-stale")).toEqual(["Last played 20 days ago. Play a round →"]);
  });

  it("gives no warning when the pace slowed", () => {
    show("thirtyDays");
    const speed = panel("Speed");

    expect(texts(speed, ".lab-reading-stat")).toEqual([
      "Recent average 1.8\u00a0s per piece · 0.1\u00a0s slower than the 10 rounds before",
      "Accuracy on the same rounds 72% · down 5 points",
    ]);
    expect(texts(speed, ".lab-speed-warn")).toEqual([]);
  });

  it("prints only the averages before there are 20 rounds to compare", () => {
    show("threeDays");

    expect(texts(panel("Speed"), ".lab-reading-stat")).toEqual(["Recent average 4.6\u00a0s per piece", "Accuracy on the same rounds 92%"]);
  });

  it("says how many more rounds at the setting draw the line", () => {
    show("twoRounds");

    expect(texts(panel("Speed"), ".lab-empty")).toEqual(["4 more rounds at 6 pieces, 10s in games draw your speed line."]);
  });

  it("reads as the player's record, not a Sample, when no round so far had a piece right", () => {
    showNothingRight();
    const speed = panel("Speed");

    expect(tagOf(speed)).toBe("Your record");
    expect(within(speed).queryByRole("img")).toBeNull();
    expect(texts(speed, ".lab-empty")).toEqual(["Speed reads only rounds with at least one piece right. Play 1 such round to start your line."]);
  });
});

describe("a player whose rounds so far had nothing right", () => {
  it("sees span and pieces held warming as their own record, not a Sample", () => {
    showNothingRight();

    expect([tagOf(panel("Memory span")), tagOf(panel("Pieces held"))]).toEqual(["Your record", "Your record"]);
    expect(texts(panel("Memory span"), ".lab-empty")).toEqual(["Score 80 percent or better twice at one size of 3 or more pieces."]);
    expect(texts(panel("Pieces held"), ".lab-empty")).toEqual(["2 more rounds, at least one on another day, draw your line."]);
  });
});

describe("accuracy trend", () => {
  it("plots one point per session once there are enough sessions, and says how many", () => {
    show("spanClimber");
    const trend = panel("Accuracy over time");

    expect(within(trend).getByRole("heading", { level: 3 })).toHaveTextContent("Your line, session by session.");
    expect(within(trend).getByRole("img")).toHaveAccessibleName(
      "Your accuracy over your last 20 sessions with game rounds at 4 pieces and 10 seconds, latest 75 percent.",
    );
    expect(texts(trend, ".lab-note")).toEqual(["Game · 4 pieces · 10s, your most played setting with a trend · From 60 rounds · 20 sessions"]);
  });

  it("reads a session's mean accuracy in whole percents", () => {
    show("heavy");

    expect(within(panel("Accuracy over time")).getByRole("img")).toHaveAccessibleName(
      "Your accuracy over your last 30 sessions with game rounds at 6 pieces and 10 seconds, latest 87 percent.",
    );
  });

  it("stays round by round until there are enough sessions", () => {
    show("threeDays");
    const trend = panel("Accuracy over time");

    expect(within(trend).getByRole("heading", { level: 3 })).toHaveTextContent("Your line, round by round.");
    expect(texts(trend, ".lab-note")).toEqual(["Game · 6 pieces · 10s, your most played setting with a trend · From 9 rounds"]);
  });
});
