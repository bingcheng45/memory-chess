import { act, fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { planChoice, targetChoice } from "@/components/home/labChoices";
import { seconds } from "@/components/home/labFormat";
import { trackEvent } from "@/lib/analytics/events";
import { PLAN_KEY, TARGET_KEY } from "@/lib/lab/choices";
import { personaChoices, type PersonaName } from "@/lib/lab/personas";
import { persona } from "@/test-utils/labPersona";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const plansPanel = () => screen.getByText(/^Fig\. 6\.\d+ · Programs$/).closest(".lab-panel") as HTMLElement;
const goalPanel = () => screen.getByText(/^Fig\. 6\.\d+ · Goal$/).closest(".lab-panel") as HTMLElement;
const card = (title: string) => within(plansPanel()).getByRole("heading", { name: title }).closest(".lab-plan") as HTMLElement;
const stored = (key: string) => JSON.parse(window.localStorage.getItem(key) ?? "null");
/** 18:00 UTC on the personas' today. */
const NOW = 1791482400000;

/** The persona's record with its plan and goal in localStorage, as the drivers seed them. */
function withChoices(name: PersonaName) {
  const { plan, target } = personaChoices(name);
  if (plan) window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  if (target) window.localStorage.setItem(TARGET_KEY, JSON.stringify(target));
  return persona(name);
}

beforeEach(() => {
  window.localStorage.clear();
  planChoice.reset();
  targetChoice.reset();
  jest.mocked(trackEvent).mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("programs before the record is read", () => {
  it("show the three plans' steps and the sample goal, tagged Sample, with nothing to press", () => {
    window.localStorage.setItem(PLAN_KEY, JSON.stringify({ planId: "edge", startedDay: "2026-10-03" }));
    renderWithIntl(<LabRecordSection record={{ ...persona("planEdge", ""), storage: "loading" }} />);

    expect(within(plansPanel()).getByText("Sample")).toBeInTheDocument();
    expect(within(card("Edge-file drill")).getByText("Custom rig: 8 pieces, 15 s.")).toBeInTheDocument();
    expect(within(plansPanel()).queryByRole("link")).toBeNull();
    expect(within(goalPanel()).getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "Sample goal: 8 pieces at 85 percent. Best so far 78 percent, 92% of the way.",
    );
    expect(within(goalPanel()).queryByRole("form")).toBeNull();
  });
});

describe("starting and stopping a plan", () => {
  it("starts a plan from its link: stores the plan, today and the moment, and opens the plan's first round", () => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);
    const start = within(card("Edge-file drill")).getByRole("link", { name: "Start Edge-file drill" });

    expect(start).toHaveAttribute("href", "/game?pieceCount=8&memorizeTime=15&source=plan");
    expect(within(card("Step-down ladder")).getByRole("link", { name: "Start Step-down ladder" })).toHaveAttribute(
      "href",
      "/game?pieceCount=12&memorizeTime=8&source=plan",
    );
    fireEvent.click(start);

    expect(stored(PLAN_KEY)).toEqual({ planId: "edge", startedDay: "2026-10-08", startedAt: NOW });
    expect(trackEvent).toHaveBeenCalledWith({ name: "lab_panel_action", params: { panel: "plans", action: "start" } });
    expect(within(card("Edge-file drill")).getByText("Day 1 of 14")).toBeInTheDocument();
    expect(within(card("Baseline week")).getByText("One plan at a time. Stop Edge-file drill to start this one.")).toBeInTheDocument();
    expect(within(plansPanel()).getByText("Your record")).toBeInTheDocument();
  });

  it("reads a baseline week mid-plan: the day, the days played, and day 1 against day 7", () => {
    renderWithIntl(<LabRecordSection record={withChoices("planBaseline")} />);
    const baseline = card("Baseline week");

    expect(baseline.querySelector(".lab-plan-progress")).toHaveTextContent(
      "Day 7 of 7" + "5 of 7 days with a Medium round" + "Day 1 67%, day 7 100%: up 33 points.",
    );
    expect(within(baseline).getByRole("link", { name: `Play 6 pieces, ${seconds(10)} →` })).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=plan");
  });

  it("stops a plan only on the second press, which keeps the day it stopped and touches no round", () => {
    const record = withChoices("planBaseline");
    renderWithIntl(<LabRecordSection record={record} />);

    fireEvent.click(within(card("Baseline week")).getByRole("button", { name: "Stop plan" }));
    expect(within(card("Baseline week")).getByRole("button", { name: "Really stop?" })).toHaveFocus();
    fireEvent.click(within(card("Baseline week")).getByRole("button", { name: "Keep going" }));
    expect(stored(PLAN_KEY)).toEqual({ planId: "baseline", startedDay: "2026-10-02" });

    fireEvent.click(within(card("Baseline week")).getByRole("button", { name: "Stop plan" }));
    fireEvent.click(within(card("Baseline week")).getByRole("button", { name: "Really stop?" }));

    expect(stored(PLAN_KEY)).toEqual({ planId: "baseline", startedDay: "2026-10-02", ended: { how: "stopped", day: "2026-10-08" } });
    expect(within(card("Baseline week")).getByText("Stopped on day 7.")).toBeInTheDocument();
    expect(within(card("Baseline week")).getByRole("link", { name: "Start Baseline week again" })).toBeInTheDocument();
    expect(within(card("Edge-file drill")).getByRole("link", { name: "Start Edge-file drill" })).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith({ name: "lab_panel_action", params: { panel: "plans", action: "stop" } });
    expect(Object.keys(window.localStorage).sort()).toEqual([PLAN_KEY, TARGET_KEY]);
    expect(record.importFile).not.toHaveBeenCalled();
  });

  it("finishes a baseline week early and keeps its comparison", () => {
    renderWithIntl(<LabRecordSection record={withChoices("planBaseline")} />);

    fireEvent.click(within(card("Baseline week")).getByRole("button", { name: "Finish early" }));

    expect(card("Baseline week").querySelector(".lab-plan-progress")).toHaveTextContent("Finished early on day 7.5 of 7 days with a Medium roundDay 1 67%, day 7 100%: up 33 points.");
    expect(trackEvent).toHaveBeenCalledWith({ name: "lab_panel_action", params: { panel: "plans", action: "finish" } });
  });

  it("reads the edge drill's days and its edge-file misses before and since, with the board vision guide", () => {
    renderWithIntl(<LabRecordSection record={withChoices("planEdge")} />);
    const edge = card("Edge-file drill");

    expect(edge.querySelector(".lab-plan-progress")).toHaveTextContent(
      "Day 6 of 14" + "Played the rig on 3 days of 6. Aim: 5 days in 14." + "Edge files missed: 73% in 23 rounds before the plan, 29% in 6 rounds since.",
    );
    expect(within(edge).getByRole("link", { name: "Read how to see the whole board →" })).toHaveAttribute("href", "/learn/how-to-see-the-whole-board-in-chess");
  });

  it("reads the ladder's rung, its run at 90 percent and the next rung, and notes the climb in the notebook", () => {
    renderWithIntl(<LabRecordSection record={withChoices("ladderClimb")} />);
    const ladder = card("Step-down ladder");

    expect(ladder.querySelector(".lab-plan-progress")).toHaveTextContent(
      "Day 3" + "Rung: 6 pieces, 8 s." + "2 of 3 rounds in a row at 90 percent or better." + "Next rung: 6 pieces, 6 s.",
    );
    expect(within(ladder).getByRole("link", { name: `Play 6 pieces, ${seconds(8)} →` })).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=8&source=plan");
    expect(within(ladder).queryByRole("button", { name: "Finish early" })).toBeNull();
    expect(screen.getByText("Day 10. Rung up: 6 pieces at 8 s.", { exact: false })).toBeInTheDocument();
  });

  it("lets another plan start once a baseline week is done by its seventh day played", () => {
    window.localStorage.setItem(PLAN_KEY, JSON.stringify({ planId: "baseline", startedDay: "2026-09-10" }));
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);

    expect(card("Baseline week").querySelector(".lab-plan-status")).toHaveTextContent("Done on day 7.");
    expect(within(card("Baseline week")).getByRole("link", { name: "Start Baseline week again" })).toBeInTheDocument();
    expect(within(card("Edge-file drill")).getByRole("link", { name: "Start Edge-file drill" })).toBeInTheDocument();
    expect(within(card("Step-down ladder")).getByRole("link", { name: "Start Step-down ladder" })).toBeInTheDocument();
  });

  it("follows a plan started in another tab without a reload", () => {
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);

    act(() => {
      window.localStorage.setItem(PLAN_KEY, JSON.stringify({ planId: "ladder", startedDay: "2026-10-08" }));
      window.dispatchEvent(new StorageEvent("storage", { key: PLAN_KEY }));
    });

    expect(card("Step-down ladder").querySelector(".lab-plan-status")).toHaveTextContent("Day 1");
  });
});

