import { homeSchema } from "@/components/home/homeSchema";

describe("homeSchema", () => {
  it("adds the app and tutorial video nodes for English beside the brand graph", () => {
    const schema = homeSchema("en", "Play the free memory chess game online.");

    expect(schema["@graph"].map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      "Person",
      ["SoftwareApplication", "WebApplication"],
      "VideoObject",
    ]);
    expect(schema["@graph"][3]).toEqual({
      "@type": ["SoftwareApplication", "WebApplication"],
      "@id": "https://thememorychess.com/#app",
      name: "Memory Chess",
      alternateName: ["MemoryChess", "The Memory Chess", "thememorychess.com"],
      disambiguatingDescription:
        "A chess position memory trainer played in the browser, not the dice-and-colour memory game for children that shares the name.",
      url: "https://thememorychess.com",
      applicationCategory: "GameApplication",
      applicationSubCategory: "Chess memory trainer",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      inLanguage: "en-US",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": "https://thememorychess.com/#organization" },
      author: { "@id": "https://thememorychess.com/about#bing-cheng" },
      isPartOf: { "@id": "https://thememorychess.com/#website" },
      description: "Play the free memory chess game online.",
      image: [
        "https://thememorychess.com/social/v2/memory-chess-1200x675.jpg",
        "https://thememorychess.com/social/v2/memory-chess-1200x900.jpg",
        "https://thememorychess.com/social/v2/memory-chess-1200x1200.jpg",
      ],
      screenshot: "https://thememorychess.com/social/v2/memory-chess-1200x630.jpg",
    });
  });

  it("names the author the app and the Organization point to", () => {
    const person = homeSchema("en", "x")["@graph"].find((node) => node["@type"] === "Person");

    expect(person).toEqual({
      "@type": "Person",
      "@id": "https://thememorychess.com/about#bing-cheng",
      name: "Bing Cheng",
      url: "https://thememorychess.com/about",
      jobTitle: "Solo developer",
      sameAs: ["https://github.com/bingcheng45", "https://x.com/Bing_Builds"],
    });
  });

  it("points a locale home at its own URL and language with the same entity id", () => {
    const app = homeSchema("de", "Beschreibung")["@graph"][3];

    expect(app).toMatchObject({
      "@id": "https://thememorychess.com/#app",
      url: "https://thememorychess.com/de",
      inLanguage: "de",
      description: "Beschreibung",
    });
  });
});
