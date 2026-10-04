import type { ComponentProps } from "react";
import { render, screen, within } from "@/test-utils/intl";
import ArticlePage from "@/components/articles/ArticlePage";
import { GERMAN_MESSAGES } from "@/components/articles/__tests__/chromeCatalogues";
import type { Article } from "@/lib/articles/schema";
import type { ArticleCounts } from "@/lib/articles/stats";
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

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/articles/alder-fixture",
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

const ENGLISH_CHROME = [
  "All articles",
  "By ",
  "Researched and drafted",
  "Photo:",
  ", via ",
  "Fact file",
  "Born",
  "Country",
  "Known for",
  "Memory feat",
  "Your turn",
  "Play 12 pieces, 5 seconds",
  "Sources",
  "Next article",
  "views",
  "Like this article",
  "Translated from English",
  "Read it in English",
];
const COUNTS: ArticleCounts = { views: 2140, likes: 187 };

const article = makeArticle(0);
const next = summaryOf(makeArticle(1));

function renderGerman(shown: Article = article) {
  return render(<ArticlePage article={shown} nextArticle={next} counts={COUNTS} />, {
    locale: "de",
    messages: GERMAN_MESSAGES,
  });
}

function graphOf(container: HTMLElement): Record<string, unknown>[] {
  return JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}")["@graph"];
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ status: 200, json: async () => COUNTS });
});

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  Reflect.deleteProperty(global, "fetch");
});

