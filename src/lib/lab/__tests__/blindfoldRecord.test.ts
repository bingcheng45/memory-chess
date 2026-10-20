import { roundRecordOf } from "@/lib/lab/recordRound";
import { buildExport, parseImport } from "@/lib/lab/transfer";
import { roundV2, CAPTURE, TARGET } from "./fixtures";

const NOW = Date.UTC(2026, 9, 8);

const FACTS = {
  source: "game",
  startSource: "guide_cta",
  pieceCount: 4,
  memorizeSeconds: 10,
  targetFen: `${TARGET} w - - 0 1`,
  placedFen: TARGET,
  memorizeMs: 10000,
  solveMs: 7000,
} as const;

describe("a blindfold round in the lab record", () => {
  it("is saved with the flag, and a board round without it", () => {
    const at = new Date(2026, 9, 8, 21, 30);

    expect(roundRecordOf({ ...FACTS, blindfold: true }, at)).toMatchObject({ v: 2, kind: "normal", blindfold: true });
    expect(roundRecordOf(FACTS, at)).not.toHaveProperty("blindfold");
  });

  it("keeps the flag through an export and import", () => {
    const rounds = [roundV2({ id: "a" }, { ...CAPTURE, blindfold: true })];

    expect(parseImport(JSON.stringify(buildExport(rounds, NOW)), NOW)).toMatchObject({ ok: true, rejected: 0, rounds: [{ id: "a", blindfold: true }] });
  });

  it("rejects a round whose flag is out of shape", () => {
    const file = JSON.parse(JSON.stringify(buildExport([roundV2({ id: "a" })], NOW)));
    file.rounds[0].blindfold = "yes";

    expect(parseImport(JSON.stringify(file), NOW)).toMatchObject({ rejected: 1 });
  });
});
