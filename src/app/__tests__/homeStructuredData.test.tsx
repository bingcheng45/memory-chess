import { render, screen } from "@/test-utils/intl";
import HomePage from "@/app/[locale]/(home)/page";
import english from "../../../messages/en.json";

const ORGANIZATION_ID = "https://thememorychess.com/#organization";
const WEBSITE_ID = "https://thememorychess.com/#website";

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  MockPageHeader.displayName = "MockPageHeader";

  return MockPageHeader;
});

jest.mock("@/components/ui/VideoSection", () => {
  function MockVideoSection() {
    return null;
  }

  MockVideoSection.displayName = "MockVideoSection";

  return MockVideoSection;
});

type SchemaNode = Record<string, unknown> & { "@type": string; "@id"?: string };
type Schema = { "@graph"?: SchemaNode[]; "@type"?: string };

function jsonLdScripts(container: HTMLElement): Schema[] {
  return Array.from(
    container.querySelectorAll('script[type="application/ld+json"]'),
  ).map((script) => JSON.parse(script.textContent ?? "{}"));
}

async function renderHome() {
  const rendered = render(await HomePage({ params: Promise.resolve({ locale: "en" }) }));
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
      alternateName: ["MemoryChess", "The Memory Chess"],
      logo: "https://thememorychess.com/logo-512.png",
      sameAs: ["https://x.com/TheMemoryChess"],
    });
  });

  it("links the WebSite to the Organization as its publisher", async () => {
    const { container } = await renderHome();
    const website = brandGraph(container).find(
      (node) => node["@type"] === "WebSite",
    );

    expect(website?.["@id"]).toBe(WEBSITE_ID);
    expect(website?.publisher).toEqual({ "@id": ORGANIZATION_ID });
    expect(website?.alternateName).toEqual(["MemoryChess", "The Memory Chess"]);
  });

  it("describes the Organization with the English home meta description", async () => {
    const { container } = await renderHome();
    const organization = brandGraph(container).find((node) => node["@type"] === "Organization");

    expect(organization?.description).toBe(english.home.meta.description);
  });

  it("emits exactly one Organization and one WebSite", async () => {
    const { container } = await renderHome();
    const types = brandGraph(container).map((node) => node["@type"]);

    expect(types.filter((type) => type === "Organization")).toHaveLength(1);
    expect(types.filter((type) => type === "WebSite")).toHaveLength(1);
  });

  it("keeps the FAQ structured data as a separate script", async () => {
    const { container } = await renderHome();
    const scripts = jsonLdScripts(container);

    expect(scripts.some((schema) => schema["@type"] === "FAQPage")).toBe(true);
    expect(scripts.length).toBeGreaterThanOrEqual(2);
  });
});
