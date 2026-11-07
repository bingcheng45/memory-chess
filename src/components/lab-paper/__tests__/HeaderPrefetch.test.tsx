import type { ReactNode } from "react";
import { renderWithIntl } from "@/test-utils/intl";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import SiteNav from "@/components/ui/SiteNav";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, prefetch, children, ...rest }: { href: string; prefetch?: boolean; children?: ReactNode }) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  usePathname: () => "/",
}));

jest.mock("@/components/ui/LanguageSettings", () => function MockLanguageSettings() {
  return null;
});

jest.mock("@/lib/articles/translatedLocales");

const prefetchByHref = (container: HTMLElement) => {
  const byHref = new Map<string, Set<string>>();
  container.querySelectorAll<HTMLAnchorElement>("a[data-prefetch]").forEach((a) => {
    const href = a.getAttribute("href")?.split("?")[0] ?? "";
    byHref.set(href, (byHref.get(href) ?? new Set()).add(a.dataset.prefetch ?? ""));
  });
  return Object.fromEntries(Array.from(byHref, ([href, values]) => [href, [...values].sort()]));
};

const EXPECTED = {
  "/": ["false"],
  "/game": ["undefined"],
  "/learn": ["false"],
  "/articles": ["false"],
  "/leaderboard": ["false"],
  "/dashboard": ["false"],
  "/about": ["false"],
  "/changelog": ["false"],
};

describe("header link prefetching", () => {
  it("prefetches only the links to the game from the site header and its menu", () => {
    const { container } = renderWithIntl(<LabPaperHeader />);

    expect(prefetchByHref(container)).toEqual(EXPECTED);
  });

  it("prefetches only the link to the game from the page navigation row", () => {
    const { container } = renderWithIntl(<SiteNav />);

    expect(prefetchByHref(container)).toEqual({
      "/game": ["undefined"],
      "/learn": ["false"],
      "/articles": ["false"],
      "/leaderboard": ["false"],
      "/dashboard": ["false"],
      "/about": ["false"],
    });
  });
});
