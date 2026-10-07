import { trackEvent, type FunnelEvent } from "@/lib/analytics/events";

const EVENTS: FunnelEvent[] = [
  { name: "round_start", params: { piece_count: 6, memorize_time: 10, source: "home_quick" } },
  {
    name: "round_complete",
    params: { piece_count: 6, memorize_time: 10, correct_pieces: 4, accuracy: 67, source: "try_again" },
  },
  {
    name: "round_complete",
    params: { piece_count: 6, memorize_time: 10, correct_pieces: 1, accuracy: 17, source: "calibration" },
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

it("does nothing when gtag is absent", () => {
  // @ts-expect-error gtag is optional at runtime, as it is on non-production builds
  delete window.gtag;

  expect(() => trackEvent(EVENTS[0])).not.toThrow();
});

it("requires every param of an event", () => {
  // @ts-expect-error memorize_time is required
  expect(() => trackEvent({ name: "round_start", params: { piece_count: 6 } })).not.toThrow();
});
