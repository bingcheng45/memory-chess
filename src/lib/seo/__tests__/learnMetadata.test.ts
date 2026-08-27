import { buildLearnPageMetadata } from "@/lib/seo/learnMetadata";
import { EN_LEARN_PAGES as LEARN_PAGES } from "@/lib/seo/learn";
import type { LearnPageContent } from "@/lib/seo/learn/schema";

function pageFor(slug: string): LearnPageContent {
  const page = LEARN_PAGES.find((entry) => entry.slug === slug);
  if (!page) throw new Error(`Unknown learn slug: ${slug}`);
  return page;
}

describe("buildLearnPageMetadata", () => {
  it("builds metadata for the beginner roadmap", () => {
    const metadata = buildLearnPageMetadata(pageFor("how-to-get-better-at-chess-for-beginners"), "en");

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
    const metadata = buildLearnPageMetadata(pageFor("how-to-stop-blundering-in-chess"), "en");

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

  it("points a translated article at its own localized social card", () => {
    // The opengraph-image route lives under [locale] and renders the
    // translated title, so an unprefixed URL hands social crawlers the
    // English card for a German page. Crawlers are deliberately pinned to
    // English by the middleware, so they cannot recover the right one.
    const page = pageFor("how-to-stop-blundering-in-chess");
    const metadata = buildLearnPageMetadata(page, "de");

    const openGraph = metadata.openGraph;
    const images = Array.isArray(openGraph?.images)
      ? openGraph.images
      : [openGraph?.images];
    const twitterImages = Array.isArray(metadata.twitter?.images)
      ? metadata.twitter.images
      : [metadata.twitter?.images];

    expect(images[0]).toMatchObject({
      url: "https://thememorychess.com/de/learn/how-to-stop-blundering-in-chess/opengraph-image",
    });
    expect(twitterImages[0]).toBe(
      "https://thememorychess.com/de/learn/how-to-stop-blundering-in-chess/opengraph-image",
    );
  });

  it("keeps the social card unprefixed for English", () => {
    const page = pageFor("how-to-stop-blundering-in-chess");
    const openGraph = buildLearnPageMetadata(page, "en").openGraph;
    const images = Array.isArray(openGraph?.images)
      ? openGraph.images
      : [openGraph?.images];

    expect(images[0]).toMatchObject({
      url: "https://thememorychess.com/learn/how-to-stop-blundering-in-chess/opengraph-image",
    });
  });

  it("keeps metadata complete for every published guide", () => {
    for (const page of LEARN_PAGES) {
      const metadata = buildLearnPageMetadata(page, "en");
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
