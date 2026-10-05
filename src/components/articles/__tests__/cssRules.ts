import { readFileSync } from "node:fs";
import { join } from "node:path";

export type CssRule = { selector: string; body: string };

export function readArticleCss(file: string): string {
  return readFileSync(join(process.cwd(), "src", "components", "articles", file), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
}

export function innermostRules(css: string): CssRule[] {
  return Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g), ([, selector, body]) => ({
    selector: selector.trim(),
    body: body.trim(),
  }));
}

export function declarationsOf(rule: CssRule): [property: string, value: string][] {
  return rule.body
    .split(";")
    .map((declaration) => declaration.split(":").map((part) => part.trim()))
    .filter(([property]) => Boolean(property))
    .map(([property, value]) => [property, value]);
}

export function keyframeProperties(css: string): string[] {
  return Array.from(css.matchAll(/@keyframes\s+[\w-]+\s*\{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)).flatMap(([, frames]) =>
    innermostRules(frames).flatMap((frame) => declarationsOf(frame).map(([property]) => property)),
  );
}
