/** The Lab Paper card every share draws on: the paper, the wordmark and its badge, the ruler, and the call to play. */

export interface CardFonts {
  readonly sans: string;
}

/** 4:5, the tallest shape the big feeds show uncropped. */
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const PAD = 88;
export const INNER = CARD_WIDTH - 2 * PAD;
/** The smallest text a card prints: a 460px preview, as the dialog and the dashboard show it, sets it at about 11px. */
export const SMALLEST_TEXT = 26;
/** Where a card's own content starts, under the header and its ruler. */
export const BODY_TOP = 256;
/** Lab Paper's light tokens (components/lab-paper/lab-paper.css): a card reads the same wherever it is posted. */
export const INK = {
  paper: "#f5f8f7",
  ink: "#0d1b24",
  ink2: "#364853",
  muted: "#56666f",
  accent: "#1f4fe0",
  accentSoft: "#e5ebfc",
  wordmark: "#c2541a",
  grid: "rgba(31, 79, 224, 0.06)",
  rule: "#d6dfe0",
  correct: "#0f7a55",
  wrong: "#c63f12",
  squareLight: "#eef2f2",
  squareDark: "#c4cfd4",
} as const;

export type Ctx = CanvasRenderingContext2D;

export const font = (weight: number, size: number, fonts: CardFonts) => `${weight} ${size}px ${fonts.sans}`;

function drawPaper(ctx: Ctx) {
  ctx.fillStyle = INK.paper;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.strokeStyle = INK.grid;
  ctx.lineWidth = 1;
  for (let at = 36; at < CARD_HEIGHT; at += 36) {
    ctx.beginPath();
    ctx.moveTo(at + 0.5, 0);
    ctx.lineTo(at + 0.5, CARD_HEIGHT);
    ctx.moveTo(0, at + 0.5);
    ctx.lineTo(CARD_WIDTH, at + 0.5);
    ctx.stroke();
  }
}

/** The lab's ruler: a fine tick every 12px and a tall one every 120px. */
function drawRuler(ctx: Ctx, y: number) {
  ctx.fillStyle = INK.rule;
  for (let x = PAD; x <= CARD_WIDTH - PAD; x += 12) {
    const major = (x - PAD) % 120 === 0;
    ctx.fillRect(x, major ? y - 14 : y - 6, 1.5, major ? 14 : 6);
  }
}

/** Sets the largest size up to `size` at which the text fits, and returns it. */
export function fitFont(ctx: Ctx, text: string, weight: number, size: number, fonts: CardFonts, maxWidth: number): number {
  let fitted = size;
  ctx.font = font(weight, fitted, fonts);
  while (fitted > 12 && ctx.measureText(text).width > maxWidth) {
    fitted -= 2;
    ctx.font = font(weight, fitted, fonts);
  }
  return fitted;
}

/**
 * The pieces a line may break between: after each space but the one after a number, so "70%" and "10 s" stay whole, and, for a run too wide to
 * fit (Japanese and Chinese, written without spaces), between the words the language's segmenter finds. A word still too
 * wide (a long compound) breaks between characters, as it does where the browser has no segmenter.
 */
function breakable(ctx: Ctx, text: string, maxWidth: number, locale: string): string[] {
  const fits = (run: string) => ctx.measureText(run).width <= maxWidth;
  const words = (run: string) =>
    typeof Intl.Segmenter === "function" ? [...new Intl.Segmenter(locale, { granularity: "word" }).segment(run)].map(({ segment }) => segment) : [run];
  return text
    .split(/(?<=\s)/)
    .reduce<string[]>((runs, run) => (/^[\d.,]+\s$/.test(runs.at(-1) ?? "") ? [...runs.slice(0, -1), runs.at(-1) + run] : [...runs, run]), [])
    .flatMap((run) => (fits(run) ? [run] : words(run)))
    .flatMap((word) => (fits(word) ? [word] : Array.from(word)));
}

/** Breaks text into lines no wider than maxWidth. A last line that would overflow `maxLines` ends in an ellipsis. */
export function wrapLines(ctx: Ctx, text: string, maxWidth: number, maxLines: number, locale: string): string[] {
  const words = breakable(ctx, text, maxWidth, locale);
  const lines = words.reduce<string[]>((done, word) => {
    const last = done.at(-1) ?? "";
    const joined = last + word;
    if (done.length === 0) return [word.trimStart()];
    return ctx.measureText(joined).width <= maxWidth || last.trim() === "" ? [...done.slice(0, -1), joined] : [...done, word.trimStart()];
  }, []);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let tail = kept[maxLines - 1];
  while (Array.from(tail).length > 1 && ctx.measureText(`${tail}…`).width > maxWidth) tail = Array.from(tail).slice(0, -1).join("");
  return [...kept.slice(0, -1), `${tail.trimEnd()}…`];
}

