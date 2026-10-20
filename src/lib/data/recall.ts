import latest from "../../../data/recall/latest.json";

export interface RecallCell {
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
  readonly rounds: number;
  readonly players: number;
  readonly meanAccuracy: number;
  readonly medianAccuracy: number;
  readonly p25Accuracy: number;
  readonly p75Accuracy: number;
  readonly perfectShare: number;
  readonly zeroShare: number;
}

export interface RecallDataset {
  readonly start: string;
  readonly end: string;
  readonly minRounds: number;
  readonly minPlayers: number;
  readonly totalRounds: number;
  readonly totalPlayers: number;
  readonly roundsWithoutSettings: number;
  readonly roundsInSmallCells: number;
  readonly publishedRounds: number;
  readonly cells: readonly RecallCell[];
}

export const RECALL_DATA: RecallDataset = latest;

export const RECALL_PATH = "/data";

const REPO_FILE = "https://github.com/bingcheng45/memory-chess/blob/main/data/recall";
const RAW_FILE = "https://raw.githubusercontent.com/bingcheng45/memory-chess/main/data/recall";
export const RECALL_CSV_PAGE = `${REPO_FILE}/latest.csv`;
export const RECALL_README_PAGE = `${REPO_FILE}/README.md`;
const SITE_URL = "https://thememorychess.com";

export const DEFAULT_ROUND_SECONDS = 10;
export const DEFAULT_ROUND_PIECES = 6;

export function findCell(dataset: RecallDataset, pieceCount: number, memorizeSeconds: number): RecallCell {
  const cell = dataset.cells.find((candidate) => candidate.pieceCount === pieceCount && candidate.memorizeSeconds === memorizeSeconds);
  if (!cell) throw new Error(`The recall data has no published cell for ${pieceCount} pieces at ${memorizeSeconds} seconds`);
  return cell;
}

export function presetCells(dataset: RecallDataset) {
  return {
    easy: findCell(dataset, 2, DEFAULT_ROUND_SECONDS),
    medium: findCell(dataset, DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS),
    hard: findCell(dataset, 12, 8),
  };
}

export function cellsAtSeconds(dataset: RecallDataset, memorizeSeconds: number): RecallCell[] {
  return dataset.cells.filter((cell) => cell.memorizeSeconds === memorizeSeconds).sort((a, b) => a.pieceCount - b.pieceCount);
}

export function cellsWithPieces(dataset: RecallDataset, pieceCount: number): RecallCell[] {
  return dataset.cells.filter((cell) => cell.pieceCount === pieceCount).sort((a, b) => a.memorizeSeconds - b.memorizeSeconds);
}

export function recallStructuredData(dataset: RecallDataset, { name, description }: { name: string; description: string }) {
  const url = `${SITE_URL}${RECALL_PATH}`;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name,
    description,
    url,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    temporalCoverage: `${dataset.start}/${dataset.end}`,
    dateModified: dataset.end,
    creator: { "@type": "Person", name: "Bing Cheng", url: `${SITE_URL}/about` },
    publisher: { "@type": "Organization", name: "Memory Chess", url: SITE_URL },
    keywords: ["chess", "memory", "visual memory", "chess position recall", "open data"],
    measurementTechnique: "Finished rounds of the Memory Chess recall game, recorded as Google Analytics 4 events",
    variableMeasured: [
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
    ],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${RAW_FILE}/latest.csv` },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${RAW_FILE}/latest.json` },
    ],
  };
}
