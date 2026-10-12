/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import LearnGuideRoute from "@/app/[locale]/learn/[slug]/page";
import LearnHub from "@/app/[locale]/learn/page";
import messages from "../../../../messages/en.json";

jest.mock("next/link", () => {
  function MockNextLink({ children, href, ...props }: ComponentProps<"a">) {
    return (
      <a href={typeof href === "string" ? href : "#"} {...props}>
        {children}
      </a>
    );
  }
  return MockNextLink;
});

jest.mock("next-intl/server", () => ({ ...jest.requireActual("next-intl/server"), setRequestLocale: jest.fn() }));
jest.mock("@/components/lab-paper/LabPaperHeader", () => ({ LabPaperHeader: () => <div>LabPaperHeader</div> }));

const html = (node: React.ReactNode) =>
  renderToString(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {node}
    </NextIntlClientProvider>,
  ).replace(/<!-- -->/g, "");

const texts = (markup: string, tag: string) =>
  [...markup.matchAll(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "g"))].map((match) =>
    match[1].replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&"),
  );

const graph = (markup: string) => {
  const json = markup.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1] ?? "{}";
  return JSON.parse(json)["@graph"] as Record<string, unknown>[];
};

async function guide(slug: string) {
  return html(await LearnGuideRoute({ params: Promise.resolve({ slug, locale: "en" }) }));
}

describe("a guide page", () => {
  it("serves one h1, one h2 per section plus the FAQ, and the contents rail in the same order", async () => {
    const markup = await guide("how-to-stop-blundering-in-chess");

    expect(texts(markup, "h1")).toEqual(["How to stop blundering in chess"]);
    expect(texts(markup, "h2")).toEqual([
      "Why pieces drop in games and not in puzzles",
      "The pre-move scan for checks, captures, threats and loose pieces",
      "One queen check against a loose bishop on b4",
      "What an invented piece costs in a Memory Chess round",
      "Loose-piece and last-move drills from your own lost games",
      "A blunder tally beside every result",
      "With under thirty seconds, scan only the last move",
      "Questions",
    ]);
    expect([...markup.matchAll(/data-toc="([^"]+)"/g)].map((match) => match[1])).toEqual([
      "puzzle-vs-game",
      "pre-move-scan",
      "loose-bishop-b4",
      "invented-pieces",
      "own-games-drills",
      "blunder-tally",
      "low-clock-scan",
      "faq",
    ]);
  });

  it("leads with the breadcrumb to its group, the meta line and the quick answer", async () => {
    const markup = await guide("how-to-stop-blundering-in-chess");

    expect(markup).toContain('<a href="/learn#board-vision">Board vision and blunders</a>');
    expect(texts(markup, "li").slice(3, 7)).toEqual(["Beginner", "6 min read", "Updated 15 September 2026", "By Bing Cheng"]);
    expect(markup.indexOf("Before every move, run one scan")).toBeLessThan(markup.indexOf('id="puzzle-vs-game"'));
  });

  it("draws three server-rendered boards and links a round, a dashboard stat and sibling guides", async () => {
    const markup = await guide("how-to-stop-blundering-in-chess");

    expect(markup.match(/class="lg-board"/g)).toHaveLength(3);
    expect(markup).toContain('href="/game?pieceCount=6&amp;memorizeTime=10&amp;source=guide_cta"');
    expect(markup).toContain('href="/dashboard#tile-recentAccuracy"');
    expect(markup).toContain('<a href="/learn/chess-coordinates-practice">Chess Coordinates Practice for Faster Board Awareness</a>');
  });

  it("hides no text from a crawler", async () => {
    const markup = await guide("20-minute-daily-chess-study-plan");

    expect(markup).not.toMatch(/\shidden(=|\s|>)/);
    expect(markup).not.toMatch(/style="[^"]*(display|visibility)/);
  });

  it("describes the article with its group, level, read time and topic", async () => {
    const article = graph(await guide("how-to-stop-blundering-in-chess")).find((node) => node["@type"] === "Article");

    expect(article).toMatchObject({
      headline: "How to stop blundering in chess",
      articleSection: "Board vision and blunders",
      educationalLevel: "Beginner",
      timeRequired: "PT6M",
      about: { "@type": "Thing", name: "how to stop blundering in chess" },
      author: { "@type": "Person", name: "Bing Cheng" },
    });
  });

  it("emits FAQPage only for a guide with an FAQ", async () => {
    const types = async (slug: string) => graph(await guide(slug)).map((node) => node["@type"]);

    expect(await types("how-to-stop-blundering-in-chess")).toEqual([
      "Article",
      "WebPage",
      "BreadcrumbList",
      "FAQPage",
      "Organization",
      "WebSite",
    ]);
    expect(await types("20-minute-daily-chess-study-plan")).not.toContain("FAQPage");
  });
});

describe("the hub", () => {
  it("lists every guide under its group heading and in the ItemList in the same order", () => {
    const markup = html(LearnHub());
    const items = graph(markup).find((node) => node["@type"] === "ItemList")?.itemListElement as { name: string }[];
    const cards = texts(markup, "b");

    expect(texts(markup, "h2")).toEqual([
      "Start here",
      "Board vision and blunders",
      "Visualization and calculation",
      "Memory and patterns",
      "Practice and review",
    ]);
    expect(items.map((item) => item.name)).toEqual(cards);
    expect(cards).toHaveLength(14);
  });
});
