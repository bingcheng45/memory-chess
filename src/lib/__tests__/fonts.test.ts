import { readFileSync } from "node:fs";
import { join } from "node:path";

jest.mock("next/font/google", () => {
  const loader = () => jest.fn(() => ({ className: "font", variable: "font-variable", style: { fontFamily: "font" } }));
  return { Geist: loader(), Geist_Mono: loader(), Noto_Sans: loader(), Noto_Sans_Devanagari: loader() };
});

const fontFaces = (css: string) =>
  [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) =>
    Object.fromEntries([...body.matchAll(/([a-z-]+)\s*:\s*([^;]+);/g)].map(([, property, value]) => [property, value.trim()])),
  );

describe("Geist Mono fallback", () => {
  it("paints in the metric-matched local face from globals.css, not next/font's Arial", async () => {
    const { Geist_Mono } = await import("next/font/google");
    await import("../fonts");
    const options = (Geist_Mono as unknown as jest.Mock).mock.calls[0][0];
    const faces = fontFaces(readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8"));
    const face = faces.find((declared) => declared["font-family"] === `"${options.fallback[0]}"`);

    expect(options.adjustFontFallback).toBe(false);
    expect(options.fallback).toEqual(["Geist Mono Local", "ui-monospace", "monospace"]);
    expect(face).toEqual({
      "font-family": '"Geist Mono Local"',
      src: 'local("Menlo Regular"), local("Courier New"), local("DejaVu Sans Mono"), local("Liberation Mono"), local("Droid Sans Mono")',
      "size-adjust": "99.65%",
      "ascent-override": "100.5%",
      "descent-override": "29.5%",
      "line-gap-override": "0%",
    });
  });
});
