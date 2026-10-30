/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import BlindfoldPage, { generateMetadata } from "@/app/[locale]/blindfold/page";
import sitemap from "@/app/sitemap";
import { RECORDED_ROUND_SOURCES, roundSourceFrom } from "@/lib/analytics/events";
import { outcomeEffects } from "@/lib/game/roundOutcome";
import messages from "../../../../../messages/en.json";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("next-intl/server", () => ({ ...jest.requireActual("next-intl/server"), setRequestLocale: jest.fn() }));
jest.mock("@/components/lab-paper/LabPaperHeader", () => ({ LabPaperHeader: () => <div>LabPaperHeader</div> }));

const markup = renderToString(
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <BlindfoldPage />
  </NextIntlClientProvider>,
).replace(/<!-- -->/g, "");

describe("the blindfold page", () => {
  it("is its own canonical with the agreed title and description", () => {
    const meta = generateMetadata();

    expect(meta.title).toEqual({ absolute: "Blindfold Chess Trainer: Free Online Practice | Memory Chess" });
    expect(meta.description).toBe(
      "Train blindfold chess in your browser. Study a position as notation, then rebuild it square by square. Free, no sign-up, with its own leaderboard.",
    );
    expect(meta.alternates?.canonical).toBe("/blindfold");
  });

  it("serves one h1 and a start link that opens a blindfold round", () => {
    expect(markup.match(/<h1>(.*?)<\/h1>/)?.[1]).toBe("Blindfold chess trainer");
    expect(markup).toContain('href="/game?pieceCount=6&amp;memorizeTime=10&amp;from=blindfold_page&amp;mode=blindfold"');
    expect(markup).toContain('href="/game?mode=blindfold"');
  });

  it("registers blindfold_page as a round source the game page and a lab import accept", () => {
    expect(roundSourceFrom("blindfold_page")).toBe("blindfold_page");
    expect(RECORDED_ROUND_SOURCES).toContain("blindfold_page");
  });

  it("links the guide and the board game rules", () => {
    expect(markup).toContain('href="/learn/blindfold-chess-training-for-beginners"');
    expect(markup).toContain('href="/learn/how-to-play-memory-chess-board-game"');
  });

  it("says a blindfold round leaves the skill rating alone, as the round outcome does", () => {
    expect(markup).toContain("A blindfold round never changes your skill rating.");
    expect(outcomeEffects.blindfold.rated).toBe(false);
  });

  it("serves WebApplication and BreadcrumbList structured data that parses", () => {
    const blocks = [...markup.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const graph = blocks.flatMap((block) => block["@graph"]);

    expect(blocks).toHaveLength(1);
    expect(graph.map((node) => node["@type"])).toEqual(["WebApplication", "BreadcrumbList"]);
    expect(graph[0]).toMatchObject({
      "@id": "https://thememorychess.com/blindfold#app",
      name: "Blindfold Chess Trainer",
      url: "https://thememorychess.com/blindfold",
      applicationCategory: "GameApplication",
      inLanguage: "en-US",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Train blindfold chess in your browser. Study a position as notation, then rebuild it square by square. Free, no sign-up, with its own leaderboard.",
    });
    expect(graph[1].itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Memory Chess", item: "https://thememorychess.com" },
      { "@type": "ListItem", position: 2, name: "Blindfold chess trainer", item: "https://thememorychess.com/blindfold" },
    ]);
  });

  it("explains what the trainer does, how a session runs and who it is for", () => {
    const headings = [...markup.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map((match) => match[1]);

    expect(headings).toEqual(expect.arrayContaining(["What the trainer does", "How a ten-minute session runs", "Who the trainer is for"]));
  });

  it("is listed once in the sitemap at its bare URL", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.filter((url) => url.endsWith("/blindfold"))).toEqual(["https://thememorychess.com/blindfold"]);
  });
});