describe("ArticlePage under a German catalogue", () => {
  it("prints the heading block in German, with the date in German", () => {
    const { container } = renderGerman();
    const header = container.querySelector("article header") as HTMLElement;

    expect(screen.getByRole("link", { name: /Alle Artikel/ })).toHaveAttribute("href", "/de/articles");
    expect(header.querySelector("time")).toHaveTextContent("1. Jan. 2026");
    expect(header.querySelector("address[data-article-byline]")).toHaveTextContent(/^Von\s+Bing Cheng$/);
    expect(header.querySelector("[data-authorship-note]")).toHaveTextContent(
      "Mit KI-Unterstützung aus den unten genannten Quellen recherchiert und entworfen.",
    );
    expect(within(header).getByText("2.140 Aufrufe")).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "Artikel empfehlen" })).toHaveTextContent(/^187$/);
  });

  it("prints the credit, the fact file, the drill, the sources and the next link in German", () => {
    const { container } = renderGerman();

    expect(container.querySelector("figure cite")).toHaveTextContent(
      "Foto: Fixture Photographer, CC BY 4.0, über Wikimedia Commons. Cropped and resized.",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Steckbrief" })).toBeInTheDocument();
    expect(Array.from(container.querySelectorAll("dl dt"), (term) => term.textContent)).toEqual([
      "Geboren",
      "Land",
      "Bekannt für",
      "Gedächtnisleistung",
    ]);
    expect(container.querySelector("a[data-article-drill]")).toHaveAccessibleName("12 Figuren, 5 Sekunden spielen");
    expect(container.querySelector("a[data-article-drill]")).toHaveTextContent("Du bist dran");
    expect(screen.getByRole("heading", { level: 2, name: "Quellen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(next.title) })).toHaveTextContent("Nächster Artikel");
  });

  it("labels all eight facts in German, in the order the file shows them", () => {
    const full = makeArticle(3, {
      facts: {
        memoryFeat: "Feat",
        knownFor: "Known",
        worldChampion: "1927 to 1935",
        peakRating: "2700 (1990)",
        title: "Grandmaster, 1950",
        country: "Homeland",
        died: "1 Jan 1990, aged 90",
        born: "1 Jan 1900, Town",
      },
    });
    const { container } = renderGerman(full);

    expect(Array.from(container.querySelectorAll("dl dt"), (term) => term.textContent)).toEqual([
      "Geboren",
      "Gestorben",
      "Land",
      "Titel",
      "Höchste Wertung",
      "Weltmeister",
      "Bekannt für",
      "Gedächtnisleistung",
    ]);
  });

  it("counts one piece and one second in the singular", () => {
    const { container } = renderGerman(
      makeArticle(0, { drill: { ...article.drill, pieceCount: 1, memorizeTime: 1 } }),
    );

    expect(container.querySelector("a[data-article-drill]")).toHaveAccessibleName("1 Figur, 1 Sekunde spielen");
  });

  it("shows none of the English labels", () => {
    const { container } = renderGerman();
    const shown = [
      container.querySelector("main")?.textContent ?? "",
      ...Array.from(container.querySelectorAll("[aria-label]"), (node) => node.getAttribute("aria-label") ?? ""),
    ].join("\n");

    expect(shown).toContain("Alle Artikel");
    for (const english of ENGLISH_CHROME) expect(shown).not.toContain(english);
  });
});

describe("ArticlePage in a translation", () => {
  it("says it is a translation directly under the authorship note, with a link to the English article", () => {
    const { container } = renderGerman();
    const notes = container.querySelectorAll("[data-authorship-note]");
    const translationNote = container.querySelector<HTMLElement>("[data-translation-note]")!;
    const link = within(translationNote).getByRole("link", { name: "Auf Englisch lesen" });

    expect(notes).toHaveLength(2);
    expect(notes[0].nextElementSibling).toBe(translationNote);
    expect(notes[1]).toBe(translationNote);
    expect(translationNote.tagName).toBe("P");
    expect(translationNote).toHaveTextContent(
      "Mit KI-Unterstützung aus dem Englischen übersetzt. Maßgeblich ist der englische Artikel. Auf Englisch lesen",
    );
    expect(link).toHaveAttribute("href", "/articles/alder-fixture");
    expect(link).toHaveAttribute("hreflang", "en");
  });

  it("marks each source title as English, since it is never translated, and leaves the translated photo credit alone", () => {
    const { container } = renderGerman();
    const sources = screen.getByRole("heading", { level: 2, name: "Quellen" }).closest("section") as HTMLElement;

    expect(Array.from(sources.querySelectorAll("cite"), (cite) => [cite.textContent, cite.getAttribute("lang")])).toEqual([
      ["Alder source one", "en"],
      ["Alder source two", "en"],
      ["Alder source three", "en"],
    ]);
    expect(container.querySelector("figure cite")).not.toHaveAttribute("lang");
  });

  it("puts no lang on a source title of the English page, which is already English", () => {
    render(<ArticlePage article={article} nextArticle={next} counts={COUNTS} />);
    const sources = screen.getByRole("heading", { level: 2, name: "Sources" }).closest("section") as HTMLElement;

    expect(Array.from(sources.querySelectorAll("cite"), (cite) => [cite.textContent, cite.hasAttribute("lang")])).toEqual([
      ["Alder source one", false],
      ["Alder source two", false],
      ["Alder source three", false],
    ]);
  });

  it("sends the byline straight to the English About page, which has no translation", () => {
    const { container } = renderGerman();
    const author = within(container.querySelector<HTMLElement>("address[data-article-byline]")!).getByRole("link", {
      name: "Bing Cheng",
    });

    expect(author).toHaveAttribute("href", "/about");
    expect(author).toHaveAttribute("hreflang", "en");
  });

  it("describes the German page in its structured data, under the German name of the list", () => {
    const { container } = renderGerman();
    const graph = graphOf(container);
    const crumbs = graph.find((node) => node["@type"] === "BreadcrumbList")?.itemListElement;

    expect(graph.find((node) => node["@type"] === "Article")).toMatchObject({
      "@id": "https://thememorychess.com/de/articles/alder-fixture#article",
      inLanguage: "de",
    });
    expect(crumbs).toEqual([
      { "@type": "ListItem", position: 1, name: "Artikel", item: "https://thememorychess.com/de/articles" },
      {
        "@type": "ListItem",
        position: 2,
        name: article.title,
        item: "https://thememorychess.com/de/articles/alder-fixture",
      },
    ]);
  });
});
