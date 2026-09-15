import { Chess, SQUARES, type PieceSymbol, type Square } from "chess.js";
import en from "../../../../../messages/en.json";
import {
  ACCURACY_BANDS,
  MEMORIZE_SECONDS_RANGE,
  PIECE_COUNT_RANGE,
  accuracyBandKey,
  type AccuracyBandKey,
} from "@/lib/reference/facts";
import { useGameStore } from "@/lib/store/gameStore";
import { DIFFICULTY_PRESETS } from "@/types/game";
import { LEARN_GUIDES, LEARN_POSITIONS } from "../guides";
import type { LearnPosition, PieceToken, PositionClaim, Side } from "../positions";
import type { LearnBlock, LearnGuide } from "../schema";

function blockText(block: LearnBlock): string[] {
  switch (block.kind) {
    case "paragraphs":
      return block.paragraphs;
    case "steps":
      return block.items;
    case "callout":
      return [block.title, block.body];
    case "drills":
      return block.drills.flatMap((drill) => [
        drill.title,
        drill.description,
        drill.duration,
        drill.goal,
        drill.ctaLabel,
      ]);
    case "comparison":
      return [...block.columns, ...block.rows.flatMap((row) => [row.label, row.struggling, row.stronger])];
    case "plan":
      return block.steps.flatMap((step) => [step.label, step.duration, step.detail]);
  }
}

function guideText(guide: LearnGuide): string {
  return [
    guide.title,
    guide.description,
    guide.quickAnswer,
    ...(guide.keyTakeaways ?? []),
    ...guide.sections.flatMap((section) => [
      section.title,
      section.summary ?? "",
      ...section.blocks.flatMap(blockText),
    ]),
    ...guide.faq.flatMap((entry) => [entry.question, entry.answer]),
  ].join("\n");
}

function sectionText(guide: LearnGuide, sectionId: string): string {
  const section = guide.sections.find(({ id }) => id === sectionId);
  if (!section) throw new Error(`${guide.slug} has no section ${sectionId}`);
  return [section.title, section.summary ?? "", ...section.blocks.flatMap(blockText)].join("\n");
}

