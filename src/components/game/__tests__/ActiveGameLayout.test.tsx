import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@/test-utils/intl";
import ActiveGameLayout, { LAYOUT_INPUTS } from "@/components/game/ActiveGameLayout";

/** The active round's rules: the stylesheet up to the result screen's, without comments or the shell's --lp- tokens. */
const activeRules = readFileSync(join(process.cwd(), "src/components/game/game-lab.css"), "utf8")
  .split("/* result screen */")[0]
  .replace(/\/\*[\s\S]*?\*\//g, "");
const names = (pattern: RegExp) =>
  new Set(Array.from(activeRules.matchAll(pattern), (match) => match[1]).filter((name) => !name.startsWith("--lp-")));

describe("ActiveGameLayout", () => {
  /**
   * The layouts live in game-lab.css and read a few figures the component hands them. A custom property nobody sets
   * makes every length that reads it invalid, and the board then has no size at all, so the two sides are held here.
   */
  it("sets every figure the stylesheet reads but does not define", () => {
    const defined = names(/(--[\w-]+)\s*:/g);
    const read = names(/var\((--[\w-]+)\)/g);
    const supplied = [...read].filter((name) => !defined.has(name)).sort();

    expect(supplied).toEqual(Object.keys(LAYOUT_INPUTS).sort());
  });

  it("draws the status, the board and the controls in the areas the layouts place", () => {
    render(<ActiveGameLayout status={<p>status</p>} board={<p>board</p>} controls={<p>controls</p>} />);

    expect(screen.getByRole("region", { name: "Game status" })).toHaveClass("lab-active-status");
    expect(screen.getByText("board").parentElement).toHaveAttribute("data-round-board");
    expect(screen.getByRole("region", { name: "Game controls" })).toHaveClass("lab-active-controls");
  });
});
