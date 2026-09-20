import { render } from "@/test-utils/intl";
import LeaderboardTable, { TimeDisplay } from "@/components/leaderboard/LeaderboardTable";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { parseCountryCode, WORLD_CODE, type CountryCode } from "@/lib/leaderboard/countries";

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
    ).container.querySelectorAll("tr.bg-peach-500\\/20");

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

    expect(flagOf(entry, "Singapore")).toHaveTextContent(SINGAPORE_FLAG);
  });

  it("shows the globe when the row names the world", () => {
    const entry = { ...row("row-zz", 0.648, 18.887, 6), country_code: WORLD_CODE };

    expect(flagOf(entry, "World")).toHaveTextContent(GLOBE);
  });

  it("shows the globe for a row written before the country column existed", () => {
    expect(flagOf(row("row-legacy", 0.648, 18.887, 6), "World")).toHaveTextContent(GLOBE);
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
