import type { AnchorHTMLAttributes } from "react";
import { render, screen, within } from "@/test-utils/intl";
import { RecallDataPage } from "@/components/data/RecallDataPage";
import type { RecallCell, RecallDataset } from "@/lib/data/recall";

jest.mock("next-intl/server", () => {
  const { createFormatter, createTranslator } = jest.requireActual("next-intl");
  const catalogue = (locale: string) => jest.requireActual(`../../../../messages/${locale}.json`);
  return {
    getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
      createTranslator({ locale, messages: catalogue(locale), namespace }),
    getFormatter: async ({ locale }: { locale: string }) => createFormatter({ locale }),
  };
});

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/data",
  useRouter: () => ({ replace: jest.fn() }),
}));

const cell = (
  pieceCount: number,
  memorizeSeconds: number,
  rounds: number,
  players: number,
  meanAccuracy: number,
  perfectShare: number,
  zeroShare: number,
): RecallCell => ({
  pieceCount,
  memorizeSeconds,
  rounds,
  players,
  meanAccuracy,
  medianAccuracy: 50,
  p25Accuracy: 25,
  p75Accuracy: 75,
  perfectShare,
  zeroShare,
});

const DATA: RecallDataset = {
  start: "2026-09-29",
  end: "2026-10-19",
  minRounds: 30,
  minPlayers: 5,
  totalRounds: 1200,
  totalPlayers: 250,
  roundsWithoutSettings: 10,
  roundsInSmallCells: 90,
  publishedRounds: 1100,
  cells: [
    cell(2, 10, 300, 60, 81.8, 77.1, 13.4),
    cell(6, 10, 600, 200, 48.3, 11.1, 15.7),
    cell(6, 20, 120, 10, 69, 34.5, 4.4),
    cell(12, 8, 80, 14, 39.8, 1.4, 16.2),
  ],
};

it("opens with the answer: the headline averages, their rounds and the date range", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How well do people remember chess positions?");
  expect(document.querySelector(".lab-lede")).toHaveTextContent(
    "In 1,200 finished rounds of Memory Chess from September 29, 2026 to October 19, 2026, rounds set to 10 seconds of study scored 82% accuracy on average with 2 pieces (300 rounds) and 48% with 6 pieces, the default setting (600 rounds). 11.1% of those 6-piece rounds were perfect. With 12 pieces and 8 seconds, a setting fewer players chose, the average was 40%, with 1.4% perfect (80 rounds).",
  );
});

it("draws each bar to scale and prints its value and rounds", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  const byPieces = screen.getByRole("figure", { name: "Average recall in rounds set to 10 seconds of study" });
  const bars = within(byPieces).getAllByRole("listitem");
  expect(bars.map((bar) => bar.textContent)).toEqual(["2 pieces82%300 rounds", "6 pieces48%600 rounds"]);
  expect(bars.map((bar) => (bar.querySelector("i") as HTMLElement).style.width)).toEqual(["81.8%", "48.3%"]);

  expect(byPieces.nextElementSibling).toHaveTextContent(
    "Different players chose each number of pieces, and some rows come from only a few players, so check the Players column in the table before comparing bars.",
  );

  const bySeconds = screen.getByRole("figure", { name: "Average recall of 6 pieces, by study time" });
  expect(within(bySeconds).getAllByRole("listitem").map((bar) => bar.textContent)).toEqual(["10 s48%600 rounds", "20 s69%120 rounds"]);
  expect(bySeconds.nextElementSibling).toHaveTextContent(
    "Different players chose each study time, so these bars do not show how much extra time helps.",
  );
});

it("tabulates every published setting with its spread, perfect share and share that scored 0", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  const rows = within(screen.getByRole("table")).getAllByRole("row");
  expect(rows.map((row) => Array.from(row.children, (cellNode) => cellNode.textContent))).toEqual([
    ["Pieces", "Study time", "Rounds", "Players", "Mean", "Median", "Middle half", "Perfect", "Scored 0"],
    ["2", "10 s", "300", "60", "81.8%", "50%", "25% to 75%", "77.1%", "13.4%"],
    ["6", "10 s", "600", "200", "48.3%", "50%", "25% to 75%", "11.1%", "15.7%"],
    ["6", "20 s", "120", "10", "69.0%", "50%", "25% to 75%", "34.5%", "4.4%"],
    ["12", "8 s", "80", "14", "39.8%", "50%", "25% to 75%", "1.4%", "16.2%"],
  ]);
  expect(screen.getByText(/Of 1,200 rounds from 250 players, 1,100 fall in the 4 settings shown, 90 in smaller settings, and 10 arrived without their settings/)).toBeInTheDocument();
});

it("says in the limits that skips, calibration, review and daily rounds are pooled, and how many default rounds scored 0", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  const limits = screen.getByRole("heading", { name: "Limits" }).parentElement as HTMLElement;
  expect(within(limits).getByText(/^An empty board counts as a round that scored 0\./)).toHaveTextContent(
    "An empty board counts as a round that scored 0. Since October 14 the game has accepted one empty board a day as a free skip, and the analytics event cannot tell a skip from a real 0, so skips are in the data. The Scored 0 column gives each setting's share, 15.7% for the 6-piece, 10-second rounds.",
  );
  expect(within(limits).getByText(/^Review rounds/)).toHaveTextContent(
    "Review rounds, which replay a board the player saw before, and the daily board, the same seeded position for everyone that day, are pooled with the other rounds. The data cannot separate them.",
  );
  expect(within(limits).getByText(/^6 pieces with 10 seconds is the default round/)).toHaveTextContent(
    "6 pieces with 10 seconds is the default round, and the home page's calibration round uses the same setting and is pooled into it. It holds the most players (200).",
  );
});

it("links the CSV, the field notes and a round, and cites the data with its range", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  expect(screen.getByRole("link", { name: "Download the CSV" })).toHaveAttribute("href", "https://github.com/bingcheng45/memory-chess/blob/main/data/recall/latest.csv");
  expect(screen.getByRole("link", { name: "Field notes on GitHub" })).toHaveAttribute("href", "https://github.com/bingcheng45/memory-chess/blob/main/data/recall/README.md");
  expect(screen.getByRole("link", { name: "Play a round" })).toHaveAttribute("href", "/game");
  expect(screen.getByText(/Memory Chess position recall data, September 29, 2026 to October 19, 2026/)).toBeInTheDocument();
});

it("embeds a Dataset JSON-LD block named for the rounds it covers", async () => {
  const { container } = render(await RecallDataPage({ data: DATA, locale: "en" }));

  const jsonLd = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}");
  expect([jsonLd["@type"], jsonLd.name, jsonLd.temporalCoverage]).toEqual([
    "Dataset",
    "How well do people remember chess positions?",
    "2026-09-29/2026-10-19",
  ]);
});

it("translates the answer and labels, and marks the English notes as English on a translated page", async () => {
  render(await RecallDataPage({ data: DATA, locale: "de" }));

  expect(screen.getByRole("heading", { level: 1 }).textContent).not.toBe("How well do people remember chess positions?");
  expect(document.querySelector(".lab-lede")?.textContent).toContain("1.200");
  const method = screen.getByRole("heading", { name: "Method" });
  expect(method.closest("[lang]")).toHaveAttribute("lang", "en");
  expect(document.querySelector('p.lab-read-note[lang="de"]')).not.toBeNull();
});
