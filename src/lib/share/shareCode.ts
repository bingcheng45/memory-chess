import type { PlacedPiece, RoundShare, ScoredBoard } from "@/components/game/roundShare";
import { BOARD_SQUARES, type SquareName } from "@/lib/game/board";
import { MEMORIZE_SECONDS_RANGE } from "@/lib/reference/facts";
import { SHARE_TILES, type DashboardUnit, type Figure, type ShareFigure, type ShareFigureId, type Trend } from "@/lib/lab/dashboard";
import { MAX_SKILL_RATING } from "@/lib/game/rating";
import { MAX_SOLVE_MS } from "@/lib/lab/progress";
import { labPositionFromFen, labPositionToFen, scoreReading, type LabPosition } from "@/lib/round/round";

/**
 * A share card's figures as one URL path segment, so a posted link can draw its own preview. Version 1:
 *
 *   progress  1_<figure>_<figure>...      figure = letter, value (tenths for a one-decimal figure), then u|d and the
 *                                         rating's change when it moved; the first figure is the card's lead
 *   result    1_g_<setting>_<rating>_<change>_<streak>_<target>_<placed>_<order>    a random round
 *             1_d_<setting>_<accuracy>_<correct>_<total>_<rating>_<change>_<streak>_<yyyymmdd>    the daily board
 *             1_v_<setting>_<target>_<placed>_<order>    a review
 *             setting = pieces_<study allowed>_<study taken>_<rebuild>, times in tenths of a second;
 *             change = 0 | u<n> | d<n>; streak = 0 for none; a board is its FEN placement with - between ranks;
 *             order = each placed piece's square, then the tenths since the piece before it went down, so e4 at
 *             1.2 s then d5 at once is e412d50; empty when the round's log lost track of the board
 *
 * Only figures a card prints go in. A code is canonical (no leading zeros, fixed order), so one card has one URL.
 * It is not signed: every figure is measured in the player's browser, so a signing endpoint would sign whatever it
 * was sent and stop no forgery. Parsing instead rejects any value out of range or inconsistent with the rest.
 */

export const SHARE_KINDS = ["progress", "result"] as const;
export type ShareKind = (typeof SHARE_KINDS)[number];

/** Longer than any card's code: 32 pieces on both boards, each ordered, and every field at its widest come to 374. */
export const MAX_CODE_LENGTH = 400;
const VERSION = "1";
const SEPARATOR = "_";

/** A progress figure as a link carries it: what the card prints, without the line of context under it. */
export type SharedFigure = Omit<ShareFigure, "context">;
export interface SharedProgress {
  readonly figures: readonly SharedFigure[];
}

interface FigureSpec {
  readonly letter: string;
  readonly unit: DashboardUnit;
  readonly digits: 0 | 1;
  /** The largest value the code may carry, in its written units (tenths for a one-decimal figure). */
  readonly max: number;
}

const FIGURES: { readonly [K in ShareFigureId]: FigureSpec } = {
  span: { letter: "s", unit: "pieces", digits: 0, max: 32 },
  rating: { letter: "r", unit: "rating", digits: 0, max: MAX_SKILL_RATING },
  piecesHeld: { letter: "h", unit: "pieces", digits: 1, max: 320 },
  speed: { letter: "v", unit: "secondsPerPiece", digits: 1, max: 9999 },
  bestAccuracy: { letter: "b", unit: "percent", digits: 0, max: 100 },
  recentAccuracy: { letter: "a", unit: "percent", digits: 0, max: 100 },
  studyTime: { letter: "m", unit: "seconds", digits: 1, max: MEMORIZE_SECONDS_RANGE.max * 10 },
  rebuildTime: { letter: "t", unit: "seconds", digits: 1, max: MAX_SOLVE_MS / 100 },
  winStreak: { letter: "w", unit: "rounds", digits: 0, max: 99999 },
  streak: { letter: "k", unit: "days", digits: 0, max: 99999 },
  rounds: { letter: "n", unit: "rounds", digits: 0, max: 999999 },
  days: { letter: "d", unit: "days", digits: 0, max: 99999 },
};
const FIGURE_BY_LETTER = new Map(SHARE_TILES.map((id) => [FIGURES[id].letter, id]));
const MAX_CHANGE = MAX_SKILL_RATING;

const NUMBER = /^(?:0|[1-9]\d{0,5})$/;
const FIGURE = /^([a-z])(0|[1-9]\d{0,5})(?:([ud])([1-9]\d{0,3}))?$/;

/** A canonical non-negative integer no larger than `max`, or null. */
function count(text: string | undefined, max: number, min = 0): number | null {
  if (text === undefined || !NUMBER.test(text)) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
}

const written = (value: number, digits: 0 | 1) => Math.round(value * 10 ** digits);
const signed = (change: number) => (change === 0 ? "0" : `${change > 0 ? "u" : "d"}${Math.abs(change)}`);