const PIECE_TYPES: Record<string, PieceSymbol> = { K: "k", Q: "q", R: "r", B: "b", N: "n" };
const tokenSquare = (token: PieceToken): Square => SQUARES.find((square) => token.endsWith(square))!;
const other = (side: Side): Side => (side === "w" ? "b" : "w");
const withoutMark = (san: string) => san.replace(/[+#]$/, "");
const destination = (san: string) => san.match(/[a-h][1-8]/g)!.at(-1)!;
const sameSet = (a: readonly string[], b: readonly string[]) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

function buildPosition(position: LearnPosition): Chess {
  let chess: Chess;
  if (!position.white && !position.black) {
    chess = new Chess();
  } else {
    const board = new Chess();
    board.clear();
    for (const [color, tokens] of [
      ["w", position.white ?? []],
      ["b", position.black ?? []],
    ] as const) {
      for (const token of tokens) {
        const type = token.length === 2 ? "p" : PIECE_TYPES[token[0]];
        if (!board.put({ type, color }, tokenSquare(token))) {
          throw new Error(`${position.id}: cannot put ${color}${token}`);
        }
      }
    }
    const placement = board.fen().split(" ")[0];
    chess = new Chess(`${placement} ${position.toMove ?? "w"} - - 0 1`, { skipValidation: true });
  }
  for (const move of position.line ?? []) chess.move(move);
  return chess;
}

function occupantOf(chess: Chess, square: Square): string | null {
  const piece = chess.get(square);
  return piece ? `${piece.color}${piece.type}` : null;
}

function sideSquares(chess: Chess, side: Side): Square[] {
  return SQUARES.filter((square) => chess.get(square)?.color === side);
}

function hasMove(chess: Chess, san: string): boolean {
  return chess.moves().some((move) => withoutMark(move) === withoutMark(san));
}

function attackersOf(chess: Chess, square: Square, side: Side): Square[] {
  return chess.attackers(square, side);
}

/** Returns what is wrong with the claim, or null when it holds. */
function failure(chess: Chess, claim: PositionClaim): string | null {
  const holds = (ok: boolean, detail: string) => (ok ? null : detail);
  switch (claim.kind) {
    case "pieceCount": {
      const count = SQUARES.filter((square) => chess.get(square)).length;
      return holds(count === claim.count, `${count} pieces, not ${claim.count}`);
    }
    case "noCheck": {
      const checked = (["w", "b"] as const).filter((side) =>
        sideSquares(chess, side).some(
          (square) => chess.get(square)?.type === "k" && chess.isAttacked(square, other(side)),
        ),
      );
      return holds(checked.length === 0, `king in check: ${checked.join()}`);
    }
    case "check":
      return holds(chess.inCheck(), "side to move is not in check");
    case "mate":
      return holds(chess.isCheckmate(), "not checkmate");
    case "occupant": {
      const found = occupantOf(chess, claim.square);
      return holds(found === claim.piece, `${claim.square} holds ${found}`);
    }
    case "legal":
      return holds(hasMove(chess, claim.move), `${claim.move} is illegal; moves ${chess.moves().join(" ")}`);
    case "illegal":
      return holds(!hasMove(chess, claim.move), `${claim.move} is legal`);
    case "attacks": {
      const color = chess.get(claim.from)?.color;
      if (!color) return `no piece on ${claim.from}`;
      const missed = claim.squares.filter((square) => !attackersOf(chess, square, color).includes(claim.from));
      return holds(missed.length === 0, `${claim.from} does not attack ${missed.join()}`);
    }
    case "attackers": {
      const found = attackersOf(chess, claim.square, claim.side);
      return holds(sameSet(found, claim.from), `${claim.side} attackers of ${claim.square}: ${found.join() || "none"}`);
    }
    case "attacked": {
      const found = sideSquares(chess, claim.side).filter((square) => chess.isAttacked(square, other(claim.side)));
      return holds(sameSet(found, claim.squares), `attacked ${claim.side} pieces: ${found.join() || "none"}`);
    }
    case "immobile": {
      const moves = chess.moves({ square: claim.square });
      return holds(moves.length === 0, `${claim.square} can play ${moves.join(" ")}`);
    }
    case "replies": {
      const replies = chess.moves();
      const nonKing = replies.filter((move) => !move.startsWith("K")).map(withoutMark);
      if (!sameSet(nonKing, claim.nonKing)) return `non-king replies: ${nonKing.join(" ") || "none"}`;
      const broken = replies.filter((reply) => {
        const after = new Chess(chess.fen(), { skipValidation: true });
        after.move(reply);
        if (!hasMove(after, claim.then)) return true;
        if (!claim.undefended) return false;
        const owner = after.get(claim.undefended)?.color;
        return !owner || attackersOf(after, claim.undefended, owner).length > 0;
      });
      return holds(broken.length === 0, `fails after ${broken.join(" ")}`);
    }
    case "material": {
      const types = (side: Side) =>
        sideSquares(chess, side)
          .map((square) => chess.get(square)!.type)
          .sort()
          .join("");
      return holds(
        types("w") === claim.white && types("b") === claim.black,
        `white ${types("w")}, black ${types("b")}`,
      );
    }
    case "reach": {
      const color = chess.get(claim.square)?.color;
      if (!color) return `no piece on ${claim.square}`;
      const found = SQUARES.filter(
        (square) => square !== claim.square && attackersOf(chess, square, color).includes(claim.square),
      );
      return holds(sameSet(found, claim.squares), `${claim.square} reaches ${found.join()}`);
    }
    case "squareColour": {
      const wrong = claim.squares.filter((square) => chess.squareColor(square) !== claim.colour);
      return holds(wrong.length === 0, `not ${claim.colour}: ${wrong.join()}`);
    }
  }
}

function claimSquares(claim: PositionClaim): string[] {
  switch (claim.kind) {
    case "occupant":
    case "immobile":
      return [claim.square];
    case "legal":
    case "illegal":
      return [destination(claim.move)];
    case "attacks":
      return [claim.from, ...claim.squares];
    case "attackers":
      return [claim.square, ...claim.from];
    case "attacked":
    case "squareColour":
      return claim.squares;
    case "replies":
      return [...claim.nonKing.map(destination), destination(claim.then), ...(claim.undefended ? [claim.undefended] : [])];
    case "reach":
      return [claim.square, ...claim.squares];
    default:
      return [];
  }
}

const namesSquare = (text: string, square: string) => new RegExp(`(^|[^a-h0-9])${square}([^0-9]|$)`).test(text);

const positionCases = LEARN_GUIDES.flatMap((guide) =>
  (LEARN_POSITIONS[guide.slug] ?? []).map((position) => ({ guide, position })),
);

describe("guide chess positions", () => {
  it("has a position list for every guide", () => {
    expect(Object.keys(LEARN_POSITIONS).sort()).toEqual(LEARN_GUIDES.map(({ slug }) => slug).sort());
    expect(positionCases.length).toBeGreaterThan(0);
  });

  it.each(positionCases.map((entry) => [`${entry.guide.slug} ${entry.position.id}`, entry] as const))(
    "%s holds every claim the guide makes",
    (_label, { position }) => {
      const chess = buildPosition(position);
      const failures = position.claims
        .map((claim) => [claim.kind, failure(chess, claim)] as const)
        .filter(([, detail]) => detail !== null)
        .map(([kind, detail]) => `${kind}: ${detail}`);

      expect(failures).toEqual([]);
    },
  );

  it.each(positionCases.map((entry) => [`${entry.guide.slug} ${entry.position.id}`, entry] as const))(
    "%s names its squares in the section that states it",
    (_label, { guide, position }) => {
      const text = sectionText(guide, position.sectionId);
      const unstated = new Set(position.unstated ?? []);
      const stated = [...(position.white ?? []), ...(position.black ?? [])]
        .map(tokenSquare)
        .filter((square) => !unstated.has(square));
      const squares = [...new Set([...stated, ...position.claims.flatMap(claimSquares)])];

      expect(squares.filter((square) => !namesSquare(text, square))).toEqual([]);
    },
  );
});

describe("board rules the coordinates guide states", () => {
  it("dark squares are the ones whose file number plus rank is even", () => {
    const board = new Chess();
    const wrong = SQUARES.filter(
      (square) =>
        ((square.charCodeAt(0) - 96 + Number(square[1])) % 2 === 0) !== (board.squareColor(square) === "dark"),
    );

    expect(wrong).toEqual([]);
  });

  it("a knight always lands on the other colour", () => {
    const board = new Chess();
    const same = SQUARES.flatMap((from) => {
      const knight = new Chess();
      knight.clear();
      knight.put({ type: "n", color: "w" }, from);
      return SQUARES.filter(
        (square) =>
          knight.attackers(square, "w").includes(from) && board.squareColor(square) === board.squareColor(from),
      ).map((square) => `${from}-${square}`);
    });

    expect(same).toEqual([]);
  });

  it("a rook on an empty board sees fourteen squares from any square", () => {
    const counts = SQUARES.map((from) => {
      const board = new Chess();
      board.clear();
      board.put({ type: "r", color: "w" }, from);
      return SQUARES.filter((square) => board.attackers(square, "w").includes(from)).length;
    });

    expect(new Set(counts)).toEqual(new Set([14]));
  });
});

/**
 * Accuracy the game gives for `correct` of `total` pieces. With `extra`, the
 * board is filled to the count with wrong pieces and `extra` more go on top,
 * since only pieces beyond the count are charged.
 */
function accuracy(correct: number, total: number, extra = 0): number {
  const store = useGameStore.getState();
  store.startGame(total, 10);
  store.startSolutionPhase();
  const original = new Chess(useGameStore.getState().gameState.originalPosition!, { skipValidation: true });
  const occupied = SQUARES.filter((square) => original.get(square));
  const empty = SQUARES.filter((square) => !original.get(square));
  const fenChar = (square: Square) => {
    const piece = original.get(square)!;
    return piece.color === "w" ? piece.type.toUpperCase() : piece.type;
  };

  occupied.slice(0, correct).forEach((square) => useGameStore.getState().placePiece(square, fenChar(square)));
  const wrong = extra > 0 ? total - correct + extra : 0;
  empty.slice(0, wrong).forEach((square) => useGameStore.getState().placePiece(square, "N"));
  useGameStore.getState().submitSolution(1);

  const result = useGameStore.getState().gameState;
  expect(result.correctPlacements).toBe(correct);
  const score = result.accuracy!;
  useGameStore.getState().resetGame();
  return score;
}

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];
const word = (n: number) => NUMBER_WORDS[n];

const label = (key: AccuracyBandKey) => en.game.result.messages[key].replace(/[^A-Za-z ]/g, "").trim();
const band = (score: number) => label(accuracyBandKey(score));
const minAccuracy = (key: AccuracyBandKey) => ACCURACY_BANDS.find((entry) => entry.key === key)!.minAccuracy;

function guideFacts(): Record<string, string[]> {
  const { easy, medium, hard, grandmaster } = DIFFICULTY_PRESETS;
  const penalty = accuracy(6, 6) - accuracy(6, 6, 1);
  const at = (correct: number, total: number, extra = 0) => accuracy(correct, total, extra);
  const row = (correct: number, total: number) => `${at(correct, total)} percent, ${band(at(correct, total))}`;
  const fewestForExcellent = [...Array(13).keys()].find((n) => at(n, 12) >= minAccuracy("excellent"));

  return {
    "chess-memory-training": [
      `takes ${word(penalty)} points off your accuracy`,
      `with five correct from ${at(5, 6)} percent into ${at(5, 6, 1)}`,
      `${minAccuracy("perfect")} percent is ${label("perfect")}, ${minAccuracy("excellent")} or more is ${label("excellent")}, ${minAccuracy("great")} is ${label("great")}, ${minAccuracy("wellDone")} is ${label("wellDone")} and ${minAccuracy("goodEffort")} is ${label("goodEffort")}`,
      `below ${minAccuracy("goodEffort")} the screen says ${label("keepPracticing")}`,
      `the only ${word(ACCURACY_BANDS.length)} messages`,
      `six correct is ${at(6, 6)} percent. five is ${at(5, 6)}, ${band(at(5, 6))}. four is ${at(4, 6)}, ${band(at(4, 6))}. three is ${at(3, 6)}, one piece from ${band(at(2, 6))}`,
      `excellent memory needs all six correct, because five correct rounds to ${at(5, 6)}`,
      `six correct plus one invented piece also shows ${band(at(6, 6, 1))}, at ${at(6, 6, 1)}`,
      `eleven correct is ${at(11, 12)} and ${band(at(11, 12))}. ten is ${at(10, 12)}. nine is ${at(9, 12)}, ${band(at(9, 12))}`,
      row(5, 6),
      row(11, 12),
      row(4, 6),
      row(10, 12),
      row(3, 6),
      row(9, 12),
      `one missed piece already costs ${at(6, 6) - at(5, 6)} points`,
      `${label("excellent")}, which at this count means at least ${fewestForExcellent} of the 12`,
      `the piece slider runs from ${PIECE_COUNT_RANGE.min} to ${PIECE_COUNT_RANGE.max}`,
      `counts other than ${easy.pieceCount}, ${medium.pieceCount}, ${hard.pieceCount} and ${grandmaster.pieceCount}`,
      `below ${label("wellDone")}, which is ${minAccuracy("wellDone")} percent`,
      `the look slider runs from ${MEMORIZE_SECONDS_RANGE.min} to ${MEMORIZE_SECONDS_RANGE.max} seconds`,
      `${word(grandmaster.pieceCount)} pieces in ${word(grandmaster.memorizeTime)} seconds`,
      `until ${hard.pieceCount} pieces at ${hard.memorizeTime} seconds`,
      `${word(hard.pieceCount)} pieces in ${word(hard.memorizeTime)} seconds leaves two thirds of a second per piece`,
      `piece by piece, ${hard.pieceCount} pieces in ${hard.memorizeTime} seconds leaves two thirds of a second each`,
    ],
    "how-many-chess-puzzles-a-day": [
      `one missed piece turns a ${label("perfect")} into ${band(at(5, 6))} at ${at(5, 6)} percent, and a second miss gives ${band(at(4, 6))} at ${at(4, 6)} percent`,
      `three rounds give you ${3 * medium.pieceCount} pieces`,
    ],
    "how-to-stop-blundering-in-chess": [
      `takes ${word(penalty)} points off your accuracy`,
      `costs ${word(penalty)} accuracy points on top`,
    ],
    "how-to-get-better-at-chess-for-beginners": [
      `put five pieces on a 4-piece round and ${word(at(4, 4) - at(4, 4, 1))} points come off your accuracy`,
    ],
    "chess-visualization-exercises": [
      `accuracy drops ${word(penalty)} points`,
      `${word(penalty)} accuracy points gone`,
      `at ${at(4, 6)}% on six pieces`,
    ],
    "chess-calculation-exercises-for-beginners": [
      `each extra piece costs ${word(penalty)} accuracy points`,
      `${word(hard.pieceCount - 1)} pieces, one short of the hard preset`,
    ],
    "chess-pattern-recognition-drills": [
      `${word(grandmaster.pieceCount)} pieces in ${word(grandmaster.memorizeTime)} seconds is a quarter of a second per piece`,
      `at least ${minAccuracy("goodEffort")} percent on the second round, which the result screen calls ${label("goodEffort")}`,
      `on a ${hard.pieceCount}-piece board the ${word(hard.pieceCount - 2)} pieces beyond the kings`,
    ],
    "why-puzzle-rating-doesnt-transfer-to-games": [
      `a hard preset of ${hard.pieceCount} pieces with ${hard.memorizeTime} seconds to look`,
    ],
    "how-to-see-the-whole-board-in-chess": [
      `${word(hard.pieceCount)} pieces in ${word(hard.memorizeTime)} seconds is one of the game's ${word(Object.keys(DIFFICULTY_PRESETS).length)} presets`,
    ],
    "20-minute-daily-chess-study-plan": [
      `the medium preset in memory chess is ${medium.pieceCount} pieces with ${medium.memorizeTime} seconds to look`,
    ],
    "how-to-analyze-chess-games-for-beginners": [
      `start at 8 pieces with ${medium.memorizeTime} seconds. that is ${word(8 - medium.pieceCount)} more pieces than the ${medium.pieceCount}-piece medium preset`,
    ],
    "blindfold-chess-training-for-beginners": [
      `the easiest preset in memory chess is ${easy.pieceCount} pieces`,
      `stage one uses ${easy.pieceCount} pieces`,
    ],
  };
}

describe("guide game facts", () => {
  let logSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it("states scoring, bands and presets as the game code computes them", () => {
    const facts = guideFacts();
    const missing = Object.entries(facts).flatMap(([slug, sentences]) => {
      const guide = LEARN_GUIDES.find((entry) => entry.slug === slug);
      if (!guide) return [`no guide ${slug}`];
      const text = guideText(guide).toLowerCase();
      return sentences.filter((sentence) => !text.includes(sentence.toLowerCase())).map((sentence) => `${slug}: "${sentence}"`);
    });

    expect(missing).toEqual([]);
  });
});

/**
 * Minutes one round takes at each setup: the look, placing the pieces and
 * reading the result. One figure per setup keeps every guide's estimate for
 * the same round consistent.
 */
const MINUTES_PER_ROUND: Record<string, number> = {
  "2/10": 0.5,
  "4/10": 0.8,
  "4/12": 0.8,
  "6/6": 0.8,
  "6/10": 1,
  "6/20": 1.2,
  "8/10": 1.2,
  "12/8": 1.6,
  "20/5": 2,
};

const ROUND_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6 };

