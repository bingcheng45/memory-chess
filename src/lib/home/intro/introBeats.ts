/**
 * The 45-board intro as pure functions of one clock, t in seconds: which caption shows, how many boards are out, how
 * dark each one is, where the camera looks and how many moves each board has played. Jumping ahead or replaying is
 * only a new t.
 */

export const INTRO_SECONDS = 10;
export const BOARD_COUNT = 45;

export const BEATS = [
  { id: "one", at: 0 },
  { id: "many", at: 2.2 },
  { id: "dark", at: 5.6 },
  { id: "you", at: 7.8 },
  { id: "end", at: 9.4 },
] as const;

export type BeatId = (typeof BEATS)[number]["id"];
/** The closing beat keeps the last caption on screen while the camera settles. */
export type CaptionId = Exclude<BeatId, "end">;

const clamp = (value: number, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
/** Eased progress through [from, to]: 0 before it, 1 after it. */
const span = (t: number, from: number, to: number) => easeInOut(clamp((t - from) / (to - from)));

export function beatAt(t: number): BeatId {
  return BEATS.reduce<BeatId>((current, beat) => (t >= beat.at ? beat.id : current), "one");
}

export function captionAt(t: number): CaptionId {
  const beat = beatAt(t);
  return beat === "end" ? "you" : beat;
}

/** Where a tap, a key or a scroll jumps to: the next beat, or the end. */
export function nextBeatTime(t: number): number {
  return BEATS.find((beat) => beat.at > t + 0.05)?.at ?? INTRO_SECONDS;
}

/** Boards fanning out from the centre, as a continuous count so each one can grow in. */
function boardsOut(t: number): number {
  return t < 2.2 ? 1 : 1 + 46 * span(t, 2.2, 4.8);
}

/** How far the board at this rank (0 is the centre) has grown in, from 0 to 1. */
export function appearance(t: number, rank: number): number {
  return rank === 0 ? 1 : clamp((boardsOut(t) - rank) / 3);
}

/** What the counter reads: the boards out, and once they go dark, that none of them is seen. */
export function counterAt(t: number): { readonly boards: number; readonly dark: boolean } {
  return { boards: Math.min(BOARD_COUNT, Math.ceil(boardsOut(t))), dark: t > 5.8 };
}

/** How dark the board at this rank is, from 0 to 1: they go out from the centre, and the centre one comes back. */
export function darkness(t: number, rank: number): number {
  const dark = clamp(span(t, 5.6, 6.8) * 1.6 - (rank / BOARD_COUNT) * 0.6);
  return rank === 0 ? dark * (1 - heroReturn(t)) : dark;
}

/** The centre board coming back for "Start with one", from 0 to 1; the others fade as it does. */
export function heroReturn(t: number): number {
  return span(t, 8.2, 9.2);
}

// MARK: - Layout and camera

/** Space between boards, as a share of a board's width. */
const GAP = 0.14;

export interface IntroLayout {
  readonly cols: number;
  readonly rows: number;
  /** A board's size in CSS pixels when all 45 are out. */
  readonly tile: number;
  /** Where the grid's middle sits on screen; higher on a phone, to leave the captions room. */
  readonly midY: number;
  /** Cell indexes ordered by distance from the centre cell, which comes first and holds the Opera Game. */
  readonly order: readonly number[];
}

const cellAt = (cols: number, cell: number) => ({ x: (cell % cols) * (1 + GAP), y: Math.floor(cell / cols) * (1 + GAP) });

export function layoutFor(width: number, height: number): IntroLayout {
  const portrait = height > width * 1.05;
  const cols = portrait ? 5 : 9;
  const rows = portrait ? 9 : 5;
  const gridW = cols * (1 + GAP) - GAP;
  const gridH = rows * (1 + GAP) - GAP;
  const tile = portrait ? Math.min((width * 0.9) / gridW, (height * 0.6) / gridH) : Math.min((width * 0.92) / gridW, (height * 0.74) / gridH);
  const centre = cellAt(cols, Math.floor(rows / 2) * cols + Math.floor(cols / 2));
  const distance = (cell: number) => Math.hypot(cellAt(cols, cell).x - centre.x, cellAt(cols, cell).y - centre.y);
  const order = Array.from({ length: BOARD_COUNT }, (_, cell) => cell).sort((a, b) => distance(a) - distance(b));
  return { cols, rows, tile, midY: portrait ? height * 0.38 : height / 2, order };
}

/** Where a cell's board sits, in board widths from the grid's top left corner to the board's centre. */
export function cellCentre(layout: IntroLayout, cell: number): { readonly x: number; readonly y: number } {
  const { x, y } = cellAt(layout.cols, cell);
  return { x: x + 0.5, y: y + 0.5 };
}

/** The camera: a board's width on screen in CSS pixels, and the grid point at the middle of the screen. */
export function cameraAt(t: number, layout: IntroLayout, width: number, height: number): { readonly zoom: number; readonly x: number; readonly y: number } {
  const hero = cellCentre(layout, layout.order[0]!);
  const grid = { x: (layout.cols * (1 + GAP) - GAP) / 2, y: (layout.rows * (1 + GAP) - GAP) / 2 };
  const one = Math.min(width, height) * 0.62;
  const push = span(t, 7.8, 9.4);
  if (push > 0) {
    return {
      zoom: layout.tile * ((one * 1.1) / layout.tile) ** push,
      x: grid.x + (hero.x - grid.x) * push,
      y: grid.y + (hero.y - grid.y) * push,
    };
  }
  const pull = span(t, 2.2, 5);
  return { zoom: one * (layout.tile / one) ** pull, x: hero.x + (grid.x - hero.x) * pull, y: hero.y + (grid.y - hero.y) * pull };
}

// MARK: - Moves

/** When the Opera Game's moves land: quickly while it is the only board, then at a reading pace. */
export function heroMoveTimes(count: number): number[] {
  const times: number[] = [];
  for (let at = 0.5; times.length < count && at < INTRO_SECONDS; at += at < 2.2 ? 0.42 : 0.9) times.push(at);
  return times;
}

/** When a bot board's moves land: each board keeps its own start and pace, so the 44 never move in step. */
export function botMoveTimes(board: number, count: number): number[] {
  const share = (seed: number) => (board * seed) % 1;
  const first = 0.3 + share(0.618034) * 1.4;
  const pace = 0.7 + share(0.381966 + 0.1) * 1.5;
  const times: number[] = [];
  for (let at = first; times.length < count && at < INTRO_SECONDS; at += pace) times.push(at);
  return times;
}

/** How many of these moves have landed by t. */
export function movesPlayed(times: readonly number[], t: number): number {
  let played = 0;
  while (played < times.length && times[played]! <= t) played++;
  return played;
}
