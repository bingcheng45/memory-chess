// Plays synthetic players through the rating engine under two hidden truths and checks the properties the rating must hold.
// Usage: node scripts/rating/simulate.mjs [engine.ts]
// Exits non-zero when a property fails under the matched truth. Seeded, so every run prints the same tables.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const enginePath = resolve(process.argv[2] ?? "src/lib/game/rating.ts");
const engine = await import(pathToFileURL(enginePath).href);
const { ratingAfter, ratingPreview, suggestBoard, boardLevel, challengeOf, expectedAccuracy, isProvisional, NEW_PLAYER, STEADY_RD, PROVISIONAL_RD, RATING_MODEL, MAX_SKILL_RATING } = engine;

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
const gauss = (rng) => Math.sqrt(-2 * Math.log(rng() || 1e-12)) * Math.cos(2 * Math.PI * rng());
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const sd = (values) => Math.sqrt(mean(values.map((x) => (x - mean(values)) ** 2)));

// The players' truth, kept apart from the engine: a player recalls a board at their true skill 70% of the time, and the
// odds move along a logistic curve with the board's level. Two truths bracket how steeply recall falls with difficulty.
const LEVEL = (pieces, study) => 1000 + 550 * Math.log2(pieces / 6) + 150 * Math.log2(10 / Math.min(60, Math.max(1, study)));
const logistic = (slope) => (skill, level) => 1 / (1 + (3 / 7) * Math.exp(-slope * (skill - level)));
const TRUTHS = {
  T1: { name: "truth 1, steep: each piece on its own, odds x10 per 400", slope: Math.LN10 / 400, chunk: 1, noise: 0 },
  T2: { name: "truth 2, gentle: the leaderboard-fitted slope ln2/200, pieces in chunks of 3, round and board noise SD 80 each", slope: Math.LN2 / 200, chunk: 3, noise: 80 },
};
for (const truth of Object.values(TRUTHS)) truth.chance = logistic(truth.slope);
const MATCHED = Math.abs(TRUTHS.T2.slope - RATING_MODEL.kappa) < 1e-12 ? "T2" : "T1";

const MAX_PIECES = 32;
const RANGES = { pieces: { min: 2, max: MAX_PIECES }, seconds: { min: 2, max: 60 } };
const BOARD_PRESETS = [["Easy", 2, 10], ["Medium", 6, 10], ["Hard", 12, 8], ["Grandmaster", 20, 5], ["32 pcs, 1 s", MAX_PIECES, 1]];

function playRound(rng, truth, { skill, pieces, study, pace = 2.5, accuracy }) {
  const effective = skill + truth.noise * (gauss(rng) + gauss(rng));
  const chance = truth.chance(effective, LEVEL(pieces, study));
  let correct = 0;
  for (let i = 0; i < pieces; i += truth.chunk) if (rng() < chance) correct += Math.min(truth.chunk, pieces - i);
  return {
    pieceCount: pieces,
    studySeconds: study * (0.85 + 0.15 * rng()),
    rebuildSeconds: pieces * pace * (0.75 + 0.5 * rng()),
    accuracy: accuracy ?? Math.round((correct / pieces) * 100),
  };
}

const play = (rounds, from = NEW_PLAYER) =>
  rounds.reduce(
    ({ player, changes }, round) => {
      const result = ratingAfter(player, round);
      return { player: result.player, changes: [...changes, { change: result.change, provisional: isProvisional(player) }] };
    },
    { player: from, changes: [] },
  );

function run(persona, truth, rounds = 500, seed = 1) {
  const rng = mulberry32(seed);
  let player = NEW_PLAYER;
  const ratings = [];
  const changes = [];
  const played = [];
  for (let n = 1; n <= rounds; n += 1) {
    const round = persona.round(n, { rng, truth, player });
    const result = ratingAfter(player, round);
    changes.push({ change: result.change, provisional: isProvisional(player) });
    player = result.player;
    ratings.push(player.rating);
    played.push(round);
  }
  return { ratings, changes, rounds: played };
}

const fixed = (skill, pieces, study, extra = {}) => ({ skill: () => skill, round: (_n, c) => playRound(c.rng, c.truth, { skill, pieces, study, ...extra }) });

