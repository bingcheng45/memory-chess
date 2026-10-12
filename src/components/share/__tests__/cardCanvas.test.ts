import { wrapLines, type Ctx } from "@/components/share/cardCanvas";

/** Every character 10px wide, so a 200px line holds 20. */
const ctx = { measureText: (text: string) => ({ width: [...text].length * 10 }) } as unknown as Ctx;

describe("wrapLines", () => {
  it("breaks at spaces, keeps a number with the word after it, and ends a cut-off line in an ellipsis", () => {
    expect(wrapLines(ctx, "Game rounds at 6 pieces, 10 s, from 9 rounds", 200, 2, "en")).toEqual(["Game rounds at ", "6 pieces, 10 s,…"]);
  });

  it("keeps a short line whole", () => {
    expect(wrapLines(ctx, "Over 3 days", 200, 2, "en")).toEqual(["Over 3 days"]);
  });

  it("breaks text written without spaces between its words", () => {
    const lines = wrapLines(ctx, "直近10ラウンドの平均、設定は問わない", 100, 3, "ja");

    expect(lines.join("")).toBe("直近10ラウンドの平均、設定は問わない");
    expect(lines.every((line) => [...line].length <= 10)).toBe(true);
    expect(lines.length).toBeGreaterThan(1);
  });
});
