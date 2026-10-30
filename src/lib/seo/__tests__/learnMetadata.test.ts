/** @jest-environment node */
import { buildLearnPageMetadata } from "@/lib/seo/learnMetadata";
import { EN_LEARN_PAGES as LEARN_PAGES } from "@/lib/seo/learn";
import type { LearnPage } from "@/lib/seo/learn";
import { loadGuide } from "@/lib/seo/learn/load";

function pageFor(slug: string): LearnPage {
  const page = LEARN_PAGES.find((entry) => entry.meta.slug === slug);
  if (!page) throw new Error(`Unknown learn slug: ${slug}`);
  return page;
}

describe("buildLearnPageMetadata", () => {
  it("builds metadata for the beginner roadmap", () => {
    const metadata = buildLearnPageMetadata(pageFor("how-to-get-better-at-chess-for-beginners"));

    expect(metadata.title).toBe("How to Get Better at Chess for Beginners");
    expect(metadata.description).toContain("beginner chess plan");
    expect(
      metadata.openGraph && "type" in metadata.openGraph
        ? metadata.openGraph.type
        : undefined,
    ).toBe("article");
  });

  it.each([
    ["blindfold-chess-training-for-beginners", "Blindfold Chess Training: 5-Week Plan + Trainer"],
    ["how-to-play-memory-chess-board-game", "How to Play Memory Chess: Rules and How to Win"],
    ["chess-coordinates-practice", "Chess Coordinates Practice: Free Trainer + Drills"],
    ["how-to-stop-blundering-in-chess", "How to Stop Blundering in Chess: A 5-Step Check"],
  ])("titles the English %s guide %p in search and on its share card", (slug, title) => {
    const metadata = buildLearnPageMetadata(pageFor(slug));

    expect([metadata.title, metadata.openGraph?.title, metadata.twitter?.title]).toEqual([title, title, title]);
  });

  it("gives the English blindfold guide its search description", async () => {
    const english = buildLearnPageMetadata(pageFor("blindfold-chess-training-for-beginners"));
    const searchDescription =
      "Blindfold chess training in about five weeks: 3 to 6 minutes of drills a day, a pass mark for each of four stages, and a free browser trainer to practise on.";

    expect([english.description, english.openGraph?.description, english.twitter?.description]).toEqual([
      searchDescription,
      searchDescription,
      searchDescription,
    ]);
  });

  it("ships the German blindfold guide's own title and description, not the English search copy", async () => {
    const guide = await loadGuide("blindfold-chess-training-for-beginners", "de");
    if (!guide) throw new Error("German blindfold guide did not load");
    const metadata = buildLearnPageMetadata(guide.page, "de");
    const title = "Blindschach-Training für Anfänger: 4 Stufen";
    const description =
      "Rechne mit etwa fünf Wochen Blindschach-Training bis zur ersten ganzen Blindpartie. Vier Wochen 3 bis 6 Minuten täglich, dann jeden zweiten Tag eine Partie.";

    expect([metadata.title, metadata.openGraph?.title, metadata.twitter?.title]).toEqual([title, title, title]);
    expect([metadata.description, metadata.openGraph?.description, metadata.twitter?.description]).toEqual([
      description,
      description,
      description,
    ]);
  });

  it("gives an untranslated guide a bare self canonical with no alternates or robots override", () => {
    const metadata = buildLearnPageMetadata(pageFor("chess-memory-training"));

    expect(metadata.alternates).toEqual({
      canonical: "/learn/chess-memory-training",
    });
    expect("robots" in metadata).toBe(false);
  });

  const NOINDEX_FOLLOW = { index: false, follow: true, googleBot: { index: false, follow: true } };

  it("gives a translated guide's English page a bare self canonical, no alternates and no robots override", () => {
    const metadata = buildLearnPageMetadata(pageFor("how-to-stop-blundering-in-chess"));

    expect(metadata.alternates).toEqual({ canonical: "/learn/how-to-stop-blundering-in-chess" });
    expect("robots" in metadata).toBe(false);
  });

  it("makes a translation noindex, follow and canonical to itself, with no alternates", () => {
    const metadata = buildLearnPageMetadata(pageFor("how-to-stop-blundering-in-chess"), "de");

    expect(metadata.alternates).toEqual({ canonical: "/de/learn/how-to-stop-blundering-in-chess" });
    expect(metadata.robots).toEqual(NOINDEX_FOLLOW);
    expect(metadata.openGraph?.url).toBe("https://thememorychess.com/de/learn/how-to-stop-blundering-in-chess");
  });

  it("adds article timestamps, author and image metadata", () => {
    const metadata = buildLearnPageMetadata(pageFor("how-to-stop-blundering-in-chess"));

    const openGraph = metadata.openGraph;
    if (!openGraph || !("publishedTime" in openGraph)) {
      throw new Error("Expected article Open Graph metadata");
    }

    const images = Array.isArray(openGraph.images)
      ? openGraph.images
      : [openGraph.images];
    const twitterImages = Array.isArray(metadata.twitter?.images)
      ? metadata.twitter.images
      : [metadata.twitter?.images];
    const authors = Array.isArray(metadata.authors)
      ? metadata.authors
      : [metadata.authors];
    const cardUrl =
      "https://thememorychess.com/learn/how-to-stop-blundering-in-chess/opengraph-image";

    expect(openGraph.publishedTime).toBe(
      pageFor("how-to-stop-blundering-in-chess").meta.publishedAt,
    );
    expect(openGraph.modifiedTime).toBe(
      pageFor("how-to-stop-blundering-in-chess").meta.updatedAt,
    );
    expect(images[0]).toMatchObject({ url: cardUrl });
    expect(twitterImages[0]).toBe(cardUrl);
    expect(authors[0]).toMatchObject({ name: "Bing Cheng" });
  });

  it("keeps metadata complete for every published guide", () => {
    for (const page of LEARN_PAGES) {
      const metadata = buildLearnPageMetadata(page);
      const openGraph = metadata.openGraph;
      const twitter = metadata.twitter;

      expect(metadata.title).toBe(page.meta.searchTitle ?? page.meta.title);
      expect(metadata.description).toBe(page.meta.searchDescription ?? page.meta.description);
      expect(metadata.alternates?.canonical).toBe(`/learn/${page.meta.slug}`);
      expect(openGraph && "url" in openGraph ? openGraph.url : undefined).toBe(
        `https://thememorychess.com/learn/${page.meta.slug}`,
      );
      expect(openGraph?.title).toBe(page.meta.searchTitle ?? page.meta.title);
      expect(openGraph?.description).toBe(page.meta.searchDescription ?? page.meta.description);
      expect(twitter?.title).toBe(page.meta.searchTitle ?? page.meta.title);
      expect(twitter?.description).toBe(page.meta.searchDescription ?? page.meta.description);
    }
  });

  it("titles the English visualization guide with its search title in the page, Open Graph and X card titles", () => {
    const metadata = buildLearnPageMetadata(pageFor("chess-visualization-exercises"));

    expect(metadata.title).toBe("Chess Visualization Exercises: Test and Train");
    expect(metadata.openGraph?.title).toBe("Chess Visualization Exercises: Test and Train");
    expect(metadata.twitter?.title).toBe("Chess Visualization Exercises: Test and Train");
  });

  it("keeps a translated page on the title of its translation", () => {
    const metadata = buildLearnPageMetadata(pageFor("chess-visualization-exercises"), "de");

    expect(metadata.title).toBe(pageFor("chess-visualization-exercises").meta.title);
    expect(metadata.alternates?.canonical).toBe("/de/learn/chess-visualization-exercises");
  });
});
