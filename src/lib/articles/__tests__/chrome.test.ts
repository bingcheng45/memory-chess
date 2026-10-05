import { approvalHashOf, sourceHashOf } from "@/lib/articles/articleText";
import { loadArticleChrome, type ChromeSource } from "@/lib/articles/chrome";

const ENGLISH = {
  list: { heading: "Articles" },
  page: { showAll: "Show all text", translationNote: "Translated from English with AI assistance." },
};
const GERMAN = {
  list: { heading: "Artikel" },
  page: { showAll: "Ganzen Text zeigen", translationNote: "Mit KI-Unterstützung aus dem Englischen übersetzt." },
};
const UNIT = { sourceHash: sourceHashOf(ENGLISH), sameAsEnglish: [] };
const APPROVED = { ...UNIT, approvedHash: approvalHashOf({ ...UNIT, text: GERMAN }) };
const CANNOT_PUBLISH = "Article chrome de cannot be published: ";

const sourceOf = (files: Record<string, unknown>, messages: Record<string, unknown>): ChromeSource => ({
  file: async (locale) => {
    if (!(locale in files)) throw new Error(`Cannot find module ./translations/${locale}/chrome.json`);
    return files[locale];
  },
  messages: async (locale) => messages[locale],
});

const german = (file: unknown = APPROVED, messages: unknown = GERMAN, english: unknown = ENGLISH) =>
  loadArticleChrome("de", sourceOf({ de: file }, { en: english, de: messages }));

describe("loadArticleChrome", () => {
  it("returns the strings of the locale when they are approved and made from the current English strings", async () => {
    const source = sourceOf(
      { de: APPROVED, fr: { ...UNIT, approvedHash: approvalHashOf({ ...UNIT, text: ENGLISH }) } },
      { en: ENGLISH, de: GERMAN, fr: ENGLISH },
    );

    expect(await loadArticleChrome("de", source)).toStrictEqual(GERMAN);
    expect(await loadArticleChrome("fr", source)).toStrictEqual(ENGLISH);
  });

  it("refuses strings made from older English strings, naming the locale", async () => {
    const reworded = { ...ENGLISH, page: { ...ENGLISH.page, showAll: "Show the whole text" } };

    await expect(german(APPROVED, GERMAN, reworded)).rejects.toThrow(`${CANNOT_PUBLISH}sourceHash is stale`);
  });

  it("refuses strings nobody approved", async () => {
    await expect(german({ ...UNIT, approvedHash: null })).rejects.toThrow(`${CANNOT_PUBLISH}not reviewed`);
    await expect(german(UNIT)).rejects.toThrow(`${CANNOT_PUBLISH}not reviewed`);
  });

  it("refuses a string that changed in the catalogue after the approval, such as one put back into English", async () => {
    const english = { ...GERMAN, page: { ...GERMAN.page, showAll: "Show all text" } };

    await expect(german(APPROVED, english)).rejects.toThrow(`${CANNOT_PUBLISH}not reviewed, edited after it was approved`);
  });

  it("names every problem of a broken chrome in one error", async () => {
    const file = { sourceHash: "stale", approvedHash: null, sameAsEnglish: [], reviewed: true };
    const messages = { list: { heading: "" }, page: { showAll: "Ganzen Text zeigen", note: "Notiz" } };

    await expect(german(file, messages)).rejects.toThrow(
      `${CANNOT_PUBLISH}unknown key "reviewed"; articles.list.heading: empty; articles.page.translationNote: missing; ` +
        "articles.page.note: not in the English text; sourceHash is stale; not reviewed",
    );
  });

  it("refuses a locale whose catalogue has no articles strings, and a chrome.json that is not an object", async () => {
    await expect(loadArticleChrome("de", sourceOf({ de: APPROVED }, { en: ENGLISH }))).rejects.toThrow(
      `${CANNOT_PUBLISH}articles: not an object; not reviewed, edited after it was approved`,
    );
    await expect(german(null)).rejects.toThrow(`${CANNOT_PUBLISH}chrome.json is not an object`);
  });

  it("throws for a locale with no chrome.json, with the cause", async () => {
    const loading = loadArticleChrome("fr", sourceOf({ de: APPROVED }, { en: ENGLISH, de: GERMAN }));

    await expect(loading).rejects.toThrow("Article chrome fr cannot be read");
    await expect(loading).rejects.toHaveProperty("cause.message", "Cannot find module ./translations/fr/chrome.json");
  });
});

describe("loadArticleChrome reading the repository", () => {
  it("reads translations/<locale>/chrome.json and the articles strings of messages/<locale>.json and messages/en.json", async () => {
    jest.doMock("../translations/fr/chrome.json", () => APPROVED);
    jest.doMock("../../../../messages/fr.json", () => ({ common: { play: "Jouer" }, articles: GERMAN }));
    jest.doMock("../../../../messages/en.json", () => ({ common: { play: "Play" }, articles: ENGLISH }));

    expect(await loadArticleChrome("fr")).toStrictEqual(GERMAN);
  });
});
