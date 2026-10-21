import { homeSchema } from "@/components/home/homeSchema";
import { gameVideo } from "@/components/home/gameVideo";

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

  it("adds the game video node when a game video is published", () => {
    const video = gameVideo({
      id: "dQw4w9WgXcQ",
      name: "Memory Chess: one round from study to score",
      description: "A full round of Memory Chess.",
      uploadDate: "2026-10-20T09:00:00+08:00",
      duration: "PT20S",
    });
    const graph = homeSchema("de", "Beschreibung", video)["@graph"];

    expect(graph.map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
      "Person",
      ["SoftwareApplication", "WebApplication"],
      "VideoObject",
      "VideoObject",
    ]);
    expect(graph[5]).toEqual({
      "@type": "VideoObject",
      "@id": "https://thememorychess.com/#game-video",
      name: "Memory Chess: one round from study to score",
      description: "A full round of Memory Chess.",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      uploadDate: "2026-10-20T09:00:00+08:00",
      duration: "PT20S",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      inLanguage: "en",
    });
  });

  it("emits no game video node while no game video is published", () => {
    const graph = homeSchema("en", "Play.", gameVideo({ id: "", name: "", description: "", uploadDate: "", duration: "" }))["@graph"];

    expect(graph.map((node) => node["@id"] ?? node["@type"])).toEqual([
      "https://thememorychess.com/#organization",
      "https://thememorychess.com/#website",
      "https://thememorychess.com/about#bing-cheng",
      "https://thememorychess.com/#app",
      "https://thememorychess.com/#tutorial-video",
    ]);
  });
});