/** Splits a code into its fields after the version, or null when it is not a version 1 code of a sane length. */
function fieldsOf(code: string): string[] | null {
  if (code.length > MAX_CODE_LENGTH) return null;
  const [version, ...fields] = code.split(SEPARATOR);
  return version === VERSION && fields.length > 0 ? fields : null;
}

// MARK: - Progress

function figureCode({ id, figure, trend }: SharedFigure): string {
  const spec = FIGURES[id];
  const moved = id === "rating" && trend && trend.direction !== "level" && trend.amount > 0;
  return `${spec.letter}${written(figure.value, spec.digits)}${moved ? `${trend.direction === "up" ? "u" : "d"}${trend.amount}` : ""}`;
}

export function progressCode(card: SharedProgress): string {
  return [VERSION, ...card.figures.map(figureCode)].join(SEPARATOR);
}

function parseFigure(field: string): SharedFigure | null {
  const match = FIGURE.exec(field);
  const id = match && FIGURE_BY_LETTER.get(match[1]);
  if (!match || !id) return null;
  const spec = FIGURES[id];
  const value = count(match[2], spec.max);
  if (value === null) return null;
  const figure: Figure = { value: value / 10 ** spec.digits, unit: spec.unit, digits: spec.digits };
  if (!match[3]) return { id, figure };
  const amount = count(match[4], MAX_CHANGE, 1);
  if (id !== "rating" || amount === null) return null;
  const trend: Trend = { direction: match[3] === "u" ? "up" : "down", amount };
  return { id, figure, trend };
}

export function parseProgress(code: string): SharedProgress | null {
  const fields = fieldsOf(code);
  if (!fields || fields.length > SHARE_TILES.length) return null;
  const figures = fields.map(parseFigure);
  if (figures.some((figure) => figure === null)) return null;
  const parsed = figures as SharedFigure[];
  if (new Set(parsed.map(({ id }) => id)).size !== parsed.length) return null;
  // The card leads with a figure above zero; a zero lead is a code no card wrote.
  return parsed[0].figure.value > 0 ? { figures: parsed } : null;
}

// MARK: - Result

const KIND_LETTER = { game: "g", daily: "d", review: "v" } as const satisfies Record<RoundShare["kind"], string>;
const MIN_PIECES = 2;
const MAX_PIECES = 32;
const MAX_STUDY_TENTHS = MEMORIZE_SECONDS_RANGE.max * 10;
/** The longest rebuild a code carries; a longer one is shared as this long. */
export const MAX_REBUILD_SECONDS = 3600;
const MAX_REBUILD_TENTHS = MAX_REBUILD_SECONDS * 10;
const MAX_STREAK = 99999;
const MIN_SHOWN_STREAK = 2;
const RANK = /^[pnbrqkPNBRQK1-8]{1,8}$/;
const DAY = /^(\d{4})(\d{2})(\d{2})$/;
const ORDER = /^(?:[a-h][1-8](?:0|[1-9]\d{0,4}))*$/;
const ORDER_STEP = /([a-h][1-8])(\d+)/g;

const tenths = (seconds: number) => String(Math.round(seconds * 10));
const boardCode = (position: LabPosition) => labPositionToFen(position).replaceAll("/", "-");

function orderCode(order: ScoredBoard["order"]): string {
  const times = (order ?? []).map(({ seconds }) => Math.round(seconds * 10));
  return (order ?? []).map(({ square }, index) => `${square}${times[index] - (times[index - 1] ?? 0)}`).join("");
}

const boardFields = ({ target, placed, order }: ScoredBoard) => [boardCode(target), boardCode(placed), orderCode(order)];

function settingCode(share: RoundShare): string[] {
  return [String(share.pieceCount), tenths(share.memorizeSeconds), tenths(share.studySeconds), tenths(share.rebuildSeconds)];
}

function ratedCode({ rating, winStreak }: Extract<RoundShare, { rating: unknown }>): string[] {
  return [String(rating.rating), signed(rating.change), String(winStreak ?? 0)];
}

export function resultCode(share: RoundShare): string {
  const head = [VERSION, KIND_LETTER[share.kind], ...settingCode(share)];
  if (share.kind === "game") return [...head, ...ratedCode(share), ...boardFields(share.board)].join(SEPARATOR);
  if (share.kind === "review") return [...head, ...boardFields(share.board)].join(SEPARATOR);
  return [...head, String(share.accuracy), String(share.correct), String(share.total), ...ratedCode(share), share.day.replaceAll("-", "")].join(SEPARATOR);
}

/** A board's ranks, each exactly eight squares and written the way labPositionToFen writes it, or null. */
function parseBoard(text: string | undefined): LabPosition | null {
  const ranks = text?.split("-") ?? [];
  const canonical = (rank: string) => RANK.test(rank) && !/\d\d/.test(rank) && [...rank].reduce((squares, char) => squares + (Number(char) || 1), 0) === 8;
  if (ranks.length !== 8 || !ranks.every(canonical)) return null;
  const position = labPositionFromFen(ranks.join("/"));
  return Object.keys(position).length <= MAX_PIECES ? position : null;
}

