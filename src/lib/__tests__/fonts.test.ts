import { readFileSync } from "node:fs";
import { join } from "node:path";
import capsize from "next/dist/server/capsize-font-metrics.json";

jest.mock("next/font/google", () => {
  const loader = () => jest.fn(() => ({ className: "font", variable: "font-variable", style: { fontFamily: "font" } }));
  return { Geist: loader(), Geist_Mono: loader(), Noto_Sans: loader(), Noto_Sans_Devanagari: loader(), Open_Sans: loader() };
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

describe("text webfont fallbacks", () => {
  it("paint Geist, Noto Sans and Open Sans in globals.css faces that cover every weight, in Arial Bold from 550", async () => {
    const google = await import("next/font/google");
    await import("../fonts");
    await import("@/components/lab-paper/shell");
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const calls = ["Geist", "Noto_Sans", "Open_Sans"].flatMap((loader) =>
      (google[loader as keyof typeof google] as unknown as jest.Mock).mock.calls.map(([options]) => options),
    );
    const coverage = calls.map(({ adjustFontFallback, fallback }) => {
      const faces = fontFaces(css).filter((declared) => declared["font-family"] === `"${fallback[0]}"`);
      return {
        adjustFontFallback,
        family: fallback[0],
        weights: faces.map((declared) => declared["font-weight"]),
        bold: faces.filter((declared) => Number(declared["font-weight"].split(" ")[0]) >= 550).every((declared) => /Bold/.test(declared.src)),
        regular: faces.filter((declared) => Number(declared["font-weight"].split(" ")[0]) < 550).every((declared) => !/Bold/.test(declared.src)),
      };
    });

    expect(coverage).toEqual([
      { adjustFontFallback: false, family: "Geist Arial", weights: ["100 449", "450 549", "550 624", "625 674", "675 900"], bold: true, regular: true },
      { adjustFontFallback: false, family: "Noto Sans Arial", weights: ["100 449", "450 549", "550 624", "625 674", "675 900"], bold: true, regular: true },
      { adjustFontFallback: false, family: "Noto Sans Arial", weights: ["100 449", "450 549", "550 624", "625 674", "675 900"], bold: true, regular: true },
      { adjustFontFallback: false, family: "Open Sans Arial", weights: ["100 549", "550 900"], bold: true, regular: true },
    ]);
  });

  it("size each weight to the webfont's measured width and carry the webfont's vertical metrics", () => {
    const webfonts = { "Geist Arial": capsize.geist, "Noto Sans Arial": capsize.notoSans, "Open Sans Arial": capsize.openSans };
    const familyOf = (declared: Record<string, string>) => declared["font-family"].replace(/"/g, "") as keyof typeof webfonts;
    const faces = fontFaces(readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")).filter((declared) => familyOf(declared) in webfonts);
    const metrics = faces.map((face) => [familyOf(face), face["font-weight"], face["size-adjust"], face["ascent-override"], face["descent-override"], face["line-gap-override"]]);
    const fromCapsize = faces.map((face) => {
      const { ascent, descent, lineGap, unitsPerEm } = webfonts[familyOf(face)];
      const sizeAdjust = parseFloat(face["size-adjust"]) / 100;
      return [familyOf(face), face["font-weight"], face["size-adjust"], ...[ascent, descent, lineGap].map((value) => percent(value / (unitsPerEm * sizeAdjust)))];
    });

    expect(metrics).toEqual([
      ["Geist Arial", "100 449", "101.22%", "99.29%", "29.14%", "0.00%"],
      ["Geist Arial", "450 549", "103.38%", "97.21%", "28.54%", "0.00%"],
      ["Geist Arial", "550 624", "99.86%", "100.64%", "29.54%", "0.00%"],
      ["Geist Arial", "625 674", "100.91%", "99.59%", "29.23%", "0.00%"],
      ["Geist Arial", "675 900", "102.26%", "98.28%", "28.85%", "0.00%"],
      ["Noto Sans Arial", "100 449", "102.61%", "104.18%", "28.55%", "0.00%"],
      ["Noto Sans Arial", "450 549", "105.27%", "101.55%", "27.83%", "0.00%"],
      ["Noto Sans Arial", "550 624", "101.29%", "105.54%", "28.93%", "0.00%"],
      ["Noto Sans Arial", "625 674", "102.72%", "104.07%", "28.52%", "0.00%"],
      ["Noto Sans Arial", "675 900", "102.92%", "103.87%", "28.47%", "0.00%"],
      ["Open Sans Arial", "100 549", "104.18%", "102.60%", "28.12%", "0.00%"],
      ["Open Sans Arial", "550 900", "101.67%", "105.13%", "28.82%", "0.00%"],
    ]);
    expect(metrics).toEqual(fromCapsize);
  });
});

describe("lab mono font shorthands", () => {
  it("all set a line-height, so the line box does not depend on font metrics Safari reads from the face", () => {
    const shorthands = ["home/lab-paper.css", "home/lab-instruments.css", "lab-paper/lab-charts.css", "dashboard/dashboard.css"].flatMap((file) =>
      [...readFileSync(join(process.cwd(), "src/components", file), "utf8").matchAll(/font:\s*([^;]*var\(--(?:lp-data|lab-mono)\))/g)].map(([, value]) => value),
    );

    expect(shorthands.length).toBeGreaterThan(0);
    expect(shorthands.filter((value) => !value.includes("/"))).toEqual([]);
  });
});
