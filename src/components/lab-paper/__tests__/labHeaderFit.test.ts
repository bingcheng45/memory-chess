import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LOCALES } from "@/i18n/routing";

const css = readFileSync(join(__dirname, "..", "lab-header-fit.css"), "utf8");
const blocks = css.split("@media ").slice(1);

describe("lab-header-fit.css", () => {
  it.each(LOCALES)("folds the %s header's nav into the menu at a measured width", (locale) => {
    const folds = blocks.filter((block) => block.includes(`html[lang="${locale}"]`) && block.includes(".lab-menu-btn { display: inline-flex; }"));
    expect(folds).toHaveLength(1);
    expect(folds[0]).toMatch(/^\(min-width: 481px\) and \(max-width: \d{3,4}px\) \{/);
  });
});