// The board a player picks to stay near 70%: more pieces until the board is full, then less study time.
function boardAt(skill) {
  const pieces = Math.min(MAX_PIECES, Math.max(2, Math.round(6 * 2 ** ((skill + 100 - 1000) / 550))));
  if (pieces < MAX_PIECES) return { pieces, study: 10 };
  return { pieces, study: Math.min(10, Math.max(1, 10 * 2 ** (-(skill + 100 - LEVEL(MAX_PIECES, 10)) / 150))) };
}
const improving = (skillAt, paceAt = () => 2.5) => ({
  skill: skillAt,
  round: (n, c) => playRound(c.rng, c.truth, { skill: skillAt(n), pace: paceAt(n), ...boardAt(skillAt(n)) }),
});
const ramp = (from, to, start, end) => (n) => from + (to - from) * Math.min(1, Math.max(0, (n - start) / (end - start)));
const paceFor = (skill) => Math.max(0.3, 2.5 * 2 ** (-(skill - 700) / 1500));
const climber = ramp(700, 3600, 0, 500);
const SANDBAG_CYCLE = 40;
const sandbagger = (tank) => ({
  skill: () => 1800,
  round: (n, c) => ((n - 1) % SANDBAG_CYCLE < SANDBAG_CYCLE / 2 && n > 100 ? tank(c) : playRound(c.rng, c.truth, { skill: 1800, pieces: 12, study: 8 })),
});
const follower = (skill) => ({
  skill: () => skill,
  round: (_n, c) => {
    const { pieceCount, studySeconds } = suggestBoard(c.player, RANGES);
    return playRound(c.rng, c.truth, { skill, pieces: pieceCount, study: studySeconds });
  },
});

// The skill at which a truth expects this accuracy on a board: what a player scoring it honestly is worth.
const skillFor = (truth, accuracy, pieces, study) => LEVEL(pieces, study) - Math.log((100 / accuracy - 1) * (7 / 3)) / truth.slope;

const personas = {
  "Steady Easy (2 pcs, 10 s, skill 500)": fixed(500, 2, 10),
  "Steady Medium (6 pcs, 10 s, skill 1200)": fixed(1200, 6, 10),
  "Steady Medium at skill 1450": fixed(1450, 6, 10),
  "Honest Hard (12 pcs, 8 s, skill 1800)": fixed(1800, 12, 8),
  "Steady Grandmaster (20 pcs, 5 s, skill 2300)": fixed(2300, 20, 5),
  "Follows the suggested board (skill 1500)": follower(1500),
  "Follows the suggested board (skill 2600)": follower(2600),
  "Improver 700 to 3600, past the 32-piece board": improving(climber, (n) => paceFor(climber(n))),
  "Plateau (700 to 2000 by round 200, then steady)": improving(ramp(700, 2000, 0, 200)),
  "Regression (2000, falls to 1000 over rounds 100-400)": improving(ramp(2000, 1000, 100, 400)),
  "Sandbagger, tanks Easy at 0% (20 of every 40)": sandbagger(() => ({ pieceCount: 2, studySeconds: 10, rebuildSeconds: 3, accuracy: 0 })),
  "Sandbagger, tanks Grandmaster at 30% (20 of every 40)": sandbagger((c) => ({ ...playRound(c.rng, c.truth, { skill: 1800, pieces: 20, study: 5 }), accuracy: 30 })),
  "Risk taker (Medium, Hard every 4th, skill 1450)": {
    skill: () => 1450,
    round: (n, c) => playRound(c.rng, c.truth, { skill: 1450, ...(n % 4 === 0 ? { pieces: 12, study: 8 } : { pieces: 6, study: 10 }) }),
  },
  "Alternator (Easy then Hard, skill 1450)": {
    skill: () => 1450,
    round: (n, c) => playRound(c.rng, c.truth, { skill: 1450, ...(n % 2 === 0 ? { pieces: 12, study: 8 } : { pieces: 2, study: 10 }) }),
  },
  "Easy farmer (2 pcs, 2 s, always 100%)": fixed(null, 2, 2, { accuracy: 100 }),
  "Done-early glance (6 pcs, Done at 1 s, 1 s a piece, always 100%)": { skill: () => null, round: () => ({ pieceCount: 6, studySeconds: 1, rebuildSeconds: 6, accuracy: 100 }) },
  "Perfect Hard (12 pcs, 8 s, 1 s a piece, always 100%)": { skill: () => null, round: () => ({ pieceCount: 12, studySeconds: 8, rebuildSeconds: 12, accuracy: 100 }) },
  "Honest early Done (6 pcs, Done at 6 s, 2 s a piece, skill 1450)": fixed(1450, 6, 6, { pace: 2 }),
  "Slow-round sandbagger (every other round the full 10 s and 4 s a piece, skill 1450)": {
    skill: () => 1450,
    round: (n, c) => playRound(c.rng, c.truth, n % 2 === 1 ? { skill: 1450, pieces: 6, study: 10, pace: 4 } : { skill: 1450, pieces: 6, study: 6, pace: 2 }),
  },
  "Empty-board spammer (32 pcs, 60 s, 0%)": fixed(null, 32, 60, { accuracy: 0, pace: 0.05 }),
  "Instant-submit cheater (32 pcs, 0.1 s, 0-6%)": {
    skill: () => null,
    round: (_n, c) => ({ pieceCount: 32, studySeconds: 0.1, rebuildSeconds: 0.2, accuracy: c.rng() < 0.5 ? 0 : 6 }),
  },
  "Hardest-board grinder (Medium at 1000 for 30 rounds, then 32 pcs, 1 s, 46-55%)": {
    skill: () => null,
    round: (n, c) =>
      n <= 30
        ? playRound(c.rng, c.truth, { skill: 1000, pieces: 6, study: 10 })
        : { pieceCount: 32, studySeconds: 1, rebuildSeconds: 32 * 2.5 * (0.75 + 0.5 * c.rng()), accuracy: 46 + Math.floor(c.rng() * 10) },
  },
};
const STEADY = [
  "Steady Easy (2 pcs, 10 s, skill 500)",
  "Steady Medium (6 pcs, 10 s, skill 1200)",
  "Steady Medium at skill 1450",
  "Honest Hard (12 pcs, 8 s, skill 1800)",
  "Steady Grandmaster (20 pcs, 5 s, skill 2300)",
  "Follows the suggested board (skill 1500)",
  "Follows the suggested board (skill 2600)",
];

