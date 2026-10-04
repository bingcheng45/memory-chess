import type { ComponentProps } from "react";
import { render, screen, within } from "@/test-utils/intl";
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

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

const article = makeArticle(0);
const next = summaryOf(makeArticle(1));

let fetchMock: jest.Mock;

function renderPage(counts?: ArticleCounts) {
  const view = render(<ArticlePage article={article} nextArticle={next} counts={counts} />);
  const header = view.container.querySelector("article header");
  if (!(header instanceof HTMLElement)) throw new Error("no heading block");
  return { ...view, header };
}

const likeButton = () => screen.getByRole("button", { name: "Like this article" });

beforeEach(() => {
  fetchMock = jest.fn().mockResolvedValue({ status: 200, json: async () => ({ views: 1, likes: 0 }) });
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

  it("keeps the rail to the portrait and the fact file, so its measured height holds", () => {
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

  it("records one view for the article it shows", () => {
    renderPage({ views: 2140, likes: 187 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/articles/${article.slug}/stats`,
      expect.objectContaining({ body: JSON.stringify({ event: "view" }) }),
    );
  });
});
