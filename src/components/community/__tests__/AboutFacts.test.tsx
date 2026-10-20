import { render } from "@/test-utils/intl";
import { AboutFacts } from "@/components/community/AboutFacts";
import german from "../../../../messages/de.json";
import japanese from "../../../../messages/ja.json";

const PLAYS = { plays: 49631, asOf: "2026-10-19T18:30:00.000Z" };

describe("AboutFacts", () => {
  it("states who runs the site, when it launched, its languages, and the finished games to the Singapore date", () => {
    const { container } = render(<AboutFacts plays={PLAYS} />);

    expect(container.textContent).toBe(
      "Memory Chess is built and run by one developer, Bing Cheng. It first went live in March 2025 and plays in 24 languages. Players had finished 49,000+ games by October 20, 2026.",
    );
    expect(container.querySelector("time")?.getAttribute("dateTime")).toBe("2026-10-20");
  });

  it("leaves out the games sentence when the count is unknown", () => {
    const { container } = render(<AboutFacts plays={null} />);

    expect(container.textContent).toBe(
      "Memory Chess is built and run by one developer, Bing Cheng. It first went live in March 2025 and plays in 24 languages.",
    );
    expect(container.querySelector("time")).toBeNull();
  });

  it("writes the count and the date the German way on the German page", () => {
    const { container } = render(<AboutFacts plays={PLAYS} />, { locale: "de", messages: german });

    expect(container.textContent).toContain("49.000+");
    expect(container.textContent).toContain("20. Oktober 2026");
  });

  it("runs the Japanese sentences together with no space after the full stop", () => {
    const { container } = render(<AboutFacts plays={PLAYS} />, { locale: "ja", messages: japanese });

    expect(container.textContent).toContain("遊べます。2026年10月20日までに");
  });
});