const SEEDS = 100;
const cache = new Map();
const seeded = (name, truthKey, rounds = 500) => {
  const key = `${name}|${truthKey}|${rounds}`;
  if (!cache.has(key)) cache.set(key, Array.from({ length: SEEDS }, (_, seed) => run(personas[name], TRUTHS[truthKey], rounds, seed + 1)));
  return cache.get(key);
};
const windowMean = (ratings, from, to) => mean(ratings.slice(from, to));
const driftOf = (name, t, from = 150) => mean(seeded(name, t).map(({ ratings }) => windowMean(ratings, 400, 500) - windowMean(ratings, from, from + 100)));
const finalMean = (name, t) => mean(seeded(name, t).map(({ ratings }) => windowMean(ratings, 400, 500)));
const settleRound = (ratings, skill) => {
  for (let n = 10; n <= ratings.length; n += 1) if (Math.abs(windowMean(ratings, n - 10, n) - skill) <= 50) return n;
  return Infinity;
};
const fmt = (value, digits = 0) => (Number.isFinite(value) ? value.toFixed(digits) : "never");
const signed = (value) => (value > 0 ? `+${value}` : `${value}`);

console.log(`# Rating simulation\n`);
console.log(`Engine constants: ${JSON.stringify(RATING_MODEL)}`);
console.log(`Steady-state RD ${STEADY_RD.toFixed(1)}; provisional while RD > ${PROVISIONAL_RD.toFixed(1)}. Matched truth: ${MATCHED} (${TRUTHS[MATCHED].name}).`);

// Single rounds and the setup card, which no truth affects.
const R = 1200;
const established = { rating: R, rd: STEADY_RD, rounds: 100 };
const single = (pieceCount, studySeconds, accuracy, rebuildSeconds = pieceCount * 2.5) => ratingAfter(established, { pieceCount, studySeconds, rebuildSeconds, accuracy });

console.log(`\n## A ${R} player, established (RD ${STEADY_RD.toFixed(0)}), rebuild 2.5 s a piece: the change at each accuracy\n`);
console.log("| Board | Board rating | Expected | 100% | 95% | 80% | 50% | 20% | 0% |");
console.log("|---|---:|---:|---:|---:|---:|---:|---:|---:|");
const suggested = suggestBoard(established, RANGES);
for (const [label, pieces, study] of [...BOARD_PRESETS.slice(0, 4), [`Suggested`, suggested.pieceCount, suggested.studySeconds]]) {
  const board = { pieceCount: pieces, studySeconds: study };
  console.log(
    `| ${label} (${pieces} pcs, ${study} s) | ${Math.round(boardLevel(board))} | ${Math.round(100 * expectedAccuracy(R, boardLevel(board)))}% | ` +
      `${[100, 95, 80, 50, 20, 0].map((accuracy) => signed(single(pieces, study, accuracy).change)).join(" | ")} |`,
  );
}

const singleRows = [
  ["Normal win, 6 pcs 10 s, 100%", [6, 10, 100]],
  ["Normal fail, 6 pcs 10 s, 17%", [6, 10, 17]],
  ["Normal at a third, 6 pcs 10 s, 33%", [6, 10, 33]],
  ["Harder win, 10 pcs 10 s, 100%", [10, 10, 100]],
  ["Harder fail, 10 pcs 10 s, 20%", [10, 10, 20]],
  ["Easier win, 3 pcs 10 s, 100%", [3, 10, 100]],
  ["Easier fail, 3 pcs 10 s, 33%", [3, 10, 33]],
  ["Speed: normal 100%, rebuilt twice as fast", [6, 10, 100, 7.5]],
];
const singles = Object.fromEntries(singleRows.map(([label, args]) => [label, single(...args).change]));
const normalWin = singles["Normal win, 6 pcs 10 s, 100%"];
const normalLoss = singles["Normal fail, 6 pcs 10 s, 17%"];
const harderWin = singles["Harder win, 10 pcs 10 s, 100%"];
const harderLoss = singles["Harder fail, 10 pcs 10 s, 20%"];
const easierWin = singles["Easier win, 3 pcs 10 s, 100%"];
const easierLoss = singles["Easier fail, 3 pcs 10 s, 33%"];
const thirdLoss = singles["Normal at a third, 6 pcs 10 s, 33%"];
const speedWin = singles["Speed: normal 100%, rebuilt twice as fast"];

