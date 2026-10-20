import { cellsAtSeconds, cellsWithPieces, presetCells, recallStructuredData, type RecallCell, type RecallDataset } from "../recall";

const cell = (pieceCount: number, memorizeSeconds: number, meanAccuracy: number): RecallCell => ({
  pieceCount,
  memorizeSeconds,
  rounds: 40,
  players: 6,
  meanAccuracy,
  medianAccuracy: 50,
  p25Accuracy: 25,
  p75Accuracy: 75,
  perfectShare: 10,
  zeroShare: 5,
});

const DATASET: RecallDataset = {
  start: "2026-09-29",
  end: "2026-10-19",
  minRounds: 30,
  minPlayers: 5,
  totalRounds: 300,
  totalPlayers: 40,
  roundsWithoutSettings: 0,
  roundsInSmallCells: 60,
  publishedRounds: 240,
  cells: [cell(6, 20, 69), cell(12, 8, 40), cell(6, 10, 48), cell(2, 10, 82), cell(4, 5, 71), cell(6, 5, 54)],
};

it("picks the easy, default and hard presets for the answer", () => {
  const { easy, medium, hard } = presetCells(DATASET);

  expect([easy.meanAccuracy, medium.meanAccuracy, hard.meanAccuracy]).toEqual([82, 48, 40]);
});

it("fails loudly when a quoted preset dropped out of the data", () => {
  const withoutTwelve = { ...DATASET, cells: DATASET.cells.filter((entry) => entry.pieceCount !== 12) };

  expect(() => presetCells(withoutTwelve)).toThrow("The recall data has no published cell for 12 pieces at 8 seconds");
});

it("orders one study time by piece count and one piece count by study time", () => {
  expect(cellsAtSeconds(DATASET, 10).map((entry) => entry.pieceCount)).toEqual([2, 6]);
  expect(cellsWithPieces(DATASET, 6).map((entry) => entry.memorizeSeconds)).toEqual([5, 10, 20]);
});

it("describes the data as a schema.org Dataset with its range, license and files", () => {
  const data = recallStructuredData(DATASET, { name: "Recall", description: "How well people recall chess positions." });

  expect(data).toMatchObject({
    "@type": "Dataset",
    url: "https://thememorychess.com/data",
    temporalCoverage: "2026-09-29/2026-10-19",
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Person", name: "Bing Cheng" },
  });
  expect(data.variableMeasured).toEqual([
    "piece count",
    "study time setting in seconds",
    "rounds",
    "players",
    "mean accuracy",
    "median accuracy",
    "25th percentile accuracy",
    "75th percentile accuracy",
    "perfect round share",
    "share of rounds that scored 0",
  ]);
  expect(data.distribution.map((file) => [file.encodingFormat, file.contentUrl])).toEqual([
    ["text/csv", "https://raw.githubusercontent.com/bingcheng45/memory-chess/main/data/recall/latest.csv"],
    ["application/json", "https://raw.githubusercontent.com/bingcheng45/memory-chess/main/data/recall/latest.json"],
  ]);
});
