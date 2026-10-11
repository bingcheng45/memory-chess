import type { AnchorHTMLAttributes } from "react";
import { fireEvent, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabHeader } from "@/components/home/LabHeader";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/",
  useRouter: () => ({ replace: jest.fn() }),
}));

const hrefsOf = (container: HTMLElement) =>
  within(container)
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);

const SECTIONS = [
  ["NotebookWhy measure", "#notebook"],
  ["MethodOne round, step by step", "#method"],
  ["CalibrateTake a reading", "#calibrate"],
  ["DifficultyPresets and rig", "#difficulty"],
  ["RecordYour readings", "#record"],
  ["LibraryGuides and drills", "#library"],
];

describe("the homepage header", () => {
  it("keeps the Memory Chess wordmark, with Chess in peach, linking home", () => {
    renderWithIntl(<LabHeader streak={null} />);
    const wordmark = screen.getByRole("link", { name: "Memory Chess" });

    expect(wordmark).toHaveAttribute("href", "/");
    expect(within(wordmark).getByText("Chess")).toHaveClass("text-peach-500");
  });

  it("links the site's pages beside the Lab menu, and plays a free round from one primary button", () => {
    renderWithIntl(<LabHeader streak={null} />);
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(hrefsOf(nav)).toEqual([
      ["Learn", "/learn"],
      ["Articles", "/articles"],
      ["Leaderboard", "/leaderboard"],
      ["Progress", "/dashboard"],
      ["About", "/about"],
    ]);
    expect(screen.getByRole("link", { name: "Play a free round" }).getAttribute("href")).toMatch(/^\/game\?/);
    expect(screen.getByRole("button", { name: /change language/i })).toBeInTheDocument();
  });

  it("opens the Lab menu of on-page sections from its button, and closes it on Escape with focus back on the button", () => {
    renderWithIntl(<LabHeader streak={null} />);
    const trigger = screen.getByRole("button", { name: "Lab" });

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
    renderWithIntl(<LabHeader streak={null} />);
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

  it("opens a phone menu with this page's sections, the site's pages and the language switcher", () => {
    renderWithIntl(<LabHeader streak={null} />);
    const menuButton = screen.getByRole("button", { name: "Menu" });

    fireEvent.click(menuButton);
    const panel = screen.getByRole("navigation", { name: "Menu" });

    expect(panel).toHaveAttribute("id", menuButton.getAttribute("aria-controls"));

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(hrefsOf(panel)).toEqual([
      ["Notebook", "#notebook"],
      ["Method", "#method"],
      ["Calibrate", "#calibrate"],
      ["Difficulty", "#difficulty"],
      ["Record", "#record"],
      ["Library", "#library"],
      ["Learn", "/learn"],
      ["Articles", "/articles"],
      ["Leaderboard", "/leaderboard"],
      ["Progress", "/dashboard"],
      ["About", "/about"],
      ["Changelog", "/changelog"],
    ]);
    expect(within(panel).getByRole("button", { name: /change language/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveFocus();
  });
});

describe("streak chip in the header", () => {
  it("counts the days played, and names a forgiven day in its title and accessible name", () => {
    renderWithIntl(<LabHeader streak={{ days: 19, forgiven: 1 }} />);
    const chip = screen.getByRole("link", { name: "Day 19 of your streak, 1 missed day forgiven" });

    expect(chip).toHaveTextContent(/^Day 19$/);
    expect(chip).toHaveAttribute("title", "Day 19 of your streak, 1 missed day forgiven");
    expect(chip).toHaveAttribute("href", "#record");
  });

  it("reads Day N alone for an unbroken run, and is absent without a streak", () => {
    const { unmount } = renderWithIntl(<LabHeader streak={{ days: 30, forgiven: 0 }} />);

    expect(screen.getByRole("link", { name: "Day 30" })).not.toHaveAttribute("title");
    unmount();
    renderWithIntl(<LabHeader streak={null} />);
    expect(screen.queryByRole("link", { name: /^Day/ })).toBeNull();
  });
});