const PREVIEW_PLAYERS = [
  ["1000, new", NEW_PLAYER, []],
  ["1000, established", { rating: 1000, rd: STEADY_RD, rounds: 100 }, []],
  ["1200, established", established, []],
  ["1600, established", { rating: 1600, rd: STEADY_RD, rounds: 100 }, []],
];
console.log("\n## Setup-card preview by preset\n");
console.log("| Player | Preset | Board rating | Expected | Perfect gain | Max loss | Phase | Suggested board |");
console.log("|---|---|---:|---:|---:|---:|---|---|");
let previewChecked = 0;
let previewBreaches = 0;
for (const [label, player, recent] of PREVIEW_PLAYERS) {
  const tip = suggestBoard(player, RANGES);
  for (const [preset, pieceCount, studySeconds] of BOARD_PRESETS) {
    const p = ratingPreview(player, recent, { pieceCount, studySeconds });
    console.log(`| ${label} | ${preset} | ${p.difficultyRating} | ${p.expectedAccuracy}% | ${signed(p.perfectGain)} | ${signed(p.maxLoss)} | ${p.phase} | ${tip.pieceCount} pcs, ${tip.studySeconds} s |`);
    // The preview's promises: no round at the full study time and a rebuild no faster than 2.5 s a piece gains more than
    // the perfect gain, and no round at all loses more than the max loss.
    for (const study of [0.1, 1, 2, studySeconds / 2, studySeconds]) {
      for (const perPiece of [0.05, 0.25, 0.5, 1, 2.5, 5]) {
        for (const accuracy of [0, 40, 46, 70, 90, 100]) {
          const { change } = ratingAfter(player, { pieceCount, studySeconds: Math.min(study, studySeconds), rebuildSeconds: pieceCount * perPiece, accuracy });
          const promised = study >= studySeconds && perPiece >= 2.5;
          previewChecked += 1;
          if ((promised && change > p.perfectGain) || change < p.maxLoss) previewBreaches += 1;
        }
      }
    }
  }
}

console.log("\n## Suggested board by rating\n");
console.log("| Rating | While provisional (aims at 50%) | Established (aims at 75%) |");
console.log("|---:|---|---|");
for (const rating of [300, 700, 1000, 1200, 1600, 2000, 2600, 3200]) {
  const at = (player) => {
    const { pieceCount, studySeconds } = suggestBoard(player, RANGES);
    return `${pieceCount} pcs, ${studySeconds} s (${Math.round(100 * expectedAccuracy(rating, boardLevel({ pieceCount, studySeconds })))}%)`;
  };
  console.log(`| ${rating} | ${at({ ...NEW_PLAYER, rating })} | ${at({ rating, rd: STEADY_RD, rounds: 100 })} |`);
}

// Empty and near-empty boards across every piece count, study time, rating and uncertainty.
let emptyGains = 0;
let emptyChecked = 0;
for (let pieces = 2; pieces <= 32; pieces += 1) {
  for (const study of [0.1, 1, 5, 10, 60]) {
    for (const accuracy of [0, 10, 25, 40]) {
      for (const rating of [0, 400, 1000, 2000, 4000, 5000]) {
        for (const [rd, rounds] of [[350, 0], [250, 2], [150, 9], [STEADY_RD, 30], [STEADY_RD, 300]]) {
          const { change } = ratingAfter({ rating, rd, rounds }, { pieceCount: pieces, studySeconds: study, rebuildSeconds: 0.1, accuracy });
          emptyChecked += 1;
          if (change > 0) emptyGains += 1;
        }
      }
    }
  }
}

// A new player's first ten rounds at 90%, one dimension doubled each.
const firstTen = (pieces, study, perPiece) =>
  play(Array.from({ length: 10 }, () => ({ pieceCount: pieces, studySeconds: study, rebuildSeconds: pieces * perPiece, accuracy: 90 }))).player.rating;
const placement = { base: firstTen(6, 10, 2.5), pieces: firstTen(12, 10, 2.5), study: firstTen(6, 5, 2.5), rebuild: firstTen(6, 10, 1.25) };
console.log("\n## A new player after 10 rounds at 90%, one dimension doubled each\n");
console.log("| Player | Rating |");
console.log("|---|---:|");
console.log(`| Baseline 6 pcs, 10 s study, 2.5 s rebuild per piece | ${placement.base} |`);
console.log(`| Twice the pieces (12) | ${placement.pieces} |`);
console.log(`| Half the study time (5 s) | ${placement.study} |`);
console.log(`| Half the rebuild time (1.25 s per piece) | ${placement.rebuild} |`);

