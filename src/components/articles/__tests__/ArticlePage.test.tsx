import type { ComponentProps } from "react";
import { render, screen, within } from "@/test-utils/intl";
import ArticlePage from "@/components/articles/ArticlePage";
import { ARTICLE_COPY } from "@/lib/articles/copy";
import { FACT_ROWS, type Article } from "@/lib/articles/schema";
import { buildArticleStructuredData } from "@/lib/articles/structuredData";
import { makeArticle, summaryOf } from "@/lib/articles/__tests__/fixtures";

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

  return MockPageHeader;
});

const article = makeArticle(0);
const next = summaryOf(makeArticle(1));

function renderPage(shown: Article = article) {
  return render(<ArticlePage article={shown} nextArticle={next} />);
}

describe("ArticlePage heading block", () => {
  it("has one h1, the title", () => {
    renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(article.title);
  });

  it("shows the published date and the description", () => {
    const { container } = renderPage();
    const time = container.querySelector("header time");

    expect(time).toHaveAttribute("datetime", article.publishedAt);
    expect(time).toHaveTextContent("Jan 1, 2026");
    expect(within(container.querySelector("header")!).getByText(article.description)).toBeInTheDocument();
  });

  it("prints the byline, then the authorship note, the way Learn does", () => {
    const { container } = renderPage();
    const byline = container.querySelector("address[data-article-byline]");
    const note = container.querySelector("[data-authorship-note]");

    expect(byline).toHaveTextContent(/^By\s+Bing Cheng$/);
    expect(within(byline as HTMLElement).getByRole("link", { name: "Bing Cheng" })).toHaveAttribute("href", "/about");
    expect(note).toHaveTextContent(
      "Researched and drafted with AI assistance from the sources listed below. Every fact was checked against those sources before publication.",
    );
    expect(note?.textContent).toBe(ARTICLE_COPY.authorshipNote);
    expect(byline?.nextElementSibling).toBe(note);
  });

  it("links back to the list", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /All articles/ })).toHaveAttribute("href", "/articles");
  });
});

describe("ArticlePage portrait and credit", () => {
  it("shows the portrait eagerly with the person's name and role as its caption", () => {
    const { container } = renderPage();
    const figure = container.querySelector("figure")!;
    const portrait = within(figure).getByRole("img", { name: article.photo.alt });

    expect(portrait.getAttribute("loading")).not.toBe("lazy");
    expect(figure.querySelector("figcaption")).toHaveTextContent(article.person.name);
    expect(figure.querySelector("figcaption")).toHaveTextContent(article.person.role);
  });

  it("puts the whole credit inside one cite: author, licence link, source link, changes", () => {
    const { container } = renderPage();
    const figure = container.querySelector("figure")!;
    const cite = figure.querySelector("cite")!;

    expect(figure.querySelectorAll("cite")).toHaveLength(1);
    expect(figure.lastElementChild?.tagName).toBe("FIGCAPTION");
    expect(cite.parentElement).toBe(figure.lastElementChild);
    expect(cite).toHaveTextContent(article.photo.author);
    expect(cite).toHaveTextContent(article.photo.changes);
    expect(within(cite).getByRole("link", { name: article.photo.license })).toHaveAttribute(
      "href",
      article.photo.licenseUrl,
    );
    expect(within(cite).getByRole("link", { name: "Wikimedia Commons" })).toHaveAttribute(
      "href",
      article.photo.sourceUrl,
    );
    for (const link of within(cite).getAllByRole("link")) {
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("target", "_blank");
    }

    const outsideCiteAndCaption = Array.from(figure.querySelectorAll("*"))
      .filter((node) => !node.closest("cite") && !node.closest("figcaption"))
      .flatMap((node) => Array.from(node.childNodes))
      .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    expect(outsideCiteAndCaption).toEqual([]);
  });

  it("names a public-domain licence as plain text, since there is no licence text to link", () => {
    const publicDomain = makeArticle(2, {
      photo: { ...makeArticle(2).photo, license: "Public domain", licenseUrl: null },
    });
    const { container } = renderPage(publicDomain);
    const cite = container.querySelector("figure cite")!;

    expect(cite).toHaveTextContent("Public domain");
    expect(within(cite as HTMLElement).getAllByRole("link")).toHaveLength(1);
  });
});

describe("ArticlePage fact file", () => {
  const labels = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("dl dt")).map((term) => term.textContent);
  const values = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("dl dd")).map((value) => value.textContent);

  it("is headed Fact file", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 2, name: "Fact file" })).toBeInTheDocument();
  });

  it("skips the facts a person does not have", () => {
    const { container } = renderPage();

    expect(labels(container)).toEqual(["Born", "Country", "Known for", "Memory feat"]);
    expect(values(container)).toEqual([
      article.facts.born,
      article.facts.country,
      article.facts.knownFor,
      article.facts.memoryFeat,
    ]);
  });

  it("shows every fact in FACT_ROWS order when all are present", () => {
    const full = makeArticle(3, {
      facts: {
        memoryFeat: "Feat",
        knownFor: "Known",
        worldChampion: "1927 to 1935",
        peakRating: "2700 (1990)",
        title: "Grandmaster, 1950",
        country: "Country",
        died: "1 Jan 1990, aged 90",
        born: "1 Jan 1900, Town",
      },
    });
    const { container } = renderPage(full);

    expect(labels(container)).toEqual(FACT_ROWS.map((row) => row.label));
    expect(values(container)).toEqual(FACT_ROWS.map((row) => full.facts[row.key]));
  });
});

