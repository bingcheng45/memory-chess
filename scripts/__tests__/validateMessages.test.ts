/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const VALIDATOR = join(__dirname, "..", "validate-messages.mjs");

const ENGLISH = { home: { title: "Welcome", lab: { hero: "Put a number on it" } } };
const GERMAN_WITH_LAB = { home: { title: "Willkommen", lab: { hero: "Miss es" } } };
const GERMAN_WITHOUT_LAB = { home: { title: "Willkommen" } };

type Run = { status: number | null; output: string };

function put(root: string, path: string, text: string) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

function validate(labLocales: string[], german: object): Run {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "validate-messages-")));
  try {
    put(root, "src/i18n/routing.ts", 'export const LOCALES = ["en", "de"] as const;\n');
    put(
      root,
      "src/lib/home/labLocales.ts",
      `export const LAB_LOCALES: readonly string[] = ${JSON.stringify(labLocales)};\n` +
        "export function hasLabCopy(locale: string): boolean { return LAB_LOCALES.includes(locale); }\n",
    );
    put(root, "messages/en.json", JSON.stringify(ENGLISH));
    put(root, "messages/de.json", JSON.stringify(german));

    const run = spawnSync(process.execPath, [VALIDATOR], { cwd: root, encoding: "utf8" });
    return { status: run.status, output: `${run.stdout}${run.stderr}` };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("validate-messages lab namespace", () => {
  it("fails a locale in LAB_LOCALES whose catalogue lacks home.lab", () => {
    const run = validate(["en", "de"], GERMAN_WITHOUT_LAB);

    expect(run.status).toBe(1);
    expect(run.output).toContain("[de] missing key: home.lab.hero");
  });

  it("fails a locale outside LAB_LOCALES whose catalogue carries home.lab", () => {
    const run = validate(["en"], GERMAN_WITH_LAB);

    expect(run.status).toBe(1);
    expect(run.output).toContain("[de] lab key in a locale outside LAB_LOCALES: home.lab.hero");
  });

  it("passes when each locale carries home.lab exactly when it is in LAB_LOCALES", () => {
    expect(validate(["en"], GERMAN_WITHOUT_LAB)).toEqual({
      status: 0,
      output: "2 keys x 2 locales - all consistent.\n",
    });
    expect(validate(["en", "de"], GERMAN_WITH_LAB)).toEqual({
      status: 0,
      output: "2 keys x 2 locales - all consistent.\n",
    });
  });
});
