import { readFileSync } from "fs";
import { join } from "path";

const SRC = join(__dirname, "..", "..", "..");
const SLUG_ONLY_MODULES = ["lib/articles/registry.ts", "app/sitemap.ts", "app/api/articles/[slug]/stats/route.ts"];
const LOCALE_AWARE_MODULE = /^(@\/lib\/articles|\.|\.\/index|(.*\/)?translations)$/;

function importsOf(file: string): string[] {
  const text = readFileSync(join(SRC, file), "utf8");
  return Array.from(text.matchAll(/from\s+"([^"]+)"/g), (match) => match[1]);
}

describe("code that only needs article slugs", () => {
  it.each(SLUG_ONLY_MODULES)("%s does not import the index or the translation loader", (file) => {
    expect(importsOf(file).filter((specifier) => LOCALE_AWARE_MODULE.test(specifier))).toEqual([]);
  });

  it("finds the imports it checks", () => {
    expect(importsOf("app/sitemap.ts")).toContain("@/lib/articles/registry");
  });
});
