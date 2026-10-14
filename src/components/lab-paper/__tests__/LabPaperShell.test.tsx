import type { AnchorHTMLAttributes } from "react";
import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import SiteFooter from "@/components/lab-paper/SiteFooter";
import ChangelogBanner from "@/components/ui/ChangelogBanner";
import { CHANGELOG_DISMISSAL_STORAGE_KEY, LATEST_CHANGELOG_ENTRY } from "@/lib/changelog";
import deMessages from "../../../../messages/de.json";

let mockPathname = "/";
jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => mockPathname,
}));
let mockSegments: string[] | null = null;
jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useSelectedLayoutSegments: () => mockSegments,
}));
jest.mock("@/lib/articles/translatedLocales");

const BANNER_NAME = new RegExp(`Memory Chess v${LATEST_CHANGELOG_ENTRY.version.replaceAll(".", "\\.")} is here`);

beforeEach(() => {
  mockPathname = "/";
  mockSegments = null;
  jest.useFakeTimers();
  jest.setSystemTime(new Date(Date.parse(LATEST_CHANGELOG_ENTRY.publishedAt) + 24 * 60 * 60 * 1000));
  window.localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("the footer the locale layout renders", () => {
  it("is the Lab Paper footer on a Lab Paper route, with the site's links, the light awards, X and the copyright", () => {
    const { container } = renderWithIntl(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");

    expect(footer.closest(".lab-paper")).not.toBeNull();
    expect(container.firstElementChild).toHaveAttribute("data-below-game");
    expect(within(footer).getByText("A free board-memory game. Study a position, rebuild it, read the number.")).toBeInTheDocument();
    expect(
      within(screen.getByRole("navigation", { name: "Site" }))
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual([
      ["Learn", "/learn"],
      ["Articles", "/articles"],
      ["About", "/about"],
      ["Changelog", "/changelog"],
      ["Contact us", "/contact-us"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ]);
    expect(within(footer).getByText("Recognition")).toBeInTheDocument();
    expect(within(footer).getAllByRole("img").map((badge) => new URL(badge.getAttribute("src")!).searchParams.get("theme"))).toEqual([
      "light",
      "light",
    ]);
    expect(within(footer).getByRole("link", { name: "Follow us on Twitter/X" })).toHaveAttribute("href", "https://x.com/TheMemoryChess");
    expect(within(footer).getByText(`© ${new Date().getFullYear()} Memory Chess. All rights reserved.`)).toBeInTheDocument();
  });

  it("is the dark site footer on a route outside the registry, and in a locale the route does not list", () => {
    mockPathname = "/not-a-listed-page";
    const { unmount } = renderWithIntl(<SiteFooter />);

    expect(screen.getByRole("contentinfo").closest(".lab-paper")).toBeNull();
    expect(screen.queryByText("Recognition")).toBeNull();
    unmount();

    mockPathname = "/learn";
    renderWithIntl(<SiteFooter />, { locale: "de", messages: deMessages });
    expect(screen.getByRole("contentinfo").closest(".lab-paper")).toBeNull();
  });

  it("is the Lab Paper footer, with the paper banner, under the 404 any unmatched path gets, in every locale", () => {
    mockPathname = "/no-such-page";
    mockSegments = ["(missing)", "no-such-page"];
    renderWithIntl(
      <>
        <ChangelogBanner announce />
        <SiteFooter />
      </>,
      { locale: "de", messages: deMessages },
    );

    expect(screen.getByRole("contentinfo").closest(".lab-paper")).not.toBeNull();
    expect(screen.getByRole("complementary")).toHaveClass("lab-banner");
  });
});

describe("the changelog banner", () => {
  it("sits in its own Lab Paper block on a Lab Paper route, links the release notes, and dismisses as before", () => {
    renderWithIntl(<ChangelogBanner announce />);
    const banner = screen.getByRole("complementary", { name: "Memory Chess update" });

    expect(banner).toHaveClass("lab-banner");
    expect(banner.parentElement).toHaveClass("lab-paper");
    expect(screen.getByRole("link", { name: BANNER_NAME })).toHaveAttribute("href", "/changelog");

    fireEvent.click(screen.getByRole("button", { name: `Dismiss Memory Chess v${LATEST_CHANGELOG_ENTRY.version} update` }));

    expect(window.localStorage.getItem(CHANGELOG_DISMISSAL_STORAGE_KEY)).toBe(LATEST_CHANGELOG_ENTRY.version);
    expect(screen.queryByRole("complementary", { name: "Memory Chess update" })).toBeNull();
    expect(document.querySelector(".lab-paper")).toBeNull();
  });

  it("keeps the dark banner, outside any Lab Paper block, on a route outside the registry", () => {
    mockPathname = "/not-a-listed-page";
    renderWithIntl(<ChangelogBanner announce />);
    const banner = screen.getByRole("complementary", { name: "Memory Chess update" });

    expect(banner).toHaveClass("bg-bg-card");
    expect(banner.closest(".lab-paper")).toBeNull();
    expect(screen.getByRole("link", { name: BANNER_NAME })).toHaveAttribute("href", "/changelog");
  });
});
