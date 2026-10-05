import { textOf } from "@/lib/articles/articleText";
import { loadArticleText, type TranslationSource } from "@/lib/articles/translations";
import { makeArticle, markEveryString, reviewedTranslationOf } from "./fixtures";

const english = makeArticle(0);
const englishText = textOf(english);
const reviewed = reviewedTranslationOf(english, "DE ", "de");

const sourceOf =
  (files: Record<string, unknown>): TranslationSource =>
  async (locale, slug) => {
    const key = `${locale}/${slug}`;
    if (!(key in files)) throw new Error(`Cannot find module ./translations/${key}.json`);
    return files[key];
  };

describe("loadArticleText", () => {
  it("returns the text of the file for that locale and that slug", async () => {
    const source = sourceOf({
      "de/alder-fixture": reviewed,
      "fr/alder-fixture": reviewedTranslationOf(english, "FR ", "fr"),
      "de/birch-fixture": reviewedTranslationOf(makeArticle(1), "DE ", "de"),
    });

    const text = await loadArticleText("alder-fixture", "de", englishText, source);

    expect(text.title).toBe("DE How Alder rebuilt a board from memory");
    expect(text).toStrictEqual(markEveryString(englishText, "DE "));
  });

  it("refuses a translation made from an older English text, naming the locale and the slug", async () => {
    const edited = { ...englishText, title: "How Alder rebuilt a board from memory in 1946" };

    await expect(
      loadArticleText("alder-fixture", "de", edited, sourceOf({ "de/alder-fixture": reviewed })),
    ).rejects.toThrow("Article translation de/alder-fixture cannot be published: sourceHash is stale");
  });

  it("refuses a translation nobody reviewed", async () => {
    const source = sourceOf({ "de/alder-fixture": { ...reviewed, approvedHash: null } });

    await expect(loadArticleText("alder-fixture", "de", englishText, source)).rejects.toThrow(
      "Article translation de/alder-fixture cannot be published: not reviewed",
    );
  });

  it("refuses a translation that was edited after its review", async () => {
    const edited = { ...reviewed, text: { ...reviewed.text, title: "DE Wie Alder ein Brett nachbaute" } };

    await expect(
      loadArticleText("alder-fixture", "de", englishText, sourceOf({ "de/alder-fixture": edited })),
    ).rejects.toThrow("Article translation de/alder-fixture cannot be published: not reviewed, the approval is for another text, article or locale");
  });

  it("refuses the approved file of another locale, copied as it is", async () => {
    const french = reviewedTranslationOf(english, "FR ", "fr");

    await expect(
      loadArticleText("alder-fixture", "de", englishText, sourceOf({ "de/alder-fixture": french })),
    ).rejects.toThrow("Article translation de/alder-fixture cannot be published: not reviewed, the approval is for another text, article or locale");
  });

  it("names every problem of a broken file in one error", async () => {
    const broken = {
      sourceHash: "stale",
      approvedHash: null,
      sameAsEnglish: [],
      text: { ...reviewed.text, title: "", sources: reviewed.text.sources.slice(1) },
    };

    await expect(
      loadArticleText("alder-fixture", "de", englishText, sourceOf({ "de/alder-fixture": broken })),
    ).rejects.toThrow(
      "Article translation de/alder-fixture cannot be published: text.title: empty; " +
        "text.sources: 2 items where the English text has 3; sourceHash is stale; not reviewed",
    );
  });

  it("throws for a locale with no file instead of answering in English", async () => {
    const source = sourceOf({ "de/alder-fixture": reviewed });
    const loading = loadArticleText("alder-fixture", "fr", englishText, source);

    await expect(loading).rejects.toThrow("Article translation fr/alder-fixture cannot be read");
    await expect(loading).rejects.toHaveProperty(
      "cause.message",
      "Cannot find module ./translations/fr/alder-fixture.json",
    );
  });
});

describe("loadArticleText reading the repository", () => {
  it("reads src/lib/articles/translations/<locale>/<slug>.json", async () => {
    jest.doMock("../translations/fr/alder-fixture.json", () => reviewedTranslationOf(english, "FR ", "fr"), {
      virtual: true,
    });

    const text = await loadArticleText("alder-fixture", "fr", englishText);

    expect(text.title).toBe("FR How Alder rebuilt a board from memory");
    expect(text.sections[0].heading).toBe("FR Alder heading number 1");
  });

  it("throws when the repository has no such file", async () => {
    await expect(loadArticleText("no-such-article", "fr", englishText)).rejects.toThrow(
      "Article translation fr/no-such-article cannot be read",
    );
  });
});
