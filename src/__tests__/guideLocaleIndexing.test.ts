/** @jest-environment node */
import { GUIDE_LOCALE_INDEXING, TRANSLATED_GUIDE_LOCALES, isIndexedGuideLocale } from "@/lib/seo/learn/translatedGuides";

describe("which translated guide locales are indexed", () => {
  it("lists ru, pt-BR, fr, de and es, and indexes none of them yet", () => {
    expect(TRANSLATED_GUIDE_LOCALES).toEqual(["ru", "pt-BR", "fr", "de", "es"]);
    expect(TRANSLATED_GUIDE_LOCALES.map((locale) => [locale, isIndexedGuideLocale(locale)])).toEqual([
      ["ru", false],
      ["pt-BR", false],
      ["fr", false],
      ["de", false],
      ["es", false],
    ]);
    expect(GUIDE_LOCALE_INDEXING.de).toEqual({ indexed: false });
  });

  it("indexes exactly the locales a config turns on, whichever approval it waits on", () => {
    const config = {
      ru: { indexed: false },
      de: { indexed: true, after: "native-read" },
      fr: { indexed: true, after: "adsense-approval" },
    } as const;

    expect(["ru", "pt-BR", "fr", "de", "es", "it"].map((locale) => [locale, isIndexedGuideLocale(locale, config)])).toEqual([
      ["ru", false],
      ["pt-BR", false],
      ["fr", true],
      ["de", true],
      ["es", false],
      ["it", false],
    ]);
  });
});
