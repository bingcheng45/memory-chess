import { rememberResultView, roundSourceFrom, trackEvent, type FunnelEvent } from "@/lib/analytics/events";

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
  { name: "round_intro_view", params: { piece_count: 3, memorize_time: 10, round_source: "link" } },
  { name: "affiliate_click", params: { store: "amazon" } },
  {
    name: "round_complete",
    params: { piece_count: 6, memorize_time: 10, correct_pieces: 5, accuracy: 83, round_source: "game_form", result_view: "overlay" },
  },
  { name: "result_view_select", params: { result_view: "side" } },
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

describe("Databuddy", () => {
  const databuddyTrack = jest.fn();

  beforeEach(() => {
    databuddyTrack.mockClear();
    Object.assign(window, { databuddy: { track: databuddyTrack } });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "databuddy");
  });

  it.each([
    ["round_started", EVENTS[0], { piece_count: 6, memorize_time: 10, source: "home_quick" }],
    ["round_completed", EVENTS[1], { piece_count: 6, memorize_time: 10, source: "try_again" }],
    ["score_submitted", EVENTS[3], { difficulty: "medium", piece_count: 6 }],
  ])("sends %s with no accuracy or recalled count", (name, event, properties) => {
    trackEvent(event);

    expect(databuddyTrack).toHaveBeenCalledTimes(1);
    expect(databuddyTrack).toHaveBeenCalledWith(name, properties);
  });

  it("receives no lab, article, search or round intro events", () => {
    EVENTS.filter(({ name }) => !["round_start", "round_complete", "score_submit"].includes(name)).forEach(trackEvent);

    expect(databuddyTrack).not.toHaveBeenCalled();
  });

  it("is not called before its script has loaded", () => {
    Reflect.deleteProperty(window, "databuddy");

    expect(() => trackEvent(EVENTS[0])).not.toThrow();
    expect(databuddyTrack).not.toHaveBeenCalled();
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
