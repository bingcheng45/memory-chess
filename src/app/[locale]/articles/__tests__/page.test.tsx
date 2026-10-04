import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { render, screen, within } from "@/test-utils/intl";
import * as pageModule from "@/app/[locale]/articles/page";
import ArticlesPage, { revalidate } from "@/app/[locale]/articles/page";
import ArticleList from "@/components/articles/ArticleList";
import { sortedFirstPaintScript } from "@/components/articles/sortedFirstPaint";
import { ARTICLE_SLUGS, ARTICLE_SUMMARIES } from "@/lib/articles";
import { ARTICLE_LIST_COPY } from "@/lib/articles/copy";
import { NO_ARTICLE_STATS, type ArticleStats } from "@/lib/articles/stats";
import { getArticleStats } from "@/lib/services/articleStatsService";

jest.mock("next-intl/server", () => ({
  setRequestLocale: jest.fn(),
}));

jest.mock("@/lib/services/articleStatsService", () => ({
  getArticleStats: jest.fn(),
}));

jest.mock("@/components/articles/ArticleList", () => ({
  __esModule: true,
  default: jest.fn(({ heading }: { heading: ReactNode }) => (
    <div data-testid="article-list">{heading}</div>
  )),
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

const STATS: ArticleStats = {
  "magnus-carlsen": { views: 120, likes: 7 },
  "judit-polgar": { views: 4, likes: 0 },
};

async function renderPage() {
  return render(await ArticlesPage({ params: Promise.resolve({ locale: "en" }) }));
}

function listProps() {
  return jest.mocked(ArticleList).mock.calls[0][0];
}

describe("ArticlesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getArticleStats).mockResolvedValue(STATS);
  });

  it("revalidates every five minutes and exports no dynamic mode", () => {
    expect(revalidate).toBe(300);
    expect(Object.keys(pageModule)).not.toContain("dynamic");
  });

  it("asks for the counts of exactly the registry slugs, after pinning the locale", async () => {
    await renderPage();

    expect(getArticleStats).toHaveBeenCalledTimes(1);
    expect(getArticleStats).toHaveBeenCalledWith(ARTICLE_SLUGS);
    expect(setRequestLocale).toHaveBeenCalledWith("en");
    expect(jest.mocked(setRequestLocale).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(getArticleStats).mock.invocationCallOrder[0],
    );
  });

  it("hands the list its articles, the counts and the heading, and nothing else", async () => {
    await renderPage();

    expect(listProps()).toEqual(expect.objectContaining({ articles: ARTICLE_SUMMARIES, stats: STATS }));
    expect(Object.keys(listProps()).sort()).toEqual(["articles", "heading", "stats"]);
  });

  it("passes its header as the heading and leaves the header's margins to the list", async () => {
    await renderPage();

    const header = screen.getByTestId("article-list").querySelector("header");
    if (header === null) throw new Error("the heading is not a <header>");

    expect(header).not.toHaveClass("mb-[26px]");
    expect(header).not.toHaveClass("mt-[22px]");
    expect(
      within(header).getByRole("heading", { level: 1, name: ARTICLE_LIST_COPY.heading }),
    ).toBeInTheDocument();
    expect(within(header).getByText(ARTICLE_LIST_COPY.sub)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("runs the sorted first paint script before the list is parsed", async () => {
    const { container } = await renderPage();
    const script = container.querySelector("script:not([type])");
    if (script === null) throw new Error("the page has no inline script");

    expect(script.textContent).toBe(sortedFirstPaintScript());
    expect(
      script.compareDocumentPosition(screen.getByTestId("article-list")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("still renders when there are no counts", async () => {
    jest.mocked(getArticleStats).mockResolvedValue(NO_ARTICLE_STATS);

    await renderPage();

    expect(listProps()).toEqual(expect.objectContaining({ stats: NO_ARTICLE_STATS }));
    expect(screen.getByRole("heading", { level: 2, name: ARTICLE_LIST_COPY.about.heading })).toBeInTheDocument();
  });
});
