import { render } from "@/test-utils/intl";
import LeaderboardTable, { TimeDisplay } from "@/components/leaderboard/LeaderboardTable";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { parseCountryCode, WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";
import deMessages from "../../../../messages/de.json";

const textOf = (seconds: number) =>
  render(<TimeDisplay seconds={seconds} />).container.textContent;

describe("TimeDisplay", () => {
  it("shows a sub-second look as milliseconds, not as hundreds of seconds", () => {
    expect(textOf(0.648)).toBe("00:00:648");
  });

  it("keeps whole seconds and rounds away floating-point noise", () => {
    expect(textOf(8.558)).toBe("00:08:558");
    expect(textOf(95.072)).toBe("01:35:072");
  });
});

const row = (id: string, memorize_time: number, solution_time: number, correct_pieces: number): LeaderboardEntry => ({
  id,
  player_name: "Dino beta",
  difficulty: "medium",
  piece_count: 6,
  correct_pieces,
  memorize_time,
  solution_time,
  created_at: "2026-08-04T11:49:31.839+00:00",
  total_wrong_pieces: 6 - correct_pieces,
});

const sameName = [row("best", 0.648, 18.887, 6), row("second", 0.693, 11.56, 6), row("worst", 4.302, 30.1, 3)];

const link = (overrides: Partial<Record<string, number | string | null>>) => ({
  player: "Dino beta",
  difficulty: "medium",
  memorizeTime: null,
  solutionTime: null,
  pieceCount: null,
  correctPieces: null,
  totalWrongPieces: null,
  ...overrides,
});

describe("LeaderboardTable highlight", () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  const highlighted = (entryDetails: ReturnType<typeof link>) =>
    render(
      <LeaderboardTable error={null} activeTab="medium" data={sameName} entryDetails={entryDetails as never} />,
    ).container.querySelectorAll("tr[data-highlighted]");

  it("highlights nothing when a link names a player but not the round", () => {
    expect(highlighted(link({}))).toHaveLength(0);
  });

  it("highlights exactly the submitted round when the link carries its times", () => {
    const rows = highlighted(link({ memorizeTime: 4.302, solutionTime: 30.1, pieceCount: 6, correctPieces: 3, totalWrongPieces: 3 }));
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("00:04:302");
  });
});

const SINGAPORE_FLAG = String.fromCodePoint(0x1f1f8, 0x1f1ec);
const GLOBE = String.fromCodePoint(0x1f30d);

const countryCode = (value: string): CountryCode => {
  const parsed = parseCountryCode(value);
  if (parsed === null) {
    throw new Error(`fixture uses an unknown country code: ${value}`);
  }
  return parsed;
};

describe("LeaderboardTable country flag", () => {
  const flagOf = (entry: LeaderboardEntry, name: string) =>
    render(<LeaderboardTable error={null} activeTab="medium" data={[entry]} />).getByRole("img", {
      name,
    });

  it("shows the country flag when the row names one", () => {
    const entry = { ...row("row-sg", 0.648, 18.887, 6), country_code: countryCode("SG") };
    const flag = flagOf(entry, "Singapore");

    expect(flag).toHaveTextContent(SINGAPORE_FLAG);
    expect(flag).toHaveAttribute("aria-label", "Singapore");
    expect(flag).toHaveAttribute("title", "Singapore");
  });

  it("shows the globe when the row names the world", () => {
    const entry = { ...row("row-zz", 0.648, 18.887, 6), country_code: WORLD_CODE };

    expect(flagOf(entry, "World")).toHaveTextContent(GLOBE);
  });

  it("shows the globe for a row written before the country column existed", () => {
    expect(flagOf(row("row-legacy", 0.648, 18.887, 6), "World")).toHaveTextContent(GLOBE);
  });

  it("shows the globe for a stored code the branded type says cannot exist", () => {
    // The column predates the type, so a row can still hold anything the
    // database accepted before the constraint landed.
    const entry = { ...row("row-junk", 0.648, 18.887, 6), country_code: "qq" as unknown as CountryCode };

    expect(flagOf(entry, "World")).toHaveTextContent(GLOBE);
  });
});

