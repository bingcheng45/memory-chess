import { BODY_BOTTOM, BODY_TOP, drawCard, fitFont, font, INK, INNER, PAD, wrapLines, type CardFonts, type CardFrame, type Ctx } from "@/components/share/cardCanvas";
import type { FigureSegment } from "./figureText";

/** One figure as the card prints it, already in the player's language and number format. */
export interface CardFigure {
  readonly label: string;
  readonly segments: readonly FigureSegment[];
  readonly note: string;
}

/** What the progress card prints: one figure large, the rest in a grid under it. */
export interface CardCopy extends CardFrame {
  readonly lead: CardFigure;
  readonly grid: readonly CardFigure[];
}

interface Slot {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly labelSize: number;
  readonly valueSize: number;
  readonly noteSize: number;
  readonly noteLines: number;
}

const GRID_TOP = 572;
const COLUMN_GAP = 40;

/** The number large and its unit small on one baseline, in the order the language puts them, shrunk together until they fit. */
function drawValue(ctx: Ctx, segments: readonly FigureSegment[], x: number, baseline: number, width: number, size: number, fonts: CardFonts) {
  const fontOf = (big: boolean, at: number) => (big ? font(600, at, fonts) : font(500, Math.round(at * 0.3), fonts));
  const widthAt = (at: number) =>
    segments.reduce((sum, { text, big }) => {
      ctx.font = fontOf(big, at);
      return sum + ctx.measureText(text).width;
    }, 0);
  let fitted = size;
  while (fitted > 24 && widthAt(fitted) > width) fitted -= 4;

  let left = x;
  segments.forEach(({ text, big }) => {
    ctx.font = fontOf(big, fitted);
    ctx.fillStyle = big ? INK.ink : INK.ink2;
    ctx.fillText(text, left, baseline);
    left += ctx.measureText(text).width;
  });
}

function drawFigure(ctx: Ctx, { label, segments, note }: CardFigure, slot: Slot, fonts: CardFonts, locale: string) {
  ctx.fillStyle = INK.muted;
  fitFont(ctx, label, 600, slot.labelSize, fonts, slot.width);
  const labelBaseline = slot.y + slot.labelSize;
  ctx.fillText(label, slot.x, labelBaseline);

  const valueBaseline = labelBaseline + 14 + slot.valueSize * 0.8;
  drawValue(ctx, segments, slot.x, valueBaseline, slot.width, slot.valueSize, fonts);

  ctx.font = font(400, slot.noteSize, fonts);
  ctx.fillStyle = INK.ink2;
  const lineHeight = Math.round(slot.noteSize * 1.3);
  wrapLines(ctx, note, slot.width, slot.noteLines, locale).forEach((line, index) => {
    ctx.fillText(line, slot.x, valueBaseline + 14 + lineHeight * (index + 1) - (lineHeight - slot.noteSize));
  });
}

/** Up to four figures share two wide columns; more take three, so ten figures still fit above the footer. */
function drawGrid(ctx: Ctx, grid: readonly CardFigure[], fonts: CardFonts, locale: string) {
  if (grid.length === 0) return;
  const columns = grid.length <= 4 ? 2 : 3;
  const rows = Math.ceil(grid.length / columns);
  const width = (INNER - COLUMN_GAP * (columns - 1)) / columns;
  const rowHeight = (BODY_BOTTOM - GRID_TOP) / Math.max(rows, columns === 2 ? 2 : 3);
  const sizes = columns === 2 ? { labelSize: 28, valueSize: 96, noteSize: 24 } : { labelSize: 24, valueSize: 66, noteSize: 21 };
  grid.forEach((figure, index) => {
    const x = PAD + (index % columns) * (width + COLUMN_GAP);
    const y = GRID_TOP + Math.floor(index / columns) * rowHeight;
    ctx.fillStyle = INK.rule;
    ctx.fillRect(x, y, width, 2);
    drawFigure(ctx, figure, { x, y: y + 20, width, ...sizes, noteLines: 2 }, fonts, locale);
  });
}

export function drawShareCard(copy: CardCopy, fonts: CardFonts, locale: string): Promise<Blob> {
  return drawCard(copy, fonts, (ctx) => {
    drawFigure(ctx, copy.lead, { x: PAD, y: BODY_TOP, width: INNER, labelSize: 34, valueSize: 170, noteSize: 28, noteLines: 1 }, fonts, locale);
    drawGrid(ctx, copy.grid, fonts, locale);
  });
}
