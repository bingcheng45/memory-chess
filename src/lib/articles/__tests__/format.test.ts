import { formatArticleDate, formatCount } from "@/lib/articles/format";

describe("formatCount", () => {
  it("groups an English count the way the site always has", () => {
    expect(formatCount(187, "en")).toBe("187");
    expect(formatCount(2140, "en")).toBe("2,140");
    expect(formatCount(1000000, "en")).toBe("1,000,000");
  });

  it("groups a count the way the page's language does", () => {
    expect(formatCount(2140, "de")).toBe("2.140");
    expect(formatCount(1000000, "hi")).toBe("10,00,000");
  });
});

describe("formatArticleDate", () => {
  it("prints an English date the way the site always has", () => {
    expect(formatArticleDate("2026-10-03T00:00:00.000Z", "en")).toBe("Oct 3, 2026");
  });

  it("prints the date in the page's language", () => {
    expect(formatArticleDate("2026-10-03T00:00:00.000Z", "de")).toBe("3. Okt. 2026");
    expect(formatArticleDate("2026-10-03T00:00:00.000Z", "ja")).toBe("2026年10月3日");
  });

  it("reads the day in UTC, whatever the clock of the machine", () => {
    expect(formatArticleDate("2026-10-03T23:59:59.000Z", "en")).toBe("Oct 3, 2026");
    expect(formatArticleDate("2026-10-04T00:00:00.000Z", "en")).toBe("Oct 4, 2026");
  });
});
