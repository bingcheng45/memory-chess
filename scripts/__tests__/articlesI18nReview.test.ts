/** @jest-environment node */

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

const REVIEW_FILES = [`${INSTALLED}/ada-example.json`, `${INSTALLED}/ben-example.json`, `${INSTALLED}/chrome.json`];

const reviewFlags = (root: string) => REVIEW_FILES.map((file) => readJson(root, file).reviewed);
const installedBytes = (root: string) => ({ ...filesUnder(root, "src"), ...filesUnder(root, "messages") });

describe("approve", () => {
  it("sets reviewed in every installed file, and a second import of the same directory keeps it", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      const imported = reviewFlags(root);
      const approve = runLever(root, "approve", "de");
      const approved = installedBytes(root);
      const approveAgain = runLever(root, "approve", "de");
      const reimport = runLever(root, "import", "de", DIR);
      return { imported, approve, approveAgain, reimport, approved, after: installedBytes(root), flags: reviewFlags(root) };
    });

    expect(state.imported).toEqual([false, false, false]);
    expect(state.approve).toEqual({ status: 0, stdout: "ok approve de: 3 files reviewed\n", failures: [] });
    expect(state.approveAgain.stdout).toBe("ok approve de: 3 files reviewed\n");
    expect(state.reimport.stdout).toBe("ok import de: 0 files written, 4 unchanged\n");
    expect(state.flags).toEqual([true, true, true]);
    expect(state.after).toEqual(state.approved);
  });

  it("keeps a repair the reviewer made in the installed files", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      const ada = readJson(root, `${INSTALLED}/ada-example.json`);
      const messages = readJson(root, "messages/de.json");
      putJson(root, `${INSTALLED}/ada-example.json`, { ...ada, text: { ...ada.text, title: "Wie Ada Example ein Brett behält" } });
      putJson(root, "messages/de.json", { ...messages, articles: { ...messages.articles, pager: { page: "Seite {page}" } } });
      const run = runLever(root, "approve", "de");
      return {
        run,
        flags: reviewFlags(root),
        title: readJson(root, `${INSTALLED}/ada-example.json`).text.title,
        page: readJson(root, "messages/de.json").articles.pager.page,
      };
    });

    expect(state).toEqual({
      run: { status: 0, stdout: "ok approve de: 3 files reviewed\n", failures: [] },
      flags: [true, true, true],
      title: "Wie Ada Example ein Brett behält",
      page: "Seite {page}",
    });
  });

  it("is reset for one article only when a second import changes one of its paragraphs", () => {
    const flags = inSandbox("fixture", (root) => {
      importGerman(root);
      runLever(root, "approve", "de");
      importGerman(root, (good) => withSecondParagraph(good, "Zz She won them all."));
      return reviewFlags(root);
    });

    expect(flags).toEqual([false, true, true]);
  });

  it("is reset for the chrome only when a second import changes one chrome string", () => {
    const flags = inSandbox("fixture", (root) => {
      importGerman(root);
      runLever(root, "approve", "de");
      importGerman(root, (good) => ({ ...good, chrome: { ...good.chrome, "list.heading": "Artikel" } }));
      return reviewFlags(root);
    });

    expect(flags).toEqual([true, true, false]);
  });

  it("is reset when a path is added to same-as-english.json", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      runLever(root, "approve", "de");
      importGerman(root, (good) => {
        const ben = { ...good.articles[BEN.slug], facts: { ...good.articles[BEN.slug].facts, country: "Netherlands" } };
        return { ...good, articles: { ...good.articles, [BEN.slug]: ben }, sameAsEnglish: { [BEN.slug]: ["facts.country"] } };
      });
      return { flags: reviewFlags(root), listed: readJson(root, `${INSTALLED}/ben-example.json`).sameAsEnglish };
    });

    expect(state).toEqual({ flags: [true, false, true], listed: ["facts.country"] });
  });

  it("approves nothing when an installed file fails the check", () => {
    const state = inSandbox("fixture", (root) => {
      importGerman(root);
      const ada = readJson(root, `${INSTALLED}/ada-example.json`);
      putJson(root, `${INSTALLED}/ada-example.json`, { ...ada, text: { ...ada.text, title: "Z".repeat(91) } });
      return { run: runLever(root, "approve", "de"), flags: reviewFlags(root) };
    });

    expect(state.run).toEqual({
      status: 1,
      stdout: "approve de: 1 failure in the installed files, nothing was approved\n",
      failures: ["ada-example title: 91 characters, the limit is 90"],
    });
    expect(state.flags).toEqual([false, false, false]);
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
});
