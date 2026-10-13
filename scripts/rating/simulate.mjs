// Plays synthetic players through the rating engine and checks the properties the rating must hold.
// Usage: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/rating/simulate.mjs [engine.ts]
// Exits non-zero when a property fails. Seeded, so every run prints the same tables.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const enginePath = resolve(process.argv[2] ?? "src/lib/game/rating.ts");
const { ratingAfter, START_RATING, NORM_ROUNDS = 30 } = await import(pathToFileURL(enginePath).href);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A player's chance of recalling each piece is 70% on a board at their true skill and moves along Elo's curve.
const LEVEL = (pieces, study) => 1000 + 550 * Math.log2(pieces / 6) + 150 * Math.log2(10 / Math.min(60, Math.max(1, study)));
const recallChance = (skill, pieces, study) => 1 / (1 + (3 / 7) * 10 ** ((LEVEL(pieces, study) - skill) / 400));

function playRound(rng, { skill, pieces, study, pace = 2.5, accuracy }) {
  let correct = 0;
  const chance = recallChance(skill, pieces, study);
  for (let i = 0; i < pieces; i += 1) if (rng() < chance) correct += 1;
  return {
    pieceCount: pieces,
    studySeconds: study * (0.85 + 0.15 * rng()),
    rebuildSeconds: pieces * pace * (0.75 + 0.5 * rng()),
    accuracy: accuracy ?? Math.round((correct / pieces) * 100),
  };
}

function run(persona, rounds = 500, seed = 1) {
  const rng = mulberry32(seed);
  let rating = START_RATING;
  let history = [];
  const ratings = [];
  const changes = [];
  for (let n = 1; n <= rounds; n += 1) {
    const round = persona.round(n, rating, rng);
    const result = ratingAfter(rating, history, round);
    changes.push({ change: result.change, phase: result.phase });
    rating = result.rating;
    history = [round, ...history].slice(0, NORM_ROUNDS);
    ratings.push(rating);
  }
  return { ratings, changes };
}

const fixed = (skill, pieces, study, extra = {}) => ({ round: (_n, _r, rng) => playRound(rng, { skill, pieces, study, ...extra }) });

const personas = {
  "Newcomer at Easy (2 pcs, 10 s)": fixed(500, 2, 10),
  "Steady Medium (6 pcs, 10 s)": fixed(1200, 6, 10),
  "Grandmaster grinder (20 pcs, 5 s)": fixed(2300, 20, 5),
  "Sandbagger (Hard, then Easy from round 60)": {
    round: (n, _r, rng) => (n <= 60 ? playRound(rng, { skill: 1800, pieces: 12, study: 8 }) : playRound(rng, { skill: 1800, pieces: 2, study: 10 })),
  },
  "Risk taker (Medium, Hard every 4th)": {
    round: (n, _r, rng) => (n % 4 === 0 ? playRound(rng, { skill: 1450, pieces: 12, study: 8 }) : playRound(rng, { skill: 1450, pieces: 6, study: 10 })),
  },
  "Improving (skill 700 to 2200, board at rating)": {
    round: (n, rating, rng) => {
      const pieces = Math.min(32, Math.max(2, Math.round(6 * 2 ** ((rating + 100 - 1000) / 550))));
      return playRound(rng, { skill: 700 + (1500 * n) / 500, pieces, study: 10 });
    },
  },
  "Easy farmer (2 pcs, 2 s, always 100%)": fixed(0, 2, 2, { accuracy: 100 }),
  "Empty-board spammer (32 pcs, 60 s, 0%)": fixed(0, 32, 60, { accuracy: 0, pace: 0.05 }),
  "Instant-submit cheater (32 pcs, 0.1 s, 0-6%)": {
    round: (_n, _r, rng) => ({ pieceCount: 32, studySeconds: 0.1, rebuildSeconds: 0.2, accuracy: rng() < 0.5 ? 0 : 6 }),
  },
};

const checkpoints = [1, 5, 10, 11, 20, 30, 50, 100, 200, 300, 500];
const trajectories = Object.fromEntries(Object.entries(personas).map(([name, persona]) => [name, run(persona)]));

