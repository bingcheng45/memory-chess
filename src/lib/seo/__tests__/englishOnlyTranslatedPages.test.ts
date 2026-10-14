import { isLabPaperRoute } from "@/lib/lab-paper/routes";
import { isEnglishOnlyPath, isServedAtBareEnglishUrl, robotsFor, servedLocalesOf } from "@/lib/seo/englishOnly";

jest.mock("@/lib/articles/translatedLocales");
jest.mock("@/lib/pages/translatedLocales");

const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } };

describe.each(["/about", "/privacy", "/terms"])("%s, translated into German and not into French", (path) => {
  it("is served under the German prefix and at the bare English URL to every other locale", () => {
    expect(servedLocalesOf(path)).toEqual(["en", "de"]);
    expect(isServedAtBareEnglishUrl(path, "de")).toBe(false);
    expect(isServedAtBareEnglishUrl(path, "fr")).toBe(true);
    expect(isServedAtBareEnglishUrl(path, "en")).toBe(true);
    expect(isEnglishOnlyPath(path)).toBe(false);
  });

  it("is noindex in German and indexed in English", () => {
    expect(robotsFor(path, "de")).toEqual(NOINDEX_FOLLOW);
    expect(robotsFor(path, "en")).toBeUndefined();
  });

  it("is drawn in Lab Paper in each locale that serves it", () => {
    expect(isLabPaperRoute(path, "en")).toBe(true);
    expect(isLabPaperRoute(path, "de")).toBe(true);
    expect(isLabPaperRoute(path, "fr")).toBe(false);
  });
});
