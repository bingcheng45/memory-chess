import { ARTICLE_LIST_COPY, ARTICLE_STATS_COPY, formatCount } from "@/lib/articles/copy";
import { SORT_KEYS } from "@/lib/articles/sorting";

describe("the list page copy", () => {
  it("promises no publishing schedule, since the section has no track record yet", () => {
    expect(JSON.stringify(ARTICLE_LIST_COPY)).not.toMatch(/\bweek/i);
    expect(JSON.stringify(ARTICLE_STATS_COPY)).not.toMatch(/\bweek/i);
  });

  it("asks for corrections in a clause the link completes", () => {
    const { text, linkLabel } = ARTICLE_LIST_COPY.about.corrections;

    expect(`${text} ${linkLabel}.`).toBe("If something here is wrong, send a correction.");
  });
});

describe("the count copy", () => {
  it.each([
    [1, "1 view", "1 like"],
    [2, "2 views", "2 likes"],
    [187, "187 views", "187 likes"],
    [2140, "2,140 views", "2,140 likes"],
    [1000000, "1,000,000 views", "1,000,000 likes"],
  ])("writes %i as %s and %s", (count, views, likes) => {
    expect(ARTICLE_STATS_COPY.views(count)).toBe(views);
    expect(ARTICLE_STATS_COPY.likes(count)).toBe(likes);
  });

  it("groups a bare count the same way", () => {
    expect(formatCount(187)).toBe("187");
    expect(formatCount(2140)).toBe("2,140");
  });

  it("names the like button, its failure, and the sort control", () => {
    expect(ARTICLE_STATS_COPY.likeButton).toBe("Like this article");
    expect(ARTICLE_STATS_COPY.likeFailed).toBe("That did not save. Try again.");
    expect(ARTICLE_STATS_COPY.sortLabel).toBe("Sort");
    expect(ARTICLE_STATS_COPY.sortGroup).toBe("Sort articles");
  });

  it("labels every sort key", () => {
    expect(SORT_KEYS.map((key) => ARTICLE_STATS_COPY.sortOptions[key])).toEqual([
      "Newest",
      "Most viewed",
      "Most liked",
    ]);
  });
});
