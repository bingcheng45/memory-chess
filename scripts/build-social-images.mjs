// Builds the site's share images from the launch artwork.
// Usage: node scripts/build-social-images.mjs [source.jpg]
//
// Every output keeps its headline and board inside a centred 4:3 box, because
// answer engines (ChatGPT, Perplexity, Bing) show link images as roughly 4:3
// thumbnails cropped from the middle. The wide 1.91:1 image therefore crops
// cleanly, and the 4:3 and 1:1 images are the same box with more paper around it.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SOURCE = process.argv[2] ?? "marketing/final/01-hook.jpg";
// Bump the folder when the artwork changes: crawlers and answer engines cache an
// image by its URL, so a new URL is the only reliable way to replace it.
const OUT_DIR = "public/social/v2";

// Regions of the 2540x1520 launch artwork, in source pixels.
const HEADLINE = { left: 120, top: 470, width: 1020, height: 590 };
const BOARD = { left: 1420, top: 205, width: 1040, height: 1130 };
const BRAND = { left: 120, top: 1384, width: 800, height: 64 };

const PAPER = { r: 246, g: 248, b: 245 };
// The artwork's graph-paper lines are lighter than this; text never is.
const PAPER_FLOOR = 205;
const BOX = { width: 840, height: 630 };

const OUTPUTS = [
  { name: "memory-chess-1200x630.jpg", width: 1200, height: 630 },
  { name: "memory-chess-1200x900.jpg", width: 1200, height: 900 },
  { name: "memory-chess-1200x1200.jpg", width: 1200, height: 1200 },
];

// Paints the artwork's graph-paper lines out so cropped text sits on plain paper.
async function flatten(buffer) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) {
    if (Math.min(data[i], data[i + 1], data[i + 2]) >= PAPER_FLOOR) {
      data[i] = PAPER.r;
      data[i + 1] = PAPER.g;
      data[i + 2] = PAPER.b;
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function piece(region, width, radius = 0) {
  const height = Math.round((region.height * width) / region.width);
  const resized = await sharp(SOURCE).extract(region).resize(width, height).png().toBuffer();
  if (!radius) return { input: await flatten(resized), width, height };
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius}"/></svg>`,
  );
  const input = await sharp(resized).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return { input, width, height };
}

function frame(x, y, width, height, radius) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 24}" height="${height + 24}">` +
      `<defs><filter id="s" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#1b2430" flood-opacity="0.10"/></filter></defs>` +
      `<rect x="12" y="10" width="${width}" height="${height}" rx="${radius}" fill="#fff" stroke="#d9dee6" filter="url(#s)"/></svg>`,
  );
}

async function render({ name, width, height }) {
  const scale = Math.min(width / BOX.width, height / BOX.height);
  const ox = Math.round((width - BOX.width * scale) / 2);
  const oy = Math.round((height - BOX.height * scale) / 2);
  const at = (v) => Math.round(v * scale);

  const headline = await piece(HEADLINE, at(370));
  const board = await piece(BOARD, at(405), at(10));
  const brand = await piece(BRAND, at(300));

  const boardX = ox + at(410);
  const boardY = oy + Math.round((BOX.height * scale - board.height) / 2);
  const headlineX = ox + at(24);
  const headlineY = oy + Math.round((BOX.height * scale - headline.height) / 2) - at(20);

  const image = await sharp({ create: { width, height, channels: 3, background: PAPER } })
    .composite([
      { input: frame(0, 0, board.width, board.height, at(10)), left: boardX - 12, top: boardY - 10 },
      { input: board.input, left: boardX, top: boardY },
      { input: headline.input, left: headlineX, top: headlineY },
      { input: brand.input, left: headlineX, top: headlineY + headline.height + at(28) },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(`${OUT_DIR}/${name}`);
  console.log(`${OUT_DIR}/${name}`, `${image.width}x${image.height}`, `${Math.round(image.size / 1024)}KB`);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const output of OUTPUTS) await render(output);
