import { render, screen, fireEvent } from "@/test-utils/intl";
import LanguageSettings from "@/components/ui/LanguageSettings";

const replace = jest.fn();
let mockPathname = "/game";

jest.mock("@/i18n/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: (...args: unknown[]) => replace(...args) }),
}));

/**
 * The switcher renders its menu through a portal on document.body, so the
 * options are only in the tree after the button is clicked.
 */
function openMenuAndPick(label: string) {
  fireEvent.click(screen.getByRole("button", { name: /change language/i }));
  fireEvent.click(screen.getByRole("menuitemradio", { name: new RegExp(label) }));
}

describe("LanguageSettings", () => {
  beforeEach(() => {
    replace.mockClear();
    mockPathname = "/game";
    window.history.replaceState({}, "", "/game");
    // The desktop popover renders only above 640px; jsdom defaults to 1024.
    window.innerWidth = 1024;
  });

  it("keeps the reader on the same page in the new locale", () => {
    render(<LanguageSettings />);
    openMenuAndPick("Deutsch");

    expect(replace).toHaveBeenCalledWith("/game", { locale: "de" });
  });

  it("preserves query parameters when switching locale", () => {
    // A preset game link. Dropping the query silently resets the difficulty
    // the reader had selected, so the "same page" promise is broken.
    window.history.replaceState({}, "", "/game?difficulty=hard&pieceCount=8");

    render(<LanguageSettings />);
    openMenuAndPick("Deutsch");

    expect(replace).toHaveBeenCalledWith("/game?difficulty=hard&pieceCount=8", {
      locale: "de",
    });
  });

  it("preserves the hash fragment when switching locale", () => {
    mockPathname = "/";
    window.history.replaceState({}, "", "/#faq");

    render(<LanguageSettings />);
    openMenuAndPick("Español");

    expect(replace).toHaveBeenCalledWith("/#faq", { locale: "es" });
  });

  it.each(["/about", "/changelog", "/privacy", "/terms", "/learn", "/learn/chess-memory-training"])(
    "on %s, offers no other language and writes no cookie",
    (path) => {
      mockPathname = path;
      window.history.replaceState({}, "", path);
      document.cookie = "NEXT_LOCALE=; max-age=0; path=/";

      render(<LanguageSettings />);
      openMenuAndPick("Deutsch");

      expect(screen.getByText("This page is only available in English.")).toBeInTheDocument();
      expect(screen.getByRole("menu")).toHaveAccessibleDescription("This page is only available in English.");
      expect(screen.getByRole("menuitemradio", { name: /Deutsch/ })).toBeDisabled();
      expect(screen.getByRole("menuitemradio", { name: /English/ })).toBeEnabled();
      expect(replace).not.toHaveBeenCalled();
      expect(document.cookie).not.toContain("NEXT_LOCALE");
    },
  );

  it("on a translated route, every language stays selectable and no note shows", () => {
    render(<LanguageSettings />);
    fireEvent.click(screen.getByRole("button", { name: /change language/i }));

    expect(screen.queryByText("This page is only available in English.")).not.toBeInTheDocument();
    for (const item of screen.getAllByRole("menuitemradio")) {
      expect(item).toBeEnabled();
    }
  });

  it("preserves query and hash together", () => {
    mockPathname = "/leaderboard";
    window.history.replaceState({}, "", "/leaderboard?player=ada#top");

    render(<LanguageSettings />);
    openMenuAndPick("Français");

    expect(replace).toHaveBeenCalledWith("/leaderboard?player=ada#top", {
      locale: "fr",
    });
  });

  it("does not navigate when the active locale is picked again", () => {
    render(<LanguageSettings />);
    openMenuAndPick("English");

    expect(replace).not.toHaveBeenCalled();
  });
});
