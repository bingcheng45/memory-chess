import { scrubTypedText, withoutTypedText } from "@/lib/analytics/typedText";
import { withoutTypedTextInEvent } from "@/components/common/SitePostHog";
import { GA_INIT_SNIPPET } from "@/components/common/SiteGoogleAnalytics";

describe("typed text in addresses", () => {
  it.each([
    ["https://thememorychess.com/en/learn?q=najdorf", "https://thememorychess.com/en/learn"],
    ["https://thememorychess.com/leaderboard?player=Ann&tab=hard", "https://thememorychess.com/leaderboard?tab=hard"],
    ["https://thememorychess.com/leaderboard?tab=hard&player=Ann", "https://thememorychess.com/leaderboard?tab=hard"],
    ["https://thememorychess.com/x?a=1&q=b+c&z=2#top", "https://thememorychess.com/x?a=1&z=2#top"],
    ["https://thememorychess.com/game?pieces=8", "https://thememorychess.com/game?pieces=8"],
    ["https://thememorychess.com/x?faq=1", "https://thememorychess.com/x?faq=1"],
    ["$direct", "$direct"],
    ["https://thememorychess.com/leaderboard?pl%61yer=Ann", "https://thememorychess.com/leaderboard"],
    ["https://thememorychess.com/learn?a=1&&q=x", "https://thememorychess.com/learn?a=1"],
  ])("%s", (address, expected) => {
    expect(withoutTypedText(address)).toBe(expected);
  });

  it("cleans nested event properties, element chains included", () => {
    expect(scrubTypedText({ $current_url: "https://a.b/l?q=x", $elements: [{ attr__href: "/leaderboard?player=Ann" }], n: 3 })).toEqual({
      $current_url: "https://a.b/l",
      $elements: [{ attr__href: "/leaderboard" }],
      n: 3,
    });
  });

  it.each(["a && b where x=1", "Unexpected token '?' x=1", "Is x=1? yes"])("leaves text with no typed parameter exactly as it was: %s", (text) => {
    expect(withoutTypedText(text)).toBe(text);
  });

  it("cleans object keys too, which heatmap data uses for page addresses", () => {
    expect(scrubTypedText({ "https://a.b/leaderboard?player=Ann": [1] })).toEqual({ "https://a.b/leaderboard": [1] });
  });

  it("is what PostHog runs before sending an event", () => {
    const event = { event: "$pageview", properties: { $current_url: "https://a.b/learn?q=x", $referrer: "https://a.b/?player=y" } };
    expect(withoutTypedTextInEvent(event).properties).toEqual({ $current_url: "https://a.b/learn", $referrer: "https://a.b/" });
    expect(withoutTypedTextInEvent(null)).toBeNull();
    expect(withoutTypedTextInEvent({ ...event, $set_once: { $initial_current_url: "https://a.b/?q=x" } }).$set_once).toEqual({ $initial_current_url: "https://a.b/" });
  });

  it("drives GA4's first page view too, so the two lists cannot drift apart", () => {
    expect(GA_INIT_SNIPPET).toContain('["player","q"].indexOf(key) >= 0');
  });
});
