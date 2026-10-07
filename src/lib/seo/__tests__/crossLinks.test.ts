import { ARTICLES, ARTICLE_SLUGS } from "@/lib/articles";
import { EN_LEARN_PAGES, LEARN_SLUGS } from "@/lib/seo/learn";

const TITLE_SUFFIX = " | Memory Chess";
const MAX_TITLE_WITH_SUFFIX = 64;

const guide = (slug: string) => EN_LEARN_PAGES.find((page) => page.slug === slug)!;
const article = (slug: string) => ARTICLES.find((entry) => entry.slug === slug)!;

describe("links from guides to other guides", () => {
  it.each([
    ["chess-calculation-exercises-for-beginners", "how-to-stop-blundering-in-chess"],
    ["chess-visualization-exercises", "how-to-see-the-whole-board-in-chess"],
    ["how-to-get-better-at-chess-for-beginners", "20-minute-daily-chess-study-plan"],
    ["chess-pattern-recognition-drills", "how-many-chess-puzzles-a-day"],
  ])("%s links %s", (source, target) => {
    expect(guide(source).relatedArticles.map((entry) => entry.slug)).toContain(target);
  });
});

describe("links between guides and articles", () => {
  it("sends each guide's readers on to its article with a descriptive anchor", () => {
    const furtherReading = Object.fromEntries(
      EN_LEARN_PAGES.filter((page) => page.furtherReading).map((page) => [page.slug, page.furtherReading]),
    );

    expect(furtherReading).toEqual({
      "chess-memory-training": [{ slug: "adriaan-de-groot", anchor: "de Groot's 1944 memory test" }],
      "chess-pattern-recognition-drills": [
        { slug: "magnus-carlsen", anchor: "how Carlsen names a game from one position" },
      ],
      "blindfold-chess-training-for-beginners": [
        { slug: "judit-polgar", anchor: "how Judit Polgár played blindfold at seven" },
      ],
    });
  });

  it("sends each article's readers on to its guides with descriptive anchors", () => {
    expect(article("judit-polgar").relatedGuides).toEqual([
      { slug: "blindfold-chess-training-for-beginners", anchor: "train blindfold chess in four stages" },
    ]);
    expect(article("adriaan-de-groot").relatedGuides).toEqual([
      { slug: "chess-memory-training", anchor: "chess memory training" },
      { slug: "how-to-see-the-whole-board-in-chess", anchor: "how to see the whole board" },
    ]);
    expect(article("magnus-carlsen").relatedGuides).toEqual([
      { slug: "chess-pattern-recognition-drills", anchor: "pattern recognition drills" },
      { slug: "chess-visualization-exercises", anchor: "visualization exercises" },
    ]);
  });

  it("points every cross-link at a page that exists", () => {
    const guideTargets = ARTICLES.flatMap((entry) => entry.relatedGuides ?? []).map((link) => link.slug);
    const articleTargets = EN_LEARN_PAGES.flatMap((page) => page.furtherReading ?? []).map((link) => link.slug);

    expect(guideTargets.filter((slug) => !LEARN_SLUGS.includes(slug))).toEqual([]);
    expect(articleTargets.filter((slug) => !ARTICLE_SLUGS.includes(slug))).toEqual([]);
  });
});

describe("trimmed search titles", () => {
  it.each([
    ["chess-calculation-exercises-for-beginners", "Chess Calculation Exercises for Beginners"],
    ["chess-pattern-recognition-drills", "Chess Pattern Recognition Drills, From Memory"],
    ["chess-memory-training", "Chess Memory Training: A Scored Ladder"],
    ["blindfold-chess-training-for-beginners", "Blindfold Chess Training: A 4-Stage Beginner Plan"],
    ["chess-visualization-exercises", "Chess Visualization Training: 2 Exercises"],
  ])("the %s guide is titled %p", (slug, title) => {
    expect(guide(slug).title).toBe(title);
    expect((title + TITLE_SUFFIX).length).toBeLessThanOrEqual(MAX_TITLE_WITH_SUFFIX);
  });

  it.each([
    ["adriaan-de-groot", "De Groot's 1944 chess memory test, in numbers"],
    ["magnus-carlsen", "How Magnus Carlsen names a game from one position"],
  ])("the %s article's search title is %p", (slug, title) => {
    expect(article(slug).searchTitle).toBe(title);
    expect((title + TITLE_SUFFIX).length).toBeLessThanOrEqual(MAX_TITLE_WITH_SUFFIX);
  });
});
