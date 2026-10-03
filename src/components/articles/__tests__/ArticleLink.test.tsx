import type { ComponentProps, MouseEvent } from "react";
import { act, fireEvent, render } from "@/test-utils/intl";
import ArticleLink from "@/components/articles/ArticleLink";
import { clearArrival, peekArrival } from "@/components/articles/articleArrival";
import {
  ARTICLE_HREF,
  ArticlePage,
  BackLink,
  Card,
  ListPage,
  OtherCard,
  ROUTE_COMMIT_LIMIT_MS,
  SLUG,
  backLink,
  card,
  flights,
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

const mockPush = jest.fn();
let mockPathname = "/articles";

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  mockPush.mockClear();
  mockPathname = "/articles";
  setReducedMotion(false);
});

afterEach(() => {
  clearArrival();
  Reflect.deleteProperty(document, "startViewTransition");
  jest.useRealTimers();
});

describe("ArticleLink markup", () => {
  it("links to the article it names and passes its other props to the anchor", () => {
    render(
      <ArticleLink article={SLUG} className="card" data-article-card={SLUG}>
        Open the article
      </ArticleLink>,
    );

    expect(card()).toHaveAttribute("href", ARTICLE_HREF);
    expect(card()).toHaveClass("card");
    expect(card()).toHaveAttribute("data-article-card", SLUG);
    expect(card()).not.toHaveAttribute("article");
  });

  it("links to the list when it leads back from an article", () => {
    render(<BackLink />);

    expect(backLink()).toHaveAttribute("href", "/articles");
    expect(backLink()).not.toHaveAttribute("backfrom");
  });
});

describe("ArticleLink without the View Transitions API", () => {
  it("announces the arrival and calls the router once", async () => {
    render(<Card />);

    const wasNotPrevented = fireEvent.click(card());

    expect(wasNotPrevented).toBe(false);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(ARTICLE_HREF);
    expect(peekArrival(SLUG)).not.toBeNull();
    expect(await isSettled(peekArrival(SLUG)!.mayStart)).toBe(true);
  });

  it("marks no card, since nothing will fly", () => {
    render(<Card />);

    fireEvent.click(card());

    expect(flights()).toHaveLength(0);
  });

  it("goes back to the list with one router call and no arrival", () => {
    render(<BackLink />);

    fireEvent.click(backLink());

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/articles");
    expect(peekArrival(SLUG)).toBeNull();
  });
});

