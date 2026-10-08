/** @jest-environment node */
import { IDBFactory } from "fake-indexeddb";
import { exportPersona, memoryLabStore, PERSONA_NAMES, personaRounds, type PersonaName } from "@/lib/lab/personas";
import { positionId } from "@/lib/lab/record";
import { PLACEMENT_KEEP } from "@/lib/lab/storage";
import { parseImport } from "@/lib/lab/transfer";

const NOW = Date.UTC(2026, 9, 8, 12);

const exportOf = (name: PersonaName) => exportPersona(name, memoryLabStore(new IDBFactory()));

describe("persona fixtures", () => {
  it("import through the real validator with nothing rejected, cut or dropped", async () => {
    const imported = await Promise.all(
      PERSONA_NAMES.map(async (name) => {
        const parsed = parseImport(JSON.stringify(await exportOf(name)), NOW);
        if (!parsed.ok) throw new Error(`${name}: ${parsed.reason}`);
        return [name, { rounds: parsed.rounds.length, rejected: parsed.rejected, overCap: parsed.overCap, summary: typeof parsed.summary === "object" && parsed.summary?.rounds }];
      }),
    );

    expect(Object.fromEntries(imported)).toEqual({
      newVisitor: { rounds: 0, rejected: 0, overCap: 0, summary: 0 },
      twoRounds: { rounds: 2, rejected: 0, overCap: 0, summary: 2 },
      threeDays: { rounds: 12, rejected: 0, overCap: 0, summary: 12 },
      thirtyDays: { rounds: 90, rejected: 0, overCap: 0, summary: 90 },
      heavy: { rounds: 5000, rejected: 0, overCap: 0, summary: 5003 },
      easyOnly: { rounds: 50, rejected: 0, overCap: 0, summary: 50 },
      stale: { rounds: 30, rejected: 0, overCap: 0, summary: 30 },
      v1Legacy: { rounds: 12, rejected: 0, overCap: 0, summary: 12 },
      spanClimber: { rounds: 135, rejected: 0, overCap: 0, summary: 135 },
      shortSessions: { rounds: 72, rejected: 0, overCap: 0, summary: 72 },
    });
  });

  it("are the same rounds on every run", () => {
    expect(personaRounds("thirtyDays")).toEqual(personaRounds("thirtyDays"));
  });

  it("count days back from the day they are built for", () => {
    expect(personaRounds("twoRounds", "2027-01-01").map(({ localDay, source }) => [localDay, source])).toEqual([
      ["2027-01-01", "calibration"],
      ["2027-01-01", "game"],
    ]);
    expect(personaRounds("stale").at(-1)?.localDay).toBe("2026-09-18");
  });

  it("evict the three oldest heavy rounds through the real store and keep them in the lifetime summary", async () => {
    const file = await exportOf("heavy");
    const rounds = personaRounds("heavy");

    expect(file.rounds[0].id).toBe("heavy-3");
    expect(file.summary?.evictedThrough).toBe(rounds[2].endedAt);
    expect(file.summary?.days[0]).toBe(rounds[0].localDay);
  });

  it("give the thirty-day player misses on the edge files and more missed queens than pawns", async () => {
    const summary = (await exportOf("thirtyDays")).summary;
    if (!summary) throw new Error("no summary");
    const fileShare = (file: number) => {
      const onFile = (values: readonly number[]) => values.filter((_, index) => index % 8 === file).reduce((a, b) => a + b, 0);
      return onFile(summary.squareMissed) / onFile(summary.squareShown);
    };
    const typeShare = (type: "q" | "p") => (summary.typeMissed[type] ?? 0) / (summary.typeShown[type] ?? 1);

    expect(Math.min(fileShare(0), fileShare(7))).toBeGreaterThan(Math.max(...[1, 2, 3, 4, 5, 6].map(fileShare)));
    expect(typeShare("q")).toBeGreaterThan(typeShare("p"));
  });

  it("write every persona but the legacy one as version 2, with the position id of its target", () => {
    const rounds = PERSONA_NAMES.filter((name) => name !== "v1Legacy").flatMap((name) => personaRounds(name));

    expect(rounds.every((round) => round.v === 2 && round.positionId === positionId(round.targetFen) && round.tzOffsetMin === -480)).toBe(true);
    expect(new Set(rounds.map((round) => round.v === 2 && round.startSource))).toEqual(
      new Set(["calibration", "home_quick", "try_again", "game_form", "tile_drill", "home_tier", "link"]),
    );
  });

  it("keep the legacy persona exactly version 1 shaped", () => {
    const keys = new Set(personaRounds("v1Legacy").flatMap((round) => Object.keys(round)));

    expect([...keys]).toEqual([
      "v", "id", "source", "endedAt", "localDay", "config", "targetFen", "placedFen", "squares",
      "shownByType", "missedByType", "memorizeMs", "solveMs", "correct", "wrong", "extra", "accuracy",
    ]);
  });

  it("give placements, in time order and one per placed piece, to the newest 500 heavy rounds only", async () => {
    const file = await exportOf("heavy");
    const placed = file.rounds.flatMap((round) => (round.v === 2 && round.placements ? [{ ...round, placements: round.placements }] : []));
    const inOrder = placed.every(({ placements, correct, squares }) =>
      placements.length === correct &&
      placements.every(([ms, square], index) => squares[square] === "c" && (index === 0 || placements[index - 1][0] <= ms)),
    );

    expect(placed).toHaveLength(PLACEMENT_KEEP);
    expect(placed[0].id).toBe("heavy-4503");
    expect(inOrder).toBe(true);
    expect(personaRounds("twoRounds")[1]).toMatchObject({ startSource: "try_again", removals: 0, placements: expect.any(Array) });
  });
});
