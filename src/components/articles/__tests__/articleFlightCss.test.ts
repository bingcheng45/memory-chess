import { innermostRules, keyframeProperties, readArticleCss } from "@/components/articles/__tests__/cssRules";

const COMPOSITOR_PROPERTIES = ["opacity", "transform", "clip-path"];
const SHARED_NAMES = ["article-date", "article-portrait", "article-title"];

const css = readArticleCss("articleFlight.css");
const rules = innermostRules(css);

describe("articleFlight.css", () => {
  const naming = rules.filter((rule) => rule.body.includes("view-transition-name"));

  it("shares exactly three names: the portrait, the title and the date", () => {
    const names = naming.map((rule) => /view-transition-name:\s*([\w-]+)/.exec(rule.body)?.[1]).sort();

    expect(names).toEqual(SHARED_NAMES);
  });

  it("gives a name only inside a marked card or article, so the list holds none at rest", () => {
    for (const rule of naming) {
      expect(rule.selector).toMatch(/^\[data-article-flight\] \[data-flight="(portrait|title|date)"\]$/);
    }
  });

  it("runs the three groups for 620 ms on the design's curve", () => {
    const groups = rules.find((rule) => SHARED_NAMES.every((name) => rule.selector.includes(`group(${name})`)));

    expect(groups?.body).toContain("animation-duration: 620ms");
    expect(groups?.body).toMatch(/cubic-bezier\(\s*0?\.16,\s*1,\s*0?\.3,\s*1\s*\)/);
  });

  it("cross-fades the root in 250 ms", () => {
    const root = rules.filter((rule) => rule.selector.includes("(root)"));

    expect(root.length).toBeGreaterThan(0);
    expect(root.every((rule) => rule.body.includes("250ms"))).toBe(true);
  });

  it("keeps the portrait covering its box in both snapshots, so the photo never squashes", () => {
    const portrait = rules.find(
      (rule) =>
        rule.selector.includes("::view-transition-old(article-portrait)") &&
        rule.selector.includes("::view-transition-new(article-portrait)"),
    );

    expect(portrait?.body).toContain("object-fit: cover");
  });

  it("switches every transition animation off under reduced motion", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*::view-transition-group\(\*\)/);
    expect(css).toMatch(/animation:\s*none\s*!important/);
  });

  it("writes no keyframes of its own beyond transform, opacity and clip-path", () => {
    expect(keyframeProperties(css).filter((property) => !COMPOSITOR_PROPERTIES.includes(property))).toEqual([]);
  });
});
