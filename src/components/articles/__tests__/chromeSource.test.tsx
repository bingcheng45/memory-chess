import type { ComponentProps, ReactElement } from "react";
import { render } from "@/test-utils/intl";
import ArticleList from "@/components/articles/ArticleList";
import ArticlePage from "@/components/articles/ArticlePage";
import { TOKEN, TOKEN_MESSAGES } from "@/components/articles/__tests__/chromeCatalogues";
import { textOf, withText } from "@/lib/articles/articleText";
import type { Article, ArticleSummary } from "@/lib/articles/schema";
import { makeArticle, makeArticles, markEveryString, summaryOf } from "@/lib/articles/__tests__/fixtures";

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
  usePathname: () => "/articles",
}));

jest.mock("@/components/ui/PageHeader", () => () => null);

const DATA_MARK = "§";
const DATE_LABEL = `${DATA_MARK}date`;
const WORDLESS = /^[\d.,←→]+$/;
const WORDED_ATTRIBUTES = ["aria-label", "alt", "title", "placeholder"];

function markedArticle(index: number): Article {
  const english = makeArticle(index);
  return withText(english, markEveryString(textOf(english), DATA_MARK));
}

function markedSummary(index: number): ArticleSummary {
  return { ...summaryOf(markedArticle(index)), publishedLabel: DATE_LABEL };
}

function wordsShown(ui: ReactElement): string[] {
  const { container } = render(ui, { locale: "de", messages: TOKEN_MESSAGES });
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const words: string[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (node.parentElement?.closest("script") === null) words.push(node.textContent ?? "");
  }
  for (const name of WORDED_ATTRIBUTES) {
    for (const element of container.querySelectorAll(`[${name}]`)) words.push(element.getAttribute(name) ?? "");
  }
  return words.map((word) => word.trim()).filter((word) => word !== "" && !WORDLESS.test(word));
}

function fromNeitherTheCatalogueNorTheArticle(words: readonly string[]): string[] {
  return words.filter((word) => !TOKEN.test(word) && !word.startsWith(DATA_MARK));
}

beforeEach(() => {
  window.history.replaceState(null, "", "/de/articles");
  global.fetch = jest.fn().mockResolvedValue({ status: 200, json: async () => ({ views: 1, likes: 0 }) });
});

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  Reflect.deleteProperty(global, "fetch");
});

describe("where the Articles section gets its words", () => {
  it("takes every word of a translated article page from the catalogue or from the article", () => {
    const words = wordsShown(
      <ArticlePage
        article={markedArticle(0)}
        nextArticle={markedSummary(1)}
        counts={{ views: 2140, likes: 187 }}
      />,
    );

    expect(words).toEqual(
      expect.arrayContaining([
        "«articles.page.backToList»",
        "«articles.page.byline»",
        "«articles.page.authorshipNote»",
        "«articles.page.translationNote»",
        "«articles.page.readInEnglish»",
        "«articles.counts.views»",
        "«articles.like.button»",
        "«articles.page.photoCredit»",
        "«articles.page.factFile»",
        "«articles.page.facts.born»",
        "«articles.page.drillHeading»",
        "«articles.page.drillAction»",
        "«articles.page.sources»",
        "«articles.page.nextArticle»",
        `${DATA_MARK}How Alder rebuilt a board from memory`,
      ]),
    );
    expect(fromNeitherTheCatalogueNorTheArticle(words)).toEqual(["1. Jan. 2026"]);
  });

  it("takes every word of the list from the catalogue or from the articles", () => {
    const stats = { "alder-fixture": { views: 2140, likes: 187 } };
    const words = wordsShown(
      <ArticleList
        articles={makeArticles(12).map((_, index) => markedSummary(index))}
        stats={stats}
        heading={<h1>{`${DATA_MARK}heading`}</h1>}
      />,
    );

    expect(words).toEqual(
      expect.arrayContaining([
        "«articles.sort.label»",
        "«articles.sort.group»",
        "«articles.sort.options.newest»",
        "«articles.sort.options.views»",
        "«articles.sort.options.likes»",
        "«articles.counts.views»",
        "«articles.counts.likes»",
        "«articles.pager.label»",
        "«articles.pager.showing»",
        "«articles.pager.previous»",
        "«articles.pager.page»",
        "«articles.pager.next»",
        DATE_LABEL,
      ]),
    );
    expect(fromNeitherTheCatalogueNorTheArticle(words)).toEqual([]);
  });
});
