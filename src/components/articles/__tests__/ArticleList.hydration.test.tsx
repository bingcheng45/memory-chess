import { act, type ComponentProps } from "react";
// @ts-expect-error react-dom ships no types for its node entry, which jsdom needs to avoid MessageChannel
import { renderToString } from "react-dom/server.node";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import ArticleList from "@/components/articles/ArticleList";
import { sortedFirstPaintInlineScript } from "@/components/articles/sortedFirstPaint";
import { makeArticles, summaryOf } from "@/lib/articles/__tests__/fixtures";
import type { ArticleStats } from "@/lib/articles/stats";
import messages from "../../../../messages/en.json";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

const STATS: ArticleStats = {
  "alder-fixture": { views: 20, likes: 9 },
  "birch-fixture": { views: 900, likes: 0 },
  "cedar-fixture": { views: 300, likes: 31 },
};
const NEWEST = ["alder-fixture", "birch-fixture", "cedar-fixture"];
const MOST_LIKED = ["cedar-fixture", "alder-fixture", "birch-fixture"];
const MOST_VIEWED = ["birch-fixture", "cedar-fixture", "alder-fixture"];

const page = (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <ArticleList articles={makeArticles(3).map(summaryOf)} stats={STATS} heading={<h1>Articles</h1>} />
  </NextIntlClientProvider>
);

const mounted: Root[] = [];
const painted = () => document.documentElement.getAttribute("data-first-paint-sort");
const shown = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-article-card]"), (card) => card.getAttribute("data-article-card"));

function serve(address: string) {
  window.history.replaceState(null, "", address);
  window.eval(sortedFirstPaintInlineScript());
  const container = document.createElement("div");
  container.innerHTML = renderToString(page);
  document.body.appendChild(container);
  return container;
}

async function hydrate(container: HTMLElement) {
  const recoverable: unknown[] = [];
  await act(async () => {
    mounted.push(hydrateRoot(container, page, { onRecoverableError: (error) => recoverable.push(error) }));
  });
  return recoverable;
}

function orderWhenUnmarked(container: HTMLElement) {
  const orders: (string | null)[][] = [];
  const remove = document.documentElement.removeAttribute.bind(document.documentElement);
  jest.spyOn(document.documentElement, "removeAttribute").mockImplementation((name) => {
    if (name === "data-first-paint-sort" && painted() !== null) orders.push(shown(container));
    remove(name);
  });
  return orders;
}

afterEach(() => {
  act(() => mounted.splice(0).forEach((root) => root.unmount()));
  jest.restoreAllMocks();
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-first-paint-sort");
  window.history.replaceState(null, "", "/");
});

describe("ArticleList on a direct load of a sorted address", () => {
  it("is served newest first with the page marked, so CSS shows the sorted order before React runs", () => {
    const container = serve("/articles?sort=likes");

    expect(shown(container)).toEqual(NEWEST);
    expect(painted()).toBe("likes");
  });

  it.each([
    ["likes", MOST_LIKED],
    ["views", MOST_VIEWED],
  ])("hydrates into the %s order and unmarks the page, with no hydration error", async (sort, order) => {
    const container = serve(`/articles?sort=${sort}`);

    const recoverable = await hydrate(container);

    expect(shown(container)).toEqual(order);
    expect(painted()).toBeNull();
    expect(recoverable).toEqual([]);
  });

  it("unmarks the page only once the cards are in the sorted order, so the two never disagree on screen", async () => {
    const container = serve("/articles?sort=likes");
    const orders = orderWhenUnmarked(container);

    await hydrate(container);

    expect(orders).toEqual([MOST_LIKED]);
  });

  it("does not slide the cards", async () => {
    const animate = jest.fn();
    Object.defineProperty(Element.prototype, "animate", { configurable: true, writable: true, value: animate });
    const container = serve("/articles?sort=likes");

    await hydrate(container);
    Reflect.deleteProperty(Element.prototype, "animate");

    expect(shown(container)).toEqual(MOST_LIKED);
    expect(animate).not.toHaveBeenCalled();
  });

  it("follows a press of another sort afterwards", async () => {
    const container = serve("/articles?sort=likes");
    await hydrate(container);

    act(() => {
      Array.from(container.querySelectorAll("button"))
        .find((button) => button.textContent === "Most viewed")
        ?.click();
    });

    expect(shown(container)).toEqual(MOST_VIEWED);
    expect(painted()).toBeNull();
  });
});

describe("ArticleList and a mark left on the page", () => {
  it("clears a mark that outlived the load it was made for, when the list mounts at the bare address", async () => {
    window.history.replaceState(null, "", "/articles");
    document.documentElement.setAttribute("data-first-paint-sort", "likes");
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push(root);

    await act(async () => root.render(page));

    expect(shown(container)).toEqual(NEWEST);
    expect(painted()).toBeNull();
  });
});
