// Plays synthetic players through the rating engine and checks the properties the rating must hold.
// Usage: node scripts/rating/simulate.mjs [engine.ts]
// Exits non-zero when a property fails. Seeded, so every run prints the same tables.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const enginePath = resolve(process.argv[2] ?? "src/lib/game/rating.ts");
const engine = await import(pathToFileURL(enginePath).href);
const { ratingAfter, ratingPreview, START_RATING, MAX_SKILL_RATING = 5000, NORM_ROUNDS = 30 } = engine;

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

// The players' truth, kept apart from the engine: a player recalls each piece with a 70% chance on a board at their
// true skill, and that chance moves along Elo's curve as the board gets harder or easier.
const LEVEL = (pieces, study) => 1000 + 550 * Math.log2(pieces / 6) + 150 * Math.log2(10 / Math.min(60, Math.max(1, study)));
const recallChance = (skill, pieces, study) => 1 / (1 + (3 / 7) * 10 ** ((LEVEL(pieces, study) - skill) / 400));
const MAX_PIECES = 32;

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
  const played = [];
  for (let n = 1; n <= rounds; n += 1) {
    const round = persona.round(n, rating, rng);
    const result = ratingAfter(rating, history, round);
    changes.push({ change: result.change, phase: result.phase });
    rating = result.rating;
    history = [round, ...history].slice(0, NORM_ROUNDS);
    ratings.push(rating);
    played.push(round);
  }
  return { ratings, changes, rounds: played };
}

const fixed = (skill, pieces, study, extra = {}) => ({ round: (_n, _r, rng) => playRound(rng, { skill, pieces, study, ...extra }) });

// The board a player picks to stay near 70%: more pieces until the board is full, then less study time.
function boardAt(skill) {
  const pieces = Math.min(MAX_PIECES, Math.max(2, Math.round(6 * 2 ** ((skill + 100 - 1000) / 550))));
  if (pieces < MAX_PIECES) return { pieces, study: 10 };
  const study = Math.min(10, Math.max(1, 10 * 2 ** (-(skill + 100 - LEVEL(MAX_PIECES, 10)) / 150)));
  return { pieces, study };
}
const improving = (skillAt, paceAt = () => 2.5) => ({
  round: (n, _r, rng) => playRound(rng, { skill: skillAt(n), pace: paceAt(n), ...boardAt(skillAt(n)) }),
});
const ramp = (from, to, start, end) => (n) => from + (to - from) * Math.min(1, Math.max(0, (n - start) / (end - start)));

// Faster at rebuilding as the skill grows, down to 0.3 s a piece.
const paceFor = (skill) => Math.max(0.3, 2.5 * 2 ** (-(skill - 700) / 1500));
const climber = ramp(700, 3600, 0, 500);
const SANDBAG_CYCLE = 40;
const sandbagger = (tank) => ({
  round: (n, _r, rng) => ((n - 1) % SANDBAG_CYCLE < SANDBAG_CYCLE / 2 && n > 100 ? tank(rng) : playRound(rng, { skill: 1800, pieces: 12, study: 8 })),
});

const personas = {
  "Steady Easy (2 pcs, 10 s, skill 500)": fixed(500, 2, 10),
  "Steady Medium (6 pcs, 10 s, skill 1200)": fixed(1200, 6, 10),
  "Steady Grandmaster (20 pcs, 5 s, skill 2300)": fixed(2300, 20, 5),
  "Improver 700 to 3600, past the 32-piece board": improving(climber, (n) => paceFor(climber(n))),
  "Plateau (700 to 2000 by round 200, then steady)": improving(ramp(700, 2000, 0, 200)),
  "Regression (2000, falls to 1000 over rounds 100-400)": improving(ramp(2000, 1000, 100, 400)),
  "Sandbagger, tanks Easy at 0% (20 of every 40)": sandbagger(() => ({ pieceCount: 2, studySeconds: 10, rebuildSeconds: 3, accuracy: 0 })),
  "Sandbagger, tanks Grandmaster at 30% (20 of every 40)": sandbagger((rng) => ({ ...playRound(rng, { skill: 1800, pieces: 20, study: 5 }), accuracy: 30 })),
  "Honest Hard (12 pcs, 8 s, skill 1800)": fixed(1800, 12, 8),
  "Risk taker (Medium, Hard every 4th, skill 1450)": {
    round: (n, _r, rng) => (n % 4 === 0 ? playRound(rng, { skill: 1450, pieces: 12, study: 8 }) : playRound(rng, { skill: 1450, pieces: 6, study: 10 })),
  },
  "Alternator (Easy then Hard, skill 1450)": {
    round: (n, _r, rng) => (n % 2 === 0 ? playRound(rng, { skill: 1450, pieces: 12, study: 8 }) : playRound(rng, { skill: 1450, pieces: 2, study: 10 })),
  },
  "Steady Medium at skill 1450": fixed(1450, 6, 10),
  "Easy farmer (2 pcs, 2 s, always 100%)": fixed(0, 2, 2, { accuracy: 100 }),
  "Empty-board spammer (32 pcs, 60 s, 0%)": fixed(0, 32, 60, { accuracy: 0, pace: 0.05 }),
  "Instant-submit cheater (32 pcs, 0.1 s, 0-6%)": {
    round: (_n, _r, rng) => ({ pieceCount: 32, studySeconds: 0.1, rebuildSeconds: 0.2, accuracy: rng() < 0.5 ? 0 : 6 }),
  },
};

