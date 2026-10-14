// Fits the rating link slope κ and the board weights w_p and w_s from leaderboard rows, where
//   expected accuracy E = 1 / (1 + (3/7)·exp(−κ·(R − b)))
//   board level       b = 1000 + w_p·log2(pieces / 6) + w_s·log2(10 / study seconds)
// Usage:
//   node scripts/rating/calibrate.mjs fetch <rows.json>
//     GETs leaderboard_entries with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from the environment.
//     Never writes to the database. Player names are replaced by an anonymous per-file player number.
//   node scripts/rating/calibrate.mjs fit <rows.json> [--ability player|pool|board] [--rated-since 2026-10-13]
//     [--boot 1000] [--seed 1] [--plays N] [--json]
// The report also gives the leaderboard's look and rebuild seconds per piece, the population pace the rating's look and
// rebuild credits are measured from (src/lib/game/rating.ts referenceStudySeconds and referenceRebuildPerPiece).
//
// A row's skill_rating is a real ability only when the row was written after the rating column existed (migration
// 0004) and is not the column default. Every other row gets a free ability, shared per --ability group:
//   player  one per player, so only a player's own rounds on different boards and study times inform the slopes
//   pool    one for everyone, which assumes the players on each board are equally able
//   board   one per board, which leaves only the study time to inform anything
// Without rated rows the rating scale has no anchor of its own, so w_p is held at its current value and κ and w_s are
// read against it.
import { readFileSync, writeFileSync } from "node:fs";

const START_RATING = 1000;
const REFERENCE_PIECES = 6;
const REFERENCE_STUDY_SECONDS = 10;
const STUDY_SECONDS_RANGE = { min: 1, max: 60 };
const EXTRA_PIECE_PENALTY = 10;
/** The board shows this many rows; below it every round with a correct piece qualifies. Mirrors src/lib/reference/facts.ts. */
const LEADERBOARD_ROW_LIMIT = 200;
const LINK_OFFSET = Math.log(7 / 3);
export const DEFAULTS = { kappa: Math.log(10) / 400, wp: 550, ws: 150 };
const COLUMNS = "player_name,difficulty,piece_count,correct_pieces,total_wrong_pieces,memorize_time,solution_time,skill_rating,created_at";
const PAGE = 1000;

// ---------- data ----------

export async function fetchRows({ url, key }) {
  const players = new Map();
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const query = `select=${COLUMNS}&order=created_at.asc&limit=${PAGE}&offset=${offset}`;
    const response = await fetch(`${url}/rest/v1/leaderboard_entries?${query}`, {
      method: "GET",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error(`leaderboard GET failed: ${response.status} ${await response.text()}`);
    const page = await response.json();
    for (const { player_name, ...row } of page) {
      if (!players.has(player_name)) players.set(player_name, players.size + 1);
      rows.push({ player: players.get(player_name), ...row });
    }
    if (page.length < PAGE) return rows;
  }
}

/** Accuracy as src/lib/game/scoring.ts scores it, 0 to 1. total_wrong_pieces is missed plus extra. */
export function accuracyOf({ piece_count: pieces, correct_pieces: correct, total_wrong_pieces: wrong }) {
  const extra = wrong == null ? 0 : Math.max(0, wrong - (pieces - correct));
  const base = Math.round((correct / pieces) * 100);
  return Math.max(0, base - extra * EXTRA_PIECE_PENALTY) / 100;
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const groupOf = (row, ability) => (ability === "player" ? `player ${row.player}` : ability === "board" ? `${row.difficulty}:${row.piece_count}` : "everyone");

export function roundOf(row, { ratedSince, ability }) {
  const pieces = row.piece_count;
  const study = clamp(row.memorize_time, STUDY_SECONDS_RANGE.min, STUDY_SECONDS_RANGE.max);
  const rated = row.created_at >= ratedSince && Number.isFinite(row.skill_rating) && row.skill_rating !== START_RATING;
  return {
    player: row.player,
    board: `${row.difficulty}:${pieces}`,
    group: rated ? null : groupOf(row, ability),
    pieces,
    accuracy: accuracyOf(row),
    rank: [-row.correct_pieces, row.total_wrong_pieces ?? Infinity, row.memorize_time, row.solution_time],
    xp: Math.log2(pieces / REFERENCE_PIECES),
    xs: Math.log2(REFERENCE_STUDY_SECONDS / study),
    rating: rated ? row.skill_rating : null,
    lookPerPiece: row.memorize_time / pieces,
    rebuildPerPiece: row.solution_time / pieces,
  };
}

export const boardLevelOf = ({ wp, ws }, round) => START_RATING + wp * round.xp + ws * round.xs;

// ---------- fit ----------
// The linear predictor is log(7/3) + κ(R − 1000) − κw_p·x_p − κw_s·x_s for a rated round, and log(7/3) + c_g − κw_p·x_p
// − κw_s·x_s for a round whose ability is its group's c_g. So the fit is a fractional logit in (κ, κw_p, κw_s, c_g).
// Each round is weighted by its pieces, which is the binomial-per-piece likelihood whenever no extra piece was placed.

const logistic = (z) => 1 / (1 + Math.exp(-z));

function solve(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col] / a[col][col];
      for (let k = col; k <= n; k++) a[row][k] -= factor * a[col][k];
    }
  }
  return a.map((row, i) => row[n] / row[i]);
}

