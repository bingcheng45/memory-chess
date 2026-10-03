import { render, screen } from "@testing-library/react";
import { setRequestLocale } from "next-intl/server";
import ArticleRoute, { revalidate } from "@/app/[locale]/articles/[slug]/page";
import ArticlePage from "@/components/articles/ArticlePage";
import { getArticle, getNextArticle } from "@/lib/articles";
import { NO_ARTICLE_STATS } from "@/lib/articles/stats";
import { getArticleStats } from "@/lib/services/articleStatsService";

jest.mock("next-intl/server", () => ({
  setRequestLocale: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

jest.mock("@/lib/services/articleStatsService", () => ({
  getArticleStats: jest.fn(),
}));

jest.mock("@/components/articles/ArticlePage", () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="article-page" />),
}));

const SLUG = "magnus-carlsen";
const COUNTS = { views: 120, likes: 7 };

function routeFor(slug: string) {
  return ArticleRoute({ params: Promise.resolve({ slug, locale: "en" }) });
}

function pageProps() {
  return jest.mocked(ArticlePage).mock.calls[0][0];
}

describe("ArticleRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getArticleStats).mockResolvedValue({ [SLUG]: COUNTS, "judit-polgar": { views: 4, likes: 0 } });
  });

  it("revalidates every five minutes", () => {
    expect(revalidate).toBe(300);
  });

  it("asks for the counts of the one article, after pinning the locale", async () => {
    render(await routeFor(SLUG));

    expect(getArticleStats).toHaveBeenCalledTimes(1);
    expect(getArticleStats).toHaveBeenCalledWith([SLUG]);
    expect(setRequestLocale).toHaveBeenCalledWith("en");
    expect(jest.mocked(setRequestLocale).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(getArticleStats).mock.invocationCallOrder[0],
    );
  });

  it("hands the article page the article, the next article and that article's counts", async () => {
    render(await routeFor(SLUG));

    expect(pageProps()).toEqual({
      article: getArticle(SLUG),
      nextArticle: getNextArticle(SLUG),
      counts: COUNTS,
    });
  });

  it("still renders, without counts, when there are none", async () => {
    jest.mocked(getArticleStats).mockResolvedValue(NO_ARTICLE_STATS);

    render(await routeFor(SLUG));

    expect(screen.getByTestId("article-page")).toBeInTheDocument();
    expect(pageProps()).toEqual({
      article: getArticle(SLUG),
      nextArticle: getNextArticle(SLUG),
      counts: undefined,
    });
  });

  it("does not read counts for a slug outside the registry", async () => {
    await expect(routeFor("not-an-article")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getArticleStats).not.toHaveBeenCalled();
  });
});
