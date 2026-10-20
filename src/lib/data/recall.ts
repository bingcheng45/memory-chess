import latest from "../../../data/recall/latest.json";

/** One published setting: every finished round with this piece count and study time. Accuracies are 0 to 100. */
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
}

/** What `scripts/data/recall-from-ga4.mjs` writes. `start` and `end` are ISO dates in the GA4 property's time zone. */
export interface RecallDataset {
  readonly start: string;
  readonly end: string;
  readonly minRounds: number;
  readonly minPlayers: number;
  readonly totalRounds: number;
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

/** The study time of the default round, and of the piece-count chart. */
export const CHART_SECONDS = 10;
/** The piece count of the default round, and of the study-time chart. */
export const CHART_PIECES = 6;

export function findCell(dataset: RecallDataset, pieceCount: number, memorizeSeconds: number): RecallCell {
  const cell = dataset.cells.find((candidate) => candidate.pieceCount === pieceCount && candidate.memorizeSeconds === memorizeSeconds);
  if (!cell) throw new Error(`The recall data has no published cell for ${pieceCount} pieces at ${memorizeSeconds} seconds`);
  return cell;
}

/** The three settings the page's answer quotes: the easy, default and hard presets. */
export function headlineOf(dataset: RecallDataset) {
  return {
    two: findCell(dataset, 2, CHART_SECONDS),
    six: findCell(dataset, CHART_PIECES, CHART_SECONDS),
    twelve: findCell(dataset, 12, 8),
  };
}

export function cellsAtSeconds(dataset: RecallDataset, memorizeSeconds: number): RecallCell[] {
  return dataset.cells.filter((cell) => cell.memorizeSeconds === memorizeSeconds).sort((a, b) => a.pieceCount - b.pieceCount);
}

export function cellsWithPieces(dataset: RecallDataset, pieceCount: number): RecallCell[] {
  return dataset.cells.filter((cell) => cell.pieceCount === pieceCount).sort((a, b) => a.memorizeSeconds - b.memorizeSeconds);
}

/** schema.org Dataset for the page. The creator is the site's developer, as on /about. */
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
    variableMeasured: ["piece count", "study time in seconds", "rounds", "players", "mean accuracy", "median accuracy", "perfect round share"],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${RAW_FILE}/latest.csv` },
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${RAW_FILE}/latest.json` },
    ],
  };
}