/**
 * Newton's method on the fractional-logit log likelihood with slopes `beta` over the features `z` and one intercept
 * `alpha` per group. Groups are disjoint, so their block of the Hessian is diagonal and is eliminated (Schur
 * complement) instead of solved densely: a fit with hundreds of players stays a 3 by 3 solve. Halving a step that
 * lowers the likelihood keeps a nearly perfect group from overshooting.
 */
function newton(rows, slopes, groups) {
  let beta = new Array(slopes).fill(0);
  let alpha = new Array(groups).fill(0);
  const eta = (row, b, a) => LINK_OFFSET + row.z.reduce((sum, v, j) => sum + v * b[j], 0) + (row.g < 0 ? 0 : a[row.g]);
  const loglik = (b, a) =>
    rows.reduce((sum, row) => {
      const mu = clamp(logistic(eta(row, b, a)), 1e-12, 1 - 1e-12);
      return sum + row.w * (row.y * Math.log(mu) + (1 - row.y) * Math.log(1 - mu));
    }, 0);
  let current = loglik(beta, alpha);
  for (let iteration = 0; iteration < 200; iteration++) {
    const gs = new Array(slopes).fill(0);
    const gd = new Array(groups).fill(0);
    const A = Array.from({ length: slopes }, (_, i) => Array.from({ length: slopes }, (_, j) => (i === j ? 1e-9 : 0)));
    const B = Array.from({ length: groups }, () => new Array(slopes).fill(0));
    const D = new Array(groups).fill(1e-9);
    for (const row of rows) {
      const mu = logistic(eta(row, beta, alpha));
      const r = row.w * (row.y - mu);
      const v = row.w * mu * (1 - mu);
      row.z.forEach((zj, j) => {
        gs[j] += r * zj;
        row.z.forEach((zk, k) => (A[j][k] += v * zj * zk));
        if (row.g >= 0) B[row.g][j] += v * zj;
      });
      if (row.g >= 0) {
        gd[row.g] += r;
        D[row.g] += v;
      }
    }
    const S = A.map((rowA, j) => rowA.map((value, k) => value - B.reduce((sum, b, g) => sum + (b[j] * b[k]) / D[g], 0)));
    const rhs = gs.map((value, j) => value - B.reduce((sum, b, g) => sum + (b[j] * gd[g]) / D[g], 0));
    const ds = solve(S, rhs);
    const dd = gd.map((value, g) => (value - B[g].reduce((sum, b, j) => sum + b * ds[j], 0)) / D[g]);
    let scale = 1;
    let next;
    for (let halvings = 0; halvings < 30; halvings++, scale /= 2) {
      next = { beta: beta.map((b, j) => b + scale * ds[j]), alpha: alpha.map((a, g) => a + scale * dd[g]) };
      next.loglik = loglik(next.beta, next.alpha);
      if (next.loglik >= current - 1e-12) break;
    }
    const converged = Math.abs(next.loglik - current) < 1e-10 * (1 + Math.abs(current));
    ({ beta, alpha } = next);
    current = next.loglik;
    if (converged) break;
  }
  return { beta, alpha };
}

