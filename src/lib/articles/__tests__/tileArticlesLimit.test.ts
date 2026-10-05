import { getTileArticles } from "@/lib/articles";

jest.mock("@/lib/articles/registry", () => {
  const registry = jest.requireActual<typeof import("@/lib/articles/registry")>("@/lib/articles/registry");
  const { FIXTURE_COUNT, makeArticle } = jest.requireActual<typeof import("./fixtures")>("./fixtures");
  const oldestFirst = Array.from({ length: FIXTURE_COUNT }, (_, index) => makeArticle(index));
  const ARTICLES = registry.newestFirst(oldestFirst);

  return { ...registry, ARTICLES, ARTICLE_SLUGS: ARTICLES.map((article) => article.slug) };
});

describe("getTileArticles with more articles than a game page carries", () => {
  it("gives the 12 newest of 13 articles, newest first, and leaves the oldest out", async () => {
    const articles = await getTileArticles("en");

    expect(articles.map((article) => article.slug)).toEqual([
      "maple-fixture",
      "larch-fixture",
      "kapok-fixture",
      "juniper-fixture",
      "ivy-fixture",
      "hazel-fixture",
      "ginkgo-fixture",
      "fir-fixture",
      "elm-fixture",
      "dogwood-fixture",
      "cedar-fixture",
      "birch-fixture",
    ]);
  });
});
