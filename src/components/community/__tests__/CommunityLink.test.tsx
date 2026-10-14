import { render, screen } from "@/test-utils/intl";
import { CommunityLink } from "@/components/community/CommunityLink";
import { COMMUNITY_PLACEMENTS, COMMUNITY_URL, isReturningPlayer } from "@/lib/community";
import Footer from "@/components/ui/Footer";
import { LabPaperFooter } from "@/components/lab-paper/LabPaperFooter";
import { FOOTER_LINKS } from "@/components/ui/Footer";

jest.mock("@/lib/articles/translatedLocales");

describe("CommunityLink", () => {
  it("points at the Telegram group", () => {
    expect(COMMUNITY_URL).toBe("https://t.me/TheMemoryChess");
  });

  it.each(COMMUNITY_PLACEMENTS)("opens the group in a new tab with the %s id", (placement) => {
    render(<CommunityLink placement={placement}>Join</CommunityLink>);

    const link = screen.getByRole("link", { name: "Join" });
    expect(link).toHaveAttribute("href", "https://t.me/TheMemoryChess");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("id", `community-${placement}`);
  });
});

describe("isReturningPlayer", () => {
  it.each([
    [0, false],
    [2, false],
    [3, true],
    [30, true],
  ])("with %i finished rounds is %s", (rounds, expected) => {
    expect(isReturningPlayer(rounds)).toBe(expected);
  });
});

describe.each([
  ["the site footer", Footer],
  ["the Lab Paper footer", LabPaperFooter],
])("%s", (_name, Component) => {
  it("links the Telegram group and keeps every trust link", () => {
    const { container } = render(<Component />);

    const telegram = screen.getByRole("link", { name: "Telegram" });
    expect(telegram).toHaveAttribute("href", COMMUNITY_URL);
    expect(telegram).toHaveAttribute("target", "_blank");
    expect(telegram).toHaveAttribute("rel", "noopener noreferrer");
    expect(telegram).toHaveAttribute("id", "community-footer");

    for (const trust of ["/about", "/contact-us", "/privacy", "/terms"]) {
      expect(FOOTER_LINKS.some((link) => link.href === trust)).toBe(true);
      expect(container.querySelector(`a[href="${trust}"]`)).toBeInTheDocument();
    }
  });
});
