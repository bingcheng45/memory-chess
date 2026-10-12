import type { RoundShare } from "@/components/game/roundShare";
import type { ShareCard } from "@/lib/lab/dashboard";
import { BOARD_SQUARES } from "@/lib/game/board";
import { labPositionFromFen } from "@/lib/round/round";
import { MAX_CODE_LENGTH, parseProgress, parseResult, progressCode, resultCode } from "@/lib/share/shareCode";

const CARD: ShareCard = {
  figures: [
    { id: "span", figure: { value: 8, unit: "pieces", digits: 0 }, context: { kind: "span", values: { rounds: 3 } } },
    { id: "rating", figure: { value: 1214, unit: "rating", digits: 0 }, context: { kind: "rating", values: {} }, trend: { direction: "up", amount: 23 } },
    { id: "piecesHeld", figure: { value: 6.4, unit: "pieces", digits: 1 }, context: { kind: "recent", values: { rounds: 10 } } },
    { id: "speed", figure: { value: 1.9, unit: "secondsPerPiece", digits: 1 }, context: { kind: "recent", values: { rounds: 10 } } },
    { id: "bestAccuracy", figure: { value: 100, unit: "percent", digits: 0 }, context: { kind: "bestAt", values: {} } },
    { id: "winStreak", figure: { value: 0, unit: "rounds", digits: 0 }, context: { kind: "winStreak", values: {} } },
    { id: "rounds", figure: { value: 140, unit: "rounds", digits: 0 }, context: { kind: "overDays", values: { days: 45 } } },
  ],
  rounds: 140,
};

const PROGRESS_CODE = "1_s8_r1214u23_h64_v19_b100_w0_n140";

const TARGET = labPositionFromFen("4k3/8/8/3q4/8/8/4P3/4K3");
const PLACED = labPositionFromFen("4k3/8/8/8/8/8/8/R3K3");
const ORDER = [
  { square: "e1", seconds: 3.1 },
  { square: "e8", seconds: 5 },
  { square: "a1", seconds: 12.4 },
] as const;
const BOARD = { target: TARGET, placed: PLACED, order: ORDER };
const TIMES = { pieceCount: 4, memorizeSeconds: 10, studySeconds: 8.4, rebuildSeconds: 38.3 };

const GAME: RoundShare = {
  kind: "game",
  accuracy: 50,
  correct: 2,
  total: 4,
  ...TIMES,
  board: BOARD,
  rating: { rating: 1214, change: -14 },
  winStreak: 3,
};
const GAME_CODE = "1_g_4_100_84_383_1214_d14_3_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3_e131e819a174";

const DAILY: RoundShare = { kind: "daily", accuracy: 75, correct: 3, total: 4, ...TIMES, day: "2026-10-12", rating: { rating: 1000, change: 0 }, winStreak: null };
const DAILY_CODE = "1_d_4_100_84_383_75_3_4_1000_0_0_20261012";

const REVIEW: RoundShare = { kind: "review", accuracy: 50, correct: 2, total: 4, ...TIMES, board: BOARD };
const REVIEW_CODE = "1_v_4_100_84_383_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3_e131e819a174";
const REVIEW_HEAD = "1_v_4_100_84_383_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3";

describe("progressCode", () => {
  it("writes each figure the card prints as its letter and value, tenths for a one-decimal figure, and the rating's trend", () => {
    expect(progressCode(CARD)).toBe(PROGRESS_CODE);
  });

  it("reads back the figures in the card's order, each with its unit, and nothing the card does not print", () => {
    expect(parseProgress(PROGRESS_CODE)).toEqual({ figures: CARD.figures.map(({ id, figure, trend }) => ({ id, figure, ...(trend && { trend }) })) });
  });

  it("leaves out a rating trend that did not move", () => {
    const level: ShareCard = { figures: [{ ...CARD.figures[1], trend: { direction: "level", amount: 0 } }], rounds: 1 };

    expect(progressCode(level)).toBe("1_r1214");
  });

  it.each([
    ["an unknown version", "2_s8"],
    ["no figures", "1"],
    ["an unknown figure", "1_s8_x4"],
    ["a figure twice", "1_s8_s9"],
    ["a percentage over 100", "1_b101"],
    ["more pieces than a board holds", "1_s33"],
    ["a leading zero", "1_s08"],
    ["a trend on a figure that has none", "1_s8u2"],
    ["a trend of nothing", "1_r1000u0"],
    ["a lead figure of zero", "1_w0_s8"],
    ["a sign", "1_r-5"],
    ["a decimal point", "1_h6.4"],
    ["a trailing separator", "1_s8_"],
    ["markup", "1_s8<script>"],
    ["an empty code", ""],
    ["a code longer than any card", `1_${"s8_".repeat(80)}s8`],
  ])("rejects %s", (_, code) => {
    expect(parseProgress(code)).toBeNull();
  });
});

