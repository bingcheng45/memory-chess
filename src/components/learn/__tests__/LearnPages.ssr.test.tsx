/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import LearnGuideRoute from "@/app/[locale]/learn/[slug]/page";
import LearnHub from "@/app/[locale]/learn/page";
import LearnSearchRoute, { metadata as searchMetadata } from "@/app/[locale]/learn/search/page";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";
import messages from "../../../../messages/en.json";
import { AFFILIATE } from "@/lib/affiliate/amazon";

jest.mock("next/link", () => {
  function MockNextLink({ children, href, prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
    return (
      <a href={typeof href === "string" ? href : "#"} {...(prefetch === false ? { "data-no-prefetch": "" } : {})} {...props}>
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
  it("links the blindfold guide to the blindfold trainer under its lede", async () => {
    const markup = await guide("blindfold-chess-training-for-beginners");

    expect(markup).toContain('Practise now in the free <a href="/blindfold" class="lg-link">blindfold chess trainer</a>');
  });

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

    expect(strip).toContain('<a href="/game?pieceCount=4&amp;memorizeTime=10&amp;from=guide_try" class="lab-btn lab-btn-primary">Try 4 pieces, 10 seconds</a>');
    expect(strip).toContain('<a href="/daily" data-no-prefetch="" class="lg-link">Play today&#x27;s daily board</a>');
    expect(markup.indexOf('class="lg-lede"')).toBeLessThan(markup.indexOf('class="lg-quickplay"'));
    expect(markup.indexOf('class="lg-quickplay"')).toBeLessThan(markup.indexOf('class="lg-meta"'));
    expect(markup.indexOf('class="lg-quickplay"')).toBeLessThan(markup.indexOf('class="lg-answer"'));
  });

  it("offers a new reader the guide's own round in the hero, the same round its answer and closing call to action name", async () => {
    const markup = await guide("chess-coordinates-practice");
    const strip = markup.slice(markup.indexOf('class="lg-quickplay"'), markup.indexOf("</aside>"));

    expect(strip).toContain('<a href="/game?pieceCount=4&amp;memorizeTime=12&amp;from=guide_try" class="lab-btn lab-btn-primary">Try 4 pieces, 12 seconds</a>');
  });

  it("offers a new reader the 4-piece try round in the hero, with the study time of the guide's own round when that is sighted and 10 seconds or more", async () => {
    const heroes = await Promise.all(
      EN_LEARN_PAGES.map(async ({ meta }) => {
        const markup = await guide(meta.slug);
        return [meta.slug, markup.match(/data-reader-round="([^"]+)"/)?.[1]];
      }),
    );

    expect(Object.fromEntries(heroes)).toEqual({
      "how-to-get-better-at-chess-for-beginners": "4/10",
      "how-to-stop-blundering-in-chess": "4/10",
      "why-puzzle-rating-doesnt-transfer-to-games": "4/10",
      "chess-coordinates-practice": "4/12",
      "chess-visualization-exercises": "4/10",
      "how-to-see-the-whole-board-in-chess": "4/10",
      "chess-calculation-exercises-for-beginners": "4/10",
      "blindfold-chess-training-for-beginners": "4/10",
      "chess-memory-training": "4/10",
      "chess-pattern-recognition-drills": "4/10",
      "how-to-think-in-chess-for-beginners": "4/20",
      "20-minute-daily-chess-study-plan": "4/10",
      "how-many-chess-puzzles-a-day": "4/10",
      "how-to-analyze-chess-games-for-beginners": "4/10",
      "how-to-play-memory-chess-board-game": "4/10",
      "chess-position-memory-trainers-compared": "4/10",
      "lichess-vs-chess-com-visualization-training": "4/10",
      "memory-chess-vs-darksquares": "4/10",
      "memory-chess-vs-lichess-coordinate-trainer": "4/12",
    });
  });

  it("keeps a hard guide's own round in its closing call to action while the hero offers the try round", async () => {
    const markup = await guide("how-to-see-the-whole-board-in-chess");
    const strip = markup.slice(markup.indexOf('class="lg-quickplay"'), markup.indexOf("</aside>"));

    expect(strip).toContain('<a href="/game?pieceCount=4&amp;memorizeTime=10&amp;from=guide_try" class="lab-btn lab-btn-primary">');
    expect(markup).toContain("/game?pieceCount=12&amp;memorizeTime=8&amp;from=guide_cta");
  });

  it("does not prefetch the home breadcrumb, the author link or either daily board link", async () => {
    const markup = await guide("how-to-get-better-at-chess-for-beginners");
    const noPrefetch = [...markup.matchAll(/<a [^>]*data-no-prefetch=""[^>]*href="([^"]+)"|<a href="([^"]+)"[^>]*data-no-prefetch=""/g)].map((m) => m[1] ?? m[2]);

    expect(noPrefetch).toEqual(["/", "/daily", "/about", "/daily"]);
  });

  it("links today's daily board under a drill box that plays a round, not under one done at a board", async () => {
    const markup = await guide("blindfold-chess-training-for-beginners");

    expect(markup.match(/class="lg-drill"/g)).toHaveLength(4);
    expect(markup.match(/<p class="lg-drills-daily"><a href="\/daily" data-no-prefetch="" class="lg-link">Play today&#x27;s daily board<\/a><\/p>/g)).toHaveLength(1);
  });

  it("draws three server-rendered boards and links a round, a dashboard stat and sibling guides", async () => {
    const markup = await guide("how-to-stop-blundering-in-chess");

    expect(markup.match(/class="lg-board"/g)).toHaveLength(3);
    expect(markup).toContain('href="/game?pieceCount=6&amp;memorizeTime=10&amp;from=guide_cta"');
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

describe("the wooden board game guide", () => {
  const SLUG = "how-to-play-memory-chess-board-game";
  const amazonLinks = (markup: string) => [...markup.matchAll(/<a [^>]*href="([^"]*amazon[^"]*)"[^>]*>/g)].map((match) => match[0]);

  afterEach(() => jest.restoreAllMocks());

  it("serves the written rules, the demo's caption and its sections to a crawler", async () => {
    const markup = await guide(SLUG);

    expect(texts(markup, "h1")).toEqual(["How to play Memory Chess, the wooden board game"]);
    expect(texts(markup, "h2")).toEqual([
      "What comes in a wooden Memory Chess set",
      "How to set up the board",
      "How a turn works: roll, lift, keep or put back",
      "How to win wooden Memory Chess",
      "Memory Chess variants and house rules",
      "Tips for playing with children and with adults",
      "Two games share the name Memory Chess",
      "Questions",
    ]);
    expect(markup).toContain("If they do not match, put the peg back in exactly the same hole.");
    expect(markup).toContain("<figcaption>A two-player game step by step: setup, a match, a miss that goes back in its hole, and a win.</figcaption>");
    expect(markup).toContain('<a href="/" class="lg-link">Memory Chess online</a>');
    expect(markup).toContain('<a href="/learn#memory">Memory and patterns</a>');
  });

  it("links the tagged Amazon product once, sponsored, beside the disclosure", async () => {
    const markup = await guide(SLUG);

    expect(amazonLinks(markup)).toEqual([
      '<a href="https://link.amazon/B02uoulyl" target="_blank" rel="sponsored nofollow noopener" class="lab-btn lab-btn-secondary">',
    ]);
    expect(markup).toMatch(/link\.amazon\/B02uoulyl[^]*?<\/a><p>As an Amazon Associate, Memory Chess earns from qualifying purchases\.<\/p>/);
  });

  it("carries no Amazon link, disclosure or set drawing while the product link is empty", async () => {
    jest.replaceProperty(AFFILIATE, "amazonProductUrl", "");
    const markup = await guide(SLUG);

    expect(amazonLinks(markup)).toEqual([]);
    expect(markup).not.toContain("Amazon Associate");
    expect(markup).not.toContain("wg-set");
    expect(markup).toContain('id="take-a-turn"');
  });

  it("describes itself as an article in the memory group with an FAQ", async () => {
    const nodes = graph(await guide(SLUG));

    expect(nodes.map((node) => node["@type"])).toEqual(["Article", "WebPage", "BreadcrumbList", "FAQPage", "Organization", "WebSite"]);
    expect(nodes[0]).toMatchObject({
      headline: "How to play Memory Chess, the wooden board game",
      articleSection: "Memory and patterns",
      about: { "@type": "Thing", name: "how to play memory chess" },
    });
  });
});

describe("the hub", () => {
  it("walks five numbered stages, each guide numbered within its stage, then the closing routine and the unnumbered compare group", () => {
    const markup = html(LearnHub());

    expect(texts(markup, "h2")).toEqual([
      "Start here",
      "Board vision and blunders",
      "Visualization and calculation",
      "Memory and patterns",
      "Practice and review",
      "Then keep the routine going",
      "Compare training tools",
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
    expect(texts(markup, "span").filter((text) => /^\d\.\d$/.test(text))).toHaveLength(15);
    expect(markup).toContain("6 min read · ends with 6 pieces, 10 seconds");
  });

  it("closes the path with a link to the open recall data", () => {
    const markup = html(LearnHub());

    expect(markup).toContain('<p class="lh-stage-cta"><a href="/data">See how well other players recall positions, by piece count and study time</a></p>');
  });

  it("lists every guide in the ItemList in the order a reader sees them", () => {
    const markup = html(LearnHub());
    const items = graph(markup).find((node) => node["@type"] === "ItemList")?.itemListElement as { name: string }[];
    const shown = [...markup.matchAll(/class="lh-guide"[^]*?<b>(.*?)<\/b>/g)].map((match) => match[1].replace(/&#x27;/g, "'"));

    expect(shown).toHaveLength(19);
    expect(shown.slice(-4)).toEqual([
      "Chess Position Memory Trainers Compared",
      "Lichess vs Chess.com for Visualization Training",
      "Memory Chess vs the Lichess Coordinate Trainer",
      "Memory Chess vs DarkSquares Compared",
    ]);
    expect(items.map((item) => item.name)).toEqual(shown);
  });

  it("closes stages with their own call to action and never hides text", () => {
    const markup = html(LearnHub());

    expect(markup).toContain('<a href="/game?pieceCount=6&amp;memorizeTime=10&amp;from=guide_cta">Check where you stand first: play a 6-piece round</a>');
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

describe("a comparison page", () => {
  const COMPARE_SLUGS = [
    "chess-position-memory-trainers-compared",
    "lichess-vs-chess-com-visualization-training",
    "memory-chess-vs-lichess-coordinate-trainer",
    "memory-chess-vs-darksquares",
  ];

  it.each(COMPARE_SLUGS)("%s says who publishes it and when it was checked, right after the lede and before the play strip, and serves a table", async (slug) => {
    const markup = await guide(slug);
    const disclosure = markup.indexOf("data-compare-disclosure");

    expect(markup).toContain('<time dateTime="2026-10-20T00:00:00.000Z">Checked 20 October 2026</time>');
    expect(disclosure).toBeGreaterThan(markup.indexOf('class="lg-lede"'));
    expect(disclosure).toBeLessThan(markup.indexOf('class="lg-quickplay"'));
    expect(texts(markup, "p").find((text) => text.includes("Checked 20 October 2026"))).toMatch(/^Memory Chess (publishes|makes)/);
    expect(markup).toContain("<table>");
    expect(markup).toContain('<a href="/learn#compare">Compare training tools</a>');
    expect(graph(markup).map((node) => node["@type"])).toEqual(
      slug === "chess-position-memory-trainers-compared"
        ? ["Article", "WebPage", "BreadcrumbList", "ItemList", "Organization", "WebSite"]
        : ["Article", "WebPage", "BreadcrumbList", "Organization", "WebSite"],
    );
  });

  it("lists the seven position-memory trainers in the ItemList alphabetically, ignoring case", async () => {
    const list = graph(await guide("chess-position-memory-trainers-compared")).find((node) => node["@type"] === "ItemList") as {
      itemListElement: { name: string }[];
    };

    expect(list.itemListElement.map((item) => item.name)).toEqual([
      "BoardWithin",
      "Chess Memory (Android)",
      "chessO",
      "ChessWorld memory trainer",
      "DarkSquares Position Memory",
      "Lucas Chess memory exercise",
      "Memory Chess",
    ]);
  });

  it("shows no disclosure on an ordinary guide", async () => {
    expect(await guide("chess-memory-training")).not.toContain("data-compare-disclosure");
  });
});

describe("the Also in line on the hub and the search page", () => {
  const alsoInOf = (markup: string, slug: string) => {
    const line = markup.match(new RegExp(`<p class="lh-also" data-guide-translations="${slug}">(.*?)</p>`))?.[1];
    return line === undefined ? null : [...line.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(([, href, label]) => [label, href]);
  };
  const BLINDFOLD_TRANSLATIONS = [
    ["Русский", "/ru/learn/blindfold-chess-training-for-beginners"],
    ["Português (BR)", "/pt-BR/learn/blindfold-chess-training-for-beginners"],
    ["Français", "/fr/learn/blindfold-chess-training-for-beginners"],
    ["Deutsch", "/de/learn/blindfold-chess-training-for-beginners"],
    ["Español", "/es/learn/blindfold-chess-training-for-beginners"],
  ];

  it("links each translation of a translated guide from its hub card, and adds no line to an untranslated guide", () => {
    const markup = html(LearnHub());

    expect(alsoInOf(markup, "blindfold-chess-training-for-beginners")).toEqual(BLINDFOLD_TRANSLATIONS);
    expect(alsoInOf(markup, "chess-memory-training")).toBeNull();
  });

  it("links each translation from a translated guide's search result, and adds no line to an untranslated one", async () => {
    const markup = html(await LearnSearchRoute({ searchParams: Promise.resolve({ q: "blindfold chess memory training" }) }));

    expect(alsoInOf(markup, "blindfold-chess-training-for-beginners")).toEqual(BLINDFOLD_TRANSLATIONS);
    expect(markup).toContain('href="/learn/chess-memory-training"');
    expect(alsoInOf(markup, "chess-memory-training")).toBeNull();
  });
});

describe("the Try it here block", () => {
  const BLOCK = /<aside class="lg-try"[^>]*data-try-it[^>]*>[\s\S]*?<\/aside>/;
  const blockOf = (markup: string) => markup.match(BLOCK)?.[0] ?? "";

  it.each([
    ["chess-calculation-exercises-for-beginners", "/game?pieceCount=4&amp;memorizeTime=10&amp;from=guide_try", "Start a round of 4 pieces"],
    ["how-to-get-better-at-chess-for-beginners", "/game?pieceCount=4&amp;memorizeTime=10&amp;from=guide_try", "Start a round of 4 pieces"],
    ["blindfold-chess-training-for-beginners", "/game?pieceCount=4&amp;memorizeTime=15&amp;from=guide_try&amp;mode=blindfold", "Start a blindfold round of 4 pieces"],
  ])("puts a start link in the served HTML of %s, after the quick answer and before the first section", async (slug, href, label) => {
    const markup = await guide(slug);
    const block = blockOf(markup);

    expect(block).toContain(`href="${href}"`);
    expect([...block.matchAll(/<a [^>]*>(.*?)<\/a>/g)].map((match) => match[1])).toEqual([label]);
    expect(markup.indexOf("lg-answer-label")).toBeLessThan(markup.indexOf(block));
    expect(markup.indexOf(block)).toBeLessThan(markup.indexOf('<section id='));
  });

  it("draws a four-piece board with its pieces written out for a reader without the board", async () => {
    const block = blockOf(await guide("chess-calculation-exercises-for-beginners"));

    expect(block.match(/class="lg-piece"/g)).toHaveLength(4);
    expect(block).toContain("White: Kg1, Nf3. Black: Ke8, Bd6.");
  });

  it("shows notation and no board on the blindfold guide", async () => {
    const block = blockOf(await guide("blindfold-chess-training-for-beginners"));

    expect(block).not.toContain("lg-board-plate");
    expect(block).toContain("White: Kg1, Nf3. Black: Ke8, Bd6.");
  });

  it("adds no h2, so the contents rail and the section count are unchanged", async () => {
    expect(blockOf(await guide("chess-calculation-exercises-for-beginners"))).not.toContain("<h2");
  });

  it("leaves a guide without the block alone", async () => {
    expect(await guide("how-to-stop-blundering-in-chess")).not.toContain("data-try-it");
  });
});
