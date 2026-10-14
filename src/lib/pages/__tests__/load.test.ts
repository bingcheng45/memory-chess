/** @jest-environment node */
import { approvalHashOf, sourceHashOf } from "@/lib/articles/articleText";
import { loadPage, type PageSource } from "@/lib/pages/load";
import privacy from "@/lib/pages/privacy";
import readingChrome from "@/lib/pages/readingChrome";
import type { PageUnit } from "@/lib/pages/translatedLocales";

jest.mock("@/lib/pages/translatedLocales");

const GERMAN_CHROME = { contents: "Inhalt", onThisPage: "Auf dieser Seite", lastUpdated: "Zuletzt geändert: <time>{date}</time>" };
const GERMAN_PRIVACY = { ...privacy, kicker: "Ihre Privatsphäre", title: "Datenschutzerklärung" };

function approvedFile(unit: PageUnit, english: unknown, text: unknown, locale = "de") {
  const file = { sourceHash: sourceHashOf(english), sameAsEnglish: [], text };
  return { ...file, approvedHash: approvalHashOf({ ...file, locale, name: `pages/${unit}` }) };
}

const FILES: Record<string, unknown> = {
  privacy: approvedFile("privacy", privacy, GERMAN_PRIVACY),
  chrome: approvedFile("chrome", readingChrome, GERMAN_CHROME),
};

const sourceOf =
  (files: Record<string, unknown>): PageSource =>
  async (_locale, unit) => {
    if (!(unit in files)) throw new Error("no such file");
    return files[unit];
  };

describe("loadPage", () => {
  it("answers English with the English text and chrome, reading no file", async () => {
    const source = jest.fn();

    await expect(loadPage("privacy", "en", source)).resolves.toEqual({ text: privacy, chrome: readingChrome });
    expect(source).not.toHaveBeenCalled();
  });

  it("answers a served locale with its reviewed translation", async () => {
    await expect(loadPage("privacy", "de", sourceOf(FILES))).resolves.toEqual({ text: GERMAN_PRIVACY, chrome: GERMAN_CHROME });
  });

  it("refuses a locale that does not serve the pages, whatever its files hold", async () => {
    await expect(loadPage("privacy", "fr", sourceOf(FILES))).rejects.toThrow("Page fr/privacy has no translation");
  });

  it.each([
    ["missing", { ...FILES, chrome: undefined }, "Page translation de/chrome cannot be read"],
    ["not reviewed", { ...FILES, privacy: { ...(FILES.privacy as object), approvedHash: null } }, "de/privacy cannot be published: not reviewed"],
    [
      "made from an older English text",
      { ...FILES, privacy: approvedFile("privacy", { ...privacy, kicker: "Old" }, GERMAN_PRIVACY) },
      "de/privacy cannot be published: sourceHash is stale",
    ],
    [
      "approved for another locale",
      { ...FILES, privacy: approvedFile("privacy", privacy, GERMAN_PRIVACY, "nl") },
      "de/privacy cannot be published: not reviewed, the approval is for another text, article or locale",
    ],
  ])("throws on a translation that is %s, and never falls back to English", async (_, files, message) => {
    const source = sourceOf(Object.fromEntries(Object.entries(files).filter(([, file]) => file !== undefined)));

    await expect(loadPage("privacy", "de", source)).rejects.toThrow(message);
  });
});
