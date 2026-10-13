import { readFileSync } from "node:fs";
import { join } from "node:path";
import measured from "../lab-heights.json";

const css = readFileSync(join(__dirname, "../lab-instruments.css"), "utf8");
const SLACK_PX = 12;
const EMPTY_GAP_PX = 220;
const BOXES = {
  unlock: ".lab-unlock",
  span: ".lab-p-span",
  held: ".lab-p-held",
  spark: ".lab-p-spark",
  speed: ".lab-p-speed",
  heat: ".lab-p-heat",
  streak: ".lab-p-streak",
  bests: ".lab-p-bests",
  types: ".lab-p-types",
  insights: ".lab-p-insights",
  notebook: ".lab-p-notebook",
  plans: ".lab-p-plans",
  goal: ".lab-p-goal",
  daily: ".lab-p-daily",
  curve: ".lab-p-curve",
  board: ".lab-p-board",
  tools: ".lab-tools-slot",
} as const;
type Box = keyof typeof BOXES;
type Tier = "wide" | "medium" | "narrow";
type Heights = Partial<Record<Box, number>>;
type Set = { max: Record<string, Heights>; empty: Record<string, Heights> };

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The reserves one selector sets at each tier: its plain block, then the 1000px and 640px blocks layered on. */
function reservesOf(selector: string): Record<Tier, Heights> {
  const tokensIn = (pattern: RegExp): Heights => {
    const block = css.match(pattern)?.[1] ?? "";
    return Object.fromEntries([...block.matchAll(/--lab-h-(\w+):\s*(\d+)px/g)].map(([, box, px]) => [box, Number(px)]));
  };
  const plain = escape(selector);
  const wide = tokensIn(new RegExp(`^${plain} \\{([^}]*)\\}`, "m"));
  const medium = { ...wide, ...tokensIn(new RegExp(`@media \\(max-width: 1000px\\) \\{\\s*${plain} \\{([^}]*)\\}`)) };
  const narrow = { ...medium, ...tokensIn(new RegExp(`@media \\(max-width: 640px\\) \\{\\s*${plain} \\{([^}]*)\\}`)) };
  return { wide, medium, narrow };
}

const ENGLISH = reservesOf(".lab-paper");
const TRANSLATED = reservesOf(".lab-paper:not(:lang(en))");
const SETS: [string, Set, Record<Tier, Heights>][] = [
  ["English", measured.english, ENGLISH],
  ["translated", measured.translated, TRANSLATED],
];

/** The widths at which the reserves change: each `@media (max-width: Npx)` block that sets them. */
const BREAKPOINTS = [...new Set([...css.matchAll(/@media \(max-width: (\d+)px\) \{\s*\.lab-paper[^{]*\{/g)].map(([, px]) => Number(px)))];

describe("lab record reserved heights", () => {
  it("were measured on both sides of every breakpoint the reserves change at", () => {
    const uncovered = BREAKPOINTS.filter((px) => !(measured.widths.includes(px) && measured.widths.some((width) => width > px && width <= px + 32)));

    expect(BREAKPOINTS).toEqual([1000, 640]);
    expect(uncovered).toEqual([]);
  });

  it("hold every box above its tallest measured state, with room to spare, at every layout width, in English and in translation", () => {
    const short = SETS.flatMap(([name, set, reserves]) =>
      Object.entries(set.max).flatMap(([tier, heights]) =>
        Object.entries(heights).flatMap(([box, height]) => {
          const reserve = reserves[tier as Tier][box as Box] ?? 0;
          return reserve - height >= SLACK_PX ? [] : [`${name} ${tier} ${box}: reserve ${reserve}px, measured ${height}px`];
        }),
      ),
    );

    expect(short).toEqual([]);
  });

  it("leave no more than about 220px blank under any empty or Sample panel on English phones", () => {
    const blank = Object.entries(measured.english.empty.narrow).flatMap(([box, height]) => {
      const gap = (ENGLISH.narrow[box as Box] ?? 0) - height;
      return gap > EMPTY_GAP_PX ? [`${box}: ${gap}px`] : [];
    });

    // The tools strip is not rendered on the server at all.
    expect(blank).toEqual(["tools: 432px"]);
  });

  it("give each box its reserve as a minimum height", () => {
    const unreserved = Object.entries(BOXES).filter(
      ([box, selector]) => !new RegExp(`^${selector.replace(".", "\\.")} \\{[^}]*min-height: var\\(--lab-h-${box}\\)`, "m").test(css),
    );

    expect(unreserved).toEqual([]);
  });
});
