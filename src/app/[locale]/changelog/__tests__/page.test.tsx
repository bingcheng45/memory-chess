import type { AnchorHTMLAttributes } from "react";
import { render, screen, within } from "@/test-utils/intl";
import ChangelogPage from "@/app/[locale]/changelog/page";
import { CHANGELOG_ENTRIES } from "@/lib/changelog";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/changelog",
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/lib/articles/translatedLocales");

describe("ChangelogPage", () => {
  it("renders every release in newest-first order", () => {
    render(<ChangelogPage />);

    const versionHeadings = screen.getAllByRole("heading", {
      name: /^v\d+\.\d+\.\d+$/,
    });

    expect(versionHeadings.map((heading) => heading.textContent)).toEqual(
      CHANGELOG_ENTRIES.map((entry) => `v${entry.version}`),
    );
    expect(
      screen.getByRole("heading", { name: "Steadier gameplay" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/reported this on Reddit/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Thank you for playing" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/over 32,000 games played/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact us page" }),
    ).toHaveAttribute("href", "/contact-us");

    expect(
      screen.getByRole("heading", { name: "Some statistics for everyone!" }),
    ).toBeInTheDocument();
    const accuracyTable = screen.getByRole("table", { name: "Accuracy" });
    expect(within(accuracyTable).getByText("72.3%")).toBeInTheDocument();
    expect(within(accuracyTable).getByText("89.1%")).toBeInTheDocument();
    const speedTable = screen.getByRole("table", {
      name: "Submission speed",
    });
    expect(within(speedTable).getByText("15.88s")).toBeInTheDocument();
    expect(within(speedTable).getByText("17.60s")).toBeInTheDocument();
    expect(screen.getByText("August 16, 2026", { selector: "article time" })).toBeInTheDocument();
    expect(screen.getByText("August 15, 2026", { selector: "article time" })).toBeInTheDocument();
  });

  it("says under 1.2.2 that the guides and changelog went back to English", () => {
    render(<ChangelogPage />);

    expect(
      screen.getByText(/the Learn guides are in English only, and two of them have been merged/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this changelog is back to English only/),
    ).toBeInTheDocument();
  });

  it("anchors every release and lists the anchors, newest first, in the header's Releases menu", () => {
    const { container } = render(<ChangelogPage />);

    expect(container.firstElementChild).toHaveClass("lab-paper");
    expect([...container.querySelectorAll("article")].map((article) => article.id)).toEqual(
      CHANGELOG_ENTRIES.map((entry) => `v${entry.version.replaceAll(".", "-")}`),
    );
    const menu = screen.getByRole("button", { name: "Releases" }).parentElement as HTMLElement;
    const links = within(menu).getAllByRole("link", { hidden: true });
    expect(links[0]).toHaveAttribute("href", "#v2-0-2");
    expect(links[0]).toHaveTextContent("v2.0.2October 23, 2026");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      CHANGELOG_ENTRIES.map((entry) => `#v${entry.version.replaceAll(".", "-")}`),
    );
  });

  it("dates each release in a time element and tags only the newest as latest", () => {
    const { container } = render(<ChangelogPage />);

    const newest = container.querySelector("article#v2-0-2") as HTMLElement;
    expect(within(newest).getByText("October 23, 2026")).toHaveAttribute("datetime", "2026-10-23T18:00:00.000+08:00");
    expect(within(newest).getByText("Latest")).toBeInTheDocument();
    expect(screen.getAllByText("Latest")).toHaveLength(1);
  });

  it("lists every release with its version, date and title in a Releases navigation, each linking to its anchor", () => {
    render(<ChangelogPage />);

    const index = screen.getByRole("navigation", { name: "Releases" });
    const links = within(index).getAllByRole("link");
    expect(links).toHaveLength(CHANGELOG_ENTRIES.length);
    expect(links[0]).toHaveAttribute("href", "#v2-0-2");
    expect(links[0]).toHaveTextContent("v2.0.2October 23, 2026Set up a round on the board, and see your board beside the position");
    expect(within(links[0]).getByText("October 23, 2026")).toHaveAttribute("datetime", "2026-10-23T18:00:00.000+08:00");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      CHANGELOG_ENTRIES.map((entry) => `#v${entry.version.replaceAll(".", "-")}`),
    );
    expect(within(index).getByRole("button", { name: `Jump to a release ${CHANGELOG_ENTRIES.length} releases` })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renders the English release notes", () => {
    render(<ChangelogPage />);

    expect(
      screen.getByRole("heading", { name: CHANGELOG_ENTRIES[0].title }),
    ).toBeInTheDocument();
  });
});
