/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ArticleCard from "@/components/articles/ArticleCard";
import { makeArticle, summaryOf } from "@/lib/articles/__tests__/fixtures";
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
}));

const html = renderToString(
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <ul>
      <ArticleCard article={summaryOf(makeArticle(0))} priority />
    </ul>
  </NextIntlClientProvider>,
);

describe("ArticleCard server HTML", () => {
  it("carries the parts a transition moves", () => {
    expect(html).toContain('data-flight="portrait"');
    expect(html).toContain('data-flight="title"');
    expect(html).toContain('data-flight="date"');
  });

  it("names none of them at rest, by attribute or by inline style", () => {
    expect(html).not.toContain("data-article-flight");
    expect(html).not.toContain("view-transition-name");
  });
});
