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
      screen.getByRole("link", { name: "Contact Us page" }),
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
    expect(screen.getByText("August 16, 2026", { selector: "time" })).toBeInTheDocument();
    expect(screen.getByText("August 15, 2026", { selector: "time" })).toBeInTheDocument();
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
    expect(links[0]).toHaveAttribute("href", "#v1-2-5");
    expect(links[0]).toHaveTextContent("v1.2.5October 5, 2026");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      CHANGELOG_ENTRIES.map((entry) => `#v${entry.version.replaceAll(".", "-")}`),
    );
  });

  it("dates each release in a time element and tags only the newest as latest", () => {
    const { container } = render(<ChangelogPage />);

    const newest = container.querySelector("article#v1-2-5") as HTMLElement;
    expect(within(newest).getByText("October 5, 2026")).toHaveAttribute("datetime", "2026-10-05T14:40:00.000+08:00");
    expect(within(newest).getByText("Latest")).toBeInTheDocument();
    expect(screen.getAllByText("Latest")).toHaveLength(1);
  });

  it("renders the English release notes", () => {
    render(<ChangelogPage />);

    expect(
      screen.getByRole("heading", { name: CHANGELOG_ENTRIES[0].title }),
    ).toBeInTheDocument();
  });
});