/** A group whose rounds are all perfect (or all empty) has an infinite ability and says nothing about the slopes. */
function informative(rounds) {
  const groups = Map.groupBy(rounds.filter((r) => r.group !== null), (r) => r.group);
  const separated = new Set([...groups].filter(([, rs]) => rs.every((r) => r.accuracy === 1) || rs.every((r) => r.accuracy === 0)).map(([g]) => g));
  return rounds.filter((r) => r.group === null || !separated.has(r.group));
}

const varies = (rounds, key) =>
  rounds.some((r) => r.rating !== null) || [...Map.groupBy(rounds, (r) => r.group).values()].some((rs) => new Set(rs.map((r) => r[key])).size > 1);

export function fit(input, { anchorWp = DEFAULTS.wp } = {}) {
  const rounds = informative(input);
  const groups = [...new Set(rounds.filter((r) => r.group !== null).map((r) => r.group))].sort();
  const hasRated = rounds.some((r) => r.rating !== null);
  const fitsPieces = varies(rounds, "xp");
  if (!varies(rounds, "xs") && !fitsPieces) throw new Error("nothing varies within an ability group: no slope can be fitted");
  const features = [
    ...(hasRated ? [(r) => (r.rating === null ? 0 : r.rating - START_RATING)] : []),
    ...(fitsPieces ? [(r) => -r.xp] : []),
    (r) => -r.xs,
  ];
  const index = new Map(groups.map((g, i) => [g, i]));
  const rows = rounds.map((r) => ({ z: features.map((f) => f(r)), g: r.group === null ? -1 : index.get(r.group), y: r.accuracy, w: r.pieces }));
  const { beta, alpha } = newton(rows, features.length, groups.length);
  const fitted = [...beta];
  const kappaRaw = hasRated ? fitted.shift() : null;
  const kp = fitsPieces ? fitted.shift() : null;
  const ks = fitted.shift();
  const ability = Object.fromEntries(groups.map((g, i) => [g, alpha[i]]));
  const scale = hasRated ? "rated" : kp !== null ? "anchored" : "default-kappa";
  const kappa = hasRated ? kappaRaw : kp !== null ? kp / anchorWp : DEFAULTS.kappa;
  const wp = hasRated ? (kp === null ? null : kp / kappa) : kp !== null ? anchorWp : null;
  return { scale, kappa, wp, ws: ks / kappa, kp, ks, ability, rows: rounds.length, groups: groups.length };
}

export function predict(params, round) {
  const ability = round.rating === null ? params.ability[round.group] : params.kappa * (round.rating - START_RATING);
  if (ability === undefined) return null;
  return logistic(LINK_OFFSET + ability - (params.kp ?? 0) * round.xp - params.ks * round.xs);
}

// ---------- uncertainty ----------

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEYS = ["kappa", "wp", "ws", "kp", "ks"];

