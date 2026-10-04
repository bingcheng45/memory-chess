/** @jest-environment node */

import { approvalHashOf } from "@/lib/articles/articleText";
import {
  BEN,
  GERMAN_DIR as DIR,
  INSTALLED_GERMAN as INSTALLED,
  filesUnder,
  importGerman,
  inSandbox,
  putJson,
  readJson,
  runLever,
  setTranslatedLocales,
  withSecondParagraph,
} from "./articlesI18nSandbox";

jest.setTimeout(60_000);

const ADA_FILE = `${INSTALLED}/ada-example.json`;
const BEN_FILE = `${INSTALLED}/ben-example.json`;
const CHROME_FILE = `${INSTALLED}/chrome.json`;
const MESSAGES = "messages/de.json";
const EDITED = "not reviewed, edited after it was approved";

function approvals(root: string): boolean[] {
  const textOf = (file: string) => (file === CHROME_FILE ? readJson(root, MESSAGES).articles : readJson(root, file).text);

  return [ADA_FILE, BEN_FILE, CHROME_FILE].map((file) => {
    const { sourceHash, sameAsEnglish, approvedHash } = readJson(root, file);
    return approvedHash === approvalHashOf({ sourceHash, sameAsEnglish, text: textOf(file) });
  });
}

const installedBytes = (root: string) => ({ ...filesUnder(root, "src"), ...filesUnder(root, "messages") });

type Json = Record<string, Record<string, object>>;

function change(root: string, file: string, edit: (value: Json) => unknown): void {
  putJson(root, file, edit(readJson(root, file)));
}

function approvedGerman(root: string): void {
  setTranslatedLocales(root, ["en", "de"]);
  importGerman(root);
  runLever(root, "approve", "de");
}

describe("approve", () => {
  it("records the hash of every installed file, and a second import of the same directory keeps it", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      const imported = [ADA_FILE, BEN_FILE, CHROME_FILE].map((file) => readJson(root, file).approvedHash);
      const approve = runLever(root, "approve", "de");
      const approved = installedBytes(root);
      const approveAgain = runLever(root, "approve", "de");
      const reimport = runLever(root, "import", "de", DIR);
      return { imported, approve, approveAgain, reimport, approved, after: installedBytes(root), approvals: approvals(root) };
    });

    expect(state.imported).toEqual([null, null, null]);
    expect(state.approve).toEqual({ status: 0, stdout: "ok approve de: 3 files reviewed\n", failures: [] });
    expect(state.approveAgain.stdout).toBe("ok approve de: 3 files reviewed\n");
    expect(state.reimport.stdout).toBe("ok import de: 0 files written, 4 unchanged\n");
    expect(state.approvals).toEqual([true, true, true]);
    expect(state.after).toEqual(state.approved);
  });

  it("keeps a repair the reviewer made in the installed files", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      change(root, ADA_FILE, (ada) => ({ ...ada, text: { ...ada.text, title: "Wie Ada Example ein Brett behält" } }));
      change(root, MESSAGES, (messages) => ({ ...messages, articles: { ...messages.articles, pager: { page: "Seite {page}" } } }));
      const run = runLever(root, "approve", "de");
      return {
        run,
        approvals: approvals(root),
        title: readJson(root, ADA_FILE).text.title,
        page: readJson(root, MESSAGES).articles.pager.page,
      };
    });

    expect(state).toEqual({
      run: { status: 0, stdout: "ok approve de: 3 files reviewed\n", failures: [] },
      approvals: [true, true, true],
      title: "Wie Ada Example ein Brett behält",
      page: "Seite {page}",
    });
  });

  it("is reset for one article only when a second import changes one of its paragraphs", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      runLever(root, "approve", "de");
      importGerman(root, (good) => withSecondParagraph(good, "Zz She won them all."));
      return { approvals: approvals(root), ada: readJson(root, ADA_FILE).approvedHash };
    });

    expect(state).toEqual({ approvals: [false, true, true], ada: null });
  });

  it("is reset for the chrome only when a second import changes one chrome string", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      runLever(root, "approve", "de");
      importGerman(root, (good) => ({ ...good, chrome: { ...good.chrome, "list.heading": "Artikel" } }));
      return { approvals: approvals(root), chrome: readJson(root, CHROME_FILE).approvedHash };
    });

    expect(state).toEqual({ approvals: [true, true, false], chrome: null });
  });

  it("is reset when a path is added to same-as-english.json", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      runLever(root, "approve", "de");
      importGerman(root, (good) => {
        const ben = { ...good.articles[BEN.slug], facts: { ...good.articles[BEN.slug].facts, country: "Netherlands" } };
        return { ...good, articles: { ...good.articles, [BEN.slug]: ben }, sameAsEnglish: { [BEN.slug]: ["facts.country"] } };
      });
      return { approvals: approvals(root), listed: readJson(root, BEN_FILE).sameAsEnglish };
    });

    expect(state).toEqual({ approvals: [true, false, true], listed: ["facts.country"] });
  });

  it("approves nothing when an installed file fails the check", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      change(root, ADA_FILE, (ada) => ({ ...ada, text: { ...ada.text, title: "Z".repeat(91) } }));
      return { run: runLever(root, "approve", "de"), approvals: approvals(root) };
    });

    expect(state.run).toEqual({
      status: 1,
      stdout: "approve de: 1 failure in the installed files, nothing was approved\n",
      failures: ["ada-example title: 91 characters, the limit is 90"],
    });
    expect(state.approvals).toEqual([false, false, false]);
  });

  it("turns a file from before approvals were hashed, with reviewed true, into one with the hash", () => {
    const state = inSandbox("fixture", (root) => {
      setTranslatedLocales(root, ["en", "de"]);
      importGerman(root);
      [ADA_FILE, BEN_FILE, CHROME_FILE].forEach((file) =>
        change(root, file, ({ sourceHash, sameAsEnglish, text }) => ({ sourceHash, reviewed: true, sameAsEnglish, text })),
      );
      const before = runLever(root, "verify");
      const approve = runLever(root, "approve", "de");
      return { before, approve, keys: Object.keys(readJson(root, ADA_FILE)), approvals: approvals(root), after: runLever(root, "verify") };
    });

    expect(state.before).toEqual({ status: 0, stdout: "ok verify: de\n", failures: [] });
    expect(state.approve.stdout).toBe("ok approve de: 3 files reviewed\n");
    expect(state.keys).toEqual(["sourceHash", "approvedHash", "sameAsEnglish", "text"]);
    expect(state.approvals).toEqual([true, true, true]);
    expect(state.after).toEqual({ status: 0, stdout: "ok verify: de\n", failures: [] });
  });
});

