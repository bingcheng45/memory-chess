/** @jest-environment node */
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import ArticlePage from "@/components/articles/ArticlePage";
import { GERMAN_MESSAGES } from "@/components/articles/__tests__/chromeCatalogues";
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

const TEXT_NODE_MARKER = /<!-- -->/g;
const HIDDEN_ATTRIBUTE = /\shidden(=|\s|>)/;
const HIDING_STYLE = /style="[^"]*(opacity|display|visibility)/;

const article = makeArticle(0);

function serverHtml(locale: string, catalogue: Record<string, unknown>): string {
  return renderToString(
    <NextIntlClientProvider locale={locale} messages={catalogue} timeZone="UTC">
      <ArticlePage article={article} nextArticle={summaryOf(makeArticle(1))} counts={{ views: 2140, likes: 187 }} />
    </NextIntlClientProvider>,
  ).replace(TEXT_NODE_MARKER, "");
}

function wordsIn(html: string, element: RegExp): string {
  return (html.match(element)?.[0] ?? "").replace(/<[^>]+>/g, "");
}

const html = serverHtml("en", messages);

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
    expect(html).not.toMatch(HIDDEN_ATTRIBUTE);
    expect(html).not.toMatch(HIDING_STYLE);
  });

  it("holds the date, the byline, the credit, the count and the drill label in the words they always had", () => {
    expect(wordsIn(html, /<time[\s\S]*?<\/time>/)).toBe("Jan 1, 2026");
    expect(wordsIn(html, /<address[\s\S]*?<\/address>/)).toBe("By Bing Cheng");
    expect(wordsIn(html, /<cite class="mt-1\.5[\s\S]*?<\/cite>/)).toBe(
      "Photo: Fixture Photographer, CC BY 4.0, via Wikimedia Commons. Cropped and resized.",
    );
    expect(html).toContain("2,140 views</span>");
    expect(html).toContain('aria-label="Play 12 pieces, 5 seconds"');
    expect(html).toContain(">Play 12 pieces, 5 seconds</span>");
  });

  it("holds no translation note, since the English article is the original", () => {
    expect(html).not.toContain("data-translation-note");
    expect(html.match(/data-authorship-note/g)).toHaveLength(1);
  });
});

describe("ArticlePage server HTML in a translation", () => {
  const german = serverHtml("de", GERMAN_MESSAGES);

  it("holds the translation note and its link to the English article", () => {
    const note = german.match(/<p[^>]*data-translation-note[^>]*>[\s\S]*?<\/p>/)?.[0] ?? "";
    const link = note.match(/<a[^>]*>/)?.[0] ?? "";

    expect(note).toContain("data-authorship-note");
    expect(wordsIn(note, /[\s\S]+/)).toBe(
      "Mit KI-Unterstützung aus dem Englischen übersetzt. Maßgeblich ist der englische Artikel. Auf Englisch lesen",
    );
    expect(link).toContain('href="/articles/alder-fixture"');
    expect(link).toContain('hrefLang="en"');
  });

  it("holds the date, the byline and the count in German, and every paragraph of the body", () => {
    expect(wordsIn(german, /<time[\s\S]*?<\/time>/)).toBe("1. Jan. 2026");
    expect(wordsIn(german, /<address[\s\S]*?<\/address>/)).toBe("Von Bing Cheng");
    expect(german).toContain("2.140 Aufrufe</span>");
    for (const section of article.sections) {
      for (const paragraph of section.paragraphs) expect(german).toContain(`>${paragraph}</p>`);
    }
  });

  it("hides nothing with an attribute or an inline style", () => {
    expect(german).not.toMatch(HIDDEN_ATTRIBUTE);
    expect(german).not.toMatch(HIDING_STYLE);
  });
});
