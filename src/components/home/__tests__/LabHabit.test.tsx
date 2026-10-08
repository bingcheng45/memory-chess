import { createTranslator } from "next-intl";
import { act, fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import en from "../../../../messages/en.json";
import { LabIndex } from "@/components/home/LabIndex";
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
  it("says how many days of the current run were played and how many missed days were forgiven, and marks it in the grid and its sentence", () => {
    renderWithIntl(<LabRecordSection record={persona("graceStreak")} />);
    const panel = streakPanel();

    expect(within(panel).getByText("Current streak 19 days played, 1 missed day forgiven · longest 19 days · From 52 rounds")).toBeInTheDocument();
    expect(within(panel).getByRole("img", { name: /^Your last 14 days/ })).toHaveAccessibleName("Your last 14 days: 13 days played, 1 forgiven.");
    expect(panel.querySelectorAll('.lab-streak i[data-day="forgiven"]')).toHaveLength(1);
    expect(panel.querySelector(".lab-streak-key")).toHaveTextContent("played forgiven missed today");
    expect(within(panel).getByText("Any finished round counts for its day. One missed day in any 7 is forgiven.")).toBeInTheDocument();
  });

  it("gives an unbroken run no forgiven day", () => {
    renderWithIntl(<LabRecordSection record={persona("thirtyDays")} />);

    expect(within(streakPanel()).getByText("Current streak 30 days · longest 30 days · From 90 rounds")).toBeInTheDocument();
  });
});

describe("streak wording", () => {
  const t = createTranslator({ locale: "en", messages: en, namespace: "home.lab.record.streak" });

  it.each([
    [{ current: 1, forgiven: 0, longest: 1 }, "Current streak 1 day · longest 1 day"],
    [{ current: 1, forgiven: 1, longest: 2 }, "Current streak 1 day played, 1 missed day forgiven · longest 2 days"],
    [{ current: 20, forgiven: 2, longest: 20 }, "Current streak 20 days played, 2 missed days forgiven · longest 20 days"],
  ])("words the note for %o", (params, note) => {
    expect(t("realNote", params)).toBe(note);
  });

  it.each([
    [0, "Goal can't be met with no days left. A new week starts Monday."],
    [1, "Goal can't be met with 1 day left. A new week starts Monday."],
  ])("words an out of reach week with %i days left", (daysLeft, line) => {
    expect(createTranslator({ locale: "en", messages: en, namespace: "home.lab.record.week" })("outOfReach", { daysLeft })).toBe(line);
  });
});

describe("streak chip in the index bar", () => {
  it("counts the days played, and names a forgiven day in its title and accessible name", () => {
    renderWithIntl(<LabIndex streak={{ days: 19, forgiven: 1 }} />);
    const chip = screen.getByRole("link", { name: "Day 19 of your streak, 1 missed day forgiven" });

    expect(chip).toHaveTextContent(/^Day 19$/);
    expect(chip).toHaveAttribute("title", "Day 19 of your streak, 1 missed day forgiven");
  });

  it("reads Day N alone for an unbroken run, and is absent without a streak", () => {
    const { unmount } = renderWithIntl(<LabIndex streak={{ days: 30, forgiven: 0 }} />);

    expect(screen.getByRole("link", { name: "Day 30" })).not.toHaveAttribute("title");
    unmount();
    renderWithIntl(<LabIndex streak={null} />);
    expect(screen.queryByRole("link", { name: /^Day/ })).toBeNull();
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

  it("says when the goal can no longer be met this week, rather than asking for more days than are left", () => {
    renderWithIntl(<LabRecordSection record={persona("stale")} />);

    expect(within(streakPanel()).getByText("Goal can't be met with 4 days left. A new week starts Monday.")).toBeInTheDocument();
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

    expect(within(streakPanel()).getByRole("img", { name: "Goal met, 4 days this week" })).toBeInTheDocument();
    expect(within(streakPanel()).queryByText(/of 3 days/)).toBeNull();
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
