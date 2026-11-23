/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ChessMemoryTrainerPage, { generateMetadata } from "@/app/[locale]/chess-memory-trainer/page";
import sitemap from "@/app/sitemap";
import { RECORDED_ROUND_SOURCES, roundSourceFrom } from "@/lib/analytics/events";
import { isLabPaperRoute } from "@/lib/lab-paper/routes";
import { indexedLocalesOf, isEnglishOnlyPath } from "@/lib/seo/englishOnly";
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
    <ChessMemoryTrainerPage />
  </NextIntlClientProvider>,
).replace(/<!-- -->/g, "");

describe("the chess memory trainer page", () => {
  it("is its own canonical with a title and description that say what the trainer does", () => {
    const meta = generateMetadata();

    expect(meta.title).toEqual({ absolute: "Chess Memory Trainer: Memorize and Rebuild Positions | Memory Chess" });
    expect(meta.description).toBe(
      "A free chess memory trainer in your browser. Memorize a position, rebuild it on an empty board, and see which squares you missed. No sign-up.",
    );
    expect(meta.alternates?.canonical).toBe("/chess-memory-trainer");
  });

  it("serves the h1, the opening text and a Start round link that opens a round, in the server HTML", () => {
    expect(markup.match(/<h1>(.*?)<\/h1>/)?.[1]).toBe("Chess memory trainer");
    expect(markup).toContain(
      "The chess memory trainer shows you a chess position for a few seconds, then clears the board. You put every piece back where it stood, and the trainer marks each square right or wrong.",
    );
    expect(markup).toContain('<a href="/game?pieceCount=6&amp;memorizeTime=10&amp;from=trainer_page" class="lab-btn lab-btn-primary">Start round</a>');
    expect(markup).toContain('<a href="/game" class="lab-btn lab-btn-secondary">Set pieces and time</a>');
  });

  it("states the game's own presets and setup limits", () => {
    expect(markup).toContain("Four ready-made levels run from easy, 2 pieces with 10 seconds, to grandmaster, 20 pieces with 5 seconds.");
    expect(markup).toContain("anywhere from 2 to 32 pieces and 1 to 60 seconds of study.");
  });

  it("registers trainer_page as a round source the game page and a lab import accept", () => {
    expect(roundSourceFrom("trainer_page")).toBe("trainer_page");
    expect(RECORDED_ROUND_SOURCES).toContain("trainer_page");
  });

  it("links the training ladder, the trainer comparison, the blindfold trainer and the daily board", () => {
    const keepGoing = markup.slice(markup.indexOf("Keep going"));

    expect([...keepGoing.matchAll(/href="([^"]+)"/g)].map((match) => match[1])).toEqual([
      "/learn/chess-memory-training",
      "/learn/chess-position-memory-trainers-compared",
      "/blindfold",
      "/daily",
    ]);
  });

  it("serves WebApplication and BreadcrumbList structured data that parses", () => {
    const blocks = [...markup.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const graph = blocks.flatMap((block) => block["@graph"]);

    expect(graph.map((node) => node["@type"])).toEqual(["WebApplication", "BreadcrumbList"]);
    expect(graph[0]).toMatchObject({
      "@id": "https://thememorychess.com/chess-memory-trainer#app",
      name: "Chess Memory Trainer",
      url: "https://thememorychess.com/chess-memory-trainer",
    });
    expect(graph[1].itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Memory Chess", item: "https://thememorychess.com" },
      { "@type": "ListItem", position: 2, name: "Chess memory trainer", item: "https://thememorychess.com/chess-memory-trainer" },
    ]);
  });

  it("is English-only, drawn in Lab Paper, and listed once in the sitemap at its bare URL", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(isEnglishOnlyPath("/chess-memory-trainer")).toBe(true);
    expect(indexedLocalesOf("/chess-memory-trainer")).toEqual(["en"]);
    expect(isLabPaperRoute("/chess-memory-trainer", "en")).toBe(true);
    expect(urls.filter((url) => url.endsWith("/chess-memory-trainer"))).toEqual(["https://thememorychess.com/chess-memory-trainer"]);
  });
});
