/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(process.cwd(), "scripts/data/recall-from-ga4.mjs");

const HISTOGRAM_ROWS: [string, string, string, number][] = [
  ["6", "10", "100", 3],
  ["6", "10", "50", 20],
  ["6", "10", "0", 10],
  ["2", "10", "100", 40],
  ["4", "5", "75", 10],
  ["(not set)", "(not set)", "(not set)", 4],
];

const PLAYER_ROWS: [string, string, number, number][] = [
  ["6", "10", 33, 7],
  ["2", "10", 40, 3],
  ["4", "5", 10, 6],
  ["(not set)", "(not set)", 4, 2],
];

const restReport = (dimensions: string[], metrics: string[], rows: (string | number)[][]) => ({
  dimensionHeaders: dimensions.map((name) => ({ name })),
  metricHeaders: metrics.map((name) => ({ name, type: "TYPE_INTEGER" })),
  rows: rows.map((row) => ({
    dimensionValues: row.slice(0, dimensions.length).map((value) => ({ value: String(value) })),
    metricValues: row.slice(dimensions.length).map((value) => ({ value: String(value) })),
  })),
});

const mcpReport = (dimensions: string[], metrics: string[], rows: (string | number)[][]) => ({
  dimension_headers: dimensions.map((name) => ({ name })),
  metric_headers: metrics.map((name) => ({ name, type_: "TYPE_INTEGER" })),
  rows: rows.map((row) => ({
    dimension_values: row.slice(0, dimensions.length).map((value) => ({ value: String(value) })),
    metric_values: row.slice(dimensions.length).map((value) => ({ value: String(value) })),
  })),
});

const HISTOGRAM_COLUMNS = [["customEvent:piece_count", "customEvent:memorize_time", "customEvent:accuracy"], ["eventCount"]] as const;
const PLAYER_COLUMNS = [["customEvent:piece_count", "customEvent:memorize_time"], ["eventCount", "totalUsers"]] as const;

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "recall-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function save(name: string, content: unknown): string {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(content));
  return path;
}

function run(files: string[]) {
  return spawnSync(process.execPath, [SCRIPT, "--start", "2026-09-29", "--end", "2026-10-19", "--out", join(dir, "out"), ...files], {
    encoding: "utf8",
  });
}

const read = (name: string) => readFileSync(join(dir, "out", name), "utf8");

it("summarizes each cell with enough rounds and players, and counts the rounds it leaves out", () => {
  const result = run([
    save("histogram.json", restReport([...HISTOGRAM_COLUMNS[0]], [...HISTOGRAM_COLUMNS[1]], HISTOGRAM_ROWS)),
    save("players.json", restReport([...PLAYER_COLUMNS[0]], [...PLAYER_COLUMNS[1]], PLAYER_ROWS)),
  ]);

  expect(result.stdout).toBe("ok 1 cells, 33 of 87 rounds, 2026-09-29 to 2026-10-19\n");
  expect(JSON.parse(read("latest.json"))).toEqual({
    name: "Memory Chess position recall",
    source: "Google Analytics 4 event round_complete, property of thememorychess.com",
    license: "CC BY 4.0",
    start: "2026-09-29",
    end: "2026-10-19",
    minRounds: 30,
    minPlayers: 5,
    totalRounds: 87,
    roundsWithoutSettings: 4,
    roundsInSmallCells: 50,
    publishedRounds: 33,
    cells: [
      {
        pieceCount: 6,
        memorizeSeconds: 10,
        rounds: 33,
        players: 7,
        meanAccuracy: 39.4,
        medianAccuracy: 50,
        p25Accuracy: 0,
        p75Accuracy: 50,
        perfectShare: 9.1,
      },
    ],
  });
  expect(read("latest.csv")).toBe(
    "piece_count,memorize_seconds,rounds,players,mean_accuracy,median_accuracy,p25_accuracy,p75_accuracy,perfect_share\n" +
      "6,10,33,7,39.4,50,0,50,9.1\n",
  );
  expect(readdirSync(join(dir, "out")).sort()).toEqual(["2026-10-19.json", "latest.csv", "latest.json"]);
  expect(read("2026-10-19.json")).toBe(read("latest.json"));
});

it("reads the analytics tool's snake_case reports in one batch file and writes the same bytes", () => {
  run([
    save("histogram.json", restReport([...HISTOGRAM_COLUMNS[0]], [...HISTOGRAM_COLUMNS[1]], HISTOGRAM_ROWS)),
    save("players.json", restReport([...PLAYER_COLUMNS[0]], [...PLAYER_COLUMNS[1]], PLAYER_ROWS)),
  ]);
  const fromRest = read("latest.csv") + read("latest.json");

  const batch = {
    reports: [
      mcpReport([...PLAYER_COLUMNS[0]], [...PLAYER_COLUMNS[1]], PLAYER_ROWS),
      mcpReport([...HISTOGRAM_COLUMNS[0]], [...HISTOGRAM_COLUMNS[1]], HISTOGRAM_ROWS),
    ],
  };
  const result = run([save("batch.json", batch)]);

  expect(result.status).toBe(0);
  expect(read("latest.csv") + read("latest.json")).toBe(fromRest);
});

it("refuses an export without the players report and writes nothing", () => {
  const result = run([save("histogram.json", restReport([...HISTOGRAM_COLUMNS[0]], [...HISTOGRAM_COLUMNS[1]], HISTOGRAM_ROWS))]);

  expect(result.status).toBe(2);
  expect(result.stderr).toBe("recall-from-ga4: need exactly one accuracy histogram report and one players report, got 1 and 0\n");
  expect(readdirSync(dir)).toEqual(["histogram.json"]);
});
