import { screen } from "@testing-library/react";

import { render } from "@/test-utils/intl";
import Footer from "@/components/ui/Footer";
import { ENGLISH_ONLY_PATHS } from "@/lib/seo/englishOnly";

/**
 * The footer mixes two link kinds. A localized route keeps the reader's locale;
 * an English-only route has exactly one URL and must point at it directly.
 * Routing prefixes English as-needed, so locale="en" would emit /en/about and
 * take a 307 to get there, and the locale-aware default would emit /de/about.
 */
function hrefFor(name: RegExp): string {
  return screen.getByRole("link", { name }).getAttribute("href") ?? "";
}

test("English-only pages link to their bare canonical URL", () => {
  render(<Footer />);

  expect(hrefFor(/^About$/)).toBe("/about");
  expect(hrefFor(/^Privacy$/)).toBe("/privacy");
  expect(hrefFor(/^Terms$/)).toBe("/terms");
});

test("localized pages keep the locale-aware link", () => {
  render(<Footer />);

  for (const name of [/^Learn$/, /^Changelog$/, /^Contact Us$/]) {
    const href = hrefFor(name);
    expect(ENGLISH_ONLY_PATHS.has(href)).toBe(false);
    expect(href.startsWith("/")).toBe(true);
  }
});

test("every English-only path in the shared set is reachable from the footer", () => {
  render(<Footer />);

  const hrefs = screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));

  for (const path of ENGLISH_ONLY_PATHS) {
    expect(hrefs).toContain(path);
  }
});
