/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(__dirname, "..", "rating", "calibrate.mjs");

type Row = {
  player: number;
  difficulty: string;
  piece_count: number;
  correct_pieces: number;
  total_wrong_pieces: number;
  memorize_time: number;
  solution_time: number;
  skill_rating: number;
  created_at: string;
};

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BOARDS = [
  { difficulty: "easy", pieces: 2 },
  { difficulty: "medium", pieces: 6 },
  { difficulty: "hard", pieces: 12 },
  { difficulty: "grandmaster", pieces: 20 },
];
const STUDY = [3, 5, 8, 10, 20];

function synthetic({ kappa, wp, ws, rated }: { kappa: number; wp: number; ws: number; rated: boolean }): Row[] {
  const rng = seeded(7);
  return Array.from({ length: 300 }, (_, player) => {
    const skill = 600 + 1600 * rng();
    return Array.from({ length: 8 }, () => {
      const { difficulty, pieces } = BOARDS[Math.floor(rng() * BOARDS.length)];
      const study = STUDY[Math.floor(rng() * STUDY.length)];
      const level = 1000 + wp * Math.log2(pieces / 6) + ws * Math.log2(10 / study);
      const p = 1 / (1 + (3 / 7) * Math.exp(-kappa * (skill - level)));
      const correct = Array.from({ length: pieces }, () => rng() < p).filter(Boolean).length;
      return {
        player: player + 1,
        difficulty,
        piece_count: pieces,
        correct_pieces: correct,
        total_wrong_pieces: pieces - correct,
        memorize_time: study,
        solution_time: 2 * pieces,
        skill_rating: rated ? Math.round(skill) : 1000,
        created_at: rated ? "2026-10-14T00:00:00Z" : "2026-01-01T00:00:00Z",
      };
    });
  })
    .flat()
    .filter((row) => row.correct_pieces > 0);
}

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "calibrate-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function fit(rows: Row[], ...flags: string[]) {
  const path = join(dir, `rows-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(path, JSON.stringify(rows));
  const run = spawnSync(process.execPath, [SCRIPT, "fit", path, "--boot", "20", "--json", ...flags], { encoding: "utf8" });
  if (run.status !== 0) throw new Error(run.stderr);
  return JSON.parse(run.stdout);
}

test("recovers the slope and both board weights from rated rows", () => {
  const { params, boot } = fit(synthetic({ kappa: 0.004, wp: 600, ws: 100, rated: true }));

  expect(params.scale).toBe("rated");
  expect(params.kappa).toBeGreaterThan(0.0036);
  expect(params.kappa).toBeLessThan(0.0044);
  expect(params.wp).toBeGreaterThan(560);
  expect(params.wp).toBeLessThan(640);
  expect(params.ws).toBeGreaterThan(70);
  expect(params.ws).toBeLessThan(130);
  expect(boot.fitted).toBe(20);
  expect(boot.kappa.lo).toBeLessThan(params.kappa);
  expect(boot.kappa.hi).toBeGreaterThan(params.kappa);
});

test("without rated rows, reads the slope from each player's own boards against the current piece weight", () => {
  const { params } = fit(synthetic({ kappa: 0.0035, wp: 550, ws: 150, rated: false }));

  expect(params.scale).toBe("anchored");
  expect(params.wp).toBe(550);
  expect(params.kappa).toBeGreaterThan(0.003);
  expect(params.kappa).toBeLessThan(0.004);
  expect(params.ws).toBeGreaterThan(100);
  expect(params.ws).toBeLessThan(200);
});

test("one ability per board leaves the piece weight unfitted", () => {
  const { params } = fit(synthetic({ kappa: 0.0035, wp: 550, ws: 150, rated: false }), "--ability", "board");

  expect(params.scale).toBe("default-kappa");
  expect(params.wp).toBeNull();
  expect(params.kp).toBeNull();
});

test("scores accuracy as the game does, ten points off per extra piece", () => {
  const row = (correct: number, wrong: number, study: number): Row => ({
    player: 1,
    difficulty: "medium",
    piece_count: 6,
    correct_pieces: correct,
    total_wrong_pieces: wrong,
    memorize_time: study,
    solution_time: 12,
    skill_rating: 1000,
    created_at: "2026-01-01T00:00:00Z",
  });
  // 6 of 6 with one extra piece is 90%; 3 of 6 with no extra is 50%.
  const { boards } = fit([row(6, 1, 4), row(3, 3, 10)], "--ability", "board");

  expect(boards).toEqual([expect.objectContaining({ board: "medium:6", rows: 2, cutoff: "open", mean: 0.7, perfect: 0 })]);
});

test("rejects an unknown ability grouping", () => {
  const run = spawnSync(process.execPath, [SCRIPT, "fit", "missing.json", "--ability", "team"], { encoding: "utf8" });

  expect(run.status).toBe(1);
  expect(run.stderr).toContain("--ability takes player, pool or board");
});
