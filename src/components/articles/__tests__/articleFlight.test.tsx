import type { ComponentProps } from "react";
import { act, fireEvent, render } from "@/test-utils/intl";
import { clearArrival } from "@/components/articles/articleArrival";
import {
  ARTICLE_HREF,
  ArticlePage,
  ListPage,
  OTHER_ARTICLE_HREF,
  OtherCard,
  ROUTE_COMMIT_LIMIT_MS,
  backLink,
  card,
  flush,
  isSettled,
  otherCard,
  stubViewTransitions,
} from "@/components/articles/__tests__/flightHarness";
import { setReducedMotion } from "@/components/articles/__tests__/reducedMotion";

jest.mock("next/link", () => {
  function MockNextLink({ children, href, ...props }: ComponentProps<"a">) {
    return (
      <a href={typeof href === "string" ? href : "#"} {...props}>
        {children}
      </a>
    );
  }

  return MockNextLink;
});

const SECOND_CLICK_BEFORE_LIMIT_MS = 100;
let mockPathname = "/articles";

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  mockPathname = "/articles";
  setReducedMotion(false);
});

afterEach(() => {
  clearArrival();
  Reflect.deleteProperty(document, "startViewTransition");
  jest.useRealTimers();
});

describe("ArticleLink when two flights overlap", () => {
  it("keeps the name on a card clicked while the flight back to the list is still running", async () => {
    const back = stubViewTransitions();
    mockPathname = ARTICLE_HREF;
    const { rerender } = render(<ArticlePage />);
    fireEvent.click(backLink());
    await flush();
    mockPathname = "/articles";
    rerender(
      <>
        <ListPage />
        <OtherCard />
      </>,
    );
    await flush();
    const another = otherCard();

    stubViewTransitions();
    fireEvent.click(another);
    back.finish();
    await flush();

    expect(another).toHaveAttribute("data-article-flight");
    expect(card()).not.toHaveAttribute("data-article-flight");
  });

  it("names only the second card when it is clicked before the first route commits", async () => {
    stubViewTransitions();
    render(
      <>
        <ListPage />
        <OtherCard />
      </>,
    );
    fireEvent.click(card());
    await flush();

    const second = stubViewTransitions();
    fireEvent.click(otherCard());

    expect(second.flightsWhenStarted).toBe(1);
    expect(otherCard()).toHaveAttribute("data-article-flight");
    expect(card()).not.toHaveAttribute("data-article-flight");
  });

  it("lets the second flight land when the first one's 400 ms limit passes while it waits", async () => {
    jest.useFakeTimers();
    stubViewTransitions();
    const { rerender } = render(
      <>
        <ListPage />
        <OtherCard />
      </>,
    );
    fireEvent.click(card());
    await flush();
    act(() => {
      jest.advanceTimersByTime(ROUTE_COMMIT_LIMIT_MS - SECOND_CLICK_BEFORE_LIMIT_MS);
    });

    const second = stubViewTransitions();
    fireEvent.click(otherCard());
    await flush();
    act(() => {
      jest.advanceTimersByTime(SECOND_CLICK_BEFORE_LIMIT_MS);
    });
    await flush();
    expect(otherCard()).toHaveAttribute("data-article-flight");
    expect(card()).not.toHaveAttribute("data-article-flight");
    mockPathname = OTHER_ARTICLE_HREF;
    rerender(<ArticlePage />);

    expect(await isSettled(second.updateDone)).toBe(true);
    expect(second.skip).not.toHaveBeenCalled();
  });

  it("leaves the article page's own name in place when a flight starts from it", async () => {
    stubViewTransitions();
    mockPathname = ARTICLE_HREF;
    render(
      <article data-article-flight="">
        <ArticlePage />
      </article>,
    );

    fireEvent.click(backLink());
    await flush();

    expect(document.querySelector("article")).toHaveAttribute("data-article-flight");
  });
});
