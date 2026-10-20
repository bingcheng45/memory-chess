import {
  alternatesLinkHeader,
  indexedLocalesOf,
  isEnglishOnlyPath,
  isServedAtBareEnglishUrl,
  robotsFor,
  servedLocalesOf,
} from "@/lib/seo/englishOnly";

const BLINDFOLD = "/learn/blindfold-chess-training-for-beginners";

describe("the translated Learn guides in the routing table", () => {
  it("serves a translated guide in English and the five translated locales", () => {
    expect(servedLocalesOf(BLINDFOLD)).toEqual(["en", "ru", "pt-BR", "fr", "de", "es"]);
    expect(servedLocalesOf("/learn/chess-memory-training")).toEqual(["en"]);
    expect(servedLocalesOf("/learn")).toEqual(["en"]);
  });

  it("serves a translated guide under its locale prefix and every other guide at its bare English URL", () => {
    expect(isServedAtBareEnglishUrl(BLINDFOLD, "de")).toBe(false);
    expect(isServedAtBareEnglishUrl(BLINDFOLD, "pt-BR")).toBe(false);
    expect(isServedAtBareEnglishUrl(BLINDFOLD, "it")).toBe(true);
    expect(isServedAtBareEnglishUrl(BLINDFOLD, "en")).toBe(true);
    expect(isServedAtBareEnglishUrl("/learn/chess-memory-training", "de")).toBe(true);
    expect(isServedAtBareEnglishUrl("/learn", "de")).toBe(true);
    expect(isServedAtBareEnglishUrl("/learn/search", "ru")).toBe(true);
  });

  it("counts a translated guide as translated, and the hub and other guides as English-only", () => {
    expect(isEnglishOnlyPath(BLINDFOLD)).toBe(false);
    expect(isEnglishOnlyPath("/learn/chess-memory-training")).toBe(true);
    expect(isEnglishOnlyPath("/learn")).toBe(true);
  });

  it("keeps every translated guide out of search while no locale is indexed, and the English guide in it", () => {
    expect(robotsFor(BLINDFOLD, "de")).toEqual({ index: false, follow: true, googleBot: { index: false, follow: true } });
    expect(robotsFor(BLINDFOLD, "ru")).toEqual({ index: false, follow: true, googleBot: { index: false, follow: true } });
    expect(robotsFor(BLINDFOLD, "en")).toBeUndefined();
    expect(robotsFor("/learn/chess-memory-training", "en")).toBeUndefined();
    expect(indexedLocalesOf(BLINDFOLD)).toEqual(["en"]);
    expect(alternatesLinkHeader(BLINDFOLD, "https://thememorychess.com")).toBeNull();
  });
});
