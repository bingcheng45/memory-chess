import { BODY_BOTTOM, BODY_TOP, CARD_WIDTH, drawCard, drawTrend, fitFont, font, INK, INNER, PAD, trendWidth, wrapLines, type CardFonts, type Ctx } from "@/components/share/cardCanvas";
import { BOARD_SQUARES } from "@/lib/game/board";
import { isDarkSquare, squareVerdict, type LabPiece } from "@/lib/round/round";
import type { PieceColor, PieceType } from "@/types/chess";
import { getPieceImageUrl } from "@/utils/chessPieces";
import type { ResultCardCopy, ResultStat, ScoredBoard } from "./roundShare";

const BOARD_SIZE = 400;
const SQUARE = BOARD_SIZE / 8;
const BOARD_X = CARD_WIDTH - PAD - BOARD_SIZE;
const BOARD_Y = BODY_TOP + 6;
const COLUMN_GAP = 48;
const STATS_TOP = 760;
/** Two rows fit between the legend and the footer; a daily card keeps the same rows, moved up. */
const STAT_ROW = (BODY_BOTTOM - STATS_TOP) / 2;
/** With no board beside the accuracy, the figures move up under it. */
const DAILY_STATS_TOP = 640;
/** The board's marks as round.css draws them on the result screen. */
const MARK = { ok: "rgba(15, 122, 85, 0.26)", wrong: "rgba(198, 63, 18, 0.30)" };
const GHOST_ALPHA = 0.38;
const PIECE_WAIT_MS = 4000;

const GLYPHS: Record<PieceColor, Record<PieceType, string>> = {
  white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" },
  black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" },
};

type PieceArt = (ctx: Ctx, piece: LabPiece, x: number, y: number, size: number) => void;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    const timer = window.setTimeout(() => resolve(null), PIECE_WAIT_MS);
    // The piece sets allow any origin, so the canvas stays readable and the card can still be encoded.
    image.crossOrigin = "anonymous";
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      resolve(null);
    };
    image.src = src;
  });
}

/** The site's own piece images; a piece whose image will not load is drawn as its chess symbol instead. */
async function loadPieces(board: ScoredBoard): Promise<ReadonlyMap<string, HTMLImageElement | null>> {
  const pieces = [...Object.values(board.target), ...Object.values(board.placed)].filter((piece): piece is LabPiece => piece !== undefined);
  const urls = [...new Set(pieces.map(({ type, color }) => getPieceImageUrl(type, color)))];
  return new Map(await Promise.all(urls.map(async (url) => [url, await loadImage(url)] as const)));
}

function pieceArt(images: ReadonlyMap<string, HTMLImageElement | null>): PieceArt {
  return (ctx, piece, x, y, size) => {
    const image = images.get(getPieceImageUrl(piece.type, piece.color));
    if (image) {
      ctx.drawImage(image, x, y, size, size);
      return;
    }
    ctx.font = `${Math.round(size * 0.86)}px serif`;
    ctx.textAlign = "center";
    ctx.fillStyle = INK.ink;
    ctx.fillText(GLYPHS[piece.color][piece.type], x + size / 2, y + size * 0.84);
    ctx.textAlign = "start";
  };
}

/** The scored board as the result screen shows it: what was placed, a faint piece where one was missed, each square marked. */
function drawBoard(ctx: Ctx, board: ScoredBoard, art: PieceArt) {
  BOARD_SQUARES.forEach((square, index) => {
    const x = BOARD_X + (index % 8) * SQUARE;
    const y = BOARD_Y + Math.floor(index / 8) * SQUARE;
    ctx.fillStyle = isDarkSquare(index) ? INK.squareDark : INK.squareLight;
    ctx.fillRect(x, y, SQUARE, SQUARE);
    const verdict = squareVerdict(board.target, board.placed, square)?.split(" ") ?? [];
    if (verdict.includes("ok") || verdict.includes("wrong")) {
      ctx.fillStyle = verdict.includes("ok") ? MARK.ok : MARK.wrong;
      ctx.fillRect(x, y, SQUARE, SQUARE);
    }
    const placed = board.placed[square];
    const ghost = placed ? undefined : board.target[square];
    if (placed) art(ctx, placed, x + 3, y + 3, SQUARE - 6);
    if (ghost) {
      ctx.globalAlpha = GHOST_ALPHA;
      art(ctx, ghost, x + 3, y + 3, SQUARE - 6);
      ctx.globalAlpha = 1;
    }
    if (verdict.includes("miss")) {
      ctx.strokeStyle = INK.wrong;
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 2, y + 2, SQUARE - 4, SQUARE - 4);
    }
  });
  ctx.strokeStyle = INK.rule;
  ctx.lineWidth = 2;
  ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, BOARD_SIZE + 2, BOARD_SIZE + 2);
}

