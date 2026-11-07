import type { ComponentProps } from "react";
import { render, screen, waitFor, within } from "@/test-utils/intl";
import ArticlePage from "@/components/articles/ArticlePage";
import { makeArticle, summaryOf } from "@/lib/articles/__tests__/fixtures";
import type { ArticleCounts } from "@/lib/articles/stats";
import { viewedStore } from "@/lib/articles/viewedStore";

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

jest.mock("@/components/lab-paper/LabPaperHeader", () => ({ LabPaperHeader: () => <div>LabPaperHeader</div> }));

const article = makeArticle(0);
const next = summaryOf(makeArticle(1));

let fetchMock: jest.Mock;
let liveRows: unknown[] | null;

function renderPage(counts?: ArticleCounts) {
  const view = render(<ArticlePage article={article} nextArticle={next} counts={counts} />);
  const header = view.container.querySelector("article header");
  if (!(header instanceof HTMLElement)) throw new Error("no heading block");
  return { ...view, header };
}

const likeButton = () => screen.getByRole("button", { name: "Like this article" });

beforeEach(() => {
  liveRows = null;
  fetchMock = jest.fn(async (url: string) =>
    url === "/api/articles/stats"
      ? { status: liveRows === null ? 503 : 200, json: async () => liveRows }
      : { status: 200, json: async () => ({ views: 1, likes: 0 }) },
  );
  global.fetch = fetchMock;
});

afterEach(() => {
  viewedStore.remove(article.slug);
  window.sessionStorage.clear();
  window.localStorage.clear();
  Reflect.deleteProperty(global, "fetch");
});

describe("ArticlePage counts", () => {
  it("shows the views and the like button in the heading block, after the authorship note", () => {
    const { header } = renderPage({ views: 2140, likes: 187 });
    const note = header.querySelector("[data-authorship-note]");
    const row = header.querySelector("[data-article-counts]");

    expect(within(header).getByText("2,140 views")).toBeInTheDocument();
    expect(row).toContainElement(likeButton());
    expect(likeButton()).toHaveTextContent(/^187$/);
    expect(note?.compareDocumentPosition(row as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each([
    ["no counts", undefined],
    ["counts of zero", { views: 0, likes: 0 }],
  ])("keeps the row and the like button with %s, and shows no number", (_, counts) => {
    const { header } = renderPage(counts);

    expect(header.querySelector("[data-article-counts]")).toContainElement(likeButton());
    expect(within(header).queryByText(/views?$/)).not.toBeInTheDocument();
    expect(likeButton()).toHaveTextContent(/^$/);
  });

  it("keeps the rail to the portrait and the fact file", () => {
    const { container } = renderPage({ views: 2140, likes: 187 });
    const rail = container.querySelector("[data-article-rail]");

    expect(rail?.querySelector("button")).toBeNull();
    expect(rail?.querySelector("[data-article-counts]")).toBeNull();
  });

  it("puts nothing new inside the parts a transition carries, and names no fourth part", () => {
    const { container } = renderPage({ views: 2140, likes: 187 });

    expect(container.querySelectorAll("[data-flight]")).toHaveLength(3);
    expect(likeButton().closest("[data-flight]")).toBeNull();
    expect(container.querySelector("[data-article-counts]")?.closest("[data-flight]")).toBeNull();
  });

  it("hides nothing: the live line is empty, not hidden", () => {
    const { container } = renderPage({ views: 2140, likes: 187 });
    const live = container.querySelector("[data-article-counts] [aria-live]");

    expect(live).toBeEmptyDOMElement();
    expect(live).not.toHaveAttribute("hidden");
    expect(container.querySelectorAll("[hidden], [style*='opacity'], [style*='display'], [style*='visibility']")).toHaveLength(0);
  });

  it("replaces the built counts with the current ones once the page has loaded", async () => {
    liveRows = [{ slug: article.slug, views: 2300, likes: 190 }];
    const { header } = renderPage({ views: 2140, likes: 187 });

    expect(await within(header).findByText("2,300 views")).toBeInTheDocument();
    expect(likeButton()).toHaveTextContent(/^190$/);
  });

  it("keeps the built counts when the current ones cannot be read", async () => {
    const { header } = renderPage({ views: 2140, likes: 187 });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/articles/stats", expect.anything()));
    expect(within(header).getByText("2,140 views")).toBeInTheDocument();
    expect(likeButton()).toHaveTextContent(/^187$/);
  });

  it("records one view for the article it shows", () => {
    renderPage({ views: 2140, likes: 187 });

    const views = fetchMock.mock.calls.filter(([url]) => url === `/api/articles/${article.slug}/stats`);
    expect(views).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/articles/${article.slug}/stats`,
      expect.objectContaining({ body: JSON.stringify({ event: "view" }) }),
    );
  });
});
