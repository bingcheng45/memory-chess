import {
  daysSinceFirstRound,
  rememberResultView,
  roundsPlayedGroup,
  roundSourceFrom,
  trackEvent,
  type FunnelEvent,
} from "@/lib/analytics/events";
import { attachPostHog, resetPostHogForTests } from "@/lib/analytics/posthog";

const EVENTS: FunnelEvent[] = [
  { name: "round_start", params: { piece_count: 6, memorize_time: 10, round_source: "home_quick" } },
  {
    name: "round_complete",
    params: { piece_count: 6, memorize_time: 10, correct_pieces: 4, accuracy: 67, round_source: "try_again" },
  },
  {
    name: "round_complete",
    params: { piece_count: 6, memorize_time: 10, correct_pieces: 1, accuracy: 17, round_source: "calibration" },
  },
  { name: "score_submit", params: { difficulty: "medium", piece_count: 6 } },
  { name: "article_like", params: { slug: "magnus-carlsen" } },
  { name: "article_tile_click", params: { slug: "judit-polgar", action: "read" } },
  { name: "article_tile_click", params: { slug: "judit-polgar", action: "drill" } },
  { name: "lab_export", params: { rounds: 42 } },
  { name: "lab_import", params: { added: 40, rejected: 2 } },
  { name: "lab_backup_interest", params: { rounds: 42 } },
  { name: "lab_section_view", params: {} },
  { name: "lab_panel_action", params: { panel: "unlock", action: "play" } },
  { name: "lab_panel_action", params: { panel: "trend", action: "play" } },
  { name: "lab_panel_action", params: { panel: "insights", action: "guide" } },
  { name: "lab_panel_action", params: { panel: "resultCard", action: "next" } },
  { name: "lab_panel_action", params: { panel: "plans", action: "start" } },
  { name: "lab_panel_action", params: { panel: "plans", action: "stop" } },
  { name: "lab_panel_action", params: { panel: "plans", action: "finish" } },
  { name: "lab_panel_action", params: { panel: "plans", action: "play" } },
  { name: "lab_panel_action", params: { panel: "goal", action: "setGoal" } },
  { name: "lab_panel_action", params: { panel: "goal", action: "clearGoal" } },
  {
    name: "learn_search",
    params: { query_length: 28, results: 2, top: "how-to-stop-blundering-in-chess", outcome: "strong", surface: "hub" },
  },
  { name: "learn_search_select", params: { slug: "chess-memory-training", rank: 1, matched_question: false, surface: "server" } },
  { name: "affiliate_click", params: { store: "amazon" } },
  { name: "reminder_set", params: { surface: "result" } },
  { name: "reminder_set", params: { surface: "dashboard" } },
  { name: "reminder_set", params: { surface: "daily" } },
  {
    name: "round_complete",
    params: { piece_count: 6, memorize_time: 10, correct_pieces: 5, accuracy: 83, round_source: "game_form", result_view: "overlay" },
  },
  { name: "result_view_select", params: { result_view: "side" } },
  {
    name: "round_complete",
    params: {
      piece_count: 5,
      memorize_time: 20,
      correct_pieces: 5,
      accuracy: 100,
      round_source: "daily",
      result_view: "side",
      days_since_first_round: 7,
      rounds_played: "6+",
      board_type: "daily",
    },
  },
];

afterEach(() => {
  // @ts-expect-error gtag is optional at runtime, as it is on non-production builds
  delete window.gtag;
});

it.each(EVENTS)("forwards $name to gtag with exactly its params", (event) => {
  const gtag = jest.fn();
  window.gtag = gtag;

  trackEvent(event);

  expect(gtag).toHaveBeenCalledTimes(1);
  expect(gtag).toHaveBeenCalledWith("event", event.name, event.params);
});

it.each([
  ["home_intro", "home_intro"],
  ["insight", "insight"],
  ["tile_drill", "tile_drill"],
  ["result_next", "result_next"],
  ["plan", "plan"],
  ["share", "share"],
  ["server", "link"],
  [null, "link"],
])("reads the round link source %p as %p", (value, source) => {
  expect(roundSourceFrom(value)).toBe(source);
});

it.each([
  [1, "1"],
  [2, "2-5"],
  [5, "2-5"],
  [6, "6+"],
  [250, "6+"],
])("groups %p rounds played as %p", (rounds, group) => {
  expect(roundsPlayedGroup(rounds)).toBe(group);
});

it.each([
  ["the same day", "2026-10-14", "2026-10-14", 0],
  ["the next day", "2026-10-14", "2026-10-15", 1],
  ["7 days on", "2026-10-14", "2026-10-21", 7],
  ["7 days on across a month end and a clock change", "2026-10-27", "2026-11-03", 7],
  ["a clock set back before the first day", "2026-10-14", "2026-10-13", "unknown"],
])("counts %s, from a first round on %s to %s, as %p days", (_case, firstRoundDay, today, days) => {
  expect(daysSinceFirstRound(firstRoundDay, today)).toBe(days);
});

it.each([
  ["missing", null],
  ["unknown, from a record saved before it was kept", "unknown"],
])("sends unknown days when the first round's day is %s", (_case, firstRoundDay) => {
  expect(daysSinceFirstRound(firstRoundDay, "2026-10-14")).toBe("unknown");
});

describe("PostHog", () => {
  const capture = jest.fn();
  const register = jest.fn();

  beforeEach(() => {
    resetPostHogForTests();
    capture.mockClear();
    register.mockClear();
  });

  it("receives every event under GA4's name and parameters", () => {
    attachPostHog({ capture, register });
    EVENTS.forEach(trackEvent);

    expect(capture.mock.calls).toEqual(EVENTS.map(({ name, params }) => [name, params, { timestamp: expect.any(Date) }]));
  });

  it("replays events sent before its library loaded, in order", () => {
    trackEvent(EVENTS[0]);
    trackEvent(EVENTS[1]);
    expect(capture).not.toHaveBeenCalled();

    attachPostHog({ capture, register });

    expect(capture.mock.calls.map(([name]) => name)).toEqual([EVENTS[0].name, EVENTS[1].name]);
  });

  it("keeps the time a queued event happened, not the time the library loaded", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-11-21T10:00:00Z"));
    trackEvent(EVENTS[0]);
    jest.setSystemTime(new Date("2026-11-21T10:00:09Z"));
    attachPostHog({ capture, register });
    jest.useRealTimers();

    expect(capture.mock.calls[0][2]).toEqual({ timestamp: new Date("2026-11-21T10:00:00Z") });
  });

  it("keeps the result view on later events without a person profile", () => {
    rememberResultView("overlay");
    attachPostHog({ capture, register });

    expect(register).toHaveBeenCalledWith({ result_view: "overlay" });
  });
});

it("does nothing when gtag is absent", () => {
  // @ts-expect-error gtag is optional at runtime, as it is on non-production builds
  delete window.gtag;

  expect(() => trackEvent(EVENTS[0])).not.toThrow();
});

it("requires every param of an event", () => {
  // @ts-expect-error memorize_time is required
  expect(() => trackEvent({ name: "round_start", params: { piece_count: 6 } })).not.toThrow();
});

it("sets the result view as a GA4 user property", () => {
  const gtag = jest.fn();
  window.gtag = gtag;

  rememberResultView("overlay");

  expect(gtag).toHaveBeenCalledWith("set", "user_properties", { result_view: "overlay" });
});

it("sets no user property when gtag has not loaded", () => {
  expect(() => rememberResultView("side")).not.toThrow();
});
