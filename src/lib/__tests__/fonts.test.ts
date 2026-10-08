import { readFileSync } from "node:fs";
import { join } from "node:path";
import capsize from "next/dist/server/capsize-font-metrics.json";

jest.mock("next/font/google", () => {
  const loader = () => jest.fn(() => ({ className: "font", variable: "font-variable", style: { fontFamily: "font" } }));
  return { Geist: loader(), Geist_Mono: loader(), Noto_Sans: loader(), Noto_Sans_Devanagari: loader() };
});

// Menlo, the macOS and iOS face the fallback resolves to, is not in next's capsize data. Its regular and bold
// advance is 1233 of 2048 units.
const MENLO_ADVANCE = 1233 / 2048;
const { ascent, descent, lineGap, unitsPerEm, xWidthAvg } = capsize.geistMono;
const sizeAdjust = xWidthAvg / unitsPerEm / MENLO_ADVANCE;
// next/font's own formula: the browser scales the overrides by size-adjust, so each is divided by it.
const percent = (ratio: number) => `${Math.abs(ratio * 100).toFixed(2)}%`;
const METRICS = {
  "size-adjust": percent(sizeAdjust),
  "ascent-override": percent(ascent / (unitsPerEm * sizeAdjust)),
  "descent-override": percent(descent / (unitsPerEm * sizeAdjust)),
  "line-gap-override": percent(lineGap / (unitsPerEm * sizeAdjust)),
};

const fontFaces = (css: string) =>
  [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) =>
    Object.fromEntries([...body.matchAll(/([a-z-]+)\s*:\s*([^;]+);/g)].map(([, property, value]) => [property, value.trim()])),
  );

describe("Geist Mono fallback", () => {
  it("paints in metric-matched local regular and bold faces from globals.css, not next/font's Arial", async () => {
    const { Geist_Mono } = await import("next/font/google");
    await import("../fonts");
    const options = (Geist_Mono as unknown as jest.Mock).mock.calls[0][0];
    const faces = fontFaces(readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")).filter(
      (declared) => declared["font-family"] === `"${options.fallback[0]}"`,
    );

    expect(options.adjustFontFallback).toBe(false);
    expect(options.fallback).toEqual(["Geist Mono Local", "ui-monospace", "monospace"]);
    expect(METRICS).toEqual({ "size-adjust": "99.66%", "ascent-override": "100.84%", "descent-override": "29.60%", "line-gap-override": "0.00%" });
    expect(faces).toEqual([
      {
        "font-family": '"Geist Mono Local"',
        src: 'local("Menlo Regular"), local("Courier New"), local("DejaVu Sans Mono"), local("Liberation Mono"), local("Droid Sans Mono")',
        ...METRICS,
      },
      {
        "font-family": '"Geist Mono Local"',
        "font-weight": "600 900",
        src: 'local("Menlo Bold"), local("Courier New Bold"), local("DejaVu Sans Mono Bold"), local("Liberation Mono Bold")',
        ...METRICS,
      },
    ]);
  });
});

describe("lab mono font shorthands", () => {
  it("all set a line-height, so the line box does not depend on font metrics Safari reads from the face", () => {
    const shorthands = ["lab.css", "lab-instruments.css"].flatMap((file) =>
      [...readFileSync(join(process.cwd(), "src/components/home", file), "utf8").matchAll(/font:\s*([^;]*var\(--lab-mono\))/g)].map(([, value]) => value),
    );

    expect(shorthands).toHaveLength(25);
    expect(shorthands.filter((value) => !value.includes("/"))).toEqual([]);
  });
});
