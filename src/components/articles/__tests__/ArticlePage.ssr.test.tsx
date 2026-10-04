/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ArticlePage from "@/components/articles/ArticlePage";
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
  usePathname: () => "/articles/alder-fixture",
}));

jest.mock("@/components/ui/PageHeader", () => {
  function MockPageHeader() {
    return <div>PageHeader</div>;
  }

  return MockPageHeader;
});

const article = makeArticle(0);
const html = renderToString(
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <ArticlePage article={article} nextArticle={summaryOf(makeArticle(1))} />
  </NextIntlClientProvider>,
);

describe("ArticlePage server HTML", () => {
  it("holds every heading and paragraph as plain text", () => {
    for (const section of article.sections) {
      expect(html).toContain(`>${section.heading}</h2>`);
      for (const paragraph of section.paragraphs) {
        expect(html).toContain(`>${paragraph}</p>`);
      }
    }
  });

  it("holds no text waiting to be typed, no caret and no Show all text button", () => {
    expect(html).not.toContain("article-untyped");
    expect(html).not.toContain("article-caret");
    expect(html).not.toContain("Show all text");
    expect(html).toContain('data-article-typing="idle"');
  });

  it("holds the portrait with no inline background, since a direct load has no card to borrow from", () => {
    const portrait = html.match(/<img[^>]*data-flight="portrait"[^>]*>/)?.[0];

    expect(portrait).toContain(`alt="${article.photo.alt}"`);
    expect(portrait).toContain('style="color:transparent"');
    expect(html).not.toContain("background");
  });

  it("hides nothing with an attribute or an inline style", () => {
    expect(html).not.toMatch(/\shidden(=|\s|>)/);
    expect(html).not.toMatch(/style="[^"]*(opacity|display|visibility)/);
  });
});
