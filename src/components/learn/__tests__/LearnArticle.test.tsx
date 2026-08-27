import type { ComponentProps } from "react";
import { render, screen } from "@/test-utils/intl";
import LearnArticleRich from "@/components/learn/LearnArticleRich";
import { EN_LEARN_PAGES, EN_LEARN_GOALS } from "@/lib/seo/learn";

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
        allPages={EN_LEARN_PAGES}
        locale="en"
      />);

    expect(screen.getByText("Start here")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Practice in Memory Chess" }),
    ).toBeInTheDocument();
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

  it("identifies a translated article as the localized page", () => {
    // A /de/learn/... page that declares the English URL in its JSON-LD
    // contradicts its own localized canonical, and tells Google the German
    // page and the English page are the same document.
    const slug = "how-to-get-better-at-chess-for-beginners";
    const page = getLearnPageBySlug(slug);

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
        locale="de"
      />,
      { locale: "de" },
    );

    const { article, webPage, breadcrumb, faq } = schemaFor(container);
    const base = `https://thememorychess.com/de/learn/${slug}`;

    expect(article["@id"]).toBe(`${base}#article`);
    expect(article.image.url).toBe(`${base}/opengraph-image`);
    expect(article.inLanguage).toBe("de");
    expect(article.mainEntityOfPage["@id"]).toBe(`${base}#webpage`);

    expect(webPage["@id"]).toBe(`${base}#webpage`);
    expect(webPage.url).toBe(base);
    expect(webPage.isPartOf["@id"]).toBe(
      "https://thememorychess.com/de/learn#webpage",
    );

    expect(faq["@id"]).toBe(`${base}#faq-schema`);
    expect(breadcrumb["@id"]).toBe(`${base}#breadcrumb`);
    expect(breadcrumb.itemListElement.map((e: { item: string }) => e.item)).toEqual([
      "https://thememorychess.com/de",
      "https://thememorychess.com/de/learn",
      base,
    ]);
  });

  it("keeps English structured data on the unprefixed URLs", () => {
    const slug = "how-to-get-better-at-chess-for-beginners";
    const page = getLearnPageBySlug(slug);

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
        locale="en"
      />,
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

  it("keeps organization identifiers global across locales", () => {
    // Publisher and author are one entity site-wide. Prefixing their @id per
    // locale would split one organization into twenty-four in the graph.
    const page = getLearnPageBySlug("how-to-get-better-at-chess-for-beginners");

    const { container } = render(
      <LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
        locale="ja"
      />,
      { locale: "ja" },
    );

    const { article } = schemaFor(container);

    expect(article.publisher["@id"]).toBe(
      "https://thememorychess.com/#organization",
    );
    expect(article.author["@id"]).toBe(
      "https://thememorychess.com/#editorial-team",
    );
  });

  it("renders clear links to the next guides", () => {
    const page = getLearnPageBySlug("how-to-stop-blundering-in-chess");

    render(<LearnArticleRich
        page={page}
        goals={EN_LEARN_GOALS}
        allPages={EN_LEARN_PAGES}
        locale="en"
      />);

    expect(
      screen.getByRole("heading", { name: "What to learn next" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Read this guide/i }),
    ).not.toHaveLength(0);
  });
});
