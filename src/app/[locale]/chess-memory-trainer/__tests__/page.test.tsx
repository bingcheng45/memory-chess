/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ChessMemoryTrainerPage, { generateMetadata } from "@/app/[locale]/chess-memory-trainer/page";
import sitemap from "@/app/sitemap";
import { RECORDED_ROUND_SOURCES, roundSourceFrom } from "@/lib/analytics/events";
import { nextBoardOf } from "@/lib/game/nextBoard";
import { isEnglishOnlyPath } from "@/lib/seo/englishOnly";
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

    expect(meta.title).toEqual({ absolute: "Chess Memory Trainer: See a Position, Rebuild It | Memory Chess" });
    expect(meta.description).toBe(
      "A free chess memory trainer in your browser. Study a position for a few seconds, rebuild it on an empty board, and see which squares you got right.",
    );
    expect(meta.alternates?.canonical).toBe("/chess-memory-trainer");
  });

  it("serves the heading and the opening text in the server HTML", () => {
    expect(markup.match(/<h1>(.*?)<\/h1>/)?.[1]).toBe("Chess memory trainer");
    expect(markup).toContain(
      "This chess memory trainer shows you a position for a few seconds, then clears the board. You put every piece back where it stood, and the trainer marks each square right or wrong.",
    );
  });

  it("serves a start link that opens a 6-piece, 10-second round, and a link to choose the size", () => {
    expect(markup).toContain('<a href="/game?pieceCount=6&amp;memorizeTime=10&amp;from=trainer_page" class="lab-btn lab-btn-primary">Start a round</a>');
    expect(markup).toContain('<a href="/game" class="lab-btn lab-btn-secondary">Choose pieces and time</a>');
  });

  it("registers trainer_page as a round source the game page and a lab import accept", () => {
    expect(roundSourceFrom("trainer_page")).toBe("trainer_page");
    expect(RECORDED_ROUND_SOURCES).toContain("trainer_page");
  });

  it("describes the next board the way Next round sizes it", () => {
    expect(markup).toContain("At 90% or better it adds a piece. Below 50% it takes one away, down to 3 pieces.");
    expect(nextBoardOf({ pieceCount: 6, memorizeSeconds: 10 }, 90)).toEqual({ pieceCount: 7, memorizeSeconds: 10 });
    expect(nextBoardOf({ pieceCount: 6, memorizeSeconds: 10 }, 89)).toEqual({ pieceCount: 6, memorizeSeconds: 10 });
    expect(nextBoardOf({ pieceCount: 6, memorizeSeconds: 10 }, 49)).toEqual({ pieceCount: 5, memorizeSeconds: 10 });
    expect(nextBoardOf({ pieceCount: 3, memorizeSeconds: 10 }, 0)).toEqual({ pieceCount: 3, memorizeSeconds: 10 });
  });

  it("states the setup limits the game enforces", () => {
    expect(markup).toContain("any board from 2 to 32 pieces, with a study time from 1 to 60 seconds");
  });

  it("links the memory ladder guide, the trainer comparison and the blindfold trainer", () => {
    expect(markup).toContain('href="/learn/chess-memory-training"');
    expect(markup).toContain('href="/learn/chess-position-memory-trainers-compared"');
    expect(markup).toContain('href="/blindfold"');
  });

  it("serves WebApplication and BreadcrumbList structured data that parses", () => {
    const blocks = [...markup.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const graph = blocks.flatMap((block) => block["@graph"]);

    expect(graph.map((node) => node["@type"])).toEqual(["WebApplication", "BreadcrumbList"]);
    expect(graph[0]).toMatchObject({
      "@id": "https://thememorychess.com/chess-memory-trainer#app",
      name: "Chess Memory Trainer",
      url: "https://thememorychess.com/chess-memory-trainer",
      inLanguage: "en-US",
    });
    expect(graph[1].itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Memory Chess", item: "https://thememorychess.com" },
      { "@type": "ListItem", position: 2, name: "Chess memory trainer", item: "https://thememorychess.com/chess-memory-trainer" },
    ]);
  });

  it("is English-only and listed once in the sitemap at its bare URL", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(isEnglishOnlyPath("/chess-memory-trainer")).toBe(true);
    expect(urls.filter((url) => url.endsWith("/chess-memory-trainer"))).toEqual(["https://thememorychess.com/chess-memory-trainer"]);
  });
});
