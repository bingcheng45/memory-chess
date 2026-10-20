/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import LearnGuideRoute from "@/app/[locale]/learn/[slug]/page";
import LearnHub from "@/app/[locale]/learn/page";
import LearnSearchRoute, { metadata as searchMetadata } from "@/app/[locale]/learn/search/page";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";
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
    match[1].replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
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

  it("opens with the direct answer as the first paragraph under the h1 and in the Article and WebPage description", async () => {
    const answer =
      "Plan on about five weeks of blindfold chess training to a first full blind game. Drill 3 to 6 minutes a day for four weeks, then a game every other day.";
    const markup = await guide("blindfold-chess-training-for-beginners");
    const nodes = graph(markup);

    expect(texts(markup.slice(markup.indexOf("</h1>")), "p")[0]).toBe(answer);
    expect(nodes.find((node) => node["@type"] === "Article")?.description).toBe(answer);
    expect(nodes.find((node) => node["@type"] === "WebPage")?.description).toBe(answer);
  });

  it("puts every guide's answer first under its h1", async () => {
    const firstParagraphs = await Promise.all(
      EN_LEARN_PAGES.map(async ({ meta }) => {
        const markup = await guide(meta.slug);
        return [meta.slug, texts(markup.slice(markup.indexOf("</h1>")), "p")[0]];
      }),
    );

    expect(firstParagraphs).toEqual(EN_LEARN_PAGES.map(({ meta }) => [meta.slug, meta.description]));
  });

  it("serves a beginner's round and today's daily board under the lede, before the byline and the quick answer", async () => {
    const markup = await guide("how-to-get-better-at-chess-for-beginners");
    const strip = markup.slice(markup.indexOf('class="lg-quickplay"'), markup.indexOf("</aside>"));

    expect(strip).toContain('<a href="/game?pieceCount=4&amp;memorizeTime=10&amp;source=guide_cta" class="lab-btn lab-btn-primary">Try 4 pieces, 10 seconds</a>');
    expect(strip).toContain('<a href="/daily" class="lg-link">Play today&#x27;s daily board</a>');
    expect(markup.indexOf('class="lg-lede"')).toBeLessThan(markup.indexOf('class="lg-quickplay"'));
    expect(markup.indexOf('class="lg-quickplay"')).toBeLessThan(markup.indexOf('class="lg-meta"'));
    expect(markup.indexOf('class="lg-quickplay"')).toBeLessThan(markup.indexOf('class="lg-answer"'));
  });

  it("offers a new reader the guide's own round in the hero, the same round its answer and closing call to action name", async () => {
    const markup = await guide("chess-coordinates-practice");
    const strip = markup.slice(markup.indexOf('class="lg-quickplay"'), markup.indexOf("</aside>"));

    expect(strip).toContain('<a href="/game?pieceCount=4&amp;memorizeTime=12&amp;source=guide_cta" class="lab-btn lab-btn-primary">Try 4 pieces, 12 seconds</a>');
  });

  it("offers a new reader the guide's closing round in the hero only up to 6 pieces with 10 seconds or more, and the beginner round otherwise", async () => {
    const heroes = await Promise.all(
      EN_LEARN_PAGES.map(async ({ meta }) => {
        const markup = await guide(meta.slug);
        return [meta.slug, markup.match(/data-reader-round="([^"]+)"/)?.[1]];
      }),
    );

    expect(Object.fromEntries(heroes)).toEqual({
      "how-to-get-better-at-chess-for-beginners": "4/10",
      "how-to-stop-blundering-in-chess": "6/10",
      "why-puzzle-rating-doesnt-transfer-to-games": "4/10",
      "chess-coordinates-practice": "4/12",
      "chess-visualization-exercises": "6/10",
      "how-to-see-the-whole-board-in-chess": "4/10",
      "chess-calculation-exercises-for-beginners": "4/10",
      "blindfold-chess-training-for-beginners": "2/10",
      "chess-memory-training": "6/10",
      "chess-pattern-recognition-drills": "4/10",
      "how-to-think-in-chess-for-beginners": "6/20",
      "20-minute-daily-chess-study-plan": "6/10",
      "how-many-chess-puzzles-a-day": "6/10",
      "how-to-analyze-chess-games-for-beginners": "4/10",
    });
  });

  it("keeps a hard guide's own round in its closing call to action while the hero offers the beginner round", async () => {
    const markup = await guide("how-to-see-the-whole-board-in-chess");
    const strip = markup.slice(markup.indexOf('class="lg-quickplay"'), markup.indexOf("</aside>"));

    expect(strip).toContain('<a href="/game?pieceCount=4&amp;memorizeTime=10&amp;source=guide_cta" class="lab-btn lab-btn-primary">');
    expect(markup).toContain("/game?pieceCount=12&amp;memorizeTime=8&amp;source=guide_cta");
  });

  it("links today's daily board under a drill box that plays a round, not under one done at a board", async () => {
    const markup = await guide("blindfold-chess-training-for-beginners");

    expect(markup.match(/class="lg-drill"/g)).toHaveLength(4);
    expect(markup.match(/<p class="lg-drills-daily"><a href="\/daily" class="lg-link">Play today&#x27;s daily board<\/a><\/p>/g)).toHaveLength(1);
  });

  it("draws three server-rendered boards and links a round, a dashboard stat and sibling guides", async () => {
    const markup = await guide("how-to-stop-blundering-in-chess");

    expect(markup.match(/class="lg-board"/g)).toHaveLength(3);
    expect(markup).toContain('href="/game?pieceCount=6&amp;memorizeTime=10&amp;source=guide_cta"');
    expect(markup).toContain('href="/dashboard#tile-recentAccuracy"');
    expect(markup).toContain('<a href="/learn/chess-coordinates-practice">Chess Coordinates Practice: Name Squares Faster</a>');
  });

  it.each(["chess-visualization-exercises", "how-to-see-the-whole-board-in-chess"])(
    "links the blindfold guide from the %s prose with its search phrase",
    async (slug) => {
      const markup = await guide(slug);

      expect(markup).toContain('<a href="/learn/blindfold-chess-training-for-beginners" class="lg-link">blindfold chess training</a>');
    },
  );

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
  it("walks five numbered stages, each guide numbered within its stage, then the closing routine", () => {
    const markup = html(LearnHub());

    expect(texts(markup, "h2")).toEqual([
      "Start here",
      "Board vision and blunders",
      "Visualization and calculation",
      "Memory and patterns",
      "Practice and review",
      "Then keep the routine going",
    ]);
    expect(texts(markup, "p").find((text) => text.endsWith("matches your problem."))).toBe(
      "Five stages, each a few short guides. Read them in order, or start at the stage that matches your problem.",
    );
    expect([...markup.matchAll(/<nav class="lh-map"[^]*?<\/nav>/g)][0][0].match(/href="#[^"]+"/g)).toEqual([
      'href="#foundations"',
      'href="#board-vision"',
      'href="#visualization"',
      'href="#memory"',
      'href="#practice"',
    ]);
    expect(texts(markup, "span").filter((text) => /^\d\.\d$/.test(text))).toHaveLength(14);
    expect(markup).toContain("6 min read · ends with 6 pieces, 10 seconds");
  });

  it("lists every guide in the ItemList in the order a reader sees them", () => {
    const markup = html(LearnHub());
    const items = graph(markup).find((node) => node["@type"] === "ItemList")?.itemListElement as { name: string }[];
    const shown = [...markup.matchAll(/class="lh-guide"[^]*?<b>(.*?)<\/b>/g)].map((match) => match[1].replace(/&#x27;/g, "'"));

    expect(shown).toHaveLength(14);
    expect(items.map((item) => item.name)).toEqual(shown);
  });

  it("closes stages with their own call to action and never hides text", () => {
    const markup = html(LearnHub());

    expect(markup).toContain('<a href="/game?pieceCount=6&amp;memorizeTime=10&amp;source=guide_cta">Check where you stand first: play a 6-piece round</a>');
    expect(markup).toContain('<a href="/dashboard#tile-span">Track your memory span as you climb the ladder</a>');
    expect(markup).not.toMatch(/\shidden(=|\s|>)/);
  });

  it("serves the question field as a plain GET form with the questions people ask", () => {
    const markup = html(LearnHub());

    expect(markup).toMatch(/<form class="ls-form" role="search" action="\/learn\/search" method="get">/);
    expect(markup).toContain('href="/learn/search?q=How+do+I+stop+blundering+pieces%3F"');
  });
});

describe("the server search page", () => {
  const page = async (q?: string) =>
    html(await LearnSearchRoute({ searchParams: Promise.resolve(q === undefined ? {} : { q }) }));

  it("ranks a question on the server and links each result with its rank", async () => {
    const markup = await page("why do i keep hanging pieces");

    expect(texts(markup, "h2")).toEqual(['Guides for "why do i keep hanging pieces"']);
    expect([...markup.matchAll(/data-search-rank="(\d)" data-search-slug="([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`)).toEqual([
      "1 how-to-stop-blundering-in-chess",
    ]);
    expect(markup).toContain('value="why do i keep hanging pieces"');
  });

  it("says when nothing matches and offers the stages", async () => {
    const markup = await page("xyzzy");

    expect(texts(markup, "h2")).toEqual(['No guide answers "xyzzy" yet.']);
    expect(markup).toContain('<a href="/learn#practice">Practice and review</a>');
  });

  it("offers the questions people ask when the query is empty", async () => {
    const markup = await page();

    expect(texts(markup, "h2")).toEqual(["People ask"]);
    expect(markup).toContain('href="/learn/search?q=How+do+I+stop+blundering+pieces%3F"');
  });

  it("keeps itself out of the index and canonical without the query", () => {
    expect(searchMetadata.robots).toEqual({ index: false, follow: true });
    expect(searchMetadata.alternates).toEqual({ canonical: "/learn/search" });
  });
});
