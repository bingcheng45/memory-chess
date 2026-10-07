/** @jest-environment node */
import { IDBFactory } from "fake-indexeddb";
import { deriveLab, type LabInput, type LabResults, type MetricId } from "@/lib/lab/metrics";
import { exportPersona, memoryLabStore, PERSONA_NAMES, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { hasFigure, type ReadinessState } from "@/lib/lab/readiness";
import golden from "./__golden__/derive-personas.json";

/**
 * The golden file holds what the five derive functions this engine replaced
 * returned for each persona at c489d37. The engine splits each old result
 * into readiness and value, so this folds it back into the old shape. The old
 * streak sampleSize counted days and was never shown; the panel showed rounds,
 * which is what the engine's streak sample now counts.
 */
function legacy(input: LabInput): Record<MetricId, Record<string, unknown>> {
  const { streak, bests, trend, typeRecall, missMap } = deriveLab(input);
  const base = ({ readiness }: LabResults[MetricId]) => ({ ready: hasFigure(readiness), sampleSize: readiness.sampleSize });
  const need = ({ readiness }: LabResults[MetricId]) => readiness.need ?? {};
  return {
    streak: { ...base(streak), sampleSize: input.summary.days.length, ...streak.value, daysNeeded: need(streak).days ?? 0 },
    bests: { ...base(bests), entries: bests.value?.entries ?? [] },
    trend: {
      ...base(trend),
      ...trend.value,
      roundsNeeded: need(trend).rounds ?? 0,
      daysNeeded: need(trend).days ?? 0,
    },
    typeRecall: {
      ...base(typeRecall),
      types: typeRecall.value?.types,
      king: typeRecall.value?.king,
      onlyKings: typeRecall.value?.onlyKings,
      roundsNeeded: typeRecall.value?.roundsEstimate,
    },
    missMap: {
      ...base(missMap),
      view: missMap.value?.view,
      squares: missMap.value?.squares,
      files: missMap.value?.files,
      ranks: missMap.value?.ranks,
      roundsNeeded: missMap.value?.roundsEstimate,
    },
  };
}

async function buildInput(name: PersonaName): Promise<LabInput> {
  const file = await exportPersona(name, memoryLabStore(new IDBFactory()));
  if (!file.summary) throw new Error(`${name} exported no summary`);
  return { records: file.rounds, summary: file.summary, today: PERSONA_TODAY };
}

const inputs = new Map<PersonaName, Promise<LabInput>>();
function inputFor(name: PersonaName): Promise<LabInput> {
  if (!inputs.has(name)) inputs.set(name, buildInput(name));
  return inputs.get(name) as Promise<LabInput>;
}

describe("metric engine on the persona fixtures", () => {
  it.each(PERSONA_NAMES.filter((name) => name !== "newVisitor"))("matches the pre-engine derive output for %s", async (name) => {
    expect(legacy(await inputFor(name))).toEqual(golden[name === "v1Legacy" ? "threeDays" : name]);
  });

  it("gives a new visitor no value and nothing ready, as the old functions did", async () => {
    const input = await inputFor("newVisitor");
    const old = golden.newVisitor;

    expect(Object.values(deriveLab(input)).map(({ value }) => value)).toEqual([null, null, null, null, null]);
    expect(Object.fromEntries(Object.entries(legacy(input)).map(([id, { ready, sampleSize }]) => [id, { ready, sampleSize }]))).toEqual({
      streak: { ready: old.streak.ready, sampleSize: old.streak.sampleSize },
      bests: { ready: old.bests.ready, sampleSize: old.bests.sampleSize },
      trend: { ready: old.trend.ready, sampleSize: old.trend.sampleSize },
      typeRecall: { ready: old.typeRecall.ready, sampleSize: old.typeRecall.sampleSize },
      missMap: { ready: old.missMap.ready, sampleSize: old.missMap.sampleSize },
    });
  });

  it("names what recall by type and the miss map still need for each persona", async () => {
    const needs = await Promise.all(
      PERSONA_NAMES.map(async (name) => {
        const { typeRecall, missMap } = deriveLab(await inputFor(name));
        return [name, { typeRecall: typeRecall.readiness.need, missMap: missMap.readiness.need }] as const;
      }),
    );

    expect(Object.fromEntries(needs)).toEqual({
      newVisitor: { typeRecall: undefined, missMap: undefined },
      twoRounds: { typeRecall: { exposures: 14 }, missMap: { exposures: 10 } },
      threeDays: { typeRecall: undefined, missMap: { exposures: 6 } },
      thirtyDays: { typeRecall: undefined, missMap: undefined },
      heavy: { typeRecall: undefined, missMap: undefined },
      easyOnly: { typeRecall: { exposures: 20 }, missMap: { exposures: 4 } },
      stale: { typeRecall: undefined, missMap: { exposures: 2 } },
      v1Legacy: { typeRecall: undefined, missMap: { exposures: 6 } },
    });
  });

  it("puts every persona in the readiness state its history earns", async () => {
    const states = await Promise.all(
      PERSONA_NAMES.map(async (name) => {
        const results = deriveLab(await inputFor(name));
        return [name, Object.fromEntries(Object.entries(results).map(([id, { readiness }]) => [id, readiness.state]))] as const;
      }),
    );
    const all = (state: ReadinessState) => ({ streak: state, bests: state, trend: state, typeRecall: state, missMap: state });

    expect(Object.fromEntries(states)).toEqual({
      newVisitor: all("empty"),
      twoRounds: { streak: "warming", bests: "ready", trend: "warming", typeRecall: "warming", missMap: "warming" },
      threeDays: { streak: "ready", bests: "ready", trend: "ready", typeRecall: "ready", missMap: "warming" },
      thirtyDays: all("ready"),
      heavy: all("ready"),
      easyOnly: { streak: "ready", bests: "ready", trend: "ready", typeRecall: "warming", missMap: "warming" },
      stale: { streak: "stale", bests: "stale", trend: "stale", typeRecall: "stale", missMap: "warming" },
      v1Legacy: { streak: "ready", bests: "ready", trend: "ready", typeRecall: "ready", missMap: "warming" },
    });
  });

  it("reads version 1 rounds exactly as it reads the same rounds as version 2", async () => {
    const [legacyInput, current] = await Promise.all([inputFor("v1Legacy"), inputFor("threeDays")]);

    expect(legacyInput.records.map(({ v }) => v)).toEqual(Array(12).fill(1));
    expect(current.records.map(({ v }) => v)).toEqual(Array(12).fill(2));
    expect(deriveLab(legacyInput)).toEqual(deriveLab(current));
  });
});
