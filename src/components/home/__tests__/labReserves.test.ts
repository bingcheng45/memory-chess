import { readFileSync } from "node:fs";
import { join } from "node:path";
import measured from "../lab-heights.json";

const css = readFileSync(join(__dirname, "../lab-instruments.css"), "utf8");
const SLACK_PX = 8;
const BOXES = {
  unlock: ".lab-unlock",
  spark: ".lab-p-spark",
  heat: ".lab-p-heat",
  streak: ".lab-p-streak",
  bests: ".lab-p-bests",
  types: ".lab-p-types",
  tools: ".lab-tools-slot",
} as const;
type Box = keyof typeof BOXES;

function tokensIn(pattern: RegExp): Partial<Record<Box, number>> {
  const block = css.match(pattern)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/--lab-h-(\w+):\s*(\d+)px/g)].map(([, box, px]) => [box, Number(px)]));
}

const wide = tokensIn(/^\.lab \{([^}]*)\}/m);
const medium = { ...wide, ...tokensIn(/@media \(max-width: 1000px\) \{\s*\.lab \{([^}]*)\}/) };
const narrow = { ...medium, ...tokensIn(/@media \(max-width: 640px\) \{\s*\.lab \{([^}]*)\}/) };
const reserves = { wide, medium, narrow };

describe("§06 reserved heights", () => {
  it("hold every box above its tallest measured state, with room to spare, at every layout width", () => {
    const short = Object.entries(measured.max).flatMap(([tier, heights]) =>
      Object.entries(heights).flatMap(([box, height]) => {
        const reserve = reserves[tier as keyof typeof reserves][box as Box] ?? 0;
        return reserve - height >= SLACK_PX ? [] : [`${tier} ${box}: reserve ${reserve}px, measured ${height}px`];
      }),
    );

    expect(short).toEqual([]);
  });

  it("give each box its reserve as a minimum height", () => {
    const unreserved = Object.entries(BOXES).filter(
      ([box, selector]) => !new RegExp(`^${selector.replace(".", "\\.")} \\{[^}]*min-height: var\\(--lab-h-${box}\\)`, "m").test(css),
    );

    expect(unreserved).toEqual([]);
  });
});
