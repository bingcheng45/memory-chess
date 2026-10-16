import { render } from "@testing-library/react";
import SiteDatabuddy from "@/components/common/SiteDatabuddy";

const trackerScript = () => document.head.querySelector<HTMLScriptElement>("script[data-databuddy-injected]");

const originalClientId = process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID;

beforeEach(() => {
  process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID = "test-site";
});

afterEach(() => {
  document.head.querySelectorAll("script[data-databuddy-injected]").forEach((script) => script.remove());
  if (originalClientId === undefined) delete process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID;
  else process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID = originalClientId;
  jest.restoreAllMocks();
});

describe("SiteDatabuddy", () => {
  it("measures Web Vitals on a page load drawn into the one-in-ten sample", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.05);
    render(<SiteDatabuddy />);

    expect(trackerScript()?.getAttribute("data-track-web-vitals")).toBe("true");
  });

  it("skips Web Vitals on the other nine loads and still tracks errors and outgoing links", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    render(<SiteDatabuddy />);

    const script = trackerScript();
    expect([
      script?.getAttribute("data-client-id"),
      script?.getAttribute("data-track-web-vitals"),
      script?.getAttribute("data-track-errors"),
      script?.getAttribute("data-track-outgoing-links"),
    ]).toEqual(["test-site", "false", "true", "true"]);
  });
});
