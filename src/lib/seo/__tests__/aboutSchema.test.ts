import { aboutSchema } from "@/lib/seo/aboutSchema";

const PERSON = {
  "@type": "Person",
  "@id": "https://thememorychess.com/about#bing-cheng",
  name: "Bing Cheng",
  url: "https://thememorychess.com/about",
  jobTitle: "Solo developer",
  sameAs: ["https://github.com/bingcheng45", "https://x.com/Bing_Builds"],
};

const ORGANIZATION = {
  "@type": "Organization",
  "@id": "https://thememorychess.com/#organization",
  name: "Memory Chess",
  alternateName: ["MemoryChess", "The Memory Chess", "thememorychess.com"],
  description:
    "Memory Chess is the free chess position memory trainer at thememorychess.com. Study a chess position for a few seconds, rebuild it from memory, and get an instant accuracy score. No sign-up.",
  disambiguatingDescription:
    "A chess position memory trainer played in the browser, not the dice-and-colour memory game for children that shares the name.",
  url: "https://thememorychess.com",
  logo: "https://thememorychess.com/logo-512.png",
  sameAs: [
    "https://x.com/TheMemoryChess",
    "https://www.producthunt.com/products/memory-chess",
    "https://github.com/bingcheng45/memory-chess",
    "https://t.me/TheMemoryChess",
  ],
  founder: { "@id": "https://thememorychess.com/about#bing-cheng" },
};

describe("aboutSchema", () => {
  it("makes the English About page about the Organization, with its developer as the main entity", () => {
    expect(aboutSchema("en", "About Memory Chess")).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "AboutPage",
          "@id": "https://thememorychess.com/about#webpage",
          url: "https://thememorychess.com/about",
          name: "About Memory Chess",
          inLanguage: "en-US",
          isPartOf: { "@id": "https://thememorychess.com/#website" },
          about: { "@id": "https://thememorychess.com/#organization" },
          mainEntity: { "@id": "https://thememorychess.com/about#bing-cheng" },
        },
        PERSON,
        ORGANIZATION,
      ],
    });
  });

  it("gives a translated About page its own URL and language and the same entities", () => {
    expect(aboutSchema("de", "Über Memory Chess")["@graph"]).toEqual([
      {
        "@type": "AboutPage",
        "@id": "https://thememorychess.com/de/about#webpage",
        url: "https://thememorychess.com/de/about",
        name: "Über Memory Chess",
        inLanguage: "de",
        isPartOf: { "@id": "https://thememorychess.com/#website" },
        about: { "@id": "https://thememorychess.com/#organization" },
        mainEntity: { "@id": "https://thememorychess.com/about#bing-cheng" },
      },
      PERSON,
      ORGANIZATION,
    ]);
  });
});