type Setting = Pick<RoundShare, "pieceCount" | "memorizeSeconds" | "studySeconds" | "rebuildSeconds">;

function parseSetting([pieces, memorize, study, rebuild]: readonly string[]): Setting | null {
  const pieceCount = count(pieces, MAX_PIECES, MIN_PIECES);
  const allowed = count(memorize, MAX_STUDY_TENTHS, 1);
  const taken = allowed === null ? null : count(study, allowed);
  const rebuilt = count(rebuild, MAX_REBUILD_TENTHS);
  if (pieceCount === null || allowed === null || taken === null || rebuilt === null) return null;
  return { pieceCount, memorizeSeconds: allowed / 10, studySeconds: taken / 10, rebuildSeconds: rebuilt / 10 };
}

type Rated = Pick<Extract<RoundShare, { kind: "game" }>, "rating" | "winStreak">;

function parseRated([rating, change, streak]: readonly string[]): Rated | null {
  const score = count(rating, MAX_SKILL_RATING);
  const moved = /^[ud]/.test(change ?? "") ? count(change.slice(1), MAX_CHANGE, 1) : change === "0" ? 0 : null;
  const run = count(streak, MAX_STREAK);
  if (score === null || moved === null || run === null || run === 1) return null;
  return { rating: { rating: score, change: change.startsWith("d") ? -moved : moved }, winStreak: run >= MIN_SHOWN_STREAK ? run : null };
}

/** A day in yyyymmdd that the calendar has, as yyyy-mm-dd. */
function parseDay(text: string | undefined): string | null {
  const match = DAY.exec(text ?? "");
  if (!match) return null;
  const day = `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(day) ? day : null;
}

/**
 * The placed board's pieces in the code's order, or undefined when it names a square twice, misses a piece of the
 * board, or runs past the rebuild. An empty order is an unknown one (null), unless the board is empty too.
 */
function parseOrder(text: string | undefined, placed: LabPosition, rebuildSeconds: number): ScoredBoard["order"] | undefined {
  if (text === undefined || !ORDER.test(text)) return undefined;
  const squares = BOARD_SQUARES.filter((square) => placed[square]);
  if (text === "") return squares.length === 0 ? [] : null;
  let elapsed = 0;
  const order: PlacedPiece[] = [...text.matchAll(ORDER_STEP)].map(([, square, delta]) => {
    elapsed += Number(delta);
    return { square: square as SquareName, seconds: elapsed / 10 };
  });
  const named = new Set(order.map(({ square }) => square));
  const exact = order.length === squares.length && named.size === squares.length && squares.every((square) => named.has(square));
  return exact && elapsed <= Math.round(rebuildSeconds * 10) ? order : undefined;
}

/** A board's figures come from the board, so a card's accuracy can never disagree with the board it draws. */
function scoredBoard([target, placed, orderText]: readonly string[], rebuildSeconds: number) {
  const [from, to] = [parseBoard(target), parseBoard(placed)];
  const order = to && parseOrder(orderText, to, rebuildSeconds);
  if (!from || !to || order === undefined) return null;
  const board: ScoredBoard = { target: from, placed: to, order };
  const { accuracy, correct, total } = scoreReading(from, to);
  return total > 0 ? { board, accuracy: Math.round(accuracy), correct, total } : null;
}

function parseDaily(setting: Setting, fields: readonly string[]): RoundShare | null {
  const total = count(fields[2], MAX_PIECES, 1);
  const correct = total === null ? null : count(fields[1], total);
  const most = total === null || correct === null ? null : Math.round((correct / total) * 100);
  const accuracy = most === null ? null : count(fields[0], most);
  const rated = parseRated(fields.slice(3, 6));
  const day = parseDay(fields[6]);
  if (accuracy === null || correct === null || total === null || !rated || !day) return null;
  return { kind: "daily", accuracy, correct, total, ...setting, day, ...rated };
}

const FIELD_COUNT = { g: 10, d: 11, v: 7 } as const;

export function parseResult(code: string): RoundShare | null {
  const fields = fieldsOf(code);
  const letter = fields?.[0];
  if (!fields || (letter !== "g" && letter !== "d" && letter !== "v") || fields.length !== FIELD_COUNT[letter] + 1) return null;
  const setting = parseSetting(fields.slice(1, 5));
  if (!setting) return null;
  const rest = fields.slice(5);
  if (letter === "d") return parseDaily(setting, rest);
  const scored = scoredBoard(letter === "g" ? rest.slice(3) : rest, setting.rebuildSeconds);
  if (!scored) return null;
  if (letter === "v") return { kind: "review", ...scored, ...setting };
  const rated = parseRated(rest.slice(0, 3));
  return rated && { kind: "game", ...scored, ...setting, ...rated };
}
