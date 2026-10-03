import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ComponentProps } from "react";
import { render } from "@/test-utils/intl";
import ArticlePage from "@/components/articles/ArticlePage";
import type { Article } from "@/lib/articles/schema";
import {
  FIXTURE_COUNT,
  MIN_OWN_SECTIONS,
  SHARED_DRILL_SENTENCE,
  SHARED_PHOTO_AUTHOR,
  makeArticles,
  summaryOf,
} from "@/lib/articles/__tests__/fixtures";

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

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

const AUDIT_URL = pathToFileURL(join(process.cwd(), "scripts", "audit-adsense.mjs")).href;
const SITE_RULES = ["boilerplate", "heading-template", "near-duplicate"] as const;
const SHARED_HEADINGS = ["Fact file", "Sources"];
const SHARED_DATE = "2026-01-01T00:00:00.000Z";
const SAME_SENTENCE = "<p>This plain sentence repeats on four pages.</p>";
const PAGES_THAT_TRIP_THE_REPEAT_RULE = 4;

// Jest cannot load the audit script, which is an ES module, so it runs in a
// Node child process that reads the rendered pages from stdin.
const AUDIT_PROGRAM = `
  import { readFileSync } from "node:fs";
  const audit = await import(${JSON.stringify(AUDIT_URL)});
  const pages = JSON.parse(readFileSync(0, "utf8")).map(({ url, html }) => audit.parsePage(url, 200, html));
  const problems = Object.fromEntries(${JSON.stringify(SITE_RULES)}.map((id) => [
    id,
    Object.fromEntries(audit.RULES.find((rule) => rule.id === id).site(pages, { listed: new Set() })),
  ]));
  process.stdout.write(JSON.stringify({
    pages: pages.map(({ url, hiddenWords, h1Count, mainWords, headings }) => ({ url, hiddenWords, h1Count, mainWords, headings })),
    problems,
  }));
`;

type RenderedPage = { url: string; html: string };
type AuditedPage = { url: string; hiddenWords: number; h1Count: number; mainWords: number; headings: string[] };
type AuditReport = {
  pages: AuditedPage[];
  problems: Record<(typeof SITE_RULES)[number], Record<string, string[]>>;
};

function auditInChildProcess(pages: RenderedPage[]): AuditReport {
  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", AUDIT_PROGRAM], {
      encoding: "utf8",
      input: JSON.stringify(pages),
    }),
  );
}

function renderedHtmlOf(article: Article, nextArticle: Article): string {
  const { container, unmount } = render(
    <ArticlePage article={article} nextArticle={summaryOf(nextArticle)} />,
  );
  const html = container.innerHTML;
  unmount();
  return html;
}

function pagesFor(articles: Article[]): RenderedPage[] {
  return articles.map((article, index) => ({
    url: `http://127.0.0.1:4517/articles/${article.slug}`,
    html: renderedHtmlOf(article, articles[(index + 1) % articles.length]),
  }));
}

const sameDay = (articles: Article[]) =>
  articles.map((article) => ({ ...article, publishedAt: SHARED_DATE, updatedAt: SHARED_DATE }));
const withSections = (articles: Article[], count: number) =>
  articles.map((article) => ({ ...article, sections: article.sections.slice(0, count) }));

describe("thirteen articles under the AdSense audit", () => {
  const articles = sameDay(makeArticles(FIXTURE_COUNT));
  let report: AuditReport;

  beforeAll(() => {
    report = auditInChildProcess(pagesFor(articles));
  });

  it("audits all thirteen, each with real text, one h1 and nothing hidden", () => {
    expect(report.pages).toHaveLength(13);
    for (const page of report.pages) {
      expect(page.h1Count).toBe(1);
      expect(page.hiddenWords).toBe(0);
      expect(page.mainWords).toBeGreaterThan(100);
    }
  });

  it("stamps no sentence across pages, though the credit, byline, note, date and drill sentence are identical on all thirteen", () => {
    for (const article of articles) {
      expect(article.drill.why).toBe(SHARED_DRILL_SENTENCE);
      expect(article.photo.author).toBe(SHARED_PHOTO_AUTHOR);
      expect(article.publishedAt).toBe(SHARED_DATE);
    }
    expect(report.problems.boilerplate).toEqual({});
  });

  it("keeps Fact file and Sources as h2 headings without forming a template", () => {
    for (const page of report.pages) {
      expect(page.headings).toEqual(expect.arrayContaining(SHARED_HEADINGS));
      expect(page.headings).toHaveLength(articles[0].sections.length + SHARED_HEADINGS.length);
    }
    expect(report.problems["heading-template"]).toEqual({});
  });

  it("reads the pages as distinct", () => {
    expect(report.problems["near-duplicate"]).toEqual({});
  });
});

describe("the two shared headings against short articles", () => {
  it(`still pass with ${MIN_OWN_SECTIONS} sections of an article's own`, () => {
    const report = auditInChildProcess(pagesFor(withSections(makeArticles(FIXTURE_COUNT), MIN_OWN_SECTIONS)));

    expect(report.problems["heading-template"]).toEqual({});
  });

  it(`fail with ${MIN_OWN_SECTIONS - 1}, which is why an entry needs at least ${MIN_OWN_SECTIONS}`, () => {
    const report = auditInChildProcess(pagesFor(withSections(makeArticles(FIXTURE_COUNT), MIN_OWN_SECTIONS - 1)));

    expect(Object.keys(report.problems["heading-template"])).toHaveLength(FIXTURE_COUNT);
  });
});

describe("the audit harness itself", () => {
  it("flags a plain sentence repeated on four pages, so a clean result means something", () => {
    const pages = pagesFor(makeArticles(PAGES_THAT_TRIP_THE_REPEAT_RULE)).map((page) => ({
      ...page,
      html: page.html + SAME_SENTENCE,
    }));
    const report = auditInChildProcess(pages);

    expect(Object.keys(report.problems.boilerplate)).toHaveLength(PAGES_THAT_TRIP_THE_REPEAT_RULE);
  });
});
