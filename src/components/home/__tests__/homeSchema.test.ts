import { homeSchema } from "@/components/home/homeSchema";

describe("homeSchema", () => {
  it("adds the app node for English beside the brand graph", () => {
    const schema = homeSchema("en", "Play the free memory chess game online.");

    expect(schema["@graph"].map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      ["SoftwareApplication", "WebApplication"],
    ]);
    expect(schema["@graph"][2]).toEqual({
      "@type": ["SoftwareApplication", "WebApplication"],
      "@id": "https://thememorychess.com/#app",
      name: "Memory Chess",
      url: "https://thememorychess.com",
      applicationCategory: "GameApplication",
      applicationSubCategory: "Chess memory trainer",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript",
      inLanguage: "en-US",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": "https://thememorychess.com/#organization" },
      isPartOf: { "@id": "https://thememorychess.com/#website" },
      description: "Play the free memory chess game online.",
    });
  });

  it("points a locale home at its own URL and language with the same entity id", () => {
    const app = homeSchema("de", "Beschreibung")["@graph"][2];

    expect(app).toMatchObject({
      "@id": "https://thememorychess.com/#app",
      url: "https://thememorychess.com/de",
      inLanguage: "de",
      description: "Beschreibung",
    });
  });
});