// The hardest board, 32 pieces studied for 1 s and rebuilt in 8 s, at accuracies from barely above empty to a coin flip.
const hardest = (accuracy) => ({ pieceCount: 32, studySeconds: 1, rebuildSeconds: 8, accuracy });
const hardestAccuracies = [41, 43, 44, 45, 46, 47, 48, 50, 52, 55];
const hardestPlaced = hardestAccuracies.map((accuracy) => play(Array.from({ length: 10 }, () => hardest(accuracy))).player.rating);
const hardestRated = hardestAccuracies.map((accuracy) => ratingAfter({ rating: 1000, rd: STEADY_RD, rounds: 100 }, hardest(accuracy)).change);
console.log("\n## The hardest board (32 pcs, 1 s study, 8 s rebuild) at 41-55%\n");
console.log(`| Accuracy | ${hardestAccuracies.map((a) => `${a}%`).join(" | ")} |`);
console.log(`|---|${hardestAccuracies.map(() => "---:").join("|")}|`);
console.log(`| A new player after 10 such rounds | ${hardestPlaced.join(" | ")} |`);
console.log(`| One round for an established 1000 | ${hardestRated.join(" | ")} |`);
const hardestSteps = hardestPlaced.slice(1).map((rating, i) => (rating - hardestPlaced[i]) / (hardestAccuracies[i + 1] - hardestAccuracies[i]));
const barelyAboveEmpty = Math.max(...hardestPlaced.slice(0, hardestAccuracies.indexOf(46) + 1));

// The same ten first rounds in two orders. The rating is sequential, so order may matter; this shows by how much.
const lucky = hardest(100);
const misses = Array.from({ length: 9 }, () => hardest(0));
const mixed = [[6, 10, 100], [12, 8, 55], [2, 10, 100], [20, 5, 40], [32, 1, 70], [6, 10, 0], [12, 8, 90], [20, 5, 100], [32, 1, 46], [6, 10, 83]].map(
  ([pieceCount, studySeconds, accuracy]) => ({ pieceCount, studySeconds, rebuildSeconds: pieceCount * 2, accuracy }),
);
const orders = {
  "100% first, then 9 at 0%": play([lucky, ...misses]).player.rating,
  "9 at 0%, then 100%": play([...misses, lucky]).player.rating,
  "Ten mixed boards": play(mixed).player.rating,
  "The same ten reversed": play([...mixed].reverse()).player.rating,
};
console.log("\n## A new player's first ten rounds in two orders (shown, not checked: the rating is sequential)\n");
console.log("| Ten rounds | Rating |");
console.log("|---|---:|");
for (const [label, rating] of Object.entries(orders)) console.log(`| ${label} | ${rating} |`);

// Random states and rounds: a round at 40% or under never raises the rating, a perfect round never lowers it.
const signRng = mulberry32(99);
let againstResult = 0;
const SIGN_SAMPLES = 20000;
for (let i = 0; i < SIGN_SAMPLES; i += 1) {
  const player = { rating: Math.round(5000 * signRng()), rd: 30 + 320 * signRng(), rounds: Math.floor(200 * signRng()) };
  const [, pieceCount, studySeconds] = BOARD_PRESETS[Math.floor(signRng() * BOARD_PRESETS.length)];
  const accuracy = signRng() < 0.5 ? Math.round(40 * signRng()) : 100;
  const { change } = ratingAfter(player, { pieceCount, studySeconds, rebuildSeconds: pieceCount * 5 * signRng(), accuracy });
  if ((accuracy <= 40 && change > 0) || (accuracy === 100 && change < 0)) againstResult += 1;
}

// The highest rating reachable: the hardest board's challenge (32 pieces, 1 s study, the fastest counted rebuild, a
// perfect score) plus the no-gain gap, plus the last perfect round from just under that gap, at the steady RD and at
// the widest RD a player can reach by playing rounds that teach the game nothing.
const fastestPace = (RATING_MODEL.referenceRebuildPerPiece * (1 + RATING_MODEL.rebuildBuffer)) / 2 ** RATING_MODEL.rebuildMaxHalvings;
const topRound = { pieceCount: 32, studySeconds: 1, rebuildSeconds: 32 * fastestPace, accuracy: 100 };
const topChallenge = challengeOf(topRound);
const highestFrom = (rd) => {
  let best = 0;
  for (let rating = Math.floor(topChallenge); rating < topChallenge + RATING_MODEL.noGainGap; rating += 1) {
    best = Math.max(best, ratingAfter({ rating, rd, rounds: 1000 }, topRound).rating);
  }
  return best;
};
let climb = { rating: 2000, rd: STEADY_RD, rounds: 100 };
for (let n = 0; n < 5000; n += 1) climb = ratingAfter(climb, topRound).player;
const highest = { steady: highestFrom(STEADY_RD), widest: highestFrom(RATING_MODEL.startRd), played: climb.rating };
console.log(`\n## The highest possible rating\n`);
console.log(
  `The hardest board's challenge is ${topChallenge.toFixed(0)} (32 pcs ${boardLevel({ pieceCount: 32, studySeconds: 1 }).toFixed(0)} + rebuild credit ${(topChallenge - boardLevel({ pieceCount: 32, studySeconds: 1 })).toFixed(0)}). ` +
    `No round gains from ${(topChallenge + RATING_MODEL.noGainGap).toFixed(0)} up. ` +
    `The last perfect round below that reaches ${highest.steady} at the steady RD and ${highest.widest} at the widest RD (${RATING_MODEL.startRd}). ` +
    `A player who scores 100% on that board every round from 2000 stops at ${highest.played} after 5000 rounds.`,
);

