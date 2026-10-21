import { markQueryWords, outcomeOf, prepareIndex, search, type SearchIndex } from "../search";
import { learnSearchDocs } from "../searchDocs";

const browser = prepareIndex(learnSearchDocs({ withBody: false }));
const server = prepareIndex(learnSearchDocs({ withBody: true }));

const top = (query: string, index = browser) => search(query, index)[0] ?? null;
const outcome = (query: string, index: SearchIndex) => outcomeOf(search(query, index), query);

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
    expect(outcome("xyzzy", browser)).toBe("none");
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
    expect(outcome("elo stuck", browser)).toBe("weak");
    expect(outcome("why do i keep hanging pieces", browser)).toBe("strong");
    expect(outcome("blindfod chess", browser)).toBe("strong");
    expect(outcome("memory", browser)).toBe("strong");
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
    expect(outcome("memory", crowded)).toBe("strong");
    expect(outcome("memory position", crowded)).toBe("weak");
  });

  it.each([
    ["two", "chess-calculation-exercises-for-beginners", 3.06],
    ["number", "adriaan-de-groot", 2.57],
    ["seven", "judit-polgar", 3.03],
    ["played", "judit-polgar", 3.72],
    ["20", "20-minute-daily-chess-study-plan", 8.32],
  ])("leaves %p weak in the hub and on the search page though %s scores it high, since a number or filler word names no subject", (query, slug, hubScore) => {
    expect(search(query, browser)[0]).toMatchObject({ slug, score: hubScore, titleMatch: false });
    expect(outcome(query, browser)).toBe("weak");
    expect(outcome(query, server)).toBe("weak");
  });

  it("keeps a query strong when a number sits beside the words that name its subject", () => {
    expect(top("20 minute study routine")?.slug).toBe("20-minute-daily-chess-study-plan");
    expect(outcome("20 minute study routine", browser)).toBe("strong");
    expect(outcome("20 minute study routine", server)).toBe("strong");
  });

  it("reads the title match from the page title, not its h1", () => {
    expect(top("pass mark", server)).toMatchObject({ slug: "blindfold-chess-training-for-beginners", titleMatch: false });
    expect(top("blindfold", server)).toMatchObject({ slug: "blindfold-chess-training-for-beginners", titleMatch: true });
  });

  it("gives no title match for a number word, written out or as digits", () => {
    expect(top("four")?.titleMatch).toBe(false);
    expect(top("20")).toMatchObject({ slug: "20-minute-daily-chess-study-plan", titleMatch: false });
    expect(outcome("four", server)).toBe("weak");
  });

  it.each([
    ["memory", "chess-memory-training"],
    ["position", "chess-position-memory-trainers-compared"],
  ])("keeps %p strong in the hub on its title match at %s", (query, slug) => {
    expect(search(query, browser)[0]).toMatchObject({ slug, titleMatch: true });
    expect(outcome(query, browser)).toBe("strong");
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
