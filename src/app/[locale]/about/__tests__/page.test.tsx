import type { AnchorHTMLAttributes } from "react";
import { render, screen, within } from "@/test-utils/intl";
import AboutPage from "@/app/[locale]/about/page";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";

const IN_ENGLISH = { params: Promise.resolve({ locale: "en" }) };

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/about",
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/lib/articles/translatedLocales");
jest.mock("@/lib/supabase", () => ({ supabase: {} }));
jest.mock("@/lib/services/gameStatsService", () => ({
  getGameMetric: async () => ({
    data: { id: "1", metric_name: "total_plays", metric_value: "49631", last_updated: "2026-10-19T18:30:00.000Z" },
  }),
}));

describe("AboutPage", () => {
  it("is a Lab Paper page whose header marks About as the current page", async () => {
    const { container } = render(await AboutPage(IN_ENGLISH));

    expect(container.firstElementChild).toHaveClass("lab-paper");
    expect(screen.getAllByRole("link", { name: "About" })[0]).toHaveAttribute("aria-current", "page");
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      "Who runs this site",
      "Why the game exists",
      "How a round works",
      "How the Learn guides are written",
      "Where the site has been",
      "Get in touch",
    ]);
  });

  it("offers the Telegram group after the contact section, outside the page text", async () => {
    render(await AboutPage(IN_ENGLISH));

    const link = screen.getByRole("link", { name: "Join the Telegram group" });
    expect(link).toHaveAttribute("href", "https://t.me/TheMemoryChess");
    expect(link).toHaveAttribute("id", "community-about");
    const contact = screen.getByRole("heading", { name: "Get in touch" });
    expect(contact.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("points to the open recall data before the Telegram invite", async () => {
    render(await AboutPage(IN_ENGLISH));

    const data = screen.getByRole("link", { name: "See the recall data" });
    expect(data).toHaveAttribute("href", "/data");
    expect(data.parentElement).toHaveTextContent("Aggregate recall statistics from rounds recorded in Google Analytics are published, for settings with enough rounds and players. See the recall data");
    const telegram = screen.getByRole("link", { name: "Join the Telegram group" });
    expect(data.compareDocumentPosition(telegram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("names the developer and links the site's real pages", async () => {
    render(await AboutPage(IN_ENGLISH));

    expect(
      screen.getByRole("heading", { name: "About Memory Chess", level: 1 }),
    ).toBeInTheDocument();
    const whoRunsIt = screen.getByRole("heading", { name: "Who runs this site" }).closest("section");
    expect(within(whoRunsIt as HTMLElement).getByText(/Bing Cheng/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "bingcheng45@gmail.com" }),
    ).toHaveAttribute("href", "mailto:bingcheng45@gmail.com");
    expect(screen.getByRole("link", { name: "Learn library" })).toHaveAttribute(
      "href",
      "/learn",
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "terms of service" }),
    ).toHaveAttribute("href", "/terms");
  });

  it("makes no claim the site cannot back up", async () => {
    const { container } = render(await AboutPage(IN_ENGLISH));
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/games have been played/);
    expect(text).not.toMatch(/review them/);
    expect(text).not.toMatch(/guides translated/);
    expect(text).not.toMatch(/same working shape/);
    expect(text).not.toMatch(/I write them myself/);
    expect(text).not.toMatch(/sixteen guides/);
    expect(text).toMatch(/written with AI assistance/);
    expect(text).not.toMatch(/every release since the beginning/);
    expect(text).toMatch(/records every versioned release/);
  });

  it("discloses AI assistance for the site itself, as the guide byline does", async () => {
    const { container } = render(await AboutPage(IN_ENGLISH));
    const text = container.textContent ?? "";

    expect(text).toMatch(/with AI assistance for the code and the site copy/);
    expect(text).not.toMatch(/design, code, and maintain everything/);
    expect(text).not.toMatch(/just me/);
  });

  it("counts the guides the Learn library actually holds", async () => {
    const { container } = render(await AboutPage(IN_ENGLISH));

    expect(container.textContent).toContain(`holds ${EN_LEARN_PAGES.length} guides`);
  });

  it("dates the Learn library to its March 2026 launch", async () => {
    const { container } = render(await AboutPage(IN_ENGLISH));
    const text = container.textContent ?? "";

    expect(text).toMatch(/Learn library launched in March 2026/);
    expect(text).not.toMatch(/August 2026 the site grew its Learn library/);
  });

  it("states the site's facts, with the finished games to the Singapore date, before the first section", async () => {
    render(await AboutPage(IN_ENGLISH));

    const facts = screen.getByText(/^Memory Chess is built and run by one developer/);
    expect(facts.textContent).toBe(
      "Memory Chess is built and run by one developer, Bing Cheng. It first went live in March 2025 and plays in 24 languages. Players had finished 49,000+ games by October 20, 2026.",
    );
    const firstSection = screen.getByRole("heading", { name: "Who runs this site" });
    expect(facts.compareDocumentPosition(firstSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("serves the About page, its developer, the Organization and the WebSite it is part of as one JSON-LD graph", async () => {
    const { container } = render(await AboutPage(IN_ENGLISH));
    const script = container.querySelector('script[type="application/ld+json"]');
    const graph = JSON.parse(script?.textContent ?? "{}")["@graph"];

    expect(graph.map((node: { "@type": string; "@id": string }) => [node["@type"], node["@id"]])).toEqual([
      ["AboutPage", "https://thememorychess.com/about#webpage"],
      ["Person", "https://thememorychess.com/about#bing-cheng"],
      ["Organization", "https://thememorychess.com/#organization"],
      ["WebSite", "https://thememorychess.com/#website"],
    ]);
    expect(graph[0].name).toBe("About Memory Chess");
    expect(graph[0].isPartOf).toEqual({ "@id": "https://thememorychess.com/#website" });
    expect(graph.filter((node: { "@id": string }) => node["@id"] === graph[0].isPartOf["@id"])).toHaveLength(1);
  });
});
