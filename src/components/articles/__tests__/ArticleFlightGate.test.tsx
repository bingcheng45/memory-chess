import { act, render } from "@testing-library/react";
import ArticleFlightGate from "@/components/articles/ArticleFlightGate";
import { announceArrival, clearArrival, peekArrival } from "@/components/articles/articleArrival";

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => "/articles",
}));

const SLUG = "alder-fixture";

afterEach(clearArrival);

describe("ArticleFlightGate", () => {
  it("drops an arrival that never opened when the reader presses Back or Forward", () => {
    render(<ArticleFlightGate />);
    announceArrival(SLUG, Promise.resolve());

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(peekArrival(SLUG)).toBeNull();
  });

  it("drops an arrival that never opened when the reader leaves the section", () => {
    const { unmount } = render(<ArticleFlightGate />);
    announceArrival(SLUG, Promise.resolve());

    unmount();

    expect(peekArrival(SLUG)).toBeNull();
  });

  it("stops listening once it is gone", () => {
    const { unmount } = render(<ArticleFlightGate />);
    unmount();
    announceArrival(SLUG, Promise.resolve());

    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(peekArrival(SLUG)).not.toBeNull();
  });
});
