import {
  ENGLISH_ONLY_ROUTES,
  englishOnlyLinkSuffix,
  isEnglishOnlyPath,
  isIndexedInDefaultLocaleOnly,
  isServedAtBareEnglishUrl,
  robotsFor,
  unprefixedPath,
} from "@/lib/seo/englishOnly";

jest.mock("@/lib/articles/translatedLocales", () => {
  const TRANSLATED_ARTICLE_LOCALES = ["en", "de"];
  return {
    TRANSLATED_ARTICLE_LOCALES,
    servesArticlesIn: (locale: string) => TRANSLATED_ARTICLE_LOCALES.includes(locale),
  };
});

const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } };

describe("unprefixedPath", () => {
  it("strips a shipped locale prefix", () => {
    expect(unprefixedPath("/de/leaderboard")).toBe("/leaderboard");
    expect(unprefixedPath("/pt-BR/learn/x")).toBe("/learn/x");
    expect(unprefixedPath("/ja")).toBe("/");
  });

  it("returns a path without a locale prefix as is", () => {
    expect(unprefixedPath("/leaderboard")).toBe("/leaderboard");
    expect(unprefixedPath("/deutsch/learn")).toBe("/deutsch/learn");
    expect(unprefixedPath("/")).toBe("/");
  });
});

describe("isIndexedInDefaultLocaleOnly", () => {
  it("matches the leaderboard, the articles list and every article beneath it", () => {
    expect(isIndexedInDefaultLocaleOnly("/leaderboard")).toBe(true);
    expect(isIndexedInDefaultLocaleOnly("/articles")).toBe(true);
    expect(isIndexedInDefaultLocaleOnly("/articles/magnus-carlsen")).toBe(true);
  });

  it("does not match a route that only shares a prefix, a prefixed path, or a route indexed in every locale", () => {
    expect(isIndexedInDefaultLocaleOnly("/articlesx")).toBe(false);
    expect(isIndexedInDefaultLocaleOnly("/article")).toBe(false);
    expect(isIndexedInDefaultLocaleOnly("/leaderboards")).toBe(false);
    expect(isIndexedInDefaultLocaleOnly("/de/articles")).toBe(false);
    expect(isIndexedInDefaultLocaleOnly("/game")).toBe(false);
    expect(isIndexedInDefaultLocaleOnly("/learn")).toBe(false);
  });
});

describe("robotsFor", () => {
  it.each(["/leaderboard", "/articles", "/articles/magnus-carlsen"])(
    "marks a translation of %s noindex and leaves the English page alone",
    (path) => {
      expect(robotsFor(path, "de")).toEqual(NOINDEX_FOLLOW);
      expect(robotsFor(path, "en")).toBeUndefined();
    },
  );

  it("leaves routes indexed in every locale alone", () => {
    expect(robotsFor("/game", "de")).toBeUndefined();
    expect(robotsFor("/", "ja")).toBeUndefined();
  });
});

describe("englishOnlyLinkSuffix", () => {
  it("adds nothing on an English page", () => {
    expect(englishOnlyLinkSuffix("en")).toBe("");
  });

  it("names English in its own language on a translated page", () => {
    expect(englishOnlyLinkSuffix("ja")).toBe(" (English)");
    expect(englishOnlyLinkSuffix("pt-BR")).toBe(" (English)");
  });
});

describe("isEnglishOnlyPath", () => {
  it("matches every listed route", () => {
    for (const route of ENGLISH_ONLY_ROUTES) {
      expect(isEnglishOnlyPath(route)).toBe(true);
    }
  });

  it("matches any path beneath a listed route", () => {
    expect(isEnglishOnlyPath("/learn/chess-memory-training")).toBe(true);
    expect(isEnglishOnlyPath("/learn/a/b")).toBe(true);
  });

  it("does not match the articles, which are served in translation", () => {
    expect(isEnglishOnlyPath("/articles")).toBe(false);
    expect(isEnglishOnlyPath("/articles/magnus-carlsen")).toBe(false);
  });

  it("does not match a route that only shares a prefix", () => {
    expect(isEnglishOnlyPath("/learning")).toBe(false);
    expect(isEnglishOnlyPath("/aboutus")).toBe(false);
    expect(isEnglishOnlyPath("/changelogs")).toBe(false);
  });

  it("does not match localized product routes or a prefixed path", () => {
    expect(isEnglishOnlyPath("/")).toBe(false);
    expect(isEnglishOnlyPath("/game")).toBe(false);
    expect(isEnglishOnlyPath("/de/about")).toBe(false);
  });
});

describe("isServedAtBareEnglishUrl", () => {
  it.each(["/about", "/privacy", "/terms", "/changelog", "/learn", "/learn/chess-memory-training"])(
    "sends every locale to the bare URL of the English-only %s",
    (path) => {
      expect(isServedAtBareEnglishUrl(path, "en")).toBe(true);
      expect(isServedAtBareEnglishUrl(path, "de")).toBe(true);
      expect(isServedAtBareEnglishUrl(path, "fr")).toBe(true);
    },
  );

  it.each(["/articles", "/articles/magnus-carlsen"])(
    "serves %s at the bare URL to English and to a locale without translated articles",
    (path) => {
      expect(isServedAtBareEnglishUrl(path, "en")).toBe(true);
      expect(isServedAtBareEnglishUrl(path, "fr")).toBe(true);
      expect(isServedAtBareEnglishUrl(path, "de")).toBe(false);
    },
  );

  it("is false for a route every locale serves under its own prefix", () => {
    expect(isServedAtBareEnglishUrl("/game", "en")).toBe(false);
    expect(isServedAtBareEnglishUrl("/leaderboard", "fr")).toBe(false);
    expect(isServedAtBareEnglishUrl("/", "de")).toBe(false);
    expect(isServedAtBareEnglishUrl("/articlesx", "fr")).toBe(false);
  });
});