describe("verify", () => {
  it("has nothing to verify while English is the only locale that serves articles", () => {
    const run = inSandbox("fixture", (root) => runLever(root, "verify"));

    expect(run).toEqual({
      status: 0,
      stdout: "ok verify: nothing to verify, en is the only locale that serves articles\n",
      failures: [],
    });
  });

  it("fails a listed locale with no translation, then one that is not reviewed, and passes once approved", () => {
    const runs = inSandbox("fixture", (root) => {
      setTranslatedLocales(root, ["en", "de"]);
      const missing = runLever(root, "verify");
      importGerman(root);
      const unreviewed = runLever(root, "verify");
      runLever(root, "approve", "de");
      return { missing, unreviewed, approved: runLever(root, "verify") };
    });

    expect(runs.missing).toEqual({
      status: 1,
      stdout: "verify: 3 failures\n",
      failures: ["[de] ada-example: no file", "[de] ben-example: no file", "[de] chrome: no file"],
    });
    expect(runs.unreviewed).toEqual({
      status: 1,
      stdout: "verify: 3 failures\n",
      failures: ["[de] ada-example: not reviewed", "[de] ben-example: not reviewed", "[de] chrome: not reviewed"],
    });
    expect(runs.approved).toEqual({ status: 0, stdout: "ok verify: de\n", failures: [] });
  });

  it.each([
    [
      "an article's text",
      ADA_FILE,
      (ada: Json) => ({ ...ada, text: { ...ada.text, title: "Wie Ada Example ein Brett behält" } }),
      "ada-example",
    ],
    [
      "an article's list of paths kept in English",
      BEN_FILE,
      (ben: Json) => ({
        ...ben,
        sameAsEnglish: ["facts.country"],
        text: { ...ben.text, facts: { ...ben.text.facts, country: BEN.facts.country } },
      }),
      "ben-example",
    ],
    [
      "a chrome string in the catalogue",
      MESSAGES,
      (messages: Json) => ({ ...messages, articles: { ...messages.articles, pager: { page: "Seite {page}" } } }),
      "chrome",
    ],
  ])("fails when %s is edited by hand after the approval", (_, file, edit, name) => {
    const run = inSandbox("fixture", (root) => {
      approvedGerman(root);
      change(root, file, edit);
      return runLever(root, "verify");
    });

    expect(run).toEqual({ status: 1, stdout: "verify: 1 failure\n", failures: [`[de] ${name}: ${EDITED}`] });
  });

  it("fails when the approval is removed, emptied or replaced by a hash of something else", () => {
    const runs = inSandbox("fixture", (root) => {
      approvedGerman(root);
      const approved = readJson(root, ADA_FILE);
      return [undefined, null, "0".repeat(64)].map((approvedHash) => {
        putJson(root, ADA_FILE, { ...approved, approvedHash });
        return runLever(root, "verify").failures;
      });
    });

    expect(runs).toEqual([["[de] ada-example: not reviewed"], ["[de] ada-example: not reviewed"], [`[de] ada-example: ${EDITED}`]]);
  });

  it("is not satisfied by reviewed true written by hand into a file that was never approved", () => {
    const run = inSandbox("fixture", (root) => {
      approvedGerman(root);
      importGerman(root, (good) => withSecondParagraph(good, "Zz She won them all."));
      change(root, ADA_FILE, (ada) => ({ ...ada, reviewed: true }));
      return runLever(root, "verify");
    });

    expect(run).toEqual({ status: 1, stdout: "verify: 1 failure\n", failures: ["[de] ada-example: not reviewed"] });
  });
});