/** A swatch per mark, in the same fill or outline the board uses, so the legend needs no colour to read. */
function drawLegend(ctx: Ctx, legend: NonNullable<ResultCardCopy["legend"]>, fonts: CardFonts) {
  const y = BOARD_Y + BOARD_SIZE + 28;
  const swatch = 24;
  let x = BOARD_X;
  ctx.font = font(500, 22, fonts);
  (["correct", "missed", "wrong"] as const).forEach((mark) => {
    ctx.fillStyle = INK.squareLight;
    ctx.fillRect(x, y, swatch, swatch);
    if (mark === "missed") {
      ctx.strokeStyle = INK.wrong;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, swatch - 3, swatch - 3);
    } else {
      ctx.fillStyle = mark === "correct" ? MARK.ok : MARK.wrong;
      ctx.fillRect(x, y, swatch, swatch);
    }
    ctx.fillStyle = INK.ink2;
    ctx.fillText(legend[mark], x + swatch + 8, y + 19);
    x += swatch + 8 + ctx.measureText(legend[mark]).width + 24;
  });
}

function drawHeadline(ctx: Ctx, copy: ResultCardCopy, width: number, fonts: CardFonts) {
  ctx.fillStyle = INK.muted;
  fitFont(ctx, copy.accuracyLabel, 600, 34, fonts, width);
  ctx.fillText(copy.accuracyLabel, PAD, BODY_TOP + 34);
  const size = fitFont(ctx, copy.accuracy, 600, width > 600 ? 240 : 190, fonts, width);
  const baseline = BODY_TOP + 34 + 14 + size * 0.8;
  ctx.fillStyle = INK.ink;
  ctx.fillText(copy.accuracy, PAD, baseline);
  ctx.fillStyle = INK.ink2;
  fitFont(ctx, copy.pieces, 500, 44, fonts, width);
  ctx.fillText(copy.pieces, PAD, baseline + 64);
}

/** Four figures make two pairs; three or five run in threes, the setting and its two times on the first row. */
function drawStats(ctx: Ctx, copy: ResultCardCopy, top: number, fonts: CardFonts, locale: string) {
  const columns = copy.stats.length === 4 ? 2 : 3;
  const width = (INNER - COLUMN_GAP * (columns - 1)) / columns;
  copy.stats.forEach(({ label, value, mark }, index) => {
    const x = PAD + (index % columns) * (width + COLUMN_GAP);
    const y = top + Math.floor(index / columns) * STAT_ROW;
    ctx.fillStyle = INK.rule;
    ctx.fillRect(x, y, width, 2);
    ctx.fillStyle = INK.muted;
    fitFont(ctx, label, 600, 26, fonts, width);
    ctx.fillText(label, x, y + 48);
    ctx.fillStyle = INK.ink;
    const size = columns === 2 ? 46 : 36;
    ctx.font = font(600, size, fonts);
    if (mark) {
      drawMarked(ctx, mark, x, y + 64 + size, width, size, fonts);
      return;
    }
    wrapLines(ctx, value, width, 2, locale).forEach((line, row) => ctx.fillText(line, x, y + 64 + size + row * Math.round(size * 1.2)));
  });
}

/** A figure with its trend beside it on one baseline; the trend is a little smaller, and both shrink together to fit. */
function drawMarked(ctx: Ctx, { figure, trend }: NonNullable<ResultStat["mark"]>, x: number, baseline: number, width: number, size: number, fonts: CardFonts) {
  const trendSize = (at: number) => Math.round(at * 0.72);
  const room = (at: number) => {
    ctx.font = font(600, at, fonts);
    return ctx.measureText(figure).width + trendWidth(ctx, trend, trendSize(at), fonts);
  };
  let fitted = size;
  while (fitted > 16 && room(fitted) > width) fitted -= 2;
  ctx.font = font(600, fitted, fonts);
  ctx.fillStyle = INK.ink;
  ctx.fillText(figure, x, baseline);
  drawTrend(ctx, trend, x + ctx.measureText(figure).width, baseline, trendSize(fitted), fonts);
}

function drawWith(copy: ResultCardCopy, board: ScoredBoard | null, art: PieceArt, fonts: CardFonts, locale: string): Promise<Blob> {
  return drawCard(copy, fonts, (ctx) => {
    drawHeadline(ctx, copy, board ? BOARD_X - PAD - COLUMN_GAP : INNER, fonts);
    if (board) drawBoard(ctx, board, art);
    if (board && copy.legend) drawLegend(ctx, copy.legend, fonts);
    drawStats(ctx, copy, board ? STATS_TOP : DAILY_STATS_TOP, fonts, locale);
  });
}

/**
 * The round's card: the accuracy large, the scored board beside it unless the round was the daily board, the rest in a
 * grid. Should a piece image still leave the canvas unreadable, the card is drawn again with the chess symbols.
 */
export async function drawResultCard(copy: ResultCardCopy, board: ScoredBoard | null, fonts: CardFonts, locale: string): Promise<Blob> {
  const images = board ? await loadPieces(board) : new Map<string, null>();
  return drawWith(copy, board, pieceArt(images), fonts, locale).catch((error: unknown) => {
    if (!(error instanceof DOMException && error.name === "SecurityError")) throw error;
    return drawWith(copy, board, pieceArt(new Map()), fonts, locale);
  });
}
