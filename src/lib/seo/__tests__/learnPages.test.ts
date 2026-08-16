import {
  getFeaturedLearnPages,
  getLearnPageBySlug,
  LEARN_PAGES,
  type LearnPageContent,
} from "@/lib/seo/learnPages";

function getVisibleCopy(page: LearnPageContent): string[] {
  return [
    page.title,
    page.h1,
    page.description,
    page.painPoint,
    page.ctaLabel,
    page.quickAnswer,
    ...page.keyTakeaways,
    ...page.whoThisIsFor,
    ...page.contentSections.flatMap((section) => [
      section.title,
      section.eyebrow ?? "",
      section.summary ?? "",
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
      ...(section.orderedBullets ?? []),
      section.callout?.title ?? "",
      section.callout?.body ?? "",
      ...(section.drillCards ?? []).flatMap((drill) => [
        drill.title,
        drill.description,
        drill.goal,
        drill.ctaLabel,
      ]),
      ...(section.comparisonRows ?? []).flatMap((row) => [
        row.label,
        row.struggling,
        row.stronger,
      ]),
      ...(section.planSteps ?? []).flatMap((step) => [
        step.label,
        step.duration,
        step.detail,
      ]),
    ]),
    ...page.faq.flatMap((entry) => [entry.question, entry.answer]),
    ...page.relatedArticles.map((entry) => entry.reason),
    ...page.sources.map((source) => source.note),
  ].filter(Boolean);
}

describe("learnPages registry", () => {
  it("returns unique slugs including the new cluster pages", () => {
    const slugs = LEARN_PAGES.map((page) => page.slug);

    expect(slugs).toContain("how-to-stop-blundering-in-chess");
    expect(slugs).toContain("why-puzzle-rating-doesnt-transfer-to-games");
    expect(slugs).toContain("20-minute-daily-chess-study-plan");
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("returns the refreshed beginner roadmap with richer content fields", () => {
    const page = getLearnPageBySlug("how-to-get-better-at-chess-for-beginners");

    expect(page.quickAnswer).toContain("short daily routine");
    expect(page.contentSections.length).toBeGreaterThanOrEqual(5);
    expect(page.relatedArticles.length).toBeGreaterThanOrEqual(3);
    expect(page.relatedDrills.length).toBeGreaterThanOrEqual(2);
  });

  it("returns featured hub pages", () => {
    const pages = getFeaturedLearnPages();

    expect(pages.length).toBeGreaterThan(0);
    expect(pages.every((page) => page.featured)).toBe(true);
  });

  it("keeps every published guide in clear, reader-facing language", () => {
    const difficultInternalPhrases = [
      "primary keyword",
      "search intent",
      "content cluster",
      "rich-result",
      "candidate line",
      "transfer layer",
      "internal board model",
      "progressive deprivation",
      "false fix",
    ];

    expect(LEARN_PAGES).toHaveLength(16);

    for (const page of LEARN_PAGES) {
      const copy = getVisibleCopy(page);
      const combinedCopy = copy.join(" ").toLowerCase();
      const sentenceWordCounts = copy.flatMap((value) =>
        value
          .split(/[.!?]+/)
          .map((sentence) => sentence.trim())
          .filter(Boolean)
          .map((sentence) => sentence.split(/\s+/).length),
      );

      for (const phrase of difficultInternalPhrases) {
        expect(combinedCopy).not.toContain(phrase);
      }

      expect(Math.max(...sentenceWordCounts)).toBeLessThanOrEqual(28);
    }
  });
});
