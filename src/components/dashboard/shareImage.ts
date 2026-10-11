import type { FigureSegment } from "./figureText";

/** What the card prints, already in the player's language and number format. */
export interface CardCopy {
  readonly kicker: string;
  readonly figures: readonly { readonly label: string; readonly segments: readonly FigureSegment[] }[];
  readonly rounds: string;
  readonly cta: string;
  readonly site: string;
}

export interface CardFonts {
  readonly sans: string;
  readonly mono: string;
}

/** 4:5, the tallest shape the big feeds show uncropped. */
const WIDTH = 1080;
const HEIGHT = 1350;
const PAD = 88;
const INK = "#0d1b24";
const PAPER = "#ffffff";
const MUTED = "#8fa1a8";
const SOFT = "#b5c4c9";
const MINT = "#3fd0a8";
const GRID = "rgba(255, 255, 255, 0.04)";
const RULE = "rgba(255, 255, 255, 0.16)";

type Ctx = CanvasRenderingContext2D;

function drawGrid(ctx: Ctx) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let at = 36; at < Math.max(WIDTH, HEIGHT); at += 36) {
    ctx.beginPath();
    ctx.moveTo(at + 0.5, 0);
    ctx.lineTo(at + 0.5, HEIGHT);
    ctx.moveTo(0, at + 0.5);
    ctx.lineTo(WIDTH, at + 0.5);
    ctx.stroke();
  }
}

/** The lab's ruler: a fine tick every 12px and a tall one every 120px. */
function drawRuler(ctx: Ctx, y: number) {
  ctx.fillStyle = RULE;
  for (let x = PAD; x <= WIDTH - PAD; x += 12) {
    const major = (x - PAD) % 120 === 0;
    ctx.fillRect(x, major ? y - 14 : y - 6, 1.5, major ? 14 : 6);
  }
}

function fitFont(ctx: Ctx, text: string, weight: number, size: number, family: string, maxWidth: number): number {
  let fitted = size;
  ctx.font = `${weight} ${fitted}px ${family}`;
  while (fitted > 12 && ctx.measureText(text).width > maxWidth) {
    fitted -= 2;
    ctx.font = `${weight} ${fitted}px ${family}`;
  }
  return fitted;
}

function drawHeader(ctx: Ctx, copy: CardCopy, fonts: CardFonts) {
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 60px ${fonts.sans}`;
  ctx.fillStyle = PAPER;
  ctx.fillText("Memory ", PAD, PAD + 52);
  const memory = ctx.measureText("Memory ").width;
  ctx.fillStyle = MINT;
  ctx.fillText("Chess", PAD + memory, PAD + 52);

  const kicker = copy.kicker.toUpperCase();
  const size = fitFont(ctx, kicker, 500, 24, fonts.mono, 360);
  const width = ctx.measureText(kicker).width;
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 2;
  ctx.strokeRect(WIDTH - PAD - width - 28, PAD + 6, width + 28, size + 24);
  ctx.fillStyle = SOFT;
  ctx.fillText(kicker, WIDTH - PAD - width - 14, PAD + 6 + 12 + size * 0.85);
  drawRuler(ctx, PAD + 128);
}

interface Slot {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly valueSize: number;
}

/** The number large and its unit small on one baseline, in the order the language puts them, shrunk together until they fit. */
function drawFigure(ctx: Ctx, { label, segments }: CardCopy["figures"][number], slot: Slot, fonts: CardFonts) {
  const labelSize = Math.round(slot.valueSize / 5.5) + 8;
  ctx.fillStyle = MUTED;
  fitFont(ctx, label.toUpperCase(), 500, labelSize, fonts.mono, slot.width);
  ctx.fillText(label.toUpperCase(), slot.x, slot.y + labelSize);

  const baseline = slot.y + labelSize + 18 + slot.valueSize * 0.82;
  const fontOf = (big: boolean, size: number) => (big ? `600 ${size}px ${fonts.sans}` : `500 ${Math.round(size * 0.24)}px ${fonts.sans}`);
  const widthAt = (size: number) =>
    segments.reduce((sum, { text, big }) => {
      ctx.font = fontOf(big, size);
      return sum + ctx.measureText(text).width;
    }, 0);
  let size = slot.valueSize;
  while (size > 24 && widthAt(size) > slot.width) size -= 4;

  let x = slot.x;
  segments.forEach(({ text, big }) => {
    ctx.font = fontOf(big, size);
    ctx.fillStyle = big ? PAPER : SOFT;
    ctx.fillText(text, x, baseline);
    x += ctx.measureText(text).width;
  });
}

/** The first figure leads at full width; the rest share two columns below it. */
function drawFigures(ctx: Ctx, copy: CardCopy, fonts: CardFonts) {
  const [lead, ...rest] = copy.figures;
  if (!lead) return;
  const inner = WIDTH - 2 * PAD;
  drawFigure(ctx, lead, { x: PAD, y: 300, width: inner, valueSize: 230 }, fonts);
  const column = (inner - 48) / 2;
  rest.forEach((figure, index) => {
    const row = Math.floor(index / 2);
    drawFigure(ctx, figure, { x: PAD + (index % 2) * (column + 48), y: 640 + row * 250, width: column, valueSize: 128 }, fonts);
  });
}

function drawFooter(ctx: Ctx, copy: CardCopy, fonts: CardFonts) {
  ctx.fillStyle = SOFT;
  fitFont(ctx, copy.rounds, 500, 30, fonts.sans, WIDTH - 2 * PAD);
  ctx.fillText(copy.rounds, PAD, HEIGHT - PAD - 150);
  ctx.fillStyle = RULE;
  ctx.fillRect(PAD, HEIGHT - PAD - 116, WIDTH - 2 * PAD, 2);
  ctx.fillStyle = PAPER;
  fitFont(ctx, copy.cta, 600, 48, fonts.sans, WIDTH - 2 * PAD);
  ctx.fillText(copy.cta, PAD, HEIGHT - PAD - 52);
  ctx.fillStyle = MINT;
  fitFont(ctx, copy.site, 600, 44, fonts.sans, WIDTH - 2 * PAD);
  ctx.fillText(copy.site, PAD, HEIGHT - PAD + 4);
}

/** Waits for the faces the card names, since a canvas draws with whatever is loaded at that moment. */
async function loadFonts(fonts: CardFonts) {
  if (!document.fonts) return;
  await Promise.all([document.fonts.load(`600 60px ${fonts.sans}`), document.fonts.load(`500 24px ${fonts.sans}`), document.fonts.load(`500 24px ${fonts.mono}`)]);
}

export async function drawShareCard(copy: CardCopy, fonts: CardFonts): Promise<Blob> {
  await loadFonts(fonts);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas here");
  drawGrid(ctx);
  drawHeader(ctx, copy, fonts);
  drawFigures(ctx, copy, fonts);
  drawFooter(ctx, copy, fonts);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The card could not be encoded"))), "image/png"));
}
