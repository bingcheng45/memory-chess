/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ArticleList from "@/components/articles/ArticleList";
import { makeArticles, summaryOf } from "@/lib/articles/__tests__/fixtures";
import type { ArticleStats } from "@/lib/articles/stats";
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

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/articles",
}));

jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

const STATS: ArticleStats = {
  "alder-fixture": { views: 20, likes: 9 },
  "birch-fixture": { views: 900, likes: 0 },
  "cedar-fixture": { views: 300, likes: 31 },
};
const HIDING = /(?<![-\w])(hidden|invisible)(?![-\w])|display:\s*none|visibility:\s*hidden|opacity:\s*0(?![.\d])/;

const html = renderToString(
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <ArticleList articles={makeArticles(3).map(summaryOf)} stats={STATS} heading={<h1>Articles</h1>} />
  </NextIntlClientProvider>,
);
const list = /<ol[^>]*>[\s\S]*<\/ol>/.exec(html)?.[0] ?? "";

describe("ArticleList server HTML", () => {
  it("lists every card newest first, whatever the counts say", () => {
    const served = Array.from(list.matchAll(/data-article-card="([^"]+)"/g), ([, slug]) => slug);

    expect(served).toEqual(["alder-fixture", "birch-fixture", "cedar-fixture"]);
  });

  it("hides nothing", () => {
    expect(list).not.toBe("");
    expect(list).not.toMatch(HIDING);
  });

  it("gives each card its rank under most viewed and most liked, for the first paint of a sorted address", () => {
    const ranks = Array.from(list.matchAll(/<li style="([^"]*)"/g), ([, style]) => style);

    expect(list).toMatch(/^<ol data-article-list=/);
    expect(ranks).toEqual([
      "--rank-views:2;--rank-likes:1",
      "--rank-views:0;--rank-likes:2",
      "--rank-views:1;--rank-likes:0",
    ]);
  });
});
