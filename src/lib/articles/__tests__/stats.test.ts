import {
  ARTICLE_EVENTS,
  countsFor,
  parseArticleCounts,
  parseArticleEvent,
  toArticleStats,
} from "@/lib/articles/stats";

describe("parseArticleEvent", () => {
  it.each(ARTICLE_EVENTS)("accepts %s", (event) => {
    expect(parseArticleEvent({ event })).toBe(event);
  });

  it("reads only the event field", () => {
    expect(parseArticleEvent({ event: "like", slug: "other", increment: 500 })).toBe("like");
  });

  it.each([
    ["an unknown event", { event: "purge" }],
    ["a differently cased event", { event: "LIKE" }],
    ["a number", { event: 1 }],
    ["a missing event", {}],
    ["an array", ["view"]],
    ["a string", "view"],
    ["null", null],
    ["undefined", undefined],
  ])("refuses %s", (_, body) => {
    expect(parseArticleEvent(body)).toBeNull();
  });
});

describe("parseArticleCounts", () => {
  it("keeps whole, non-negative counts", () => {
    expect(parseArticleCounts({ views: 2140, likes: 0, slug: "magnus-carlsen" })).toEqual({
      views: 2140,
      likes: 0,
    });
  });

  it.each([
    ["a negative count", { views: -1, likes: 0 }],
    ["a fraction", { views: 1.5, likes: 0 }],
    ["a string", { views: "12", likes: 0 }],
    ["a count past the safe integer range", { views: 2 ** 60, likes: 0 }],
    ["a missing count", { views: 3 }],
    ["null", null],
    ["an array", [{ views: 1, likes: 1 }]],
  ])("refuses %s", (_, row) => {
    expect(parseArticleCounts(row)).toBeNull();
  });
});

describe("toArticleStats", () => {
  it("keys the valid rows by slug and drops the rest", () => {
    const stats = toArticleStats([
      { slug: "magnus-carlsen", views: 10, likes: 2 },
      { slug: "judit-polgar", views: -4, likes: 1 },
      { slug: 7, views: 1, likes: 1 },
      "not a row",
    ]);

    expect(stats).toEqual({ "magnus-carlsen": { views: 10, likes: 2 } });
  });

  it.each([null, undefined, "rows", { slug: "magnus-carlsen", views: 1, likes: 1 }])(
    "answers no stats for %p",
    (rows) => {
      expect(toArticleStats(rows)).toEqual({});
    },
  );
});

describe("countsFor", () => {
  const stats = toArticleStats([{ slug: "magnus-carlsen", views: 10, likes: 2 }]);

  it("finds the counts of a slug it holds", () => {
    expect(countsFor(stats, "magnus-carlsen")).toEqual({ views: 10, likes: 2 });
  });

  it.each(["judit-polgar", "constructor", "toString", "__proto__"])(
    "answers nothing for %s",
    (slug) => {
      expect(countsFor(stats, slug)).toBeUndefined();
    },
  );
});