function drawHeader(ctx: Ctx, kicker: string, fonts: CardFonts) {
  ctx.textBaseline = "alphabetic";
  ctx.font = font(700, 60, fonts);
  ctx.fillStyle = INK.ink;
  ctx.fillText("Memory ", PAD, PAD + 52);
  const memory = ctx.measureText("Memory ").width;
  ctx.fillStyle = INK.wordmark;
  ctx.fillText("Chess", PAD + memory, PAD + 52);

  const size = fitFont(ctx, kicker, 600, 26, fonts, 420);
  const width = ctx.measureText(kicker).width;
  const height = size + 24;
  ctx.fillStyle = INK.accentSoft;
  ctx.beginPath();
  ctx.roundRect(CARD_WIDTH - PAD - width - 36, PAD + 4, width + 36, height, height / 2);
  ctx.fill();
  ctx.fillStyle = INK.accent;
  ctx.fillText(kicker, CARD_WIDTH - PAD - width - 18, PAD + 4 + 12 + size * 0.85);
  drawRuler(ctx, PAD + 128);
}

function drawFooter(ctx: Ctx, cta: string, site: string, fonts: CardFonts) {
  ctx.fillStyle = INK.rule;
  ctx.fillRect(PAD, CARD_HEIGHT - PAD - 116, INNER, 2);
  ctx.fillStyle = INK.ink;
  fitFont(ctx, cta, 600, 48, fonts, INNER);
  ctx.fillText(cta, PAD, CARD_HEIGHT - PAD - 52);
  ctx.fillStyle = INK.accent;
  fitFont(ctx, site, 600, 44, fonts, INNER);
  ctx.fillText(site, PAD, CARD_HEIGHT - PAD + 4);
}

/** The top of the footer's rule: a card's content ends above it. */
export const BODY_BOTTOM = CARD_HEIGHT - PAD - 116 - 32;

/** Waits for the faces the card names, since a canvas draws with whatever is loaded at that moment. */
async function loadFonts(fonts: CardFonts) {
  if (!document.fonts) return;
  await Promise.all([document.fonts.load(font(700, 60, fonts)), document.fonts.load(font(600, 60, fonts)), document.fonts.load(font(500, 24, fonts))]);
}

export interface CardFrame {
  readonly kicker: string;
  readonly cta: string;
  readonly site: string;
}

/** Draws the frame, lets `body` draw between the ruler and the footer, and encodes the card as a PNG. */
export async function drawCard(frame: CardFrame, fonts: CardFonts, body: (ctx: Ctx) => void | Promise<void>): Promise<Blob> {
  await loadFonts(fonts);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas here");
  drawPaper(ctx);
  drawHeader(ctx, frame.kicker, fonts);
  await body(ctx);
  drawFooter(ctx, frame.cta, frame.site, fonts);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The card could not be encoded"))), "image/png"));
}

/** The card prints in Lab Paper's interface face, the one the page's headings and figures use. */
export function fontsOf(element: HTMLElement): CardFonts {
  const style = getComputedStyle(element);
  return { sans: style.getPropertyValue("--lp-ui").trim() || style.fontFamily };
}

export const SITE = "thememorychess.com";

/** How far a rating moved, as the card draws it: the amount in the player's number format, the arrow by direction. */
export interface CardTrend {
  readonly direction: "up" | "down";
  readonly text: string;
}

const TREND_GAP = 12;
const trendFont = (size: number, fonts: CardFonts) => font(600, size, fonts);

/** The room a trend takes beside a figure, the gap before it included. */
export function trendWidth(ctx: Ctx, { text }: CardTrend, size: number, fonts: CardFonts): number {
  ctx.font = trendFont(size, fonts);
  return TREND_GAP + size * 0.8 + size * 0.3 + ctx.measureText(text).width;
}

/**
 * A triangle and the amount, in Lab Paper's correct green for a rise and wrong red for a fall, starting `TREND_GAP` after `x`
 * on the figure's baseline. The triangle is a path, so no font has to carry an arrow glyph.
 */
export function drawTrend(ctx: Ctx, trend: CardTrend, x: number, baseline: number, size: number, fonts: CardFonts) {
  const side = size * 0.8;
  const left = x + TREND_GAP;
  const top = baseline - size * 0.72;
  ctx.fillStyle = trend.direction === "up" ? INK.correct : INK.wrong;
  ctx.beginPath();
  if (trend.direction === "up") {
    ctx.moveTo(left + side / 2, top);
    ctx.lineTo(left + side, baseline);
    ctx.lineTo(left, baseline);
  } else {
    ctx.moveTo(left, top);
    ctx.lineTo(left + side, top);
    ctx.lineTo(left + side / 2, baseline);
  }
  ctx.closePath();
  ctx.fill();
  ctx.font = trendFont(size, fonts);
  ctx.fillText(trend.text, left + side + size * 0.3, baseline);
}