console.log("\n## Trajectories (rating after round n)\n");
console.log(`| Persona | ${checkpoints.join(" | ")} | max up | max down |`);
console.log(`|---|${checkpoints.map(() => "---:").join("|")}|---:|---:|`);
for (const [name, { ratings, changes }] of Object.entries(trajectories)) {
  const deltas = changes.map(({ change }) => change);
  console.log(`| ${name} | ${checkpoints.map((n) => ratings[n - 1]).join(" | ")} | ${Math.max(0, ...deltas)} | ${Math.min(0, ...deltas)} |`);
}

// The player in the single-round checks: 30 rated rounds of Medium at mostly 83%, rated 1200.
const MEDIUM_NORM = Array.from({ length: 30 }, (_, i) => ({
  pieceCount: 6,
  studySeconds: 9 + (i % 3) * 0.5,
  rebuildSeconds: 15,
  accuracy: [83, 100, 67][i % 3],
}));
const R = 1200;
const single = (pieceCount, studySeconds, accuracy, rebuildSeconds = pieceCount * 2.5, history = MEDIUM_NORM, rating = R) =>
  ratingAfter(rating, history, { pieceCount, studySeconds, rebuildSeconds, accuracy });

const normalWin = single(6, 10, 100).change;
const normalLoss = single(6, 10, 17).change;
const harderWin = single(10, 10, 100).change;
const harderLoss = single(10, 10, 20).change;
const easierWin = single(3, 10, 100).change;
const easierLoss = single(3, 10, 33).change;

console.log("\n## Single rounds for a player rated 1200 whose last 30 rounds were Medium (6 pcs, ~9.5 s)\n");
console.log("| Round | Change | Breakdown |");
console.log("|---|---:|---|");
for (const [label, args] of [
  ["Normal, 6 pcs 10 s, 100%", [6, 10, 100]],
  ["Normal, 6 pcs 10 s, 83%", [6, 10, 83]],
  ["Normal, 6 pcs 10 s, 17%", [6, 10, 17]],
  ["Harder, 10 pcs 10 s, 100%", [10, 10, 100]],
  ["Harder, 10 pcs 10 s, 20%", [10, 10, 20]],
  ["Easier, 3 pcs 10 s, 100%", [3, 10, 100]],
  ["Easier, 3 pcs 10 s, 33%", [3, 10, 33]],
  ["Normal 100%, studied 5 s and rebuilt twice as fast", [6, 5, 100, 7.5]],
  ["Empty, 32 pcs 1 s", [32, 1, 0, 0.2]],
]) {
  const result = single(...args);
  const b = result.breakdown;
  const detail =
    result.phase === "rated"
      ? `level ${Math.round(b.boardLevel)}, E ${b.expected.toFixed(2)}, s ${b.outcome.toFixed(2)}, base ${b.base.toFixed(1)}, risk ${b.risk.direction} ${b.risk.sigmas.toFixed(2)}σ ×${b.risk.multiplier.toFixed(2)}, speed ×${b.speed.toFixed(2)}`
      : JSON.stringify(b);
  console.log(`| ${label} | ${result.change} | ${detail} |`);
}

// Empty and near-empty boards across every piece count, study time, rating and phase.
let emptyGains = 0;
let emptyChecked = 0;
for (let pieces = 2; pieces <= 32; pieces += 1) {
  for (const study of [0.1, 1, 5, 10, 60]) {
    for (const accuracy of [0, 10, 25, 40]) {
      for (const rating of [0, 400, 1000, 2000, 4000, 5000]) {
        for (const placed of [0, 5, 9, 10, 30]) {
          const history = Array.from({ length: placed }, (_, i) => ({ pieceCount: 2 + ((i * 7) % 31), studySeconds: 10, rebuildSeconds: 20, accuracy: 90 }));
          const { change } = ratingAfter(rating, history, { pieceCount: pieces, studySeconds: study, rebuildSeconds: 0.1, accuracy });
          emptyChecked += 1;
          if (change > 0) emptyGains += 1;
        }
      }
    }
  }
}

// Placement: four players at 90%, three of them each better in one dimension by the same factor of two.
const placementOf = (pieces, study, perPiece) =>
  run({ round: () => ({ pieceCount: pieces, studySeconds: study, rebuildSeconds: pieces * perPiece, accuracy: 90 }) }, 10).ratings[9];
