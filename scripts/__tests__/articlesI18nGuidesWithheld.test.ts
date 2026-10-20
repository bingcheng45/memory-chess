/** @jest-environment node */
import { cpSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { approvalHashOf } from "@/lib/articles/articleText";
import { put, putJson, readJson, runLever } from "./articlesI18nSandbox";

jest.setTimeout(60_000);

const REPO_ROOT = join(__dirname, "..", "..");
const COPIED = ["messages", "src/i18n/routing.ts", "src/lib/articles/articleText.ts", "src/lib/articles/schema.ts", "src/lib/seo/learn"];
const LEARN = "src/lib/seo/learn";
const SERVED = `${LEARN}/servedGuides.json`;
const BLUNDERING = "how-to-stop-blundering-in-chess";
const BLINDFOLD = "blindfold-chess-training-for-beginners";
const ALL = ["ru", "pt-BR", "fr", "de", "es"];

function inGuideSandbox<T>(body: (root: string) => T): T {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "articles-i18n-guides-")));
  try {
    COPIED.forEach((path) => cpSync(join(REPO_ROOT, path), join(root, path), { recursive: true }));
    putJson(root, "package.json", { name: "sandbox", private: true });
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function editFile(root: string, file: string, from: string, to: string): void {
  const source = readFileSync(join(root, file), "utf8");
  if (!source.includes(from)) throw new Error(`${file} has no ${from}`);
  writeFileSync(join(root, file), source.replace(from, to));
}

const editEnglishBlundering = (root: string) =>
  editFile(root, `${LEARN}/guides/${BLUNDERING}.ts`, '"A puzzle tells you two things', '"A chess puzzle tells you two things');

/** The translator's side of a re-approval: the installed text, unchanged, imported against the new English and approved. */
function reapprove(root: string, locale: string): void {
  const dir = `work/${locale}`;
  const installed = join(root, LEARN, "translations", locale);
  const same: Record<string, unknown> = {};
  for (const file of readdirSync(installed)) {
    const unit = JSON.parse(readFileSync(join(installed, file), "utf8"));
    putJson(root, `${dir}/${file}`, unit.text);
    same[file.replace(/\.json$/, "")] = unit.sameAsEnglish;
  }
  putJson(root, `${dir}/same-as-english.json`, same);
  expect(runLever(root, "--guides", "import", locale, dir).status).toBe(0);
  expect(runLever(root, "--guides", "approve", locale).status).toBe(0);
}

const warningFor = (locale: string, slug: string, reason: string) =>
  `warning: [${locale}] ${slug}: ${reason}, so /${locale}/learn/${slug} answers a 307 to the English guide until it is translated again. ` +
  `Run node scripts/articles-i18n.mjs --guides export <dir>, translate, then --guides import ${locale} <dir> and --guides approve ${locale}`;
const ENGLISH_CHANGED = "the English text changed after this translation was approved";

describe("--guides verify after an English edit", () => {
  it("withholds the edited guide in every locale with a warning, passes, and serves it again once a locale re-approves", () => {
    const result = inGuideSandbox((root) => {
      editEnglishBlundering(root);
      const stale = runLever(root, "--guides", "verify");
      const servedWhileStale = readJson(root, SERVED)[BLUNDERING];
      reapprove(root, "de");
      const afterGerman = runLever(root, "--guides", "verify");
      return { stale, servedWhileStale, afterGerman, servedAfterGerman: readJson(root, SERVED) };
    });

    expect(result.stale.status).toBe(0);
    expect(result.stale.failures).toEqual(ALL.map((locale) => warningFor(locale, BLUNDERING, ENGLISH_CHANGED)));
    expect(result.stale.stdout).toBe("ok verify --guides: 20 of 25 translations served, in ru, pt-BR, fr, de, es\n");
    expect(result.servedWhileStale).toEqual([]);

    expect(result.afterGerman.status).toBe(0);
    expect(result.afterGerman.failures).toEqual(["ru", "pt-BR", "fr", "es"].map((locale) => warningFor(locale, BLUNDERING, ENGLISH_CHANGED)));
    expect(result.servedAfterGerman[BLUNDERING]).toEqual(["de"]);
    expect(result.servedAfterGerman[BLINDFOLD]).toEqual(ALL);
  });

  it("withholds every guide of every locale when the shared chrome changes, and still passes", () => {
    const result = inGuideSandbox((root) => {
      editFile(root, `${LEARN}/guideChrome.ts`, 'takeaways: "Takeaways"', 'takeaways: "Key points"');
      return { run: runLever(root, "--guides", "verify"), served: readJson(root, SERVED) };
    });

    expect(result.run.status).toBe(0);
    expect(result.run.failures).toHaveLength(25);
    expect(result.run.failures[0]).toBe(
      warningFor("ru", BLINDFOLD, "the guide chrome every guide shares changed after this translation was approved"),
    );
    expect(result.run.stdout).toBe("ok verify --guides: 0 of 25 translations served, in ru, pt-BR, fr, de, es\n");
    expect(Object.values(result.served)).toEqual([[], [], [], [], []]);
  });

  it("withholds a guide whose locale renamed a button the guide names", () => {
    const result = inGuideSandbox((root) => {
      const messages = readJson(root, "messages/de.json");
      messages.game.result.nextRound = "Weiter geht's";
      putJson(root, "messages/de.json", messages);
      return { run: runLever(root, "--guides", "verify"), served: readJson(root, SERVED) };
    });

    expect(result.run.status).toBe(0);
    expect(result.run.failures).toEqual([
      warningFor(
        "de",
        BLINDFOLD,
        `a button the guide names has a new label in the game (${BLINDFOLD} sections.how-long-each-stage-takes.blocks[1].steps[0].detail: ` +
          `names the button game.result.nextRound, which the game shows as "Weiter geht's" here)`,
      ),
    ]);
    expect(result.served[BLINDFOLD]).toEqual(["ru", "pt-BR", "fr", "es"]);
    expect(result.served[BLUNDERING]).toEqual(ALL);
  });
});

describe("--guides verify still fails", () => {
  it("on a translation no reviewer approved", () => {
    const run = inGuideSandbox((root) => {
      const file = `${LEARN}/translations/de/${BLINDFOLD}.json`;
      putJson(root, file, { ...readJson(root, file), approvedHash: null });
      return runLever(root, "--guides", "verify");
    });

    expect(run.status).toBe(1);
    expect(run.failures).toEqual([`[de] ${BLINDFOLD}: not reviewed`]);
    expect(run.stdout).toBe("verify --guides: 1 failure\n");
  });

  it("on a current, approved translation whose numbers no longer match the English", () => {
    const run = inGuideSandbox((root) => {
      const file = `${LEARN}/translations/de/${BLINDFOLD}.json`;
      const unit = readJson(root, file);
      const text = JSON.parse(JSON.stringify(unit.text).replace("20 ", "21 "));
      const approvedHash = approvalHashOf({ locale: "de", name: `learn/${BLINDFOLD}`, sourceHash: unit.sourceHash, sameAsEnglish: unit.sameAsEnglish, text });
      put(root, file, `${JSON.stringify({ ...unit, approvedHash, text }, null, 2)}\n`);
      return runLever(root, "--guides", "verify");
    });

    expect(run.status).toBe(1);
    expect(run.failures).toContainEqual(expect.stringMatching(/^\[de\] blindfold-chess-training-for-beginners .*the number 20 /));
  });
});
