import type { ComponentProps } from "react";
import { act, fireEvent, render, screen, within } from "@/test-utils/intl";
import ArticleList from "@/components/articles/ArticleList";
import { setReducedMotion } from "@/components/articles/__tests__/reducedMotion";
import { makeArticles, summaryOf } from "@/lib/articles/__tests__/fixtures";
import { NO_ARTICLE_STATS, type ArticleStats } from "@/lib/articles/stats";

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

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/articles",
}));

const HEADING = (
  <header>
    <h1>Articles</h1>
  </header>
);
const STATS: ArticleStats = {
  "alder-fixture": { views: 20, likes: 9 },
  "birch-fixture": { views: 900, likes: 0 },
  "cedar-fixture": { views: 300, likes: 31 },
};
const summaries = (count: number) => makeArticles(count).map(summaryOf);
const cards = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="/articles/"]'));
const shown = (container: HTMLElement) => cards(container).map((card) => card.getAttribute("data-article-card"));
const sortGroup = () => screen.queryByRole("group", { name: "Sort articles" });
const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const pressed = () => screen.getByRole("button", { pressed: true });

function renderSorted(count = 3, stats: ArticleStats = STATS) {
  const articles = summaries(count);
  return { articles, ...render(<ArticleList articles={articles} stats={stats} heading={HEADING} />) };
}

beforeEach(() => {
  window.history.replaceState(null, "", "/articles");
});

describe("ArticleList counts", () => {
  it("shows each card's views and likes as text inside the one link", () => {
    const { container } = renderSorted();
    const [alder] = cards(container);

    expect(within(alder).getByText("20 views")).toBeInTheDocument();
    expect(within(alder).getByText("9 likes")).toBeInTheDocument();
    expect(alder.querySelectorAll("button")).toHaveLength(0);
    expect(alder).toHaveAccessibleName(summaries(1)[0].title);
  });

  it("leaves out a count of zero, and the whole line when an article has no counts", () => {
    const { container } = renderSorted(4);
    const [, birch, , dogwood] = cards(container);

    expect(within(birch).getByText("900 views")).toBeInTheDocument();
    expect(within(birch).queryByText(/likes?$/)).not.toBeInTheDocument();
    expect(dogwood.querySelector("[data-article-counts]")).toBeNull();
    expect(container.querySelectorAll("[data-article-counts]")).toHaveLength(3);
  });

  it("groups thousands and writes one view and one like in the singular", () => {
    const { container } = renderSorted(2, {
      "alder-fixture": { views: 2140, likes: 1 },
      "birch-fixture": { views: 1, likes: 1873 },
    });
    const [alder, birch] = cards(container);

    expect(within(alder).getByText("2,140 views")).toBeInTheDocument();
    expect(within(alder).getByText("1 like")).toBeInTheDocument();
    expect(within(birch).getByText("1 view")).toBeInTheDocument();
    expect(within(birch).getByText("1,873 likes")).toBeInTheDocument();
  });

  it("keeps the three parts a transition carries, and adds no fourth", () => {
    const { container } = renderSorted();

    for (const card of cards(container)) {
      expect(card.querySelectorAll("[data-flight]")).toHaveLength(3);
      expect(card.querySelector("[data-article-counts] [data-flight]")).toBeNull();
    }
  });
});

