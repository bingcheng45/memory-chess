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

const cell = (pieceCount: number, memorizeSeconds: number, rounds: number, players: number, meanAccuracy: number, perfectShare: number): RecallCell => ({
  pieceCount,
  memorizeSeconds,
  rounds,
  players,
  meanAccuracy,
  medianAccuracy: 50,
  p25Accuracy: 25,
  p75Accuracy: 75,
  perfectShare,
});

const DATA: RecallDataset = {
  start: "2026-09-29",
  end: "2026-10-19",
  minRounds: 30,
  minPlayers: 5,
  totalRounds: 1200,
  roundsWithoutSettings: 10,
  roundsInSmallCells: 90,
  publishedRounds: 1100,
  cells: [cell(2, 10, 300, 60, 81.8, 77.1), cell(6, 10, 600, 200, 48.3, 11.1), cell(6, 20, 120, 10, 69.3, 34.5), cell(12, 8, 80, 14, 39.8, 1.4)],
};

it("opens with the answer: the headline averages, their rounds and the date range", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How well do people remember chess positions?");
  expect(document.querySelector(".lab-lede")).toHaveTextContent(
    "In 1,200 finished rounds of Memory Chess from September 29, 2026 to October 19, 2026, players who studied a position for 10 seconds placed 82% of 2 pieces correctly on average (300 rounds), but only 48% of 6 pieces (600 rounds). Just 11.1% of those 6-piece rounds were perfect, and with 12 pieces and 8 seconds the average fell to 40%, with 1.4% perfect (80 rounds).",
  );
});

it("draws each bar to scale and prints its value and rounds", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  const byPieces = screen.getByRole("figure", { name: "Average recall with 10 seconds to study" });
  const bars = within(byPieces).getAllByRole("listitem");
  expect(bars.map((bar) => bar.textContent)).toEqual(["2 pieces82%300 rounds", "6 pieces48%600 rounds"]);
  expect(bars.map((bar) => (bar.querySelector("i") as HTMLElement).style.width)).toEqual(["81.8%", "48.3%"]);

  const bySeconds = screen.getByRole("figure", { name: "Average recall of 6 pieces, by study time" });
  expect(within(bySeconds).getAllByRole("listitem").map((bar) => bar.textContent)).toEqual(["10 s48%600 rounds", "20 s69%120 rounds"]);
});

it("tabulates every published setting with its spread and perfect share", async () => {
  render(await RecallDataPage({ data: DATA, locale: "en" }));

  const rows = within(screen.getByRole("table")).getAllByRole("row");
  expect(rows.map((row) => Array.from(row.children, (cellNode) => cellNode.textContent))).toEqual([
    ["Pieces", "Study time", "Rounds", "Players", "Mean", "Median", "Middle half", "Perfect"],
    ["2", "10 s", "300", "60", "81.8%", "50%", "25% to 75%", "77.1%"],
    ["6", "10 s", "600", "200", "48.3%", "50%", "25% to 75%", "11.1%"],
    ["6", "20 s", "120", "10", "69.3%", "50%", "25% to 75%", "34.5%"],
    ["12", "8 s", "80", "14", "39.8%", "50%", "25% to 75%", "1.4%"],
  ]);
  expect(screen.getByText(/Of 1,200 rounds, 1,100 fall in the 4 settings shown, 90 in smaller settings, and 10 arrived without their settings/)).toBeInTheDocument();
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
    "How well do people remember chess positions? Data from 1,200 rounds of Memory Chess",
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
