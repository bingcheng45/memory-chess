import type { ComponentProps } from "react";
import { render, screen } from "@/test-utils/intl";
import LearnArticleRich from "@/components/learn/LearnArticleRich";
import { EN_LEARN_PAGES, EN_LEARN_GOALS } from "@/lib/seo/learn";
import enMessages from "../../../../messages/en.json";

/**
 * A catalogue whose every leaf is a unique marker, with the original ICU
 * arguments preserved so messages still format. Rendering against it proves a
 * string came from the catalogue: a hard-coded literal has no marker to show.
 */
function markerCatalogue(value: unknown, keyPath = ""): unknown {
  if (Array.isArray(value)) {
    return value.map((item, i) => markerCatalogue(item, `${keyPath}[${i}]`));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        markerCatalogue(v, keyPath ? `${keyPath}.${k}` : k),
      ]),
    );
  }
  const args = [...String(value).matchAll(/\{\s*(\w+)\s*\}/g)]
    .map((m) => `{${m[1]}}`)
    .join(" ");
  return `«${keyPath}»${args ? ` ${args}` : ""}`;
}

function getLearnPageBySlug(slug: string) {
  const page = EN_LEARN_PAGES.find((entry) => entry.slug === slug);
  if (!page) throw new Error(`Unknown learn slug: ${slug}`);
  return page;
}

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

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  MockPageHeader.displayName = "MockPageHeader";

  return MockPageHeader;
});

jest.mock("@/components/ui/Footer", () => {
  function MockFooter() {
    return <div>Footer</div>;
  }

  MockFooter.displayName = "MockFooter";

  return MockFooter;
});

