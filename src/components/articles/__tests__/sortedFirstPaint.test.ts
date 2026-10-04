import { declarationsOf, innermostRules, readArticleCss } from "@/components/articles/__tests__/cssRules";
import { sortOf } from "@/components/articles/listAddress";
import { sortedFirstPaintInlineScript } from "@/components/articles/sortedFirstPaint";
import { RANKED_SORTS } from "@/lib/articles/sorting";

const painted = () => document.documentElement.getAttribute("data-first-paint-sort");

function load(address: string) {
  window.history.replaceState(null, "", address);
  window.eval(sortedFirstPaintInlineScript());
}

afterEach(() => {
  document.documentElement.removeAttribute("data-first-paint-sort");
  window.history.replaceState(null, "", "/");
});

describe("sortedFirstPaintInlineScript", () => {
  it.each([
    ["/articles?sort=views", "views"],
    ["/articles?sort=likes", "likes"],
    ["/articles?ref=home&sort=likes&page=2", "likes"],
    ["/articles?sort=likes&sort=views", "likes"],
  ])("marks the page for %s, the sort the list reads from it", (address, sort) => {
    load(address);

    expect(painted()).toBe(sort);
    expect(sortOf(window.location.search)).toBe(sort);
  });

  it.each([
    "/articles",
    "/articles?",
    "/articles?sort=newest",
    "/articles?sort=",
    "/articles?sort=oldest",
    "/articles?sort=LIKES",
    "/articles?sort=constructor",
    "/articles?page=2",
    "/articles#sort=likes",
  ])("leaves the page unmarked for %s, which the list reads as newest", (address) => {
    load(address);

    expect(painted()).toBeNull();
    expect(sortOf(window.location.search)).toBe("newest");
  });

  it("does not throw in a browser that cannot read the query", () => {
    const original = window.URLSearchParams;
    Reflect.deleteProperty(window, "URLSearchParams");

    try {
      expect(() => load("/articles?sort=likes")).not.toThrow();
      expect(painted()).toBeNull();
    } finally {
      window.URLSearchParams = original;
    }
  });

  it("uses only syntax an old browser parses, and nothing from a module", () => {
    const script = sortedFirstPaintInlineScript();

    expect(script).not.toMatch(/=>|\bconst\b|\blet\b|`|\bimport\b|\brequire\b/);
  });
});

describe("articleList.css", () => {
  const rules = innermostRules(readArticleCss("articleList.css"));

  it("has one rule for each sort the script can mark, which orders the cards by that sort's rank", () => {
    expect(rules.map((rule) => [rule.selector, declarationsOf(rule)])).toEqual(
      RANKED_SORTS.map((sort) => [
        `[data-first-paint-sort="${sort}"] [data-article-list] > li`,
        [["order", `var(--rank-${sort})`]],
      ]),
    );
    expect(rules).toHaveLength(2);
  });
});
