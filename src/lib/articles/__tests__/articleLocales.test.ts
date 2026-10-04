import { servesArticlesIn } from "@/lib/articles/articleLocales";

jest.mock("@/lib/articles/translatedLocales");

describe("servesArticlesIn", () => {
  it("serves English, which the list of translations does not hold", () => {
    expect(servesArticlesIn("en")).toBe(true);
  });

  it("serves a locale with translated articles and no other", () => {
    expect(servesArticlesIn("de")).toBe(true);
    expect(servesArticlesIn("fr")).toBe(false);
    expect(servesArticlesIn("xx")).toBe(false);
  });
});
