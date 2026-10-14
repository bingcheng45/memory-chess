import type { AnchorHTMLAttributes } from "react";
import { render, screen, within } from "@/test-utils/intl";
import TermsPage from "@/app/[locale]/terms/page";

const IN_ENGLISH = { params: Promise.resolve({ locale: "en" }) };

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/terms",
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/lib/articles/translatedLocales");

describe("TermsPage", () => {
  it("states the deal plainly and links the privacy policy", async () => {
    render(await TermsPage(IN_ENGLISH));

    expect(
      screen.getByRole("heading", { name: "Terms of Service", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The leaderboard" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "bingcheng45@gmail.com" }),
    ).toHaveAttribute("href", "mailto:bingcheng45@gmail.com");
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("is a Lab Paper page that prints the date the sitemap reads", async () => {
    const { container } = render(await TermsPage(IN_ENGLISH));

    expect(container.firstElementChild).toHaveClass("lab-paper");
    const updated = screen.getByText("September 3, 2026");
    expect(updated.tagName).toBe("TIME");
    expect(updated).toHaveAttribute("dateTime", "2026-09-03");
  });

  it("lists every section near the top, each link landing on its heading", async () => {
    const { container } = render(await TermsPage(IN_ENGLISH));

    const contents = within(screen.getByRole("navigation", { name: "On this page" })).getAllByRole("link");
    expect(contents.map((link) => link.textContent)).toEqual([
      "The service",
      "Acceptable use",
      "The leaderboard",
      "Content and intellectual property",
      "Third-party services",
      "Changes to these terms",
      "Contact",
    ]);
    for (const link of contents) {
      const target = container.querySelector(link.getAttribute("href") ?? "");
      expect(target?.querySelector("h2")?.textContent).toBe(link.textContent);
    }
  });
});