// Properties under both truths. Only the matched truth gates the exit code; the other shows what a wrong slope costs.
function propertiesUnder(t) {
  const steadyDrifts = ["Steady Easy (2 pcs, 10 s, skill 500)", "Steady Medium (6 pcs, 10 s, skill 1200)", "Steady Grandmaster (20 pcs, 5 s, skill 2300)"].map((name) => driftOf(name, t));
  const climbRuns = seeded("Improver 700 to 3600, past the 32-piece board", t);
  const climbFull = climbRuns.every(({ rounds }) => rounds.slice(349).every(({ pieceCount }) => pieceCount === MAX_PIECES));
  const climbGain = mean(climbRuns.map(({ ratings }) => ratings[499] - ratings[349]));
  const climbLate = mean(climbRuns.map(({ ratings }) => ratings[499] - ratings[449]));
  const plateau = driftOf("Plateau (700 to 2000 by round 200, then steady)", t, 250);
  const regression = mean(seeded("Regression (2000, falls to 1000 over rounds 100-400)", t).map(({ ratings }) => ratings[449] - ratings[99]));
  const trajectories = Object.keys(personas).map((name) => seeded(name, t)[0]);
  const allChanges = trajectories.flatMap(({ changes }) => changes);
  const maxEstablished = Math.max(...allChanges.filter(({ provisional }) => !provisional).map(({ change }) => Math.abs(change)));
  const maxProvisional = Math.max(...allChanges.filter(({ provisional }) => provisional).map(({ change }) => Math.abs(change)));
  const allRatings = trajectories.flatMap(({ ratings }) => ratings);
  const spam = ["Empty-board spammer (32 pcs, 60 s, 0%)", "Instant-submit cheater (32 pcs, 0.1 s, 0-6%)"].flatMap((name) => seeded(name, t).flatMap(({ changes }) => changes.map(({ change }) => change)));
  const sandbagNames = ["Sandbagger, tanks Easy at 0% (20 of every 40)", "Sandbagger, tanks Grandmaster at 30% (20 of every 40)"];
  const sandbagNet = sandbagNames.map((name) =>
    mean(seeded(name, t).flatMap(({ ratings }) => Array.from({ length: 9 }, (_, k) => ratings[100 + SANDBAG_CYCLE * (k + 1) - 1] - ratings[100 + SANDBAG_CYCLE * k - 1]))),
  );
  const sandbagEnds = sandbagNames.map((name) => mean(seeded(name, t).flatMap(({ ratings }) => Array.from({ length: 8 }, (_, k) => ratings[100 + SANDBAG_CYCLE * (k + 2) - 1]))));
  const honestHard = finalMean("Honest Hard (12 pcs, 8 s, skill 1800)", t);
  const farmer = finalMean("Easy farmer (2 pcs, 2 s, always 100%)", t);
  const sameSkill = finalMean("Steady Medium at skill 1450", t);
  const alternator = finalMean("Alternator (Easy then Hard, skill 1450)", t);
  const riskTaker = finalMean("Risk taker (Medium, Hard every 4th, skill 1450)", t);
  const alternatorDrift = driftOf("Alternator (Easy then Hard, skill 1450)", t);
  const riskDrift = driftOf("Risk taker (Medium, Hard every 4th, skill 1450)", t);
  const grinder = finalMean("Hardest-board grinder (Medium at 1000 for 30 rounds, then 32 pcs, 1 s, 46-55%)", t);
  const grinderSkill = skillFor(TRUTHS[t], 50.5, MAX_PIECES, 1);
  const barelySkill = skillFor(TRUTHS[t], 46, MAX_PIECES, 1);
  const biases = STEADY.map((name) => finalMean(name, t) - personas[name].skill(1));
  const glance = finalMean("Done-early glance (6 pcs, Done at 1 s, 1 s a piece, always 100%)", t);
  const perfectHard = finalMean("Perfect Hard (12 pcs, 8 s, 1 s a piece, always 100%)", t);
  const slowRounds = finalMean("Slow-round sandbagger (every other round the full 10 s and 4 s a piece, skill 1450)", t) - finalMean("Honest early Done (6 pcs, Done at 6 s, 2 s a piece, skill 1450)", t);
  const DRIFT = 15;
  const BIAS_BAND = 50;
  return [
    [`1. Steady players do not drift: rounds 401-500 minus 151-250 over ${SEEDS} seeds is ${steadyDrifts.map((d) => d.toFixed(1)).join(", ")} for Easy, Medium, Grandmaster (|drift| < ${DRIFT})`,
      steadyDrifts.every((d) => Math.abs(d) < DRIFT)],
    [`2. The improver keeps climbing on the full 32-piece board (32 pieces from round 350: ${climbFull}); +${climbGain.toFixed(0)} over rounds 350-500 and +${climbLate.toFixed(0)} over 450-500 (> 100 and > 20)`,
      climbFull && climbGain > 100 && climbLate > 20],
    [`3. A plateau holds: rounds 401-500 minus 251-350 is ${plateau.toFixed(1)} (|drift| < ${DRIFT})`, Math.abs(plateau) < DRIFT],
    [`4. A regressing player falls: ${regression.toFixed(0)} from round 100 to 450 (< -500)`, regression < -500],
    [`5a. Harder win gains more than a normal win (${harderWin} > ${normalWin})`, harderWin > normalWin],
    [`5b. Harder fail loses less than a normal fail but still loses (${normalLoss} < ${harderLoss} < 0)`, harderLoss > normalLoss && harderLoss < 0],
    [`5c. Easier win earns little: less than a normal win, never a loss (0 <= ${easierWin} < ${normalWin})`, easierWin < normalWin && easierWin >= 0],
    [`5d. Easier fail loses more than a normal fail at the same accuracy, 33% (${easierLoss} < ${thirdLoss})`, easierLoss < thirdLoss],
    [`5f. A faster rebuild earns a normal win a little more: ${speedWin} vs ${normalWin} (more, by at most 10)`, speedWin > normalWin && speedWin <= normalWin + 10],
    [`6a. Empty or near-empty boards (<=40%) never gain: ${emptyGains} gains in ${emptyChecked} rounds`, emptyGains === 0],
    [`6b. Empty-board spammer and instant-submit cheater never gain (best ${Math.max(...spam)})`, Math.max(...spam) <= 0],
    [`6c. Sandbag cycles never net a gain: ${sandbagNet.map((d) => d.toFixed(1)).join(", ")} per 40-round cycle (<= 2), cycle ends ${sandbagEnds.map((d) => d.toFixed(0)).join(", ")} vs honest ${honestHard.toFixed(0)} (+10 at most)`,
      sandbagNet.every((d) => d <= 2) && sandbagEnds.every((d) => d <= honestHard + 10)],
    [`6d. Mixing easy and hard boards at true skill does not drift up: alternator ${alternatorDrift.toFixed(1)}, risk taker ${riskDrift.toFixed(1)} (< ${DRIFT}); they end at ${alternator.toFixed(0)} and ${riskTaker.toFixed(0)} vs ${sameSkill.toFixed(0)} for steady Medium at the same skill (within +60)`,
      alternatorDrift < DRIFT && riskDrift < DRIFT && alternator < sameSkill + 60 && riskTaker < sameSkill + 60],
    [`6e. Easy farming at 100% (${farmer.toFixed(0)}) stays below an honest Hard player (${honestHard.toFixed(0)})`, farmer < honestHard],
    [`6f. No established round moves the rating more than ${RATING_MODEL.establishedCap} (largest ${maxEstablished}); no provisional round more than ${RATING_MODEL.provisionalCap} (largest ${maxProvisional})`,
      maxEstablished <= RATING_MODEL.establishedCap && maxProvisional <= RATING_MODEL.provisionalCap],
    [`7. A new player's first ten rounds rank pieces > study > rebuild > baseline (${placement.pieces} > ${placement.study} > ${placement.rebuild} > ${placement.base})`,
      placement.pieces > placement.study && placement.study > placement.rebuild && placement.rebuild > placement.base],
    [`8. Ratings stay within 0..${MAX_SKILL_RATING} (seen ${Math.min(...allRatings)}..${Math.max(...allRatings)})`, Math.min(...allRatings) >= 0 && Math.max(...allRatings) <= MAX_SKILL_RATING],
    [`9a. Ten rounds on the hardest board rate higher the more they scored, without a jump: ${hardestPlaced.join(", ")} for ${hardestAccuracies.join(", ")}% (never falls, at most 100 per point)`,
      hardestSteps.every((step) => step >= 0 && step <= 100)],
    [`9b. Barely above empty (41-46%) on the hardest board rates no higher than the skill 46% honestly shows (${barelyAboveEmpty} <= ${barelySkill.toFixed(0)} + ${BIAS_BAND})`, barelyAboveEmpty <= barelySkill + BIAS_BAND],
    [`9d. The hardest-board grinder at 46-55% ends no higher than the skill 50.5% honestly shows (${grinder.toFixed(0)} <= ${grinderSkill.toFixed(0)} + ${BIAS_BAND})`, grinder <= grinderSkill + BIAS_BAND],
    [`9e. The preview holds: ${previewBreaches} of ${previewChecked} rounds lose more than its max loss, or gain more than its perfect gain at the full study time and 2.5 s a piece or slower`, previewBreaches === 0],
    [`9f. No round at 40% or under raises the rating and no perfect round lowers it (${againstResult} of ${SIGN_SAMPLES} random states and rounds do)`, againstResult === 0],
    [`11a. A perfect glance at 6 pieces, Done at 1 s, settles at ${glance.toFixed(0)}: at most 1700 and at least 400 under a perfect Hard player (${perfectHard.toFixed(0)})`,
      glance <= 1700 && glance <= perfectHard - 400],
    [`11b. Slow rounds buy nothing: alternating the full look and 4 s a piece with honest rounds ends ${slowRounds.toFixed(0)} from always honest (at most +25)`, slowRounds <= 25],
    [`10. Steady players end near their true skill: bias over rounds 401-500 is ${biases.map((b) => b.toFixed(0)).join(", ")} (each within ±${BIAS_BAND})`, biases.every((b) => Math.abs(b) <= BIAS_BAND)],
  ];
}