/** Resamples players, not rows: one player's rounds share a skill, so rows are not independent. */
export function bootstrap(rounds, { samples, seed, anchorWp }) {
  const rng = mulberry32(seed);
  const clusters = [...Map.groupBy(rounds, (r) => r.player).values()];
  const draws = [];
  for (let s = 0; s < samples; s++) {
    const sample = Array.from({ length: clusters.length }, (_, k) =>
      clusters[Math.floor(rng() * clusters.length)].map((r) => (r.group?.startsWith("player ") ? { ...r, group: `draw ${k}` } : r)),
    ).flat();
    try {
      draws.push(fit(sample, { anchorWp }));
    } catch {
      // A resample with nothing varying inside any group cannot be fitted; the report counts these.
    }
  }
  const interval = (key) => {
    const values = draws.map((d) => d[key]).filter(Number.isFinite).sort((a, b) => a - b);
    if (values.length === 0) return { lo: null, hi: null };
    return { lo: values[Math.floor(0.025 * (values.length - 1))], hi: values[Math.ceil(0.975 * (values.length - 1))] };
  };
  return { fitted: draws.length, samples, ...Object.fromEntries(KEYS.map((key) => [key, interval(key)])) };
}

// ---------- selection check ----------
// Leaderboard rows are rounds players chose to submit, which are likely their best. This replays the fitted model at
// the observed boards, study times and abilities, keeps the best of k simulated rounds for each row, and refits. The
// gap between the refit at k and at 1 is how far that much selection moves the constants. Rounds are drawn binomially
// per piece; real rounds vary more than that, so the gaps are a lower bound on the shift.

export function selectionCheck(input, params, { picks, seed, replicates = 20, anchorWp }) {
  const rng = mulberry32(seed);
  const rounds = informative(input).filter((r) => predict(params, r) !== null);
  const binomial = (n, p) => {
    let hits = 0;
    for (let i = 0; i < n; i++) if (rng() < p) hits++;
    return hits;
  };
  return picks.map((k) => {
    const fits = [];
    for (let rep = 0; rep < replicates; rep++) {
      const synthetic = rounds.map((round) => {
        const p = predict(params, round);
        const best = Math.max(...Array.from({ length: k }, () => binomial(round.pieces, p)));
        return { ...round, accuracy: best / round.pieces };
      });
      try {
        fits.push(fit(synthetic, { anchorWp }));
      } catch {
        // as in bootstrap
      }
    }
    const mean = (key) => (fits.length === 0 || fits[0][key] === null ? null : fits.reduce((sum, f) => sum + f[key], 0) / fits.length);
    return { k, ...Object.fromEntries(KEYS.map((key) => [key, mean(key)])) };
  });
}

// ---------- report ----------

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

/** The leaderboard's order (src/lib/leaderboard/ranking.ts): more correct, fewer wrong, shorter study, faster rebuild. */
function byRank(a, b) {
  const i = a.rank.findIndex((value, j) => value !== b.rank[j]);
  return i === -1 ? 0 : a.rank[i] - b.rank[i];
}

export function describeBoards(rounds) {
  return [...Map.groupBy(rounds, (r) => r.board)].sort().map(([board, rs]) => {
    const acc = rs.map((r) => r.accuracy).sort((a, b) => a - b);
    const last = rs.length < LEADERBOARD_ROW_LIMIT ? null : rs.toSorted(byRank)[LEADERBOARD_ROW_LIMIT - 1];
    const share = (test) => rs.filter(test).length / rs.length;
    return {
      board,
      rows: rs.length,
      rated: rs.filter((r) => r.rating !== null).length,
      cutoff: last === null ? "open" : `>=${Math.round(last.accuracy * 100)}%`,
      mean: acc.reduce((s, a) => s + a, 0) / acc.length,
      q25: quantile(acc, 0.25),
      median: quantile(acc, 0.5),
      perfect: share((r) => r.accuracy === 1),
      under70: share((r) => r.accuracy < 0.7),
      atMost40: share((r) => r.accuracy <= 0.4),
    };
  });
}

