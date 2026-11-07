/** @jest-environment node */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { SOURCE_DIR, importGerman, inSandbox, runLever, setTranslatedLocales } from "./articlesI18nSandbox";

jest.setTimeout(60_000);

describe("an article published in English before its translations", () => {
  it("is not exported, imported, approved or required, until it leaves the list", () => {
    const runs = inSandbox("fixture", (root) => {
      setTranslatedLocales(root, ["en", "de"], ["ben-example"]);
      const imported = importGerman(root);
      const exported = readdirSync(join(root, SOURCE_DIR)).sort();
      const approve = runLever(root, "approve", "de");
      const verify = runLever(root, "verify");
      setTranslatedLocales(root, ["en", "de"]);
      return { exported, imported, approve, verify, required: runLever(root, "verify") };
    });

    expect(runs.exported).toEqual(["ada-example.source.json", "chrome.source.json"]);
    expect(runs.imported).toEqual({ status: 0, stdout: "ok import de: 3 files written, 0 unchanged\n", failures: [] });
    expect(runs.approve).toEqual({ status: 0, stdout: "ok approve de: 2 files reviewed\n", failures: [] });
    expect(runs.verify).toEqual({ status: 0, stdout: "ok verify: de\n", failures: [] });
    expect(runs.required).toEqual({ status: 1, stdout: "verify: 1 failure\n", failures: ["[de] ben-example: no file"] });
  });
});