describe("ArticleList sorting", () => {
  it("lays the page's heading out beside the sort control", () => {
    renderSorted();
    const header = screen.getByRole("heading", { level: 1, name: "Articles" }).closest("header");

    expect(header?.parentElement).toBe(sortGroup()?.parentElement?.parentElement);
  });

  it.each([
    ["one article", 1, STATS],
    ["no counts", 3, NO_ARTICLE_STATS],
    ["counts that are all zero", 3, { "alder-fixture": { views: 0, likes: 0 } }],
  ])("shows no sort control with %s, and still shows the heading", (_, count, stats) => {
    renderSorted(count, stats);

    expect(sortGroup()).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Articles" })).toBeInTheDocument();
  });

  it("offers Newest, Most viewed and Most liked, with Newest pressed", () => {
    renderSorted();
    const group = sortGroup();
    if (group === null) throw new Error("no sort control");

    expect(within(group).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Newest",
      "Most viewed",
      "Most liked",
    ]);
    expect(pressed()).toHaveTextContent("Newest");
    expect(screen.getByText("Sort")).toBeInTheDocument();
    within(group)
      .getAllByRole("button")
      .forEach((button) => expect(button).toHaveClass("min-h-11"));
  });

  it("orders by views and by likes, writes the choice to the address, and drops it for Newest", () => {
    const { container } = renderSorted();

    press("Most viewed");
    expect(shown(container)).toEqual(["birch-fixture", "cedar-fixture", "alder-fixture"]);
    expect(window.location.search).toBe("?sort=views");
    expect(pressed()).toHaveTextContent("Most viewed");

    press("Most liked");
    expect(shown(container)).toEqual(["cedar-fixture", "alder-fixture", "birch-fixture"]);
    expect(window.location.search).toBe("?sort=likes");

    press("Newest");
    expect(shown(container)).toEqual(["alder-fixture", "birch-fixture", "cedar-fixture"]);
    expect(window.location.search).toBe("");
  });

  it("breaks a tie by the given order and puts an article with no counts last", () => {
    const { container } = renderSorted(4, {
      "alder-fixture": { views: 5, likes: 1 },
      "birch-fixture": { views: 9, likes: 1 },
      "cedar-fixture": { views: 5, likes: 1 },
    });

    press("Most viewed");

    expect(shown(container)).toEqual(["birch-fixture", "alder-fixture", "cedar-fixture", "dogwood-fixture"]);
  });

  it("opens in the order the address names, and reads an unknown sort as newest", () => {
    window.history.replaceState(null, "", "/articles?sort=likes");
    const first = renderSorted();
    expect(shown(first.container)).toEqual(["cedar-fixture", "alder-fixture", "birch-fixture"]);
    first.unmount();

    window.history.replaceState(null, "", "/articles?sort=oldest");
    const second = renderSorted();
    expect(shown(second.container)).toEqual(["alder-fixture", "birch-fixture", "cedar-fixture"]);
    expect(pressed()).toHaveTextContent("Newest");
  });

  it("returns to page one on a new sort and keeps other query values", () => {
    window.history.replaceState(null, "", "/articles?ref=home&page=2");
    const { container } = renderSorted(13);
    expect(cards(container)).toHaveLength(3);

    press("Most viewed");

    const query = new URLSearchParams(window.location.search);
    expect(cards(container)).toHaveLength(10);
    expect(shown(container)[0]).toBe("birch-fixture");
    expect(query.get("page")).toBeNull();
    expect(query.get("sort")).toBe("views");
    expect(query.get("ref")).toBe("home");
  });

  it("sorts before it pages, so page two holds the least viewed", () => {
    const { container } = renderSorted(13);

    press("Most viewed");
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));

    expect(window.location.search).toBe("?sort=views&page=2");
    expect(cards(container)).toHaveLength(3);
    expect(shown(container)).not.toContain("birch-fixture");
  });

  it("follows the address on Back, and a link to the bare address returns to newest", () => {
    const { container, articles, rerender } = renderSorted();

    act(() => {
      window.history.replaceState(null, "", "/articles?sort=views");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(shown(container)[0]).toBe("birch-fixture");

    window.history.pushState(null, "", "/articles");
    rerender(<ArticleList articles={articles} stats={STATS} heading={HEADING} />);
    expect(shown(container)[0]).toBe("alder-fixture");
  });
});

describe("ArticleList slide", () => {
  const animate = jest.fn((): { finish: jest.Mock } => ({ finish: jest.fn() }));
  const SLIDE = { duration: 560, easing: "cubic-bezier(.16, 1, .3, 1)" };

  beforeEach(() => {
    animate.mockClear();
    setReducedMotion(false);
    Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: animate });
    Object.defineProperty(HTMLElement.prototype, "offsetTop", {
      configurable: true,
      get(this: HTMLElement) {
        return Array.from(this.parentElement?.children ?? []).indexOf(this) * 100;
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, "animate");
    Reflect.deleteProperty(HTMLElement.prototype, "offsetTop");
  });

  it("slides the cards that moved, on the list items, when a sort is pressed", () => {
    renderSorted();

    press("Most viewed");

    expect(animate).toHaveBeenCalledTimes(3);
    expect(animate.mock.contexts.every((card) => (card as Element).tagName === "LI")).toBe(true);
    expect(animate).toHaveBeenCalledWith([{ transform: "translate(0px, -200px)" }, { transform: "none" }], SLIDE);
  });

  it("does not slide on arrival, on Back, or on a page change", () => {
    window.history.replaceState(null, "", "/articles?sort=views");
    renderSorted(13);

    act(() => {
      window.history.replaceState(null, "", "/articles?sort=likes");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));

    expect(animate).not.toHaveBeenCalled();
  });

  it("does not slide when the visitor asked for reduced motion, and still reorders", () => {
    setReducedMotion(true);
    const { container } = renderSorted();

    press("Most viewed");

    expect(animate).not.toHaveBeenCalled();
    expect(shown(container)[0]).toBe("birch-fixture");
  });

  it("finishes a running slide before a card click starts its own transition", () => {
    const { container } = renderSorted();
    press("Most viewed");
    const slides = animate.mock.results.map((result) => result.value);

    fireEvent.click(cards(container)[0]);

    expect(slides).toHaveLength(3);
    slides.forEach((slide) => expect(slide.finish).toHaveBeenCalledTimes(1));
  });
});
