import type { AnchorHTMLAttributes } from "react";
import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LabHomeHeader } from "@/components/home/LabHomeHeader";
import deMessages from "../../../../messages/de.json";

let mockPathname = "/";
jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/lib/articles/translatedLocales");

beforeEach(() => {
  mockPathname = "/";
});

const hrefsOf = (container: HTMLElement) =>
  within(container)
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);

const SITE = [
  ["Play", "/game"],
  ["Learn", "/learn"],
  ["Articles", "/articles"],
  ["Leaderboard", "/leaderboard"],
  ["Dashboard", "/dashboard"],
  ["About", "/about"],
];

const SECTIONS = [
  ["NotebookWhy measure", "#notebook"],
  ["MethodOne round, step by step", "#method"],
  ["CalibrateTake a reading", "#calibrate"],
  ["DifficultyPresets and rig", "#difficulty"],
  ["RecordYour readings", "#record"],
  ["LibraryGuides and drills", "#library"],
];

describe("the Lab Paper header", () => {
  it("keeps the Memory Chess wordmark, with Chess in peach, linking home", () => {
    renderWithIntl(<LabPaperHeader />);
    const wordmark = screen.getByRole("link", { name: "Memory Chess" });

    expect(wordmark).toHaveAttribute("href", "/");
    expect(within(wordmark).getByText("Chess")).toHaveClass("lab-wordmark-chess");
  });

  it("links the site's pages with no page menu of its own, and plays a round from a Play button", () => {
    renderWithIntl(<LabPaperHeader />);

    expect(hrefsOf(screen.getByRole("navigation", { name: "Main" }))).toEqual(SITE);
    expect(screen.queryByRole("button", { name: "Lab" })).toBeNull();
    expect(screen.getByRole("link", { name: "Play Play" }).getAttribute("href")).toMatch(/^\/game\?/);
    expect(screen.getByRole("button", { name: /change language/i })).toBeInTheDocument();
  });

  it("marks the link to the current route, and to the route a nested page sits under, as the current page", () => {
    mockPathname = "/leaderboard";
    const { unmount } = renderWithIntl(<LabPaperHeader />);
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(within(nav).getByRole("link", { name: "Leaderboard" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Learn" })).not.toHaveAttribute("aria-current");
    unmount();

    mockPathname = "/articles/chunking";
    renderWithIntl(<LabPaperHeader />);
    expect(within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Articles" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("lists Play first in the nav and the phone menu on the game, marks it current, and drops the Play button there", () => {
    mockPathname = "/game";
    renderWithIntl(<LabPaperHeader showPlay={false} />);
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(hrefsOf(nav)[0]).toEqual(["Play", "/game"]);
    expect(within(nav).getByRole("link", { name: "Play" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Play Play" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const panel = screen.getByRole("navigation", { name: "Menu" });
    expect(hrefsOf(panel)[0]).toEqual(["Play", "/game"]);
    expect(within(panel).getByRole("link", { name: "Play" })).toHaveAttribute("aria-current", "page");
  });

  it("speaks the reader's language and sends English-only pages to their bare English URL", () => {
    renderWithIntl(<LabPaperHeader />, { locale: "de", messages: deMessages });
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(within(nav).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("hreflang")])).toEqual([
      ["Spielen", null],
      ["Lernen (English)", "en"],
      ["Artikel", null],
      ["Bestenliste", null],
      ["Dashboard", null],
      ["Über (English)", "en"],
    ]);
    expect(screen.getByRole("button", { name: "Menü" })).toBeInTheDocument();
  });

  it("opens a phone menu with the site's pages, Changelog and the language switcher", () => {
    renderWithIntl(<LabPaperHeader />);
    const menuButton = screen.getByRole("button", { name: "Menu" });

    fireEvent.click(menuButton);
    const panel = screen.getByRole("navigation", { name: "Menu" });

    expect(panel).toHaveAttribute("id", menuButton.getAttribute("aria-controls"));
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(within(panel).getByText("Site")).toBeInTheDocument();
    expect(hrefsOf(panel)).toEqual([...SITE, ["Changelog", "/changelog"]]);
    expect(within(panel).getByRole("button", { name: /change language/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });
});

describe("the homepage's header", () => {
  it("adds the Lab menu of on-page sections, and closes it on Escape with focus back on the button", () => {
    renderWithIntl(<LabHomeHeader streak={null} />);
    const trigger = screen.getByRole("button", { name: "Lab" });

    expect(hrefsOf(screen.getByRole("navigation", { name: "Main" }))).toEqual(SITE);
    expect(screen.getByRole("link", { name: "Play a free round" }).getAttribute("href")).toMatch(/^\/game\?/);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /^Notebook/ })).toBeNull();

    fireEvent.click(trigger);
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(hrefsOf(panel)).toEqual(SECTIONS);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(panel).not.toBeVisible();
    expect(trigger).toHaveFocus();
  });

  it("closes the Lab menu when a section is picked, or when focus or a press lands outside it", () => {
    renderWithIntl(<LabHomeHeader streak={null} />);
    const trigger = screen.getByRole("button", { name: "Lab" });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("link", { name: /^Calibrate/ }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    fireEvent.focusIn(screen.getByRole("link", { name: "Learn" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("puts this page's sections before the site's pages in the phone menu", () => {
    renderWithIntl(<LabHomeHeader streak={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));

    expect(hrefsOf(screen.getByRole("navigation", { name: "Menu" }))).toEqual([
      ["Notebook", "#notebook"],
      ["Method", "#method"],
      ["Calibrate", "#calibrate"],
      ["Difficulty", "#difficulty"],
      ["Record", "#record"],
      ["Library", "#library"],
      ...SITE,
      ["Changelog", "/changelog"],
    ]);
  });
});

describe("streak chip in the homepage header", () => {
  it("counts the days played, and names a forgiven day in its title and accessible name", () => {
    renderWithIntl(<LabHomeHeader streak={{ days: 19, forgiven: 1 }} />);
    const chip = screen.getByRole("link", { name: "Day 19 of your streak, 1 missed day forgiven" });

    expect(chip).toHaveTextContent(/^Day 19$/);
    expect(chip).toHaveAttribute("title", "Day 19 of your streak, 1 missed day forgiven");
    expect(chip).toHaveAttribute("href", "#record");
  });

  it("reads Day N alone for an unbroken run, and is absent without a streak", () => {
    const { unmount } = renderWithIntl(<LabHomeHeader streak={{ days: 30, forgiven: 0 }} />);

    expect(screen.getByRole("link", { name: "Day 30" })).not.toHaveAttribute("title");
    unmount();
    renderWithIntl(<LabHomeHeader streak={null} />);
    expect(screen.queryByRole("link", { name: /^Day/ })).toBeNull();
  });
});
