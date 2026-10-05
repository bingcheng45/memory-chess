import { innermostRules, keyframeProperties, readArticleCss } from "@/components/articles/__tests__/cssRules";

const css = readArticleCss("typedBody.css");
const rules = innermostRules(css);

describe("typedBody.css", () => {
  it("hides the text not yet typed with opacity alone, so it keeps its place and stays readable to a screen reader", () => {
    const untyped = rules.find((rule) => rule.selector === ".article-untyped");

    expect(untyped?.body).toBe("opacity: 0;");
    expect(css).not.toMatch(/display:\s*none|visibility:\s*hidden/);
  });

  it("gives the caret no width, so it cannot move a line break", () => {
    const caret = rules.find((rule) => rule.selector === ".article-caret");
    const bar = rules.find((rule) => rule.selector === ".article-caret::after");

    expect(caret?.body).toContain("position: relative");
    expect(caret?.body).not.toMatch(/width|padding|margin/);
    expect(bar?.body).toContain("position: absolute");
  });

  it("animates only opacity in its keyframes", () => {
    expect(keyframeProperties(css)).toEqual(["opacity"]);
  });
});
