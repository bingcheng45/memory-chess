import { screen } from "@testing-library/react";

import { render } from "@/test-utils/intl";
import Footer from "@/components/ui/Footer";
import { ENGLISH_ONLY_ROUTES, isEnglishOnlyPath } from "@/lib/seo/englishOnly";
import jaMessages from "../../../../messages/ja.json";

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

test("on an English page, English-only links carry no marker", () => {
  render(<Footer />);

  expect(screen.getByRole("link", { name: /^About$/ })).toHaveAttribute("hreflang", "en");
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
