/** @jest-environment node */

import { spawnSync } from "node:child_process";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..", "..");
const LEVER_PATH = join(REPO_ROOT, "scripts", "articles-i18n.mjs");

describe("the translations this repo serves", () => {
  it("pass the lever's verify, so every listed locale is checked, made from the current English text and reviewed", () => {
    const run = spawnSync(process.execPath, [LEVER_PATH, "verify"], { cwd: REPO_ROOT, encoding: "utf8" });

    expect({ stderr: run.stderr, status: run.status }).toEqual({ stderr: "", status: 0 });
    expect(run.stdout).toMatch(/^ok verify: /);
  });
});