describe("LeaderboardTable", () => {
  it("dates a row in UTC so the server and the browser print the same day", () => {
    const { container } = render(
      <LeaderboardTable
        error={null}
        activeTab="medium"
        data={[
          {
            id: "row-1",
            player_name: "Dino beta",
            difficulty: "medium",
            piece_count: 6,
            correct_pieces: 6,
            memorize_time: 0.648,
            solution_time: 18.887,
            created_at: "2026-08-04T23:49:31.839+00:00",
            total_wrong_pieces: 0,
          },
        ]}
      />,
    );

    expect(container.textContent).toContain("Aug 4, 2026");
    expect(container.textContent).toContain("00:00:648");
  });
});

describe("LeaderboardTable ELO column", () => {
  const headers = (container: HTMLElement) =>
    [...container.querySelectorAll("thead th")].map((cell) => cell.textContent);
  const ratings = (container: HTMLElement) =>
    [...container.querySelectorAll("tbody tr")].map((tr) => tr.querySelectorAll("td")[2].textContent);

  it("reads Rank, Player, ELO, Pieces, Memorize Time, Solution Time, Date", () => {
    const { container } = render(<LeaderboardTable error={null} activeTab="medium" data={[row("a", 1, 2, 6)]} />);

    expect(headers(container)).toEqual(["Rank", "Player", "ELO", "Pieces", "Memorize Time", "Solution Time", "Date"]);
  });

  it("shows each row's stored rating, and 1000 for a row stored before the column existed", () => {
    const { container } = render(
      <LeaderboardTable
        error={null}
        activeTab="medium"
        data={[{ ...row("rated", 1, 2, 6), skill_rating: 1342 }, row("older", 1, 3, 5)]}
      />,
    );

    expect(ratings(container)).toEqual(["1342", "1000"]);
  });

  it("keeps ELO as ELO in German, between German headers", () => {
    const { container } = render(<LeaderboardTable error={null} activeTab="medium" data={[row("a", 1, 2, 6)]} />, {
      locale: "de",
      messages: deMessages,
    });

    expect(headers(container).slice(1, 4)).toEqual([
      deMessages.leaderboard.columns.player,
      "ELO",
      deMessages.leaderboard.columns.pieces,
    ]);
    expect(deMessages.leaderboard.columns.player).not.toBe("Player");
  });

  it("shows a ranked board the API reports unavailable as unavailable, without an error message", () => {
    const { getByText, queryByText } = render(
      <LeaderboardTable error="The leaderboard is unavailable. Please try again shortly." activeTab="medium" data={[]} />,
    );

    expect(getByText("Leaderboard Temporarily Unavailable")).toBeInTheDocument();
    expect(queryByText(/Error loading leaderboard/)).not.toBeInTheDocument();
  });

  it("spans every column in an empty board's message", () => {
    const { container } = render(<LeaderboardTable error={null} activeTab="medium" data={[]} />);

    expect(container.querySelector("tbody td")?.getAttribute("colspan")).toBe("7");
  });
});

describe("LeaderboardTable rating column", () => {
  const headers = (blindfold: boolean) =>
    Array.from(
      render(<LeaderboardTable error={null} activeTab="medium" data={[{ ...sameName[0], skill_rating: 1450 }]} blindfold={blindfold} />).container.querySelectorAll("thead th, tbody tr:first-child td"),
      (cell) => cell.textContent,
    );

  it("shows ELO on a board tab and leaves it off the blindfold tab, whose rounds never move the rating", () => {
    const board = headers(false);
    const blindfold = headers(true);

    expect(board.slice(0, 3)).toEqual(["Rank", "Player", "ELO"]);
    expect(board).toContain("1450");
    expect(blindfold.slice(0, 3)).toEqual(["Rank", "Player", "Pieces"]);
    expect(blindfold).not.toContain("1450");
    expect(blindfold).toHaveLength(board.length - 2);
  });
});