const placement = {
  base: placementOf(6, 10, 2.5),
  pieces: placementOf(12, 10, 2.5),
  study: placementOf(6, 5, 2.5),
  rebuild: placementOf(6, 10, 1.25),
};
console.log("\n## Placement after 10 rounds at 90%, one dimension doubled each\n");
console.log("| Player | Rating |");
console.log("|---|---:|");
console.log(`| Baseline 6 pcs, 10 s study, 2.5 s rebuild per piece | ${placement.base} |`);
console.log(`| Twice the pieces (12) | ${placement.pieces} |`);
console.log(`| Half the study time (5 s) | ${placement.study} |`);
console.log(`| Half the rebuild time (1.25 s per piece) | ${placement.rebuild} |`);

const steady = trajectories["Steady Medium (6 pcs, 10 s)"];
const windowMean = (ratings, from, to) => ratings.slice(from, to).reduce((a, b) => a + b, 0) / (to - from);
const SEEDS = 20;
const drift =
  Array.from({ length: SEEDS }, (_, seed) => run(personas["Steady Medium (6 pcs, 10 s)"], 500, seed + 1).ratings)
    .map((ratings) => windowMean(ratings, 400, 500) - windowMean(ratings, 150, 250))
    .reduce((a, b) => a + b, 0) / SEEDS;
const improving = trajectories["Improving (skill 700 to 2200, board at rating)"].ratings;
const farmer = trajectories["Easy farmer (2 pcs, 2 s, always 100%)"].ratings;
const honest = run(fixed(1800, 12, 8)).ratings;
const ups = steady.changes.filter(({ change }) => change > 0).length;
const downs = steady.changes.filter(({ change }) => change < 0).length;
const allChanges = Object.values(trajectories).flatMap(({ changes }) => changes);
const maxRated = Math.max(...allChanges.filter(({ phase }) => phase === "rated").map(({ change }) => Math.abs(change)));
const maxPlacement = Math.max(...allChanges.filter(({ phase }) => phase === "placement").map(({ change }) => Math.abs(change)));
const spam = [
  trajectories["Empty-board spammer (32 pcs, 60 s, 0%)"],
  trajectories["Instant-submit cheater (32 pcs, 0.1 s, 0-6%)"],
].flatMap(({ changes }) => changes.map(({ change }) => change));

const properties = [
  [`Harder board, success gains more than a normal success (${harderWin} > ${normalWin})`, harderWin > normalWin],
  [`Harder board, failure loses less than a normal failure but still loses (${normalLoss} < ${harderLoss} < 0)`, harderLoss > normalLoss && harderLoss < 0],
  [`Easier board, success gains less than a normal success (${easierWin} < ${normalWin})`, easierWin < normalWin],
  [`Easier board, failure loses more than a normal failure (${easierLoss} < ${normalLoss})`, easierLoss < normalLoss],
  [`Empty or near-empty boards (≤40%) never gain: ${emptyGains} gains in ${emptyChecked} rounds`, emptyGains === 0],
  [`Empty-board spammer and instant-submit cheater never gain (best ${Math.max(...spam)})`, Math.max(...spam) <= 0],
  [`Easy farming at 100% (${farmer[499]}) stays below an honest Hard player at skill 1800 (${honest[499]}) after 500 rounds`, farmer[499] < honest[499]],
  [`Steady Medium plateaus: over ${SEEDS} seeds, mean of rounds 401-500 minus mean of 151-250 is ${drift.toFixed(1)} (|drift| < 15)`, Math.abs(drift) < 15],
  [`An improving player climbs (${improving[49]} at round 50 to ${improving[499]} at round 500)`, improving[499] - improving[49] > 600],
  [`Ratings move both ways: steady Medium had ${ups} rises and ${downs} falls`, ups > 50 && downs > 50],
  [`Placement ranks pieces > study > rebuild > baseline (${placement.pieces} > ${placement.study} > ${placement.rebuild} > ${placement.base})`,
    placement.pieces > placement.study && placement.study > placement.rebuild && placement.rebuild > placement.base],
  [`No rated round moves the rating more than 50 (largest ${maxRated})`, maxRated <= 50],
  [`No placement round moves the rating more than 250 (largest ${maxPlacement})`, maxPlacement <= 250],
];

console.log("\n## Properties\n");
for (const [label, ok] of properties) console.log(`- ${ok ? "PASS" : "FAIL"} ${label}`);
const failed = properties.filter(([, ok]) => !ok).length;
console.log(`\n${failed === 0 ? "All properties hold." : `${failed} properties fail.`}`);
process.exitCode = failed === 0 ? 0 : 1;