const SEEDS = 20;
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const windowMean = (ratings, from, to) => mean(ratings.slice(from, to));
const seeded = (name, rounds = 500) => Array.from({ length: SEEDS }, (_, seed) => run(personas[name], rounds, seed + 1));
const driftOf = (name, from = 150) => mean(seeded(name).map(({ ratings }) => windowMean(ratings, 400, 500) - windowMean(ratings, from, from + 100)));
const finalMean = (name) => mean(seeded(name).map(({ ratings }) => windowMean(ratings, 400, 500)));

const checkpoints = [1, 10, 11, 30, 50, 100, 200, 300, 350, 400, 500];
const trajectories = Object.fromEntries(Object.entries(personas).map(([name, persona]) => [name, run(persona)]));

console.log("\n## Trajectories (rating after round n, seed 1)\n");
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
const single = (pieceCount, studySeconds, accuracy, rebuildSeconds = pieceCount * 2.5) =>
  ratingAfter(R, MEDIUM_NORM, { pieceCount, studySeconds, rebuildSeconds, accuracy });

const singleRows = [
  ["Normal win, 6 pcs 10 s, 100%", [6, 10, 100]],
  ["Normal, 6 pcs 10 s, 83% (their usual)", [6, 10, 83]],
  ["Normal fail, 6 pcs 10 s, 17%", [6, 10, 17]],
  ["Harder win, 10 pcs 10 s, 100%", [10, 10, 100]],
  ["Harder fail, 10 pcs 10 s, 20%", [10, 10, 20]],
  ["Easier win, 3 pcs 10 s, 100%", [3, 10, 100]],
  ["Easier fail, 3 pcs 10 s, 33%", [3, 10, 33]],
  ["Speed bonus: normal 100%, rebuilt twice as fast", [6, 10, 100, 7.5]],
  ["Harder by study: 6 pcs studied 5 s, 100%", [6, 5, 100]],
  ["Speed: normal 100%, rebuilt twice as slow", [6, 10, 100, 30]],
  ["Empty, 32 pcs 1 s", [32, 1, 0, 0.2]],
];
const singles = Object.fromEntries(singleRows.map(([label, args]) => [label, single(...args)]));
const normalWin = singles["Normal win, 6 pcs 10 s, 100%"].change;
const normalLoss = singles["Normal fail, 6 pcs 10 s, 17%"].change;
const harderWin = singles["Harder win, 10 pcs 10 s, 100%"].change;
const harderLoss = singles["Harder fail, 10 pcs 10 s, 20%"].change;
const easierWin = singles["Easier win, 3 pcs 10 s, 100%"].change;
const easierLoss = singles["Easier fail, 3 pcs 10 s, 33%"].change;
const speedWin = singles["Speed bonus: normal 100%, rebuilt twice as fast"].change;

console.log(`\n## Single rounds for a player rated ${R} whose last 30 rounds were Medium (6 pcs, ~9.5 s, 83% on average)\n`);
console.log("| Round | Change | Breakdown |");
console.log("|---|---:|---|");
const fmt = (value) => (typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(2)) : value);
const flat = (object) =>
  Object.entries(object)
    .map(([key, value]) => (typeof value === "object" ? `${key} {${flat(value)}}` : `${key} ${fmt(value)}`))
    .join(", ");
for (const [label, result] of Object.entries(singles)) console.log(`| ${label} | ${result.change} | ${flat(result.breakdown)} |`);

// Normal band: a board within 5% of the usual effective piece count is treated as normal.
const bandEdge = single(6.25, 10, 100);

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

// Sandbag cycles: from round 101 every 40 rounds is 20 tanked then 20 honest. The rating at the end of each cycle,
// averaged over seeds, must not stand above the rating at its start, nor above the honest player's.
const cycleNet = (name) =>
  mean(
    seeded(name).flatMap(({ ratings }) =>
      Array.from({ length: 9 }, (_, k) => ratings[100 + SANDBAG_CYCLE * (k + 1) - 1] - ratings[100 + SANDBAG_CYCLE * k - 1]),
    ),
  );
