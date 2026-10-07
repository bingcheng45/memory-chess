/** @jest-environment node */
import { IDBFactory } from "fake-indexeddb";
import { deriveLab, type LabResults, type MetricId } from "@/lib/lab/metrics";
import { exportPersona, memoryLabStore, PERSONA_NAMES, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { hasFigure, type ReadinessState } from "@/lib/lab/readiness";
import golden from "./__golden__/derive-personas.json";

/**
 * The golden file holds what the five derive functions this engine replaced
 * returned for each persona at c489d37. The engine splits each old result
 * into readiness and value, so this folds it back into the old shape.
 */
function legacy({ streak, bests, trend, typeRecall, missMap }: LabResults): Record<MetricId, Record<string, unknown>> {
  const base = ({ readiness }: LabResults[MetricId]) => ({ ready: hasFigure(readiness), sampleSize: readiness.sampleSize });
  const need = ({ readiness }: LabResults[MetricId]) => readiness.need ?? {};
  return {
    streak: { ...base(streak), ...streak.value, daysNeeded: need(streak).days ?? 0 },
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

async function resultsFor(name: PersonaName): Promise<LabResults> {
  const file = await exportPersona(name, memoryLabStore(new IDBFactory()));
  if (!file.summary) throw new Error(`${name} exported no summary`);
  return deriveLab({ records: file.rounds, summary: file.summary, today: PERSONA_TODAY });
}

describe("metric engine on the persona fixtures", () => {
  it.each(PERSONA_NAMES.filter((name) => name !== "newVisitor"))("matches the pre-engine derive output for %s", async (name) => {
    expect(legacy(await resultsFor(name))).toEqual(golden[name]);
  });

  it("gives a new visitor no value and nothing ready, as the old functions did", async () => {
    const results = await resultsFor("newVisitor");
    const old = golden.newVisitor;

    expect(Object.values(results).map(({ value }) => value)).toEqual([null, null, null, null, null]);
    expect(Object.fromEntries(Object.entries(legacy(results)).map(([id, { ready, sampleSize }]) => [id, { ready, sampleSize }]))).toEqual({
      streak: { ready: old.streak.ready, sampleSize: old.streak.sampleSize },
      bests: { ready: old.bests.ready, sampleSize: old.bests.sampleSize },
      trend: { ready: old.trend.ready, sampleSize: old.trend.sampleSize },
      typeRecall: { ready: old.typeRecall.ready, sampleSize: old.typeRecall.sampleSize },
      missMap: { ready: old.missMap.ready, sampleSize: old.missMap.sampleSize },
    });
  });

  it("puts every persona in the readiness state its history earns", async () => {
    const states = await Promise.all(
      PERSONA_NAMES.map(async (name) => {
        const results = await resultsFor(name);
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
    });
  });
});