/** Quartiles of the look and rebuild seconds per piece. */
export function pacesOf(rounds) {
  const quartiles = (values) => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    return { q25: quantile(sorted, 0.25), median: quantile(sorted, 0.5), q75: quantile(sorted, 0.75) };
  };
  return { look: quartiles(rounds.map((r) => r.lookPerPiece)), rebuild: quartiles(rounds.map((r) => r.rebuildPerPiece)) };
}

/** Observed and predicted accuracy, piece-weighted, by the fitted board level. */
export function fitTable(input, params, binWidth = 200) {
  const rounds = informative(input).filter((r) => predict(params, r) !== null);
  const level = (r) => boardLevelOf({ wp: params.wp ?? DEFAULTS.wp, ws: params.ws }, r);
  const bins = Map.groupBy(rounds, (r) => Math.floor(level(r) / binWidth) * binWidth);
  return [...bins.keys()].sort((a, b) => a - b).map((lo) => {
    const rs = bins.get(lo);
    const weight = rs.reduce((s, r) => s + r.pieces, 0);
    const observed = rs.reduce((s, r) => s + r.pieces * r.accuracy, 0) / weight;
    const predicted = rs.reduce((s, r) => s + r.pieces * predict(params, r), 0) / weight;
    return { lo, hi: lo + binWidth, rows: rs.length, observed, predicted };
  });
}

const pct = (value) => `${(value * 100).toFixed(0)}%`.padStart(4);
const fmt = (value, digits) => (Number.isFinite(value) ? value.toFixed(digits) : "n/a");
const bar = (value, width = 40) => {
  const filled = Math.round(clamp(value, 0, 1) * width);
  return "#".repeat(filled) + ".".repeat(width - filled);
};

const SCALE_NOTE = {
  rated: "kappa from rated rows; w_p and w_s from kappa",
  anchored: "no rated rows: w_p held at its current value, kappa = (kappa*w_p)/w_p, w_s = w_p*(kappa*w_s)/(kappa*w_p)",
  "default-kappa": "no rated rows and no piece contrast: kappa held at its default, only w_s fitted",
};

function printReport({ rounds, options, params, boot, selection, boards, paces }) {
  const log = (line = "") => console.log(line);
  const rated = rounds.filter((r) => r.rating !== null);
  log(`Rows: ${rounds.length} with a correct piece, from ${new Set(rounds.map((r) => r.player)).size} player names`);
  log(`Rated rows (written since ${options.ratedSince}, rating not ${START_RATING}): ${rated.length} from ${new Set(rated.map((r) => r.player)).size} players`);
  log(`Ability of unrated rows: one per ${options.ability}; ${params.rows} rows in ${params.groups} groups inform the fit (groups all perfect or all empty dropped)`);
  if (options.plays) log(`Submitted share of all plays: ${rounds.length} of ${options.plays} = ${((rounds.length / options.plays) * 100).toFixed(2)}%`);
  log();
  log("Board               rows rated cutoff  mean  q25 median perfect  <70% <=40%");
  for (const b of boards) {
    log(`${b.board.padEnd(18)} ${String(b.rows).padStart(5)} ${String(b.rated).padStart(5)} ${b.cutoff.padStart(6)}  ${pct(b.mean)} ${pct(b.q25)}   ${pct(b.median)}    ${pct(b.perfect)}  ${pct(b.under70)}  ${pct(b.atMost40)}`);
  }
  log();
  log("Seconds per piece      q25  median   q75");
  for (const [name, q] of [["look", paces.look], ["rebuild", paces.rebuild]]) {
    log(`  ${name.padEnd(18)} ${fmt(q.q25, 2).padStart(5)}   ${fmt(q.median, 2).padStart(5)} ${fmt(q.q75, 2).padStart(5)}`);
  }
  log();
  log(`Fit (${SCALE_NOTE[params.scale]})`);
  log(`Bootstrap over players: ${boot.fitted} of ${boot.samples} resamples fitted, 95% percentile intervals`);
  const line = (name, key, digits, fallback) =>
    log(`  ${name.padEnd(32)} ${fmt(params[key], digits).padStart(9)}   ${fmt(boot[key].lo, digits)} to ${fmt(boot[key].hi, digits)}${fallback === undefined ? "" : `   (default ${fallback})`}`);
  line("kappa, per rating point", "kappa", 5, DEFAULTS.kappa.toFixed(5));
  line("w_p, per doubling of pieces", "wp", 0, DEFAULTS.wp);
  line("w_s, per halving of study time", "ws", 0, DEFAULTS.ws);
  line("kappa*w_p, logit per doubling", "kp", 3, (DEFAULTS.kappa * DEFAULTS.wp).toFixed(3));
  line("kappa*w_s, logit per halving", "ks", 3, (DEFAULTS.kappa * DEFAULTS.ws).toFixed(3));
  log();
  log("Observed (o) vs predicted (p) accuracy by fitted board level, piece-weighted");
  for (const bin of fitTable(rounds, params)) {
    log(`  ${String(bin.lo).padStart(5)} to ${String(bin.hi).padEnd(5)} n=${String(bin.rows).padStart(4)}  o ${pct(bin.observed)} ${bar(bin.observed)}`);
    log(`  ${" ".repeat(21)}  p ${pct(bin.predicted)} ${bar(bin.predicted)}`);
  }
  log();
  log("Selection check: refit when every row is the best of k rounds drawn from this fit");
  log("      k     kappa    w_p    w_s  kappa*w_p  kappa*w_s");
  for (const s of selection) {
    log(`  ${String(s.k).padStart(5)}  ${fmt(s.kappa, 5)}  ${fmt(s.wp, 0).padStart(5)}  ${fmt(s.ws, 0).padStart(5)}  ${fmt(s.kp, 3).padStart(9)}  ${fmt(s.ks, 3).padStart(9)}`);
  }
}