const cycleEnds = (name) =>
  mean(seeded(name).flatMap(({ ratings }) => Array.from({ length: 8 }, (_, k) => ratings[100 + SANDBAG_CYCLE * (k + 2) - 1])));
const honestHard = finalMean("Honest Hard (12 pcs, 8 s, skill 1800)");

// The improver who has filled the board: 32 pieces from round 350 on, still cutting study and rebuild time.
const climb = seeded("Improver 700 to 3600, past the 32-piece board");
const climbFull = climb.every(({ rounds }) => rounds.slice(349).every(({ pieceCount }) => pieceCount === MAX_PIECES));
const climbGain = mean(climb.map(({ ratings }) => ratings[499] - ratings[349]));
const climbLate = mean(climb.map(({ ratings }) => ratings[499] - ratings[449]));

// How long a strong improver takes to near the cap: keeps improving at the same pace for 3000 rounds.
const longClimber = ramp(700, 3600 + (2900 * 2500) / 500, 0, 3000);
const long = run(improving(longClimber, (n) => paceFor(longClimber(n))), 3000).ratings;
const nearCap = long.findIndex((rating) => rating >= MAX_SKILL_RATING * 0.9);
console.log(`\n## Approaching the ${MAX_SKILL_RATING} cap\n`);
console.log(
  `A player who keeps improving as fast as the 700-to-3600 improver for 3000 rounds stands at ${long[499]} after 500, ${long[999]} after 1000, ${long[1999]} after 2000 and ${long[2999]} after 3000 rounds; ` +
    (nearCap >= 0 ? `first reaching ${MAX_SKILL_RATING * 0.9} at round ${nearCap + 1}.` : `never reaching ${MAX_SKILL_RATING * 0.9} (highest ${Math.max(...long)}).`),
);

if (ratingPreview) {
  console.log("\n## Setup-card preview: the board's rating and this round's range\n");
  console.log("| Player | Preset | Board rating | Max gain | Max loss | Phase |");
  console.log("|---|---|---:|---:|---:|---|");
  const presets = [["Easy", 2, 10], ["Medium", 6, 10], ["Hard", 12, 8], ["Grandmaster", 20, 5]];
  for (const [label, rating, history] of [["1000, new", 1000, []], ["1000, Medium norm", 1000, MEDIUM_NORM], ["1600, Medium norm", 1600, MEDIUM_NORM]]) {
    for (const [preset, pieceCount, studySeconds] of presets) {
      const p = ratingPreview(rating, history, { pieceCount, studySeconds });
      console.log(`| ${label} | ${preset} | ${p.difficultyRating} | +${p.maxGain} | ${p.maxLoss} | ${p.phase} |`);
    }
  }
}

const allChanges = Object.values(trajectories).flatMap(({ changes }) => changes);
const maxRated = Math.max(...allChanges.filter(({ phase }) => phase === "rated").map(({ change }) => Math.abs(change)));
const maxPlacement = Math.max(...allChanges.filter(({ phase }) => phase === "placement").map(({ change }) => Math.abs(change)));
const allRatings = Object.values(trajectories).flatMap(({ ratings }) => ratings).concat(long);
const spam = [
  trajectories["Empty-board spammer (32 pcs, 60 s, 0%)"],
  trajectories["Instant-submit cheater (32 pcs, 0.1 s, 0-6%)"],
].flatMap(({ changes }) => changes.map(({ change }) => change));
const farmer = finalMean("Easy farmer (2 pcs, 2 s, always 100%)");
const steadyNames = ["Steady Easy (2 pcs, 10 s, skill 500)", "Steady Medium (6 pcs, 10 s, skill 1200)", "Steady Grandmaster (20 pcs, 5 s, skill 2300)"];
const steadyDrifts = steadyNames.map((name) => driftOf(name));
const plateau = driftOf("Plateau (700 to 2000 by round 200, then steady)", 250);
const regression = mean(seeded("Regression (2000, falls to 1000 over rounds 100-400)").map(({ ratings }) => ratings[449] - ratings[99]));
const alternatorDrift = driftOf("Alternator (Easy then Hard, skill 1450)");
const riskDrift = driftOf("Risk taker (Medium, Hard every 4th, skill 1450)");
const sameSkill = finalMean("Steady Medium at skill 1450");
const alternator = finalMean("Alternator (Easy then Hard, skill 1450)");
const riskTaker = finalMean("Risk taker (Medium, Hard every 4th, skill 1450)");
const sandbagNames = ["Sandbagger, tanks Easy at 0% (20 of every 40)", "Sandbagger, tanks Grandmaster at 30% (20 of every 40)"];
const sandbagNet = sandbagNames.map(cycleNet);
const sandbagEnds = sandbagNames.map(cycleEnds);
const DRIFT = 15;