describe("guide round durations", () => {
  it("scales every stated duration from the rounds and one per-round figure per setup", () => {
    const mismatches = LEARN_GUIDES.flatMap((guide) =>
      guide.sections.flatMap((section) =>
        section.blocks.flatMap((block) => {
          if (block.kind === "drills") {
            return block.drills.flatMap((drill) => {
              if (!drill.setup) return [];
              const setup = `${drill.setup.pieceCount}/${drill.setup.memorizeTime}`;
              const rounds = Number(drill.description.match(/(\d+) rounds/)?.[1]);
              const perRound = MINUTES_PER_ROUND[setup];
              const stated = [...`${drill.description} ${drill.duration}`.matchAll(/about (\d+) minutes/gi)].map(
                (match) => Number(match[1]),
              );
              const expected = Math.round(rounds * perRound);
              const ok = Number.isFinite(expected) && stated.length > 0 && stated.every((n) => n === expected);
              return ok ? [] : [`${guide.slug} "${drill.title}" ${setup}: ${rounds} rounds, stated ${stated.join()}, expected ${expected}`];
            });
          }
          if (block.kind === "plan") {
            return block.steps.flatMap((step) => {
              const match = step.detail.match(/(\w+) rounds of (\d+) pieces, (\d+) seconds/i);
              if (!match) return [];
              const rounds = ROUND_WORDS[match[1].toLowerCase()];
              const expected = Math.round(rounds * MINUTES_PER_ROUND[`${match[2]}/${match[3]}`]);
              const stated = Number(step.duration.match(/^(\d+) minutes/)?.[1]);
              return stated === expected ? [] : [`${guide.slug} "${step.label}": stated ${stated}, expected ${expected}`];
            });
          }
          return [];
        }),
      ),
    );

    expect(mismatches).toEqual([]);
  });
});
