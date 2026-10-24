import {
  appearance,
  BOARD_COUNT,
  botMoveTimes,
  cameraAt,
  cellCentre,
  darkness,
  heroMoveTimes,
  heroReturn,
  layoutFor,
  movesPlayed,
  type IntroLayout,
} from "@/lib/home/intro/introBeats";
import type { SimulBoard } from "@/lib/home/intro/simul";
import { SIMUL_BOARDS, SIMUL_HERO } from "@/lib/home/intro/simulGames";

/**
 * Draws the 45 boards for one moment of the intro. Only the intro loads this module, with the games it plays, so a
 * visitor who never sees the intro downloads neither.
 */

const COLOR = {
  ground: "#070707",
  light: "#2d2723",
  dark: "#1b1714",
  white: "#fbf6f1",
  black: "#e9a679",
  moved: "255, 159, 102",
  out: "#050505",
  outline: "#ff9f66",
} as const;

/** Text presentation selector, so iOS draws the black pawn as a glyph and not as an emoji. */
const TEXT = "︎";
const GLYPH: Record<string, string> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
/** Below this many device pixels a square shows its piece as a dot; a glyph would be a smudge. */
const GLYPH_MIN_PX = 12;
/** A board drawn larger than this many times its grid size is painted each frame instead of from its cached bitmap. */
const LIVE_SCALE = 1.4;
const FLASH_SECONDS = 0.6;

// MARK: - Games as positions

/** 64 characters, a8 to h1, a FEN letter or "." for each square. */
type Position = string;

interface Track {
  /** The position after each move; the first is the one the board opens on. */
  readonly positions: readonly Position[];
  /** The squares each move changed, by index into a position. */
  readonly moved: readonly (readonly number[])[];
  readonly times: readonly number[];
}

const squareIndex = (square: string) => (8 - Number(square[1])) * 8 + (square.charCodeAt(0) - 97);

function openingPosition(fen: string): Position {
  return fen
    .split(" ")[0]!
    .split("/")
    .map((rank) => rank.replace(/\d/g, (empty) => ".".repeat(Number(empty))))
    .join("");
}

function trackOf(board: SimulBoard, times: readonly number[]): Track {
  const positions = [openingPosition(board.fen)];
  const moved = [[] as number[]];
  board.plies.slice(0, times.length).forEach(({ changes }) => {
    const squares = [...positions[positions.length - 1]!];
    const indexes = changes.map(([square, piece]) => {
      const index = squareIndex(square);
      squares[index] = piece ?? ".";
      return index;
    });
    positions.push(squares.join(""));
    moved.push(indexes);
  });
  return { positions, moved, times };
}

// MARK: - Drawing

