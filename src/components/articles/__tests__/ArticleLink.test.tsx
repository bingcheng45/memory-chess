import type { ComponentProps, MouseEvent } from "react";
import { act, fireEvent, render, screen } from "@/test-utils/intl";
import ArticleFlightGate from "@/components/articles/ArticleFlightGate";
import ArticleLink from "@/components/articles/ArticleLink";
import { announceArrival, clearArrival, peekArrival } from "@/components/articles/articleArrival";
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

const SLUG = "alder-fixture";
const ARTICLE_HREF = `/articles/${SLUG}`;
const ROUTE_COMMIT_LIMIT_MS = 400;

const flush = () => act(async () => {});
const flights = () => document.querySelectorAll("[data-article-flight]");

async function isSettled(promise: Promise<unknown>) {
  let settled = false;
  const mark = () => {
    settled = true;
  };
  promise.then(mark, mark);
  await flush();
  return settled;
}

function stubViewTransitions() {
  let finish = () => {};
  let fail = () => {};
  const finished = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = () => reject(new Error("the update callback threw"));
  });
  let flightsWhenStarted = -1;
  let updateDone: Promise<void> = Promise.resolve();
  const skip = jest.fn(() => finish());
  const start = jest.fn((update: () => Promise<void>) => {
    flightsWhenStarted = flights().length;
    updateDone = Promise.resolve().then(update);
    return { finished, ready: Promise.resolve(), updateCallbackDone: updateDone, skipTransition: skip };
  });
  Object.defineProperty(document, "startViewTransition", { configurable: true, writable: true, value: start });
  return {
    start,
    skip,
    finish: () => finish(),
    fail: () => fail(),
    get flightsWhenStarted() {
      return flightsWhenStarted;
    },
    get updateDone() {
      return updateDone;
    },
  };
}

function Card() {
  return (
    <ArticleLink article={SLUG} data-article-card={SLUG}>
      Open the article
    </ArticleLink>
  );
}

function BackLink() {
  return <ArticleLink backFrom={SLUG}>All articles</ArticleLink>;
}

function ListPage() {
  return (
    <>
      <Card />
      <ArticleFlightGate />
    </>
  );
}

function ArticlePage() {
  return (
    <>
      <BackLink />
      <ArticleFlightGate />
    </>
  );
}

const card = () => screen.getByRole("link", { name: "Open the article" });
const backLink = () => screen.getByRole("link", { name: "All articles" });

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
        <ArticleLink article="birch-fixture" data-article-card="birch-fixture">
          Another card
        </ArticleLink>
      </>,
    );

    fireEvent.click(card());

    expect(transitions.flightsWhenStarted).toBe(1);
    expect(card()).toHaveAttribute("data-article-flight");
    expect(screen.getByRole("link", { name: "Another card" })).not.toHaveAttribute("data-article-flight");

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
        <ArticleLink article="birch-fixture" data-article-card="birch-fixture">
          Another card
        </ArticleLink>
      </>,
    );
    await flush();
    const another = screen.getByRole("link", { name: "Another card" });

    stubViewTransitions();
    fireEvent.click(another);
    back.finish();
    await flush();

    expect(another).toHaveAttribute("data-article-flight");
    expect(card()).not.toHaveAttribute("data-article-flight");
  });
});

describe("ArticleFlightGate", () => {
  it("drops an arrival that never opened when the reader presses Back or Forward", () => {
    render(<ListPage />);
    announceArrival(SLUG, Promise.resolve());

    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(peekArrival(SLUG)).toBeNull();
  });

  it("drops an arrival that never opened when the reader leaves the section", () => {
    const { unmount } = render(<ListPage />);
    announceArrival(SLUG, Promise.resolve());

    unmount();

    expect(peekArrival(SLUG)).toBeNull();
  });

  it("stops listening once it is gone", () => {
    const { unmount } = render(<ListPage />);
    unmount();
    announceArrival(SLUG, Promise.resolve());

    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(peekArrival(SLUG)).not.toBeNull();
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
