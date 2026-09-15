import { ENGLISH_ONLY_ROUTES, englishOnlyLinkSuffix, isEnglishOnlyPath } from "@/lib/seo/englishOnly";

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
