import { screen } from "@testing-library/react";

import { render } from "@/test-utils/intl";
import Footer from "@/components/ui/Footer";
import { ENGLISH_ONLY_ROUTES, isEnglishOnlyPath } from "@/lib/seo/englishOnly";
import deMessages from "../../../../messages/de.json";
import jaMessages from "../../../../messages/ja.json";

jest.mock("@/lib/articles/translatedLocales", () => {
  const TRANSLATED_ARTICLE_LOCALES = ["en", "de"];
  return {
    TRANSLATED_ARTICLE_LOCALES,
    servesArticlesIn: (locale: string) => TRANSLATED_ARTICLE_LOCALES.includes(locale),
  };
});

/**
 * The footer mixes two link kinds. A localized route keeps the reader's locale;
 * an English-only route has exactly one URL and must point at it directly.
 * Routing prefixes English as-needed, so locale="en" would emit /en/about and
 * take a redirect to get there, and the locale-aware default would emit
 * /de/about.
 */
function hrefFor(name: RegExp): string {
  return screen.getByRole("link", { name }).getAttribute("href") ?? "";
}

test("English-only pages link to their bare canonical URL", () => {
  render(<Footer />);

  expect(hrefFor(/^About$/)).toBe("/about");
  expect(hrefFor(/^Privacy$/)).toBe("/privacy");
  expect(hrefFor(/^Terms$/)).toBe("/terms");
  expect(hrefFor(/^Learn$/)).toBe("/learn");
  expect(hrefFor(/^Articles$/)).toBe("/articles");
  expect(hrefFor(/^Changelog$/)).toBe("/changelog");
});

test("on a translated page, English-only links say they are in English", () => {
  const { container } = render(<Footer />, { locale: "ja", messages: jaMessages });

  for (const route of ENGLISH_ONLY_ROUTES) {
    const link = container.querySelector(`a[href="${route}"]`);
    expect(link).toHaveAttribute("hreflang", "en");
    expect(link?.textContent).toMatch(/ \(English\)$/);
  }

  const contact = container.querySelector('a[href="/ja/contact-us"]');
  expect(contact).not.toHaveAttribute("hreflang");
  expect(contact?.textContent).not.toContain("English");
});

test("in a locale the articles are not translated into, Articles links to the English list and says so", () => {
  const { container } = render(<Footer />, { locale: "ja", messages: jaMessages });

  const articles = container.querySelector('a[href="/articles"]');
  expect(articles).toHaveAttribute("hreflang", "en");
  expect(articles).toHaveTextContent(/^記事 \(English\)$/);
  expect(container.querySelector('a[href="/ja/articles"]')).not.toBeInTheDocument();
});

test("in a locale the articles are translated into, Articles keeps the locale and carries no marker", () => {
  const { container } = render(<Footer />, { locale: "de", messages: deMessages });

  const articles = container.querySelector('a[href="/de/articles"]');
  expect(articles).toHaveTextContent(/^Artikel$/);
  expect(articles).not.toHaveAttribute("hreflang");
  expect(container.querySelector('a[href="/articles"]')).not.toBeInTheDocument();
  expect(container.querySelector('a[href="/about"]')).toHaveTextContent(/^Über \(English\)$/);
});

test("on an English page, English-only links and Articles carry no marker", () => {
  render(<Footer />);

  expect(screen.getByRole("link", { name: /^About$/ })).toHaveAttribute("hreflang", "en");
  expect(screen.getByRole("link", { name: /^Articles$/ })).toHaveAttribute("hreflang", "en");
  expect(screen.queryByText(/\(English\)/)).not.toBeInTheDocument();
});

test("localized pages keep the locale-aware link", () => {
  render(<Footer />);

  const href = hrefFor(/^Contact Us$/);
  expect(isEnglishOnlyPath(href)).toBe(false);
  expect(href.startsWith("/")).toBe(true);
});

test("every English-only route is reachable from the footer", () => {
  render(<Footer />);

  const hrefs = screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  for (const route of ENGLISH_ONLY_ROUTES) {
    expect(hrefs).toContain(route);
  }
});

test("Articles sits right after Learn", () => {
  render(<Footer />);

  const labels = screen.getAllByRole("link").map((link) => link.textContent);
  const learn = labels.indexOf("Learn");

  expect(learn).toBeGreaterThanOrEqual(0);
  expect(labels[learn + 1]).toBe("Articles");
});
