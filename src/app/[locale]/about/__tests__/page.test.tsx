import type { AnchorHTMLAttributes } from "react";
import { render, screen } from "@/test-utils/intl";
import AboutPage from "@/app/[locale]/about/page";
import { EN_LEARN_PAGES } from "@/lib/seo/learn";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/about",
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/lib/articles/translatedLocales");

describe("AboutPage", () => {
  it("is a Lab Paper page whose header marks About as the current page", () => {
    const { container } = render(<AboutPage />);

    expect(container.firstElementChild).toHaveClass("lab-paper");
    expect(screen.getAllByRole("link", { name: "About" })[0]).toHaveAttribute("aria-current", "page");
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      "Who runs this site",
      "Why the game exists",
      "How a round works",
      "How the Learn guides are written",
      "Where the site has been",
      "Get in touch",
    ]);
  });

  it("names the developer and links the site's real pages", () => {
    render(<AboutPage />);

    expect(
      screen.getByRole("heading", { name: "About Memory Chess", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Bing Cheng/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "bingcheng45@gmail.com" }),
    ).toHaveAttribute("href", "mailto:bingcheng45@gmail.com");
    expect(screen.getByRole("link", { name: "Learn library" })).toHaveAttribute(
      "href",
      "/learn",
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "terms of service" }),
    ).toHaveAttribute("href", "/terms");
  });

  it("makes no claim the site cannot back up", () => {
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/games have been played/);
    expect(text).not.toMatch(/review them/);
    expect(text).not.toMatch(/guides translated/);
    expect(text).not.toMatch(/same working shape/);
    expect(text).not.toMatch(/I write them myself/);
    expect(text).not.toMatch(/sixteen guides/);
    expect(text).toMatch(/written with AI assistance/);
    expect(text).not.toMatch(/every release since the beginning/);
    expect(text).toMatch(/records every versioned release/);
  });

  it("discloses AI assistance for the site itself, as the guide byline does", () => {
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";

    expect(text).toMatch(/with AI assistance for the code and the site copy/);
    expect(text).not.toMatch(/design, code, and maintain everything/);
    expect(text).not.toMatch(/just me/);
  });

  it("counts the guides the Learn library actually holds", () => {
    const { container } = render(<AboutPage />);

    expect(container.textContent).toContain(`holds ${EN_LEARN_PAGES.length} guides`);
  });

  it("dates the Learn library to its March 2026 launch", () => {
    const { container } = render(<AboutPage />);
    const text = container.textContent ?? "";

    expect(text).toMatch(/Learn library launched in March 2026/);
    expect(text).not.toMatch(/August 2026 the site grew its Learn library/);
  });
});
