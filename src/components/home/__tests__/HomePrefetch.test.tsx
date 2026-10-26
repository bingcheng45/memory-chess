import type { ReactNode } from "react";
import { renderWithIntl, screen } from "@/test-utils/intl";
import { LabHero } from "@/components/home/LabHero";
import { LibrarySection } from "@/components/home/LibrarySection";
import { TiersSection } from "@/components/home/TiersSection";
import { LabPaperFooter } from "@/components/lab-paper/LabPaperFooter";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, prefetch, children, ...rest }: { href: string; prefetch?: boolean; children?: ReactNode }) => (
    <a href={href} data-prefetch={String(prefetch)} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/ui/LanguageSettings", () => function MockLanguageSettings() {
  return null;
});

beforeEach(() => {
  global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
});

const prefetchOf = (container: HTMLElement, hrefPart: string) =>
  Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).filter((a) => a.getAttribute("href")?.includes(hrefPart)).map((a) => a.dataset.prefetch);

describe("home link prefetching", () => {
  it("prefetches the hero's links to the game and leaves its secondary links to load on click", () => {
    const { container } = renderWithIntl(<LabHero />);

    expect(prefetchOf(container, "/game?")).toEqual(["undefined"]);
    expect(prefetchOf(container, "/leaderboard")).toEqual(["false"]);
    expect(prefetchOf(container, "/daily")).toEqual(["false"]);
    expect(prefetchOf(container, "/learn/how-to-play-memory-chess-board-game")).toEqual(["false"]);
  });

  it("does not prefetch the library guides below the fold", () => {
    const { container } = renderWithIntl(<LibrarySection />);

    const guides = prefetchOf(container, "/learn");
    expect(guides).toHaveLength(7);
    expect(new Set(guides)).toEqual(new Set(["false"]));
  });

  it("prefetches each difficulty's link to the game", () => {
    const { container } = renderWithIntl(<TiersSection />);

    const games = prefetchOf(container, "/game");
    expect(games.length).toBeGreaterThan(0);
    expect(new Set(games)).toEqual(new Set(["undefined"]));
  });

  it("does not prefetch any footer link", () => {
    const { container } = renderWithIntl(<LabPaperFooter />);

    const prefetches = Array.from(container.querySelectorAll<HTMLAnchorElement>("a[data-prefetch]"), (a) => a.dataset.prefetch);
    expect(screen.getByRole("link", { name: "Changelog" })).toBeInTheDocument();
    expect(prefetches.length).toBeGreaterThan(6);
    expect(new Set(prefetches)).toEqual(new Set(["false"]));
  });
});
