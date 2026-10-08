import { renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import type { PersonaName } from "@/lib/lab/personas";
import { persona } from "@/test-utils/labPersona";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const panel = (name: string) => screen.getByText(new RegExp(`^Fig\\. 6\\.\\d+ · ${name}$`)).closest(".lab-panel") as HTMLElement;
const texts = (element: HTMLElement, selector: string) => [...element.querySelectorAll(selector)].map((node) => node.textContent);
const tagOf = (element: HTMLElement) => element.querySelector(".lab-tag")?.textContent ?? null;

function show(name: PersonaName, today?: string) {
  renderWithIntl(<LabRecordSection record={persona(name, today)} />);
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

  it("keeps the span and says how long ago the last round was once it is stale", () => {
    show("stale");
    const span = panel("Memory span");

    expect(within(span).getByText("6 pieces at 10 s")).toBeInTheDocument();
    expect(texts(span, ".lab-stale")).toEqual(["Last played 20 days ago. Play a round →"]);
  });
});
