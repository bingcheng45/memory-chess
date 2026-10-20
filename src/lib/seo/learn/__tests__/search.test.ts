import { markQueryWords, outcomeOf, prepareIndex, search } from "../search";
import { learnSearchDocs } from "../searchDocs";

const browser = prepareIndex(learnSearchDocs({ withBody: false }));
const server = prepareIndex(learnSearchDocs({ withBody: true }));

const top = (query: string, index = browser) => search(query, index)[0] ?? null;

describe("Learn search", () => {
  it("answers a question in the reader's words with the guide that answers it", () => {
    expect(top("why do i keep hanging pieces")).toMatchObject({
      slug: "how-to-stop-blundering-in-chess",
      matchedQuestion: "How do I stop blundering pieces?",
    });
  });

  it("forgives a typo in a guide's title words", () => {
    expect(top("blindfod chess")?.slug).toBe("blindfold-chess-training-for-beginners");
  });

  it("finds nothing for a word no guide uses", () => {
    expect(search("xyzzy", browser)).toEqual([]);
    expect(outcomeOf(search("xyzzy", browser))).toBe("none");
  });

  it.each([
    ["how many puzzles a day", "how-many-chess-puzzles-a-day"],
    ["visualisation", "chess-visualization-exercises"],
    ["review my games", "how-to-analyze-chess-games-for-beginners"],
    ["knight fork", "chess-pattern-recognition-drills"],
    ["tunnel vision", "how-to-see-the-whole-board-in-chess"],
    ["de groot", "adriaan-de-groot"],
  ])("ranks %p first as %s", (query, slug) => {
    expect(top(query)?.slug).toBe(slug);
    expect(top(query, server)?.slug).toBe(slug);
  });

  it("drops results under a fifth of the top score", () => {
    expect(search("tunnel vision", browser).map((result) => result.slug)).toEqual([
      "how-to-see-the-whole-board-in-chess",
      "how-to-stop-blundering-in-chess",
      "chess-coordinates-practice",
      "why-puzzle-rating-doesnt-transfer-to-games",
    ]);
    expect(search("why do i keep hanging pieces", browser).map((result) => result.slug)).toEqual([
      "how-to-stop-blundering-in-chess",
      "how-to-get-better-at-chess-for-beginners",
    ]);
  });

  it("labels a loose match weak and a question match strong", () => {
    expect(outcomeOf(search("elo stuck", browser))).toBe("weak");
    expect(outcomeOf(search("why do i keep hanging pieces", browser))).toBe("strong");
    expect(outcomeOf(search("blindfod chess", browser))).toBe("strong");
    expect(outcomeOf(search("memory", browser))).toBe("strong");
  });

  it("labels a query strong when every word is in the top guide's title, however many pages use the word", () => {
    const doc = (slug: string, title: string, description: string) => ({
      kind: "guide" as const,
      slug,
      url: `/learn/${slug}`,
      title,
      group: "Memory and patterns",
      questions: [],
      fields: { questions: "", title, keywords: "", headings: "", description, body: "" },
    });
    const crowded = prepareIndex([
      doc("memory-training", "Memory training", "Train recall."),
      ...Array.from({ length: 30 }, (_, i) => doc(`other-${i}`, `Other ${i}`, "Remember to recall the position.")),
    ]);

    expect(search("memory", crowded)[0]).toMatchObject({ slug: "memory-training", score: 0.04 });
    expect(outcomeOf(search("memory", crowded))).toBe("strong");
    expect(outcomeOf(search("memory position", crowded))).toBe("weak");
  });

  it("marks the question words that mean a query term, synonyms included", () => {
    expect(
      markQueryWords("How do I stop blundering pieces?", "why do i keep hanging pieces")
        .filter((word) => word.mark)
        .map((word) => word.text.trim()),
    ).toEqual(["blundering", "pieces?"]);
  });

  it("ignores case, accents and punctuation", () => {
    expect(search("BLUNDER!!", browser).map((result) => result.slug)).toEqual(
      search("blunder", browser).map((result) => result.slug),
    );
    expect(top("Polgár")?.slug).toBe("judit-polgar");
  });
});