describe("resultCode", () => {
  it.each([
    ["a random round, with its scored board", GAME, GAME_CODE],
    ["the daily board, with no position", DAILY, DAILY_CODE],
    ["a review, with no rating or streak", REVIEW, REVIEW_CODE],
  ])("writes and reads back %s", (_, share, code) => {
    expect(resultCode(share)).toBe(code);
    expect(parseResult(code)).toEqual(share);
  });

  it("writes and reads back a round at the longest study time the slider allows", () => {
    const longest: RoundShare = { ...REVIEW, memorizeSeconds: 60, studySeconds: 60 };
    const code = "1_v_4_600_600_383_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3_e131e819a174";

    expect(resultCode(longest)).toBe(code);
    expect(parseResult(code)).toEqual(longest);
  });

  it("scores a round with a board from the board itself, so its figures always match the board it draws", () => {
    expect(parseResult(GAME_CODE)).toMatchObject({ accuracy: 50, correct: 2, total: 4 });
  });

  it("writes the order of a board whose log lost track of it as an empty field, and reads it back as unknown", () => {
    const unknown: RoundShare = { ...REVIEW, board: { ...BOARD, order: null } };

    expect(resultCode(unknown)).toBe(`${REVIEW_HEAD}_`);
    expect(parseResult(`${REVIEW_HEAD}_`)).toEqual(unknown);
  });

  it("reads an empty order on an empty board as a rebuild with nothing put down", () => {
    const code = "1_v_4_100_84_383_4k3-8-8-3q4-8-8-4P3-4K3_8-8-8-8-8-8-8-8_";

    expect(parseResult(code)).toMatchObject({ accuracy: 0, board: { placed: {}, order: [] } });
  });

  it("keeps the longest code a card can write under the cap: 32 pieces on both boards, each ordered, every field at its widest", () => {
    const sparse = "p1p1p1p1/1p1p1p1p/p1p1p1p1/1p1p1p1p/P1P1P1P1/1P1P1P1P/P1P1P1P1/1P1P1P1P";
    const board = labPositionFromFen(sparse);
    const order = BOARD_SQUARES.filter((square) => board[square]).map((square, index) => ({ square, seconds: ((index + 1) * 1124) / 10 }));
    const widest: RoundShare = { ...GAME, pieceCount: 32, memorizeSeconds: 60, studySeconds: 60, rebuildSeconds: 3599.9, board: { target: board, placed: board, order }, rating: { rating: 9999, change: -9999 }, winStreak: 99999 };
    const code = resultCode(widest);

    expect(code).toHaveLength(374);
    expect(code.length).toBeLessThanOrEqual(MAX_CODE_LENGTH);
    expect(parseResult(code)).toEqual({ ...widest, accuracy: 100, correct: 32, total: 32 });
  });

  it.each([
    ["an unknown kind", "1_x_4_100_84_383"],
    ["a daily board with more right than it had", "1_d_4_100_84_383_75_5_4_1000_0_0_20261012"],
    ["a daily accuracy above what its pieces allow", "1_d_4_100_84_383_100_3_4_1000_0_0_20261012"],
    ["a day that does not exist", "1_d_4_100_84_383_75_3_4_1000_0_0_20260230"],
    ["a win streak of one, which the card never shows", "1_d_4_100_84_383_75_3_4_1000_0_1_20261012"],
    ["a change with no direction", "1_d_4_100_84_383_75_3_4_1000_14_0_20261012"],
    ["a study time longer than the setting allows", "1_g_4_100_101_383_1214_d14_3_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3"],
    ["a board row of nine squares", "1_v_4_100_84_383_4k4-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3"],
    ["a board of seven rows", "1_v_4_100_84_383_4k3-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3"],
    ["a piece that is not a chess piece", "1_v_4_100_84_383_4x3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3"],
    ["an empty target board", "1_v_4_100_84_383_8-8-8-8-8-8-8-8_4k3-8-8-8-8-8-8-R3K3"],
    ["a missing field", "1_v_4_100_84_383_4k3-8-8-3q4-8-8-4P3-4K3"],
    ["an extra field", `${REVIEW_CODE}_1`],
    ["a study setting past the slider's 60 seconds", "1_v_4_601_600_383_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3"],
    ["a setting of one piece", "1_d_1_100_84_383_75_1_1_1000_0_0_20261012"],
    ["a round with no order field", REVIEW_HEAD],
    ["an order that misses a placed piece", `${REVIEW_HEAD}_e131e819`],
    ["an order that names a square twice", `${REVIEW_HEAD}_e131e819e174`],
    ["an order that names an empty square", `${REVIEW_HEAD}_e131e819a274`],
    ["an order that runs past the rebuild", `${REVIEW_HEAD}_e131e819a1334`],
    ["an order with a leading zero", `${REVIEW_HEAD}_e131e819a1074`],
    ["an order with a square off the board", `${REVIEW_HEAD}_e131e819a974`],
    ["an order on an empty board", "1_v_4_100_84_383_4k3-8-8-3q4-8-8-4P3-4K3_8-8-8-8-8-8-8-8_e10"],
  ])("rejects %s", (_, code) => {
    expect(parseResult(code)).toBeNull();
  });
});
