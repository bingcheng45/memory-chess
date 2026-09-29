import { trackEvent, type FunnelEvent } from "@/lib/analytics/events";

const EVENTS: FunnelEvent[] = [
  { name: "round_start", params: { piece_count: 6, memorize_time: 10 } },
  {
    name: "round_complete",
    params: { piece_count: 6, memorize_time: 10, correct_pieces: 4, accuracy: 67 },
  },
  { name: "score_submit", params: { difficulty: "medium", piece_count: 6 } },
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
