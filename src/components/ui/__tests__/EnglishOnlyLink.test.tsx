import { render, screen } from "@/test-utils/intl";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import ChangelogBanner from "@/components/ui/ChangelogBanner";
import jaMessages from "../../../../messages/ja.json";

jest.mock("@/lib/changelog", () => ({
  ...jest.requireActual("@/lib/changelog"),
  isChangelogAnnouncementActive: () => true,
}));

describe("EnglishOnlyLink", () => {
  it("points at the bare URL and says the page is in English on a translated page", () => {
    render(<EnglishOnlyLink href="/about">{(suffix) => <>About{suffix}</>}</EnglishOnlyLink>, {
      locale: "ja",
      messages: jaMessages,
    });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/about");
    expect(link).toHaveAttribute("hreflang", "en");
    expect(link).toHaveTextContent(/^About \(English\)$/);
  });

  it("adds no marker on an English page", () => {
    render(<EnglishOnlyLink href="/about">{(suffix) => <>About{suffix}</>}</EnglishOnlyLink>);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("hreflang", "en");
    expect(link).toHaveTextContent(/^About$/);
  });
});

describe("ChangelogBanner", () => {
  it("marks its link to the English-only changelog on a translated page", async () => {
    render(<ChangelogBanner />, { locale: "ja", messages: jaMessages });

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/changelog");
    expect(link).toHaveAttribute("hreflang", "en");
    expect(link.textContent).toMatch(new RegExp(`${jaMessages.changelog.bannerCta} \\(English\\)$`));
  });
});
