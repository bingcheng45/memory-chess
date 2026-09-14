import { screen } from "@testing-library/react";

import { render } from "@/test-utils/intl";
import Footer from "@/components/ui/Footer";
import { ENGLISH_ONLY_ROUTES, isEnglishOnlyPath } from "@/lib/seo/englishOnly";

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