function paintBoard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, position: Position, moved: readonly number[], flash: number, devicePx: number) {
  const square = size / 8;
  for (let index = 0; index < 64; index++) {
    ctx.fillStyle = (index + Math.floor(index / 8)) % 2 ? COLOR.dark : COLOR.light;
    ctx.fillRect(x + (index % 8) * square, y + Math.floor(index / 8) * square, square + 0.5, square + 0.5);
  }
  if (flash > 0) {
    ctx.fillStyle = `rgba(${COLOR.moved}, ${0.18 + 0.32 * flash})`;
    moved.forEach((index) => ctx.fillRect(x + (index % 8) * square, y + Math.floor(index / 8) * square, square, square));
  }
  const glyphs = square * devicePx >= GLYPH_MIN_PX;
  if (glyphs) {
    ctx.font = `${square * 0.86}px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }
  for (let index = 0; index < 64; index++) {
    const piece = position[index]!;
    if (piece === ".") continue;
    const cx = x + (index % 8) * square + square / 2;
    const cy = y + Math.floor(index / 8) * square + square / 2;
    ctx.fillStyle = piece === piece.toUpperCase() ? COLOR.white : COLOR.black;
    if (glyphs) {
      ctx.fillText(GLYPH[piece]! + TEXT, cx, cy + square * 0.04);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, square * (piece.toLowerCase() === "p" ? 0.22 : 0.34), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A grid board's bitmap, redrawn only when a move lands or the grid size changes. */
interface Cache {
  readonly canvas: HTMLCanvasElement;
  played: number;
}

export interface SimulScene {
  readonly resize: () => void;
  readonly draw: (t: number) => void;
}

export function createScene(canvas: HTMLCanvasElement): SimulScene | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const hero = trackOf(SIMUL_HERO, heroMoveTimes(SIMUL_HERO.plies.length));
  const bots = SIMUL_BOARDS.map((board, index) => trackOf(board, botMoveTimes(index, board.plies.length)));
  const caches = Array.from({ length: BOARD_COUNT }, (): Cache => ({ canvas: document.createElement("canvas"), played: -1 }));
  let width = 0;
  let height = 0;
  let devicePx = 1;
  let layout: IntroLayout = layoutFor(1, 1);
  /** The game in each grid cell: the Opera Game in the centre, the bots in cell order around it. */
  let tracks: Track[] = [];

  const resize = () => {
    devicePx = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * devicePx);
    canvas.height = Math.round(height * devicePx);
    layout = layoutFor(width, height);
    const centre = layout.order[0]!;
    let next = 0;
    tracks = Array.from({ length: BOARD_COUNT }, (_, cell) => (cell === centre ? hero : bots[next++]!));
    caches.forEach((cache) => (cache.played = -1));
  };

  const cached = (cell: number, track: Track, played: number) => {
    const cache = caches[cell]!;
    const px = Math.max(32, Math.ceil(layout.tile * devicePx));
    if (cache.canvas.width !== px) {
      cache.canvas.width = cache.canvas.height = px;
      cache.played = -1;
    }
    if (cache.played !== played) {
      paintBoard(cache.canvas.getContext("2d")!, 0, 0, px, track.positions[played]!, track.moved[played]!, played > 0 ? 0.6 : 0, 1);
      cache.played = played;
    }
    return cache.canvas;
  };

  const draw = (t: number) => {
    ctx.setTransform(devicePx, 0, 0, devicePx, 0, 0);
    ctx.fillStyle = COLOR.ground;
    ctx.fillRect(0, 0, width, height);
    const camera = cameraAt(t, layout, width, height);
    const back = heroReturn(t);

    layout.order.forEach((cell, rank) => {
      const grown = appearance(t, rank);
      if (grown <= 0) return;
      const size = camera.zoom * grown;
      const centre = cellCentre(layout, cell);
      const x = width / 2 + (centre.x - camera.x) * camera.zoom - size / 2;
      const y = layout.midY + (centre.y - camera.y) * camera.zoom - size / 2;
      if (x > width || y > height || x + size < 0 || y + size < 0) return;

      const track = tracks[cell]!;
      const played = movesPlayed(track.times, t);
      const isHero = rank === 0;
      ctx.globalAlpha = isHero ? 1 : 1 - back * 0.85;
      if (isHero || size > layout.tile * LIVE_SCALE) {
        const flash = played > 0 ? Math.max(0, 1 - (t - track.times[played - 1]!) / FLASH_SECONDS) : 0;
        paintBoard(ctx, x, y, size, track.positions[played]!, track.moved[played]!, flash, devicePx);
      } else {
        ctx.drawImage(cached(cell, track, played), x, y, size, size);
      }

      const dark = darkness(t, rank);
      if (dark > 0) {
        ctx.globalAlpha *= dark * 0.94;
        ctx.fillStyle = COLOR.out;
        ctx.fillRect(x, y, size, size);
        ctx.globalAlpha = dark * 0.5;
        ctx.strokeStyle = COLOR.outline;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      }
      ctx.globalAlpha = 1;
    });
  };

  resize();
  return { resize, draw };
}