for (const t of Object.keys(TRUTHS)) {
  console.log(`\n# ${t}: ${TRUTHS[t].name}${t === MATCHED ? " (matched to the engine)" : ""}\n`);
  const checkpoints = [1, 5, 10, 30, 50, 100, 200, 350, 500];
  console.log("## Trajectories (rating after round n, seed 1)\n");
  console.log(`| Persona | ${checkpoints.join(" | ")} | max up | max down |`);
  console.log(`|---|${checkpoints.map(() => "---:").join("|")}|---:|---:|`);
  for (const name of Object.keys(personas)) {
    const { ratings, changes } = seeded(name, t)[0];
    const deltas = changes.map(({ change }) => change);
    console.log(`| ${name} | ${checkpoints.map((n) => ratings[n - 1]).join(" | ")} | ${Math.max(0, ...deltas)} | ${Math.min(0, ...deltas)} |`);
  }
  console.log(`\n## Steady players over ${SEEDS} seeds: bias, convergence, error, volatility\n`);
  console.log("bias = mean rating over rounds 401-500 minus true skill; settle = median first round whose 10-round mean is within 50 of skill; provisional = median rounds until the rating stops being provisional; RMSE over seeds at round n; SD = per-seed SD over 401-500.\n");
  console.log("| Persona | bias | settle | provisional | RMSE@10 | RMSE@30 | RMSE@100 | RMSE@500 | SD | accuracy |");
  console.log("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
  const rows = STEADY.map((name) => {
    const skill = personas[name].skill(1);
    const rs = seeded(name, t);
    const rmse = (n) => Math.sqrt(mean(rs.map(({ ratings }) => (ratings[n - 1] - skill) ** 2)));
    const provisionalFor = median(rs.map(({ changes }) => changes.findIndex(({ provisional }) => !provisional)));
    const row = {
      bias: mean(rs.map(({ ratings }) => windowMean(ratings, 400, 500) - skill)),
      settle: median(rs.map(({ ratings }) => settleRound(ratings, skill))),
      sd: mean(rs.map(({ ratings }) => sd(ratings.slice(400)))),
    };
    console.log(
      `| ${name} | ${fmt(row.bias)} | ${fmt(row.settle)} | ${provisionalFor} | ${fmt(rmse(10))} | ${fmt(rmse(30))} | ${fmt(rmse(100))} | ${fmt(rmse(500))} | ${fmt(row.sd)} | ` +
        `${fmt(mean(rs.map(({ rounds }) => mean(rounds.slice(400).map(({ accuracy }) => accuracy)))))}% |`,
    );
    return row;
  });
  const steady1450 = finalMean("Steady Medium at skill 1450", t);
  console.log(
    `\nHeadline: mean |bias| ${fmt(mean(rows.map((r) => Math.abs(r.bias))))}, worst |bias| ${fmt(Math.max(...rows.map((r) => Math.abs(r.bias))))}, median settle ${fmt(median(rows.map((r) => r.settle)))}, ` +
      `mean SD ${fmt(mean(rows.map((r) => r.sd)))}; alternator minus steady 1450 ${fmt(finalMean("Alternator (Easy then Hard, skill 1450)", t) - steady1450)}, ` +
      `risk taker minus steady 1450 ${fmt(finalMean("Risk taker (Medium, Hard every 4th, skill 1450)", t) - steady1450)}.`,
  );
  console.log(`\n## Properties under ${t}\n`);
  const properties = propertiesUnder(t);
  for (const [label, ok] of properties) console.log(`- ${ok ? "PASS" : "FAIL"} ${label}`);
  const failed = properties.filter(([, ok]) => !ok).length;
  console.log(`\n${failed === 0 ? `All properties hold under ${t}.` : `${failed} properties fail under ${t}.`}`);
  if (t === MATCHED) process.exitCode = failed === 0 ? 0 : 1;
}
