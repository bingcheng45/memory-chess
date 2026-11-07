import { render, screen } from "@/test-utils/intl";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import ChangelogBanner from "@/components/ui/ChangelogBanner";
import { GAME_STORAGE_KEY } from "@/lib/game/configPrefill";
import jaMessages from "../../../../messages/ja.json";

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
    window.localStorage.clear();
    window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ state: { history: [{ id: "round-1" }] } }));
    render(<ChangelogBanner announce version="1.0.0" publishedAt={new Date().toISOString()} />, { locale: "ja", messages: jaMessages });

    const link = await screen.findByRole("link");
    expect(link).toHaveAttribute("href", "/changelog");
    expect(link).toHaveAttribute("hreflang", "en");
    expect(link.textContent).toMatch(new RegExp(`${jaMessages.changelog.bannerCta} \\(English\\)$`));
  });
});
