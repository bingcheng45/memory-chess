/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inGuideSandbox, read, readJson } from "./articlesI18nSandbox";

const REPO_ROOT = join(__dirname, "..", "..");
const SERVED = "src/lib/seo/learn/servedGuides.json";
const LOCALES = ["ru", "pt-BR", "fr", "de", "es"];
const STALE = `${SERVED} is stale: run \`node scripts/articles-i18n.mjs --guides verify\` and commit the file`;
const LEVER_PATH = join(REPO_ROOT, "scripts", "articles-i18n.mjs");

describe("the translations this repo serves", () => {
  it("pass the lever's verify, so every listed locale is checked, made from the current English text and reviewed", () => {
    const run = spawnSync(process.execPath, [LEVER_PATH, "verify"], { cwd: REPO_ROOT, encoding: "utf8" });

    expect({ stderr: run.stderr, status: run.status }).toEqual({ stderr: "", status: 0 });
    expect(run.stdout).toMatch(/^ok verify: /);
  });

  it("pass the lever's verify of the trust pages, so every locale that serves them has reviewed, current translations", () => {
    const run = spawnSync(process.execPath, [LEVER_PATH, "--pages", "verify"], { cwd: REPO_ROOT, encoding: "utf8" });

    expect({ stderr: run.stderr, status: run.status }).toEqual({ stderr: "", status: 0 });
    expect(run.stdout).toMatch(/^ok verify --pages: /);
  });

  it("pass the lever's verify of the guides in a copy, serving only approved translations and warning for each one held back", () => {
    const servedFile = join(REPO_ROOT, SERVED);
    const trackedBefore = readFileSync(servedFile, "utf8");

    const { run, served, servedText } = inGuideSandbox((root) => ({
      run: spawnSync(process.execPath, [LEVER_PATH, "--guides", "verify"], { cwd: root, encoding: "utf8" }),
      served: readJson(root, SERVED) as Record<string, string[]>,
      servedText: read(root, SERVED),
    }));

    const stderrLines = run.stderr.split("\n").filter((line) => line !== "");
    const held = stderrLines.map((line) => line.match(/^warning: \[([\w-]+)\] ([\w-]+): /));
    expect(run.status).toBe(0);
    expect(held.every((match) => match !== null)).toBe(true);
    const heldPairs = held.map((match) => `${match?.[2]}/${match?.[1]}`);
    const servedPairs = Object.entries(served).flatMap(([slug, locales]) => locales.map((locale) => `${slug}/${locale}`));
    const total = Object.keys(served).length * LOCALES.length;
    expect(servedPairs.filter((pair) => heldPairs.includes(pair))).toEqual([]);
    expect(servedPairs.length + heldPairs.length).toBe(total);
    expect(run.stdout).toBe(`ok verify --guides: ${servedPairs.length} of ${total} translations served, in ${LOCALES.join(", ")}\n`);
    expect(readFileSync(servedFile, "utf8")).toBe(trackedBefore);
    expect(servedText === trackedBefore ? "current" : STALE).toBe("current");
  });
});
