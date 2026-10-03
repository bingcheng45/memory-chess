import { render, screen, within } from "@/test-utils/intl";
import PageHeader from "@/components/ui/PageHeader";
import SiteNav from "@/components/ui/SiteNav";
import deMessages from "../../../../messages/de.json";

let mockPathname = "/";

jest.mock("@/i18n/navigation", () => ({
  ...jest.requireActual("@/i18n/navigation"),
  usePathname: () => mockPathname,
}));

function nav() {
  return screen.getByRole("navigation", { name: "Main" });
}

beforeEach(() => {
  mockPathname = "/";
});

describe("SiteNav", () => {
  it("links Play, Learn, Articles, Leaderboard and About in that order", () => {
    render(<SiteNav />);

    const links = within(nav()).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Play",
      "Learn",
      "Articles",
      "Leaderboard",
      "About",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/game",
      "/learn",
      "/articles",
      "/leaderboard",
      "/about",
    ]);
  });

  it("marks only the current page", () => {
    mockPathname = "/leaderboard";
    render(<SiteNav />);

    const current = within(nav()).getByRole("link", { current: "page" });
    expect(current).toHaveTextContent("Leaderboard");
    expect(within(nav()).getAllByRole("link").filter((link) => link.hasAttribute("aria-current"))).toHaveLength(1);
  });

  it("marks Articles on the articles list and nothing on an article beneath it", () => {
    mockPathname = "/articles";
    const { unmount } = render(<SiteNav />);

    expect(within(nav()).getByRole("link", { current: "page" })).toHaveTextContent("Articles");
    unmount();

    mockPathname = "/articles/some-slug";
    render(<SiteNav />);

    expect(within(nav()).queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });

  it("marks nothing on a page the nav does not list", () => {
    mockPathname = "/learn/how-to-stop-blundering-in-chess";
    render(<SiteNav />);

    expect(within(nav()).queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });

  it("keeps the locale on translated routes and sends English-only ones to the bare URL", () => {
    const { container } = render(<SiteNav />, { locale: "de", messages: deMessages });

    expect(container.querySelector('a[href="/de/game"]')).toHaveTextContent(deMessages.common.nav.play);
    expect(container.querySelector('a[href="/de/leaderboard"]')).not.toHaveAttribute("hreflang");

    for (const route of ["/learn", "/articles", "/about"]) {
      const link = container.querySelector(`a[href="${route}"]`);
      expect(link).toHaveAttribute("hreflang", "en");
      // A compact marker stands in for the footer's " (English)" suffix,
      // which the accessible name keeps.
      expect(link).toHaveTextContent(/EN$/);
      expect(link).not.toHaveTextContent("(English)");
      expect(link?.getAttribute("aria-label")).toMatch(/ \(English\)$/);
    }
  });

  it("shows no English marker on an English page", () => {
    render(<SiteNav />);

    const about = within(nav()).getByRole("link", { name: "About" });
    expect(about).toHaveAttribute("hreflang", "en");
    expect(about).not.toHaveAttribute("aria-label");
    expect(about).toHaveTextContent(/^About$/);
  });
});

describe("PageHeader navigation", () => {
  const renderHeader = (pageType?: "game-memorize-solution" | "other") =>
    render(<PageHeader pageType={pageType} showSoundSettings={false} showLanguageSettings={false} />);

  it("renders the nav on ordinary pages", () => {
    renderHeader();

    expect(within(nav()).getAllByRole("link")).toHaveLength(5);
  });

  it("leaves the nav out while a round is being memorised or placed", () => {
    renderHeader("game-memorize-solution");

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Memory Chess" })).toBeInTheDocument();
  });
});