const properties = [
  [`1. Steady players do not drift: rounds 401-500 minus 151-250 over ${SEEDS} seeds is ${steadyDrifts.map((d) => d.toFixed(1)).join(", ")} for Easy, Medium, Grandmaster (|drift| < ${DRIFT})`,
    steadyDrifts.every((d) => Math.abs(d) < DRIFT)],
  [`2. The improver keeps climbing on the full 32-piece board (32 pieces from round 350: ${climbFull}); +${climbGain.toFixed(0)} over rounds 350-500 and +${climbLate.toFixed(0)} over 450-500 (> 100 and > 20)`,
    climbFull && climbGain > 100 && climbLate > 20],
  [`3. A plateau holds: rounds 401-500 minus 251-350 is ${plateau.toFixed(1)} (|drift| < ${DRIFT})`, Math.abs(plateau) < DRIFT],
  [`4. A regressing player falls: ${regression.toFixed(0)} from round 100 to 450 (< -500)`, regression < -500],
  [`5a. Harder win gains more than a normal win (${harderWin} > ${normalWin})`, harderWin > normalWin],
  [`5b. Harder fail loses less than a normal fail but still loses (${normalLoss} < ${harderLoss} < 0)`, harderLoss > normalLoss && harderLoss < 0],
  [`5c. Easier win earns little: less than a normal win, never a loss (0 <= ${easierWin} < ${normalWin})`, easierWin < normalWin && easierWin >= 0],
  [`5d. Easier fail loses more than a normal fail (${easierLoss} < ${normalLoss})`, easierLoss < normalLoss],
  [`5e. A board 4% bigger than usual is still normal (${bandEdge.breakdown.risk?.direction ?? "?"})`, bandEdge.breakdown.risk?.direction === "normal"],
  [`5f. Speed varies a normal win slightly: ${speedWin} vs ${normalWin} (within 15%, rounded)`, speedWin > normalWin && speedWin <= Math.ceil(normalWin * 1.15) + 1],
  [`6a. Empty or near-empty boards (<=40%) never gain: ${emptyGains} gains in ${emptyChecked} rounds`, emptyGains === 0],
  [`6b. Empty-board spammer and instant-submit cheater never gain (best ${Math.max(...spam)})`, Math.max(...spam) <= 0],
  [`6c. Sandbag cycles never net a gain: ${sandbagNet.map((d) => d.toFixed(1)).join(", ")} per 40-round cycle (<= 2), cycle ends ${sandbagEnds.map((d) => d.toFixed(0)).join(", ")} vs honest ${honestHard.toFixed(0)}`,
    sandbagNet.every((d) => d <= 2) && sandbagEnds.every((d) => d <= honestHard + 10)],
  [`6d. Mixing easy and hard boards at true skill does not drift up: alternator ${alternatorDrift.toFixed(1)}, risk taker ${riskDrift.toFixed(1)} (< ${DRIFT}); they end at ${alternator.toFixed(0)} and ${riskTaker.toFixed(0)} vs ${sameSkill.toFixed(0)} for steady Medium at the same skill (within +60)`,
    alternatorDrift < DRIFT && riskDrift < DRIFT && alternator < sameSkill + 60 && riskTaker < sameSkill + 60],
  [`6e. Easy farming at 100% (${farmer.toFixed(0)}) stays below an honest Hard player (${honestHard.toFixed(0)})`, farmer < honestHard],
  [`6f. No rated round moves the rating more than 50 (largest ${maxRated}); no placement round more than 250 (largest ${maxPlacement})`, maxRated <= 50 && maxPlacement <= 250],
  [`7. Placement ranks pieces > study > rebuild > baseline (${placement.pieces} > ${placement.study} > ${placement.rebuild} > ${placement.base})`,
    placement.pieces > placement.study && placement.study > placement.rebuild && placement.rebuild > placement.base],
  [`8. Ratings stay within 0..${MAX_SKILL_RATING} (seen ${Math.min(...allRatings)}..${Math.max(...allRatings)})`,
    Math.min(...allRatings) >= 0 && Math.max(...allRatings) <= MAX_SKILL_RATING],
];

console.log("\n## Properties\n");
for (const [label, ok] of properties) console.log(`- ${ok ? "PASS" : "FAIL"} ${label}`);
const failed = properties.filter(([, ok]) => !ok).length;
console.log(`\n${failed === 0 ? "All properties hold." : `${failed} properties fail.`}`);
process.exitCode = failed === 0 ? 0 : 1;