describe("ArticlePage body", () => {
  it("renders every section heading and paragraph in order as plain text", () => {
    const { container } = renderPage();
    const body = container.querySelector("[data-article-body]")!;

    expect(Array.from(body.querySelectorAll("h2")).map((heading) => heading.textContent)).toEqual(
      article.sections.map((section) => section.heading),
    );
    expect(Array.from(body.querySelectorAll("p")).map((paragraph) => paragraph.textContent)).toEqual(
      article.sections.flatMap((section) => section.paragraphs),
    );
    for (const paragraph of body.querySelectorAll("p")) {
      expect(paragraph.children).toHaveLength(0);
    }
  });

  it("ends on one drill link built from the drill, carrying its sentence", () => {
    const { container } = renderPage();
    const drill = container.querySelectorAll('a[href^="/game"]');

    expect(drill).toHaveLength(1);
    expect(drill[0]).toHaveAttribute("href", "/game?pieceCount=12&memorizeTime=5");
    expect(drill[0]).toHaveAttribute("data-article-drill");
    expect(drill[0]).toHaveTextContent(article.drill.why);
    expect(drill[0]).toHaveTextContent("Play 12 pieces, 5 seconds");
    expect(drill[0]).toHaveAccessibleName("Play 12 pieces, 5 seconds");
  });

  it("lists every source as a cited link with its note", () => {
    renderPage();
    const heading = screen.getByRole("heading", { level: 2, name: "Sources" });
    const items = within(heading.closest("section")!).getAllByRole("listitem");

    expect(items).toHaveLength(article.sources.length);
    article.sources.forEach((source, index) => {
      const link = within(items[index]).getByRole("link", { name: source.title });
      expect(link).toHaveAttribute("href", source.url);
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.closest("cite")).not.toBeNull();
      expect(items[index]).toHaveTextContent(source.note);
    });
  });

  it("links to the next article when there is one", () => {
    renderPage();
    const link = screen.getByRole("link", { name: new RegExp(next.title) });

    expect(link).toHaveAttribute("href", `/articles/${next.slug}`);
    expect(link).toHaveTextContent("Next article");
  });

  it("shows no next link for the only article", () => {
    render(<ArticlePage article={article} />);

    expect(screen.queryByText("Next article")).not.toBeInTheDocument();
  });
});

describe("ArticlePage markup", () => {
  const classTokens = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("[class]")).flatMap((node) =>
      (node.getAttribute("class") ?? "").split(/\s+/),
    );

  it("emits the structured data for the article", () => {
    const { container } = renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(JSON.parse(script?.textContent ?? "null")).toEqual(
      JSON.parse(JSON.stringify(buildArticleStructuredData(article))),
    );
  });

  it("names in its breadcrumb only what the page shows, the list its back link opens and the title", () => {
    const { container } = renderPage();
    const graph: Record<string, unknown>[] = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}",
    )["@graph"];
    const crumbs = graph.find((node) => node["@type"] === "BreadcrumbList")?.itemListElement as {
      name: string;
      item: string;
    }[];

    expect(crumbs.map((crumb) => new URL(crumb.item).pathname)).toEqual([
      screen.getByRole("link", { name: /All articles/ }).getAttribute("href"),
      `/articles/${article.slug}`,
    ]);
    expect(crumbs[1].name).toBe(screen.getByRole("heading", { level: 1 }).textContent);
  });

  it("puts the title before every other heading in the document", () => {
    const { container } = renderPage();
    const headings = Array.from(container.querySelectorAll("h1, h2, h3, h4, h5, h6"));

    expect(headings[0].tagName).toBe("H1");
  });

  it("shows the phone in the order portrait, heading, fact file, body, set by grid rows", () => {
    const { container } = renderPage();
    const rowOf = (selector: string) =>
      Array.from(container.querySelector(selector)?.classList ?? []).filter((token) => token.startsWith("row-start-"));

    expect(rowOf("figure")).toEqual(["row-start-1"]);
    expect(rowOf("article > header")).toEqual(["row-start-2"]);
    expect(rowOf("[data-article-rail] > section")).toEqual(["row-start-3"]);
    expect(rowOf("article > div:last-child")).toEqual(["row-start-4"]);
    expect(classTokens(container).filter((token) => /(^|:)!?-?\[?order[-:]/.test(token))).toEqual([]);
  });

  it("marks the rail the sticky rule looks for, holding the portrait and the fact file", () => {
    const { container } = renderPage();
    const rail = container.querySelector("[data-article-rail]");

    expect(rail?.querySelector("figure img")).not.toBeNull();
    expect(rail?.querySelector("dl")).not.toBeNull();
    expect(rail?.querySelector("h1")).toBeNull();
  });

  it("runs no transition that a reduced-motion setting leaves on", () => {
    const { container } = renderPage();
    const transitioning = Array.from(container.querySelectorAll("[class]")).filter((node) =>
      Array.from(node.classList).some((token) => /(^|:)transition(-|$)/.test(token)),
    );

    expect(transitioning.length).toBeGreaterThan(0);
    for (const node of transitioning) expect(node).toHaveClass("motion-reduce:transition-none");
  });

  it("hides nothing at any width", () => {
    const { container } = renderPage();

    expect(classTokens(container).filter((token) => /(^|:)(hidden|invisible|opacity-0|sr-only)$/.test(token))).toEqual([]);
    expect(container.querySelectorAll("[hidden], [style*='opacity'], [style*='display'], [style*='visibility']")).toHaveLength(0);
  });
});
