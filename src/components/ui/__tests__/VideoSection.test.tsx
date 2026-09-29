import { act, render } from "@/test-utils/intl";
import VideoSection from "@/components/ui/VideoSection";

function youTubeStateChange(info: number, origin = "https://www.youtube.com") {
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", {
        origin,
        data: JSON.stringify({ event: "onStateChange", info }),
      }),
    );
  });
}

beforeEach(() => {
  window.gtag = jest.fn();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("sends video_start on the first play, video_complete at the end, and video_play on a replay", () => {
  render(<VideoSection />);

  youTubeStateChange(1);
  youTubeStateChange(0);
  youTubeStateChange(1);

  const events = jest.mocked(window.gtag).mock.calls.map(([, name]) => name);
  expect(events).toEqual(["video_start", "video_complete", "video_play"]);
  expect(window.gtag).toHaveBeenCalledWith(
    "event",
    "video_start",
    expect.objectContaining({ event_category: "engagement", video_provider: "YouTube" }),
  );
});

it("ignores player messages from any origin but YouTube", () => {
  render(<VideoSection />);

  youTubeStateChange(1, "https://example.com");

  expect(window.gtag).not.toHaveBeenCalled();
});
