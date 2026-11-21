import { render } from "@testing-library/react";
import SitePostHog, { POSTHOG_OPTIONS, resetLandingPageviewForTests, startPostHog, withLandingTime, withoutTypedTextInEvent } from "@/components/common/SitePostHog";

const mockInit = jest.fn();
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { init: (...args: unknown[]) => mockInit(...args), capture: jest.fn(), register: jest.fn() },
}));

describe("SitePostHog", () => {
  beforeEach(() => mockInit.mockClear());

  it("keeps every setting the privacy page promises", () => {
    expect(POSTHOG_OPTIONS).toMatchObject({
      api_host: "/relay",
      persistence: "localStorage",
      person_profiles: "identified_only",
      mask_all_text: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      mask_personal_data_properties: true,
      custom_personal_data_properties: ["player", "q"],
      disable_session_recording: true,
      disable_surveys: true,
      advanced_disable_flags: true,
    });
    expect(POSTHOG_OPTIONS.before_send).toEqual([withLandingTime, withoutTypedTextInEvent]);
  });

  it("starts PostHog with those settings and the project key", async () => {
    await startPostHog();
    expect(mockInit).toHaveBeenCalledWith(expect.stringMatching(/^phc_/), POSTHOG_OPTIONS);
  });

  it("waits for the page's load event before loading the library", async () => {
    const readyState = jest.spyOn(document, "readyState", "get").mockReturnValue("interactive");
    render(<SitePostHog />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockInit).not.toHaveBeenCalled();

    readyState.mockReturnValue("complete");
    window.dispatchEvent(new Event("load"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockInit).toHaveBeenCalledTimes(1);
    readyState.mockRestore();
  });

  it("dates the first page view to when the page began loading, so earlier queued events follow it", () => {
    resetLandingPageviewForTests();
    const landing = withLandingTime({ event: "$pageview", timestamp: new Date("2026-11-21T10:00:09Z") });
    const later = withLandingTime({ event: "$pageview", timestamp: new Date("2026-11-21T10:01:00Z") });
    const round = withLandingTime({ event: "round_start", timestamp: new Date("2026-11-21T10:00:03Z") });

    expect(landing?.timestamp).toEqual(new Date(performance.timeOrigin));
    expect(later?.timestamp).toEqual(new Date("2026-11-21T10:01:00Z"));
    expect(round?.timestamp).toEqual(new Date("2026-11-21T10:00:03Z"));
  });
});