jest.mock("@/components/learn/LearnArticleTracking", () => {
  function MockLearnArticleTracking() {
    return null;
  }

  MockLearnArticleTracking.displayName = "MockLearnArticleTracking";

  return MockLearnArticleTracking;
});
describe("LearnArticleRich", () => {
  it("renders the direct answer, practice ideas, and reference links", () => {
    const page = getLearnPageBySlug("how-to-get-better-at-chess-for-beginners");

    const { container } = render(<LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}      />);

    expect(screen.getByText("Start here")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reference links" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Use a short daily routine/i)).toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);

    const allClasses = Array.from(container.querySelectorAll("[class]"))
      .map((element) => element.getAttribute("class") ?? "")
      .join(" ");

    expect(allClasses).toContain("max-w-[68ch]");
    expect(allClasses).toContain("border-white/10");
    expect(allClasses).not.toContain("font-black");
    expect(allClasses).not.toContain("rounded-3xl");
    expect(allClasses).not.toContain("shadow-[");

    const schemaScript = container.querySelector(
      'script[type="application/ld+json"]',
    );
    const schema = JSON.parse(schemaScript?.textContent ?? "{}");
    const article = schema["@graph"].find(
      (entry: { "@type": string }) => entry["@type"] === "Article",
    );

    expect(article.image.url).toBe(
      "https://thememorychess.com/learn/how-to-get-better-at-chess-for-beginners/opengraph-image",
    );
    expect(
      schema["@graph"].map((entry: { "@type": string }) => entry["@type"]),
    ).toEqual(
      expect.arrayContaining([
        "Article",
        "WebPage",
        "BreadcrumbList",
        "FAQPage",
      ]),
    );
  });

  function schemaFor(container: HTMLElement) {
    const script = container.querySelector('script[type="application/ld+json"]');
    const schema = JSON.parse(script?.textContent ?? "{}");
    const node = (type: string) =>
      schema["@graph"].find(
        (entry: { "@type": string }) => entry["@type"] === type,
      );

    return {
      article: node("Article"),
      webPage: node("WebPage"),
      breadcrumb: node("BreadcrumbList"),
      faq: node("FAQPage"),
    };
  }

  it("keeps English structured data on the unprefixed URLs", () => {
    const slug = "how-to-get-better-at-chess-for-beginners";
    const page = getLearnPageBySlug(slug);

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}      />,
    );

    const { article, webPage, breadcrumb } = schemaFor(container);
    const base = `https://thememorychess.com/learn/${slug}`;

    expect(article["@id"]).toBe(`${base}#article`);
    expect(article.inLanguage).toBe("en-US");
    expect(webPage.url).toBe(base);
    // Home stays bare rather than gaining a trailing slash.
    expect(breadcrumb.itemListElement[0].item).toBe("https://thememorychess.com");
    expect(breadcrumb.itemListElement[1].item).toBe(
      "https://thememorychess.com/learn",
    );
  });

  it("keeps publisher and author on their site-wide identifiers", () => {
    const page = getLearnPageBySlug("how-to-get-better-at-chess-for-beginners");

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
      />,
    );

    const { article } = schemaFor(container);

    expect(article.publisher["@id"]).toBe(
      "https://thememorychess.com/#organization",
    );
    expect(article.author["@id"]).toBe(
      "https://thememorychess.com/about#bing-cheng",
    );
  });

  it("credits the author under the date and says how the guide was written and checked", () => {
    const page = getLearnPageBySlug("chess-coordinates-practice");

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
      />,
    );

    const byline = container.querySelector("[data-learn-byline]");
    expect(byline?.textContent).toBe(
      "By Bing Cheng. Written with AI assistance; chess positions checked by script and game facts traced to the code.",
    );
    expect(byline?.querySelector("a")).toHaveAttribute("href", "/about");
    // The byline follows the updated date in the header.
    const time = container.querySelector("header time");
    expect(time?.compareDocumentPosition(byline!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("links the settings page from the coordinates guide", () => {
    const page = getLearnPageBySlug("chess-coordinates-practice");

    render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
      />,
    );

    const links = screen.getAllByRole("link", { name: "the settings page" });
    expect(links.length).toBeGreaterThanOrEqual(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/settings");
  });

  it("reads every piece of article chrome from the catalogue", () => {
    // Rendered against a marker catalogue, any string the component still
    // hard-codes simply will not have a marker in the DOM. This is the
    // invariant, not a list of today's phrasings: a newly hard-coded heading
    // fails here without anyone remembering to extend the test.
    const page = getLearnPageBySlug("how-to-get-better-at-chess-for-beginners");

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}      />,
      {
        locale: "en",
        messages: markerCatalogue(enMessages) as Record<string, unknown>,
      },
    );

    const text = container.textContent ?? "";

    for (const key of [
      "breadcrumbHome",
      "breadcrumbLearn",
      "eyebrow",
      "updated",
      "startHere",
      "whatYouWillLearn",
      "whoThisIsFor",
      "browseAllGuides",
      "onThisPage",
      "aimFor",
      "keepLearning",
      "whatToLearnNext",
      "commonQuestions",
      "faqLabel",
      "referenceLinks",
    ]) {
      expect(text).toContain(`\u00ablearnArticle.${key}\u00bb`);
    }

    // And the English literals they replaced are gone, so nothing is being
    // rendered twice from both a message and a leftover hard-coded copy.
    for (const literal of [
      "Simple chess guide",
      "Browse all guides",
      "On this page",
      "What to learn next",
      "Read this guide",
      "Common questions",
      "Reference links",
    ]) {
      expect(text).not.toContain(literal);
    }
  });

  it("links a drill to the exact round it describes, and only when the game can play it", () => {
    const base = getLearnPageBySlug("chess-memory-training");
    const drillBlock = base.sections
      .flatMap((section) => section.blocks)
      .find((block) => block.kind === "drills");
    if (drillBlock?.kind !== "drills") throw new Error("guide has no drills");
    const [playable, offBoard] = drillBlock.drills;
    const page = {
      ...base,
      sections: base.sections.map((section) => ({
        ...section,
        blocks: section.blocks.map((block) =>
          block === drillBlock
            ? {
                kind: "drills" as const,
                drills: [
                  { ...playable, setup: { pieceCount: 12, memorizeTime: 8 } },
                  { ...offBoard, setup: undefined },
                ],
              }
            : block,
        ),
      })),
    };

    render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}      />,
    );

    expect(screen.getByRole("link", { name: playable.ctaLabel })).toHaveAttribute(
      "href",
      "/game?pieceCount=12&memorizeTime=8",
    );
    expect(screen.queryByRole("link", { name: offBoard.ctaLabel })).toBeNull();
  });

  it("renders clear links to the next guides", () => {
    const page = getLearnPageBySlug("how-to-stop-blundering-in-chess");

    render(<LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}      />);

    expect(
      screen.getByRole("heading", { name: "What to learn next" }),
    ).toBeInTheDocument();

    const next = getLearnPageBySlug(page.relatedArticles[0].slug);
    expect(screen.getByRole("link", { name: next.title })).toHaveAttribute(
      "href",
      `/learn/${next.slug}`,
    );
  });
});
