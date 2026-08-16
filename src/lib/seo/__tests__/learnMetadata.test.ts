import { buildLearnPageMetadata } from "@/lib/seo/learnMetadata";
import { LEARN_PAGES } from "@/lib/seo/learnPages";

describe("buildLearnPageMetadata", () => {
  it("builds metadata for the beginner roadmap", () => {
    const metadata = buildLearnPageMetadata(
      "how-to-get-better-at-chess-for-beginners",
    );

    expect(metadata.title).toBe("How to Get Better at Chess for Beginners");
    expect(metadata.description).toContain("beginner chess plan");
    expect(metadata.alternates?.canonical).toBe(
      "/learn/how-to-get-better-at-chess-for-beginners",
    );
    expect(
      metadata.openGraph && "type" in metadata.openGraph
        ? metadata.openGraph.type
        : undefined,
    ).toBe("article");
  });

  it("adds article timestamps and image metadata", () => {
    const metadata = buildLearnPageMetadata("how-to-stop-blundering-in-chess");

    const openGraph = metadata.openGraph;
    if (!openGraph || !("publishedTime" in openGraph)) {
      throw new Error("Expected article Open Graph metadata");
    }

    const images = Array.isArray(openGraph.images)
      ? openGraph.images
      : [openGraph.images];
    const authors = Array.isArray(metadata.authors)
      ? metadata.authors
      : [metadata.authors];

    expect(openGraph.publishedTime).toBe("2026-03-06T00:00:00.000Z");
    expect(openGraph.modifiedTime).toBe("2026-08-17T00:00:00.000Z");
    expect(images[0]).toMatchObject({
      url: "https://thememorychess.com/learn/how-to-stop-blundering-in-chess/opengraph-image",
    });
    expect(authors[0]).toMatchObject({ name: "Memory Chess Editorial Team" });
  });

  it("keeps metadata complete for every published guide", () => {
    for (const page of LEARN_PAGES) {
      const metadata = buildLearnPageMetadata(page.slug);
      const openGraph = metadata.openGraph;
      const twitter = metadata.twitter;

      expect(metadata.title).toBe(page.title);
      expect(metadata.description).toBe(page.description);
      expect(metadata.alternates?.canonical).toBe(`/learn/${page.slug}`);
      expect(openGraph && "url" in openGraph ? openGraph.url : undefined).toBe(
        `https://thememorychess.com/learn/${page.slug}`,
      );
      expect(openGraph?.title).toBe(page.title);
      expect(openGraph?.description).toBe(page.description);
      expect(twitter?.title).toBe(page.title);
      expect(twitter?.description).toBe(page.description);
    }
  });
});
