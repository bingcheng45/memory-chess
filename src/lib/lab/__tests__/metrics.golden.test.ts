/** @jest-environment node */
import { IDBFactory } from "fake-indexeddb";
import type { LabInput } from "@/lib/lab/engine";
import { deriveLab, type LabResults, type MetricId } from "@/lib/lab/metrics";
import { exportPersona, memoryLabStore, PERSONA_NAMES, PERSONA_TODAY, personaRounds, type PersonaName } from "@/lib/lab/personas";
import { hasFigure, type ReadinessState } from "@/lib/lab/readiness";
import golden from "./__golden__/derive-personas.json";

/**
 * The golden file holds what the five derive functions this engine replaced
 * returned for each persona at c489d37. The engine splits each old result
 * into readiness and value, so this folds it back into the old shape. The old
 * streak sampleSize counted days and was never shown; the panel showed rounds,
 * which is what the engine's streak sample now counts.
 */
type LegacyId = "streak" | "bests" | "trend" | "typeRecall" | "missMap";

function legacy(input: LabInput): Record<LegacyId, Record<string, unknown>> {
  const { streak, bests, trend, typeRecall, missMap } = deriveLab(input);
  const base = ({ readiness }: LabResults[MetricId]) => ({ ready: hasFigure(readiness), sampleSize: readiness.sampleSize });
  const need = ({ readiness }: LabResults[MetricId]) => readiness.need ?? {};
  return {
    streak: { ...base(streak), sampleSize: input.summary.days.length, ...streak.value, daysNeeded: need(streak).days ?? 0 },
    bests: { ...base(bests), entries: bests.value?.entries ?? [] },
    trend: {
      ...base(trend),
      ...(trend.value && { setting: trend.value.setting, points: trend.value.points }),
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
  it.each(PERSONA_NAMES.filter((name) => name in golden && name !== "newVisitor" && name !== "v1Legacy"))("matches the pre-engine derive output for %s", async (name) => {
    expect(legacy(await inputFor(name))).toEqual(golden[name as keyof typeof golden]);
  });

  it("gives a new visitor no value and nothing ready, as the old functions did", async () => {
    const input = await inputFor("newVisitor");
    const old = golden.newVisitor;

    expect(Object.values(deriveLab(input)).map(({ value }) => value)).toEqual(Array(11).fill(null));
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
      spanClimber: { typeRecall: undefined, missMap: undefined },
      shortSessions: { typeRecall: undefined, missMap: undefined },
      plateau: { typeRecall: undefined, missMap: undefined },
      colourSkew: { typeRecall: undefined, missMap: undefined },
    });
  });

  it("puts every persona in the readiness state its history earns", async () => {
    const states = await Promise.all(
      PERSONA_NAMES.map(async (name) => {
        const results = deriveLab(await inputFor(name));
        return [name, Object.fromEntries(Object.entries(results).map(([id, { readiness }]) => [id, readiness.state]))] as const;
      }),
    );
    const all = (state: ReadinessState) => ({
      streak: state, bests: state, trend: state, typeRecall: state, missMap: state, sessions: state, span: state, piecesHeld: state, speed: state, insights: state, notebook: state,
    });
    const progress = (state: ReadinessState) => ({ sessions: state, span: state, piecesHeld: state, speed: state });

    expect(Object.fromEntries(states)).toEqual({
      newVisitor: all("empty"),
      twoRounds: { streak: "warming", bests: "ready", trend: "warming", typeRecall: "warming", missMap: "warming", ...progress("warming"), sessions: "ready", insights: "warming", notebook: "ready" },
      threeDays: { streak: "ready", bests: "ready", trend: "ready", typeRecall: "ready", missMap: "warming", ...progress("ready"), insights: "ready", notebook: "ready" },
      thirtyDays: all("ready"),
      heavy: all("ready"),
      easyOnly: { streak: "ready", bests: "ready", trend: "ready", typeRecall: "warming", missMap: "warming", ...progress("ready"), span: "warming", insights: "ready", notebook: "ready" },
      stale: { streak: "stale", bests: "stale", trend: "stale", typeRecall: "stale", missMap: "warming", ...progress("stale"), insights: "stale", notebook: "stale" },
      v1Legacy: { streak: "ready", bests: "ready", trend: "ready", typeRecall: "ready", missMap: "warming", ...progress("ready"), insights: "ready", notebook: "ready" },
      spanClimber: all("ready"),
      shortSessions: all("ready"),
      plateau: all("ready"),
      colourSkew: all("ready"),
    });
  });

  it("reads version 1 rounds exactly as it reads the same rounds as version 2", async () => {
    const [legacyInput, current] = await Promise.all([inputFor("v1Legacy"), inputFor("threeDays")]);

    expect(legacyInput.records.map(({ v }) => v)).toEqual(Array(12).fill(1));
    expect(current.records.map(({ v }) => v)).toEqual(Array(12).fill(2));
    expect(deriveLab(legacyInput)).toEqual(deriveLab(current));
  });

  it("gives each persona the sessions, span, pieces held and speed its history earns", async () => {
    const summaries = await Promise.all(
      PERSONA_NAMES.map(async (name) => {
        const { sessions, span, piecesHeld, speed, trend } = deriveLab(await inputFor(name));
        const steps = span.value?.history.flatMap(({ pieceCount }, index, history) =>
          index === 0 || pieceCount !== history[index - 1].pieceCount ? [[index, pieceCount]] : [],
        );
        return [
          name,
          {
            sessions: sessions.value?.sessions.length ?? 0,
            span: span.value && {
              pieceCount: span.value.pieceCount,
              memorizeSeconds: span.value.memorizeSeconds,
              qualifyingRounds: span.value.qualifyingRounds,
              weekAgo: span.value.weekAgo,
              change: span.value.change,
            },
            steps: steps ?? null,
            piecesHeld: piecesHeld.value?.recent ?? null,
            speed: speed.value && { setting: speed.value.setting, recent: speed.value.recent, accuracy: speed.value.accuracyAtSameRounds.recent },
            trend: trend.value && { granularity: trend.value.granularity, sessions: trend.value.bySession.length },
          },
        ] as const;
      }),
    );

    expect(Object.fromEntries(summaries)).toEqual({
      newVisitor: {
        sessions: 0,
        span: null,
        steps: null,
        piecesHeld: null,
        speed: null,
        trend: null,
      },
      twoRounds: {
        sessions: 1,
        span: { pieceCount: null, memorizeSeconds: null, qualifyingRounds: 0, weekAgo: null, change: null },
        steps: [[0, null]],
        piecesHeld: { average: 4, previous: null, change: null },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 9.8, previous: null, change: null }, accuracy: { average: 50, previous: null, change: null } },
        trend: { granularity: "round", sessions: 1 },
      },
      threeDays: {
        sessions: 3,
        span: { pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 11, weekAgo: null, change: null },
        steps: [[0, 6]],
        piecesHeld: { average: 5.2, previous: null, change: null },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 4.6, previous: null, change: null }, accuracy: { average: 92.44, previous: null, change: null } },
        trend: { granularity: "round", sessions: 3 },
      },
      thirtyDays: {
        sessions: 30,
        span: { pieceCount: 12, memorizeSeconds: 8, qualifyingRounds: 9, weekAgo: 12, change: 0 },
        steps: [[0, null], [1, 6], [5, 12]],
        piecesHeld: { average: 5.3, previous: 5.1, change: 0.2 },
        speed: { setting: { source: "game", pieceCount: 12, memorizeSeconds: 8 }, recent: { average: 1.82, previous: 1.73, change: 0.09 }, accuracy: { average: 72.4, previous: 77.5, change: -5.1 } },
        trend: { granularity: "session", sessions: 25 },
      },
      heavy: {
        sessions: 250,
        span: { pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 4440, weekAgo: 6, change: 0 },
        steps: [[0, 6]],
        piecesHeld: { average: 5.2, previous: 5.4, change: -0.2 },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 3.76, previous: 3.81, change: -0.05 }, accuracy: { average: 86.5, previous: 89.9, change: -3.4 } },
        trend: { granularity: "session", sessions: 30 },
      },
      easyOnly: {
        sessions: 10,
        span: { pieceCount: null, memorizeSeconds: null, qualifyingRounds: 0, weekAgo: null, change: null },
        steps: [[0, null]],
        piecesHeld: { average: 1.4, previous: 1.9, change: -0.5 },
        speed: { setting: { source: "game", pieceCount: 2, memorizeSeconds: 10 }, recent: { average: 15.71, previous: 9.1, change: 6.61 }, accuracy: { average: 70, previous: 95, change: -25 } },
        trend: { granularity: "session", sessions: 10 },
      },
      stale: {
        sessions: 6,
        span: { pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 26, weekAgo: null, change: null },
        steps: [[0, 6]],
        piecesHeld: { average: 5, previous: 5.5, change: -0.5 },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 3.36, previous: 3.81, change: -0.45 }, accuracy: { average: 83.2, previous: 91.7, change: -8.5 } },
        trend: { granularity: "session", sessions: 6 },
      },
      v1Legacy: {
        sessions: 3,
        span: { pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 11, weekAgo: null, change: null },
        steps: [[0, 6]],
        piecesHeld: { average: 5.2, previous: null, change: null },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 4.6, previous: null, change: null }, accuracy: { average: 92.44, previous: null, change: null } },
        trend: { granularity: "round", sessions: 3 },
      },
      // Its last 20 rounds are all 14 pieces at 10s; their last ten accuracies sum to 986, the ten before to 915.
      spanClimber: {
        sessions: 45,
        span: { pieceCount: 14, memorizeSeconds: 10, qualifyingRounds: 19, weekAgo: 10, change: 4 },
        steps: [[0, 4], [20, 10], [38, 14]],
        piecesHeld: { average: 13.8, previous: 12.8, change: 1 },
        speed: { setting: { source: "game", pieceCount: 14, memorizeSeconds: 10 }, recent: { average: 1.55, previous: 1.64, change: -0.09 }, accuracy: { average: 98.6, previous: 91.5, change: 7.1 } },
        trend: { granularity: "session", sessions: 20 },
      },
      shortSessions: {
        sessions: 18,
        span: { pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 64, weekAgo: null, change: null },
        steps: [[0, 6]],
        piecesHeld: { average: 5.3, previous: 5.1, change: 0.2 },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 4.14, previous: 3.58, change: 0.56 }, accuracy: { average: 81.6, previous: 89.8, change: -8.2 } },
        trend: { granularity: "session", sessions: 18 },
      },
      plateau: {
        sessions: 14,
        span: { pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 48, weekAgo: 6, change: 0 },
        steps: [[0, 6]],
        piecesHeld: { average: 5.3, previous: 5.3, change: 0 },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 3.68, previous: 3.89, change: -0.21 }, accuracy: { average: 88.2, previous: 88.2, change: 0 } },
        trend: { granularity: "session", sessions: 14 },
      },
      colourSkew: {
        sessions: 15,
        span: { pieceCount: 6, memorizeSeconds: 10, qualifyingRounds: 44, weekAgo: 6, change: 0 },
        steps: [[0, 6]],
        piecesHeld: { average: 4.9, previous: 4.8, change: 0.1 },
        speed: { setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, recent: { average: 4.28, previous: 4.11, change: 0.17 }, accuracy: { average: 81.5, previous: 79.8, change: 1.7 } },
        trend: { granularity: "session", sessions: 15 },
      },
    });
  });

  it("steps the span climber from 4 to 10 pieces in session 21 and to 14 in the last week, 4 more than a week ago", async () => {
    const { value } = deriveLab(await inputFor("spanClimber")).span;
    const firstAt = (pieceCount: number) => value?.history.findIndex((step) => step.pieceCount === pieceCount);

    expect([firstAt(4), firstAt(10), firstAt(14), value?.weekAgo, value?.pieceCount]).toEqual([0, 20, 38, 10, 14]);
  });

  /**
   * Worked by hand from each persona's rounds, apart from the engine. Per setting: [rounds at 80% or better with three
   * pieces or more, those of them ending more than 7 days before the persona's newest round].
   * thirtyDays: 12 pieces is the largest count held twice (9 rounds, all at 8s); a week earlier it already had 7.
   * spanClimber: 14 pieces holds 19 rounds, none a week earlier, when 10 pieces was the largest held.
   * easyOnly: every round is the two kings, so nothing qualifies.
   */
  const SPAN_BY_HAND = {
    thirtyDays: {
      qualifying: { "game:12x8": [9, 7], "game:6x10": [9, 7], "calibration:6x10": [8, 5] },
      span: { pieceCount: 12, memorizeSeconds: 8, qualifyingRounds: 9, weekAgo: 12, change: 0 },
    },
    spanClimber: {
      qualifying: { "game:4x10": [20, 20], "game:10x10": [47, 46], "game:14x10": [19, 0] },
      span: { pieceCount: 14, memorizeSeconds: 10, qualifyingRounds: 19, weekAgo: 10, change: 4 },
    },
    easyOnly: {
      qualifying: {},
      span: { pieceCount: null, memorizeSeconds: null, qualifyingRounds: 0, weekAgo: null, change: null },
    },
  } as const;

  it.each(Object.keys(SPAN_BY_HAND) as (keyof typeof SPAN_BY_HAND)[])("gives %s the span worked out by hand from its rounds", async (name) => {
    const rounds = personaRounds(name);
    const weekBefore = Math.max(...rounds.map(({ endedAt }) => endedAt)) - 7 * 24 * 60 * 60 * 1000;
    const qualifying: Record<string, [number, number]> = {};
    rounds
      .filter(({ accuracy, config }) => accuracy >= 80 && config.pieceCount >= 3)
      .forEach(({ source, config, endedAt }) => {
        const counts = (qualifying[`${source}:${config.pieceCount}x${config.memorizeSeconds}`] ??= [0, 0]);
        counts[0] += 1;
        if (endedAt < weekBefore) counts[1] += 1;
      });
    const { span } = deriveLab(await inputFor(name));

    expect(qualifying).toEqual(SPAN_BY_HAND[name].qualifying);
    expect({ ...span.value, history: undefined }).toEqual(SPAN_BY_HAND[name].span);
  });

  /** Correct pieces in each persona's last 20 rounds, oldest first; the averages are these tens summed by hand. */
  const HELD_BY_HAND = {
    thirtyDays: {
      correct: [4, 7, 10, 2, 6, 5, 9, 2, 2, 4, 7, 6, 2, 4, 4, 10, 1, 6, 5, 8],
      recent: { average: 5.3, previous: 5.1, change: 0.2 },
    },
    spanClimber: {
      correct: [13, 13, 11, 13, 14, 13, 14, 9, 14, 14, 14, 14, 13, 14, 14, 13, 14, 14, 14, 14],
      recent: { average: 13.8, previous: 12.8, change: 1 },
    },
  } as const;

  it.each(Object.keys(HELD_BY_HAND) as (keyof typeof HELD_BY_HAND)[])("gives %s the pieces held worked out by hand from its rounds", async (name) => {
    const last20 = [...personaRounds(name)].sort((a, b) => a.endedAt - b.endedAt).slice(-20);

    expect(last20.map(({ correct }) => correct)).toEqual(HELD_BY_HAND[name].correct);
    expect(deriveLab(await inputFor(name)).piecesHeld.value?.recent).toEqual(HELD_BY_HAND[name].recent);
  });
});
