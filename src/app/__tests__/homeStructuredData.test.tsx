import { render, screen } from "@/test-utils/intl";
import HomePage from "@/app/[locale]/(home)/page";

const ORGANIZATION_ID = "https://thememorychess.com/#organization";
const WEBSITE_ID = "https://thememorychess.com/#website";

jest.mock("@/i18n/navigation", () => ({ ...jest.requireActual("@/i18n/navigation"), usePathname: () => "/" }));

// The switcher needs a mounted app router, which a test render does not have.
jest.mock("@/components/ui/LanguageSettings", () => function MockLanguageSettings() {
  return null;
});

type SchemaNode = Record<string, unknown> & { "@type": string; "@id"?: string };
type Schema = { "@graph"?: SchemaNode[]; "@type"?: string };

function jsonLdScripts(container: HTMLElement): Schema[] {
  return Array.from(
    container.querySelectorAll('script[type="application/ld+json"]'),
  ).map((script) => JSON.parse(script.textContent ?? "{}"));
}

async function renderHome() {
  const rendered = render(HomePage());
  await screen.findByRole("heading", { level: 1 });
  return rendered;
}

function brandGraph(container: HTMLElement): SchemaNode[] {
  const script = jsonLdScripts(container).find((schema) =>
    schema["@graph"]?.some((node) => node["@id"] === ORGANIZATION_ID),
  );
  if (!script?.["@graph"]) throw new Error("No brand JSON-LD script found");
  return script["@graph"];
}

describe("home page structured data", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });

  it("declares the Organization the way search engines should name the brand", async () => {
    const { container } = await renderHome();
    const organization = brandGraph(container).find(
      (node) => node["@type"] === "Organization",
    );

    expect(organization).toMatchObject({
      "@id": ORGANIZATION_ID,
      name: "Memory Chess",
      alternateName: ["MemoryChess", "The Memory Chess", "thememorychess.com"],
      disambiguatingDescription:
        "A chess position memory trainer played in the browser, not the dice-and-colour memory game for children that shares the name.",
      logo: "https://thememorychess.com/logo-512.png",
      sameAs: [
        "https://x.com/TheMemoryChess",
        "https://www.producthunt.com/products/memory-chess",
        "https://github.com/bingcheng45/memory-chess",
        "https://t.me/TheMemoryChess",
      ],
      founder: { "@id": "https://thememorychess.com/about#bing-cheng" },
    });
  });

  it("links the WebSite to the Organization as its publisher", async () => {
    const { container } = await renderHome();
    const website = brandGraph(container).find(
      (node) => node["@type"] === "WebSite",
    );

    expect(website?.["@id"]).toBe(WEBSITE_ID);
    expect(website?.publisher).toEqual({ "@id": ORGANIZATION_ID });
    expect(website?.alternateName).toEqual(["MemoryChess", "The Memory Chess", "thememorychess.com"]);
  });

  it("describes the Organization as the chess position memory trainer at its domain", async () => {
    const { container } = await renderHome();
    const organization = brandGraph(container).find((node) => node["@type"] === "Organization");

    expect(organization?.description).toBe(
      "Memory Chess is the free chess position memory trainer at thememorychess.com. Study a chess position for a few seconds, rebuild it from memory, and get an instant accuracy score. No sign-up.",
    );
  });

  it("emits exactly one Organization and one WebSite", async () => {
    const { container } = await renderHome();
    const types = brandGraph(container).map((node) => node["@type"]);

    expect(types.filter((type) => type === "Organization")).toHaveLength(1);
    expect(types.filter((type) => type === "WebSite")).toHaveLength(1);
  });

  it("describes the video with its YouTube title, thumbnail, upload date, duration and embed URL", async () => {
    const { container } = await renderHome();
    const video = brandGraph(container).find((node) => node["@type"] === "VideoObject");

    expect(video).toEqual({
      "@type": "VideoObject",
      "@id": "https://thememorychess.com/#tutorial-video",
      name: "How to Train Yourself to Visualize Anything (6 Simple Tips & Habits)",
      description:
        "Colin Galen explains why mental imagery helps you play out chess moves and solve problems in your head, and shares six tips and habits for getting better at it.",
      thumbnailUrl: "https://i.ytimg.com/vi/p4xFVJTyJZg/hqdefault.jpg",
      uploadDate: "2023-02-13T23:00:03-08:00",
      duration: "PT10M35S",
      embedUrl: "https://www.youtube.com/embed/p4xFVJTyJZg",
      inLanguage: "en",
      creator: { "@type": "Person", name: "Colin Galen", url: "https://www.youtube.com/@ColinGalen" },
    });
    expect(container.querySelector("iframe")?.getAttribute("src")).toMatch(/^https:\/\/www\.youtube\.com\/embed\/p4xFVJTyJZg\?/);
  });

  it("keeps the FAQ structured data as a separate script", async () => {
    const { container } = await renderHome();
    const scripts = jsonLdScripts(container);

    expect(scripts.some((schema) => schema["@type"] === "FAQPage")).toBe(true);
    expect(scripts.length).toBeGreaterThanOrEqual(2);
  });
});