describe("the goal", () => {
  it("sets a goal from the form and fills its bar from the best round at that count or more since it was set", () => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);
    const form = within(goalPanel()).getByRole("form", { name: "New goal" });

    fireEvent.change(within(form).getByLabelText("Pieces, at least"), { target: { value: "12" } });
    fireEvent.change(within(form).getByLabelText("Accuracy, at least"), { target: { value: "95" } });
    fireEvent.click(within(form).getByRole("button", { name: "Set goal" }));

    expect(stored(TARGET_KEY)).toEqual({ pieceCount: 12, accuracy: 95, createdDay: "2026-10-08", createdAt: NOW });
    expect(trackEvent).toHaveBeenCalledWith({ name: "lab_panel_action", params: { panel: "goal", action: "setGoal" } });
    expect(within(goalPanel()).getByText("Goal: 12 or more pieces at 95 percent or better, set Oct 8.")).toBeInTheDocument();
    fireEvent.click(within(goalPanel()).getByRole("button", { name: "Set a new goal" }));
    fireEvent.change(within(goalPanel()).getByLabelText("Accuracy, at least"), { target: { value: "100" } });
    fireEvent.click(within(goalPanel()).getByRole("button", { name: "Set goal" }));
    expect(within(goalPanel()).getByText("Goal: 12 or more pieces at 100 percent, set Oct 8.")).toBeInTheDocument();
  });

  it("says when and with what a goal was reached, with its bar labelled in words, and clears it", () => {
    renderWithIntl(<LabRecordSection record={withChoices("planEdge")} />);
    const panel = goalPanel();

    expect(within(panel).getByText("Best since then: 100 percent at 8 pieces, 100% of the way.")).toBeInTheDocument();
    expect(within(panel).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(within(panel).getByRole("progressbar")).toHaveAttribute("aria-valuetext", "100% of the way to the goal");
    expect(within(panel).getByText("Reached on Oct 3: 100 percent at 8 pieces.")).toBeInTheDocument();
    expect(screen.getByText("Goal reached: 70 percent at 8 pieces or more.", { exact: false })).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole("button", { name: "Clear goal" }));

    expect(window.localStorage.getItem(TARGET_KEY)).toBeNull();
    expect(trackEvent).toHaveBeenCalledWith({ name: "lab_panel_action", params: { panel: "goal", action: "clearGoal" } });
    expect(within(goalPanel()).getByRole("form", { name: "New goal" })).toBeInTheDocument();
  });

  it("says what is missing when no round at the goal's count has been played since it was set", () => {
    window.localStorage.setItem(TARGET_KEY, JSON.stringify({ pieceCount: 20, accuracy: 60, createdDay: "2026-10-01" }));
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);

    expect(within(goalPanel()).getByText("No round at 20 or more pieces since you set this goal.")).toBeInTheDocument();
    expect(within(goalPanel()).queryByRole("progressbar")).toBeNull();
  });
});