describe("ArticleLink with the View Transitions API", () => {
  it("announces the arrival and calls the router once, inside the transition", async () => {
    const transitions = stubViewTransitions();
    render(<Card />);

    const wasNotPrevented = fireEvent.click(card());
    expect(wasNotPrevented).toBe(false);
    expect(transitions.start).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();

    await flush();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(ARTICLE_HREF);
    expect(peekArrival(SLUG)).not.toBeNull();
  });

  it("lets the body type only once the transition has finished", async () => {
    const transitions = stubViewTransitions();
    render(<Card />);
    fireEvent.click(card());
    const { mayStart } = peekArrival(SLUG)!;

    expect(await isSettled(mayStart)).toBe(false);

    transitions.finish();
    expect(await isSettled(mayStart)).toBe(true);
  });

  it("lets the body type even when the transition fails", async () => {
    const transitions = stubViewTransitions();
    render(<Card />);
    fireEvent.click(card());

    transitions.fail();

    expect(await isSettled(peekArrival(SLUG)!.mayStart)).toBe(true);
  });

  it("names the clicked card before the browser takes its snapshot, and unnames it afterwards", async () => {
    const transitions = stubViewTransitions();
    render(
      <>
        <Card />
        <OtherCard />
      </>,
    );

    fireEvent.click(card());

    expect(transitions.flightsWhenStarted).toBe(1);
    expect(card()).toHaveAttribute("data-article-flight");
    expect(otherCard()).not.toHaveAttribute("data-article-flight");

    transitions.finish();
    await flush();
    expect(flights()).toHaveLength(0);
  });

  it("holds the old page until the gate sees the address change", async () => {
    const transitions = stubViewTransitions();
    const { rerender } = render(<ListPage />);
    fireEvent.click(card());
    await flush();

    rerender(<ListPage />);
    expect(await isSettled(transitions.updateDone)).toBe(false);

    mockPathname = ARTICLE_HREF;
    rerender(<ArticlePage />);

    expect(await isSettled(transitions.updateDone)).toBe(true);
    expect(transitions.skip).not.toHaveBeenCalled();
  });

  it("gives up after 400 ms and lets the page go, so a slow route never freezes it", async () => {
    jest.useFakeTimers();
    const transitions = stubViewTransitions();
    render(<ListPage />);
    fireEvent.click(card());
    await flush();

    act(() => {
      jest.advanceTimersByTime(ROUTE_COMMIT_LIMIT_MS - 1);
    });
    expect(await isSettled(transitions.updateDone)).toBe(false);
    expect(transitions.skip).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(await isSettled(transitions.updateDone)).toBe(true);
    expect(transitions.skip).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(await isSettled(peekArrival(SLUG)!.mayStart)).toBe(true);
    expect(flights()).toHaveLength(0);
  });

  it("names the card of the article it leaves once the list has committed, then unnames it", async () => {
    const transitions = stubViewTransitions();
    mockPathname = ARTICLE_HREF;
    const { rerender } = render(<ArticlePage />);

    fireEvent.click(backLink());
    await flush();
    expect(mockPush).toHaveBeenCalledWith("/articles");
    expect(peekArrival(SLUG)).toBeNull();

    mockPathname = "/articles";
    rerender(<ListPage />);
    await flush();
    expect(card()).toHaveAttribute("data-article-flight");
    expect(await isSettled(transitions.updateDone)).toBe(true);

    transitions.finish();
    await flush();
    expect(flights()).toHaveLength(0);
  });

  it("does not name a card when the list commits after the 400 ms limit", async () => {
    jest.useFakeTimers();
    stubViewTransitions();
    mockPathname = ARTICLE_HREF;
    const { rerender } = render(<ArticlePage />);
    fireEvent.click(backLink());
    await flush();

    act(() => {
      jest.advanceTimersByTime(ROUTE_COMMIT_LIMIT_MS);
    });
    mockPathname = "/articles";
    rerender(<ListPage />);
    await flush();

    expect(flights()).toHaveLength(0);
  });

  it("skips the transition under reduced motion and still navigates and announces", () => {
    const transitions = stubViewTransitions();
    setReducedMotion(true);
    render(<Card />);

    fireEvent.click(card());

    expect(transitions.start).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(peekArrival(SLUG)).not.toBeNull();
    expect(flights()).toHaveLength(0);
  });
});

describe("ArticleLink clicks it leaves to the browser", () => {
  it.each([
    ["a command click", { metaKey: true }],
    ["a control click", { ctrlKey: true }],
    ["a shift click", { shiftKey: true }],
    ["an option click", { altKey: true }],
    ["a middle click", { button: 1 }],
  ])("does nothing on %s, so the browser opens the link its own way", (_name, init) => {
    const transitions = stubViewTransitions();
    render(<Card />);

    const wasNotPrevented = fireEvent.click(card(), init);

    expect(wasNotPrevented).toBe(true);
    expect(transitions.start).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(peekArrival(SLUG)).toBeNull();
    expect(flights()).toHaveLength(0);
  });

  it("runs the caller's onClick first and stands down when it prevents the default", () => {
    const transitions = stubViewTransitions();
    const onClick = jest.fn((event: MouseEvent) => event.preventDefault());
    render(
      <ArticleLink article={SLUG} onClick={onClick}>
        Open the article
      </ArticleLink>,
    );

    fireEvent.click(card());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(transitions.start).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(peekArrival(SLUG)).toBeNull();
  });
});
