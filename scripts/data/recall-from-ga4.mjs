#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PIECES = "customEvent:piece_count";
const SECONDS = "customEvent:memorize_time";
const ACCURACY = "customEvent:accuracy";
const MIN_ROUNDS = 30;
const MIN_PLAYERS = 5;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const CSV_COLUMNS = [
  "piece_count",
  "memorize_seconds",
  "rounds",
  "players",
  "mean_accuracy",
  "median_accuracy",
  "p25_accuracy",
  "p75_accuracy",
  "perfect_share",
  "zero_share",
];

class UsageError extends Error {}

const pick = (object, camel, snake) => object[camel] ?? object[snake];

function tableOf(report) {
  const names = (headers) => (headers ?? []).map((header) => header.name);
  return {
    dimensions: names(pick(report, "dimensionHeaders", "dimension_headers")),
    metrics: names(pick(report, "metricHeaders", "metric_headers")),
    rows: (report.rows ?? []).map((row) => ({
      dimensions: pick(row, "dimensionValues", "dimension_values").map((cell) => cell.value),
      metrics: pick(row, "metricValues", "metric_values").map((cell) => Number(cell.value)),
    })),
  };
}

const sameColumns = (actual, expected) => actual.length === expected.length && actual.every((name, index) => name === expected[index]);

function classify(tables) {
  const histogram = tables.filter((table) => sameColumns(table.dimensions, [PIECES, SECONDS, ACCURACY]) && sameColumns(table.metrics, ["eventCount"]));
  const players = tables.filter((table) => sameColumns(table.dimensions, [PIECES, SECONDS]) && sameColumns(table.metrics, ["eventCount", "totalUsers"]));
  if (histogram.length !== 1 || players.length !== 1) {
    throw new UsageError(`need exactly one accuracy histogram report and one players report, got ${histogram.length} and ${players.length}`);
  }
  return { histogram: histogram[0], players: players[0] };
}

const wholeNumber = (value) => (/^\d+$/.test(value) ? Number(value) : null);
const cellKey = (pieces, seconds) => `${pieces}/${seconds}`;

function histogramCells(table) {
  const cells = new Map();
  let total = 0;
  let unset = 0;
  for (const { dimensions, metrics } of table.rows) {
    const [pieces, seconds, accuracy] = dimensions.map(wholeNumber);
    const [count] = metrics;
    total += count;
    if (pieces === null || seconds === null || accuracy === null || accuracy > 100) {
      unset += count;
      continue;
    }
    const key = cellKey(pieces, seconds);
    const cell = cells.get(key) ?? { pieces, seconds, counts: new Map() };
    cell.counts.set(accuracy, (cell.counts.get(accuracy) ?? 0) + count);
    cells.set(key, cell);
  }
  return { cells, total, unset };
}

function playersByCell(table) {
  return new Map(table.rows.map(({ dimensions: [pieces, seconds], metrics: [, users] }) => [cellKey(pieces, seconds), users]));
}

function nearestRankPercentile(sorted, rounds, share) {
  const rank = Math.max(1, Math.ceil(share * rounds));
  let seen = 0;
  for (const [accuracy, count] of sorted) {
    seen += count;
    if (seen >= rank) return accuracy;
  }
  throw new Error("percentile past the last round");
}

const oneDecimal = (value) => Math.round(value * 10) / 10;
const shareScoring = (counts, accuracy, rounds) => oneDecimal(((counts.get(accuracy) ?? 0) / rounds) * 100);

function summarize({ pieces, seconds, counts }, players) {
  const sorted = [...counts].sort(([a], [b]) => a - b);
  const rounds = sorted.reduce((sum, [, count]) => sum + count, 0);
  const points = sorted.reduce((sum, [accuracy, count]) => sum + accuracy * count, 0);
  return {
    pieceCount: pieces,
    memorizeSeconds: seconds,
    rounds,
    players,
    meanAccuracy: oneDecimal(points / rounds),
    medianAccuracy: nearestRankPercentile(sorted, rounds, 0.5),
    p25Accuracy: nearestRankPercentile(sorted, rounds, 0.25),
    p75Accuracy: nearestRankPercentile(sorted, rounds, 0.75),
    perfectShare: shareScoring(counts, 100, rounds),
    zeroShare: shareScoring(counts, 0, rounds),
  };
}

function recallDataset(reports, { start, end }) {
  const { histogram, players } = classify(reports.flatMap((report) => (report.reports ?? [report]).map(tableOf)));
  const { cells, total, unset } = histogramCells(histogram);
  const users = playersByCell(players);
  const summaries = [...cells].map(([key, cell]) => summarize(cell, users.get(key) ?? 0));
  const published = summaries
    .filter((cell) => cell.rounds >= MIN_ROUNDS && cell.players >= MIN_PLAYERS)
    .sort((a, b) => a.pieceCount - b.pieceCount || a.memorizeSeconds - b.memorizeSeconds);
  const publishedRounds = published.reduce((sum, cell) => sum + cell.rounds, 0);
  return {
    name: "Memory Chess position recall",
    source: "Google Analytics 4 event round_complete, property of thememorychess.com",
    license: "CC BY 4.0",
    start,
    end,
    minRounds: MIN_ROUNDS,
    minPlayers: MIN_PLAYERS,
    totalRounds: total,
    roundsWithoutSettings: unset,
    roundsInSmallCells: total - unset - publishedRounds,
    publishedRounds,
    cells: published,
  };
}

function recallCsv(dataset) {
  const rows = dataset.cells.map((cell) =>
    [
      cell.pieceCount,
      cell.memorizeSeconds,
      cell.rounds,
      cell.players,
      cell.meanAccuracy,
      cell.medianAccuracy,
      cell.p25Accuracy,
      cell.p75Accuracy,
      cell.perfectShare,
      cell.zeroShare,
    ].join(","),
  );
  return `${[CSV_COLUMNS.join(","), ...rows].join("\n")}\n`;
}

function parseArgs(argv) {
  const options = { out: "data/recall", files: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--start" || arg === "--end" || arg === "--out") {
      options[arg.slice(2)] = argv[index + 1];
      index += 1;
    } else {
      options.files.push(arg);
    }
  }
  if (!DATE.test(options.start ?? "") || !DATE.test(options.end ?? "") || options.start > options.end) {
    throw new UsageError("--start and --end must be YYYY-MM-DD dates, start first");
  }
  if (options.files.length === 0) throw new UsageError("name at least one saved GA4 report file");
  return options;
}

function main(argv) {
  const { start, end, out, files } = parseArgs(argv);
  const dataset = recallDataset(
    files.map((file) => JSON.parse(readFileSync(file, "utf8"))),
    { start, end },
  );
  const json = `${JSON.stringify(dataset, null, 2)}\n`;
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${end}.json`), json);
  writeFileSync(join(out, "latest.json"), json);
  writeFileSync(join(out, "latest.csv"), recallCsv(dataset));
  process.stdout.write(`ok ${dataset.cells.length} cells, ${dataset.publishedRounds} of ${dataset.totalRounds} rounds, ${start} to ${end}\n`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`recall-from-ga4: ${error instanceof UsageError ? error.message : error.stack}\n`);
  process.exitCode = error instanceof UsageError ? 2 : 1;
}
