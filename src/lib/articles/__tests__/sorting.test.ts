import {
  DEFAULT_SORT,
  SORT_KEYS,
  hasCountsToSortBy,
  parseSortKey,
  sortArticles,
} from "@/lib/articles/sorting";
import { NO_ARTICLE_STATS, type ArticleStats } from "@/lib/articles/stats";

const NEWEST_FIRST = [{ slug: "cedar" }, { slug: "birch" }, { slug: "alder" }] as const;
const slugs = (articles: readonly { slug: string }[]) => articles.map((article) => article.slug);

describe("parseSortKey", () => {
  it.each(SORT_KEYS)("keeps %s", (key) => {
    expect(parseSortKey(key)).toBe(key);
  });

  it.each([null, "", "oldest", "VIEWS", "constructor"])("reads %p as newest", (raw) => {
    expect(parseSortKey(raw)).toBe("newest");
    expect(DEFAULT_SORT).toBe("newest");
  });
});

describe("sortArticles", () => {
  const stats: ArticleStats = {
    alder: { views: 900, likes: 4 },
    birch: { views: 20, likes: 31 },
    cedar: { views: 300, likes: 7 },
  };

  it("keeps the registry order for newest, whatever the counts say", () => {
    expect(slugs(sortArticles(NEWEST_FIRST, stats, "newest"))).toEqual(["cedar", "birch", "alder"]);
  });

  it("puts the most viewed first", () => {
    expect(slugs(sortArticles(NEWEST_FIRST, stats, "views"))).toEqual(["alder", "cedar", "birch"]);
  });

  it("puts the most liked first", () => {
    expect(slugs(sortArticles(NEWEST_FIRST, stats, "likes"))).toEqual(["birch", "cedar", "alder"]);
  });

  it.each(["views", "likes"] as const)("breaks a tie on %s by the newer article", (sort) => {
    const tied: ArticleStats = {
      alder: { views: 5, likes: 5 },
      birch: { views: 9, likes: 9 },
      cedar: { views: 5, likes: 5 },
    };

    expect(slugs(sortArticles(NEWEST_FIRST, tied, sort))).toEqual(["birch", "cedar", "alder"]);
  });

  it.each(["views", "likes"] as const)("sorts an article with no counts last on %s", (sort) => {
    const partial: ArticleStats = { alder: { views: 1, likes: 1 }, birch: { views: 2, likes: 2 } };

    expect(slugs(sortArticles(NEWEST_FIRST, partial, sort))).toEqual(["birch", "alder", "cedar"]);
  });

  it.each(SORT_KEYS)("keeps the registry order on %s when nothing has counts", (sort) => {
    expect(slugs(sortArticles(NEWEST_FIRST, NO_ARTICLE_STATS, sort))).toEqual(["cedar", "birch", "alder"]);
  });

  it.each(SORT_KEYS)("answers a new array on %s and leaves the one it was given untouched", (sort) => {
    const given = Object.freeze([...NEWEST_FIRST]);

    const sorted = sortArticles(given, stats, sort);

    expect(sorted).not.toBe(given);
    expect(slugs(given)).toEqual(["cedar", "birch", "alder"]);
  });
});

describe("hasCountsToSortBy", () => {
  it("needs two articles", () => {
    expect(hasCountsToSortBy([{ slug: "alder" }], { alder: { views: 9, likes: 9 } })).toBe(false);
  });

  it.each([
    ["no counts at all", NO_ARTICLE_STATS],
    ["counts that are all zero", { alder: { views: 0, likes: 0 }, birch: { views: 0, likes: 0 } }],
    ["counts for an article that is not listed", { juniper: { views: 9, likes: 9 } }],
  ])("finds nothing to sort by with %s", (_, stats) => {
    expect(hasCountsToSortBy(NEWEST_FIRST, stats)).toBe(false);
  });

  it.each([
    ["one view", { birch: { views: 1, likes: 0 } }],
    ["one like", { birch: { views: 0, likes: 1 } }],
  ])("finds something to sort by with %s", (_, stats) => {
    expect(hasCountsToSortBy(NEWEST_FIRST, stats)).toBe(true);
  });
});
