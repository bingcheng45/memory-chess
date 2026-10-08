import { act, fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { resetWeekGoalSession, WEEK_GOAL_KEY } from "@/components/home/useWeekGoal";
import { persona } from "@/test-utils/labPersona";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const streakPanel = () => screen.getByText(/^Fig\. 6\.\d+ · Days in a row$/).closest(".lab-panel") as HTMLElement;
const welcome = () => document.querySelector(".lab-welcome")?.textContent;

beforeEach(() => {
  window.localStorage.clear();
  resetWeekGoalSession();
});

afterEach(() => jest.restoreAllMocks());

describe("days in a row with a grace day", () => {
  it("says the current run includes a forgiven day, and marks it in the grid and its sentence", () => {
    renderWithIntl(<LabRecordSection record={persona("graceStreak")} />);
    const panel = streakPanel();

    expect(within(panel).getByText("Current streak 19 days, includes 1 forgiven day · longest 19 days · From 52 rounds")).toBeInTheDocument();
    expect(within(panel).getByRole("img", { name: /^Your last 14 days/ })).toHaveAccessibleName("Your last 14 days: 13 days played, 1 forgiven.");
    expect(panel.querySelectorAll('.lab-streak i[data-day="forgiven"]')).toHaveLength(1);
    expect(panel.querySelector(".lab-streak-key")).toHaveTextContent("played forgiven missed today");
    expect(within(panel).getByText("Any finished round counts for its day. One missed day a week is forgiven.")).toBeInTheDocument();
  });

  it("gives an unbroken run no forgiven day", () => {
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);

    expect(within(streakPanel()).getByText("Current streak 30 days · longest 30 days · From 90 rounds")).toBeInTheDocument();
  });
});

describe("week ring", () => {
  it("counts this week's days against the default goal of 5", () => {
    renderWithIntl(<LabRecordSection record={persona("graceStreak")} />);

    expect(within(streakPanel()).getByRole("img", { name: "4 of 5 days this week" })).toBeInTheDocument();
    expect(within(streakPanel()).getByText("1 more day to meet your goal.")).toBeInTheDocument();
    expect(within(streakPanel()).getByRole("radio", { name: "5 days a week" })).toBeChecked();
  });

  it("redraws the ring and keeps the goal on this device when the player picks another", () => {
    const { unmount } = renderWithIntl(<LabRecordSection record={persona("graceStreak")} />);
    fireEvent.click(within(streakPanel()).getByRole("radio", { name: "7 days a week" }));

    expect(within(streakPanel()).getByRole("img", { name: "4 of 7 days this week" })).toBeInTheDocument();
    expect(within(streakPanel()).getByText("3 more days to meet your goal.")).toBeInTheDocument();
    expect(window.localStorage.getItem(WEEK_GOAL_KEY)).toBe("7");
    unmount();

    renderWithIntl(<LabRecordSection record={persona("graceStreak")} />);
    expect(within(streakPanel()).getByRole("radio", { name: "7 days a week" })).toBeChecked();
  });

  it("follows a goal changed in another tab", () => {
    renderWithIntl(<LabRecordSection record={persona("graceStreak")} />);
    window.localStorage.setItem(WEEK_GOAL_KEY, "4");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: WEEK_GOAL_KEY, newValue: "4" }));
    });

    expect(within(streakPanel()).getByRole("img", { name: "4 of 4 days this week" })).toBeInTheDocument();
    expect(within(streakPanel()).getByText("Goal met this week.")).toBeInTheDocument();
  });

  it("reads a stored goal it does not offer as the default", () => {
    window.localStorage.setItem(WEEK_GOAL_KEY, "6");
    renderWithIntl(<LabRecordSection record={persona("stale")} />);

    expect(within(streakPanel()).getByRole("img", { name: "0 of 5 days this week" })).toBeInTheDocument();
  });

  it("shows a Sample ring and no goal picker before the first round", () => {
    renderWithIntl(<LabRecordSection record={persona("newVisitor")} />);

    expect(within(streakPanel()).getByRole("img", { name: "Sample week · 4 of 5 days" })).toBeInTheDocument();
    expect(within(streakPanel()).queryByRole("radio")).toBeNull();
  });

  it("keeps the goal for the session when storage refuses the write", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    renderWithIntl(<LabRecordSection record={persona("graceStreak")} />);
    fireEvent.click(within(streakPanel()).getByRole("radio", { name: "3 days a week" }));

    expect(within(streakPanel()).getByRole("img", { name: "4 of 3 days this week" })).toBeInTheDocument();
    expect(within(streakPanel()).getByText("Goal met this week.")).toBeInTheDocument();
  });
});

describe("welcome back", () => {
  it("greets a player back after 20 days with their day count and latest round", () => {
    renderWithIntl(<LabRecordSection record={persona("stale")} />);

    expect(welcome()).toBe("Welcome back. Day 26 of your record. Last time 100% at 6 pieces, 10 s.");
  });

  it("stays empty for a player who played today, a new visitor, the server render and unreadable storage", () => {
    const lines = [persona("graceStreak"), persona("newVisitor"), persona("stale", ""), { ...persona("stale"), storage: "unavailable" as const }].map((record) => {
      const { unmount } = renderWithIntl(<LabRecordSection record={record} />);
      const text = welcome();
      unmount();
      return text;
    });

    expect(lines).toEqual(["", "", "", ""]);
  });
});
