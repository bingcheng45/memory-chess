import { render, screen } from "@testing-library/react";
import LearnQuickPlay from "../LearnQuickPlay";
import { GAME_STORAGE_KEY } from "@/lib/game/configPrefill";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, prefetch, ...props }: { children: React.ReactNode; href: string; prefetch?: boolean }) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));

const copy = { quickPlay: "Try a round now", tryRound: "Try {pieces, plural, one {# piece} other {# pieces}}, {seconds} seconds", dailyBoard: "Play today's daily board" };
const unrated = { pieceCount: 4, memorizeTime: 10 };

describe("LearnQuickPlay", () => {
  afterEach(() => localStorage.clear());

  it("starts the 4-piece try round for a reader with no rating and keeps the daily link from prefetching", () => {
    render(<LearnQuickPlay unrated={unrated} locale="en" copy={copy} />);

    expect(screen.getByRole("link", { name: "Try 4 pieces, 10 seconds" })).toHaveAttribute("href", "/game?pieceCount=4&memorizeTime=10&from=guide_try");
    expect(screen.getByRole("link", { name: "Play today's daily board" })).toHaveAttribute("data-prefetch", "false");
  });

  it("sizes the round to a rated reader and keeps the guide_cta source", () => {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ state: { gameState: { skillRating: 1300 }, certainty: { rd: 60, rounds: 40 } }, version: 3 }));
    render(<LearnQuickPlay unrated={unrated} locale="en" copy={copy} />);

    expect(screen.getByRole("link", { name: "Try 8 pieces, 10 seconds" })).toHaveAttribute("href", "/game?pieceCount=8&memorizeTime=10&from=guide_cta");
  });

  it.each([700, 800])("keeps guide_cta for a rated reader (%d) whose suggestion is exactly the 4-piece, 10 second try round", (rating) => {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify({ state: { gameState: { skillRating: rating }, certainty: { rd: 60, rounds: 40 } }, version: 3 }));
    render(<LearnQuickPlay unrated={unrated} locale="en" copy={copy} />);

    expect(screen.getByRole("link", { name: "Try 4 pieces, 10 seconds" })).toHaveAttribute("href", "/game?pieceCount=4&memorizeTime=10&from=guide_cta");
  });
});