export function parseOptions(args) {
  const options = { ability: "player", ratedSince: "2026-10-13", boot: 1000, seed: 1, plays: null, json: false };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === "--json") options.json = true;
    else if (flag === "--ability") options.ability = args[++i];
    else if (flag === "--rated-since") options.ratedSince = args[++i];
    else if (flag === "--boot") options.boot = Number(args[++i]);
    else if (flag === "--seed") options.seed = Number(args[++i]);
    else if (flag === "--plays") options.plays = Number(args[++i]);
    else throw new Error(`unknown flag ${flag}`);
  }
  if (!["player", "pool", "board"].includes(options.ability)) throw new Error("--ability takes player, pool or board");
  return options;
}

export function calibrate(rows, options) {
  const rounds = rows.filter((row) => row.piece_count > 0 && row.correct_pieces > 0).map((row) => roundOf(row, options));
  const params = fit(rounds);
  const boot = bootstrap(rounds, { samples: options.boot, seed: options.seed });
  const selection = selectionCheck(rounds, params, { picks: [1, 3, 10, 30], seed: options.seed });
  return { rounds, options, params, boot, selection, boards: describeBoards(rounds), paces: pacesOf(rounds) };
}

async function main([command, path, ...rest]) {
  if (command === "fetch" && path) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const rows = await fetchRows({ url, key });
    writeFileSync(path, JSON.stringify(rows));
    console.log(`wrote ${rows.length} rows to ${path}`);
    return;
  }
  if (command === "fit" && path) {
    const options = parseOptions(rest);
    const result = calibrate(JSON.parse(readFileSync(path, "utf8")), options);
    if (options.json) {
      const { params, boot, selection, boards, paces } = result;
      const { ability, ...constants } = params;
      console.log(JSON.stringify({ options, params: constants, boot, selection, boards, paces }));
    } else {
      printReport(result);
    }
    return;
  }
  throw new Error("usage: calibrate.mjs fetch <rows.json> | fit <rows.json> [--ability player|pool|board] [--rated-since DATE] [--boot N] [--seed S] [--plays N] [--json]");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
