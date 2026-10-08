import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { busiestSetting, hundredths, mean, measured, readinessFor, settingOf, TREND_THRESHOLDS, type LabInput, type MetricResult, type TrendSetting } from "./engine";
import type { SpanValue, SpeedValue } from "./progress";
import { hasFigure, LAB_THRESHOLDS, type Need } from "./readiness";
import { PIECE_LETTERS } from "./record";
import type { ColorCounts } from "./summary";

export type InsightId = "edgeFiles" | "weakType" | "fasterLessAccurate" | "colourGap" | "plateau";

/** Keyed by the link label under home.lab.record.insights.actions. */
export const INSIGHT_GUIDES = {
  patterns: "chess-pattern-recognition-drills",
  vision: "how-to-see-the-whole-board-in-chess",
} as const;

/** What the panel's link does: start a round at a setting, or open a guide. The panel builds the href and the label. */
export type InsightAction =
  | { readonly kind: "rig"; readonly pieceCount: number; readonly memorizeSeconds: number }
  | { readonly kind: "guide"; readonly guide: keyof typeof INSIGHT_GUIDES };

export interface Insight {
  readonly ruleId: InsightId;
  /** Interpolated into the rule's sentence under home.lab.record.insights.rules, so no digit is typed by hand. */
  readonly params: Readonly<Record<string, number | string>>;
  readonly action: InsightAction;
  /** How far past its threshold the finding is, as a multiple of it, so findings of one priority rank by evidence. */
  readonly strength: number;
}

type Finding = Omit<Insight, "ruleId">;

interface InsightRule<TMin extends Need> {
  readonly id: InsightId;
  /** Lower comes first. */
  readonly priority: number;
  /** The least evidence the rule reads, as the unlock and readiness needs name it. `evaluate` is handed it and returns null below it. */
  readonly minSample: TMin;
  evaluate(input: LabInput, prior: InsightPrior, min: TMin): Finding | null;
}

interface BoundRule {
  readonly id: InsightId;
  readonly priority: number;
  find(input: LabInput, prior: InsightPrior): Finding | null;
}

const bind = <TMin extends Need>({ id, priority, minSample, evaluate }: InsightRule<TMin>): BoundRule => ({
  id,
  priority,
  find: (input, prior) => evaluate(input, prior, minSample),
});

export interface InsightPrior {
  readonly span: MetricResult<SpanValue>;
  readonly speed: MetricResult<SpeedValue>;
}

export interface InsightsValue {
  readonly insights: readonly Insight[];
}

export const INSIGHTS_THRESHOLDS = { rounds: 10 };
const MAX_INSIGHTS = 3;

export const EDGE_FILES: readonly number[] = [0, 7];
const CENTRE_FILES = [3, 4];
const EDGE_RATIO = 1.8;
const EDGE_MISSES = 5;
export const EDGE_RIG = { pieceCount: 8, memorizeSeconds: 15 };
/** With no centre miss there is no multiple to weigh, so the finding ranks just under any finding past its threshold, which reads 1 or more. */
const NO_CENTRE_MISS_STRENGTH = 0.99;
const WEAK_RECALL = LAB_THRESHOLDS.weakRecall;
const COLOUR_EXPOSURES = 100;
const TWO_WINDOWS = 2 * LAB_THRESHOLDS.rollingWindow;
const PLATEAU_POINTS = 2;
const FASTER_SECONDS = 0.3;
const ACCURACY_FALL_POINTS = 5;
const COLOUR_GAP_POINTS = 8;
const percent = (share: number) => Math.round(share * 100);
/** The multiple a sentence prints, to one decimal: "about 1.8 times", and "about twice" only from 1.95. */
export const aboutTimes = (ratio: number) => Math.round(ratio * 10) / 10;
/** A rate above zero prints as 0 below 1%, which the sentence words as "under 1%", so a real miss never reads as none. */
const percentShown = (share: number) => (share > 0 && share < 0.01 ? 0 : percent(share));
const rig = ({ pieceCount, memorizeSeconds }: Pick<TrendSetting, "pieceCount" | "memorizeSeconds">): InsightAction => ({ kind: "rig", pieceCount, memorizeSeconds });

function fileCounts({ summary }: LabInput) {
  const perFile = (values: readonly number[]) =>
    Array.from({ length: 8 }, (_, file) => values.reduce((sum, value, index) => (index % 8 === file ? sum + value : sum), 0));
  const shown = perFile(summary.squareShown);
  const missed = perFile(summary.squareMissed);
  const total = (files: readonly number[]) => ({ shown: files.reduce((sum, file) => sum + shown[file], 0), missed: files.reduce((sum, file) => sum + missed[file], 0) });
  return { shown, total };
}

const edgeFiles: InsightRule<{ exposures: number }> = {
  id: "edgeFiles",
  priority: 1,
  minSample: { exposures: LAB_THRESHOLDS.squareExposures },
  evaluate(input, _prior, { exposures }) {
    const { shown, total } = fileCounts(input);
    if (Math.min(...[...EDGE_FILES, ...CENTRE_FILES].map((file) => shown[file])) < exposures) return null;
    const edge = total(EDGE_FILES);
    const centre = total(CENTRE_FILES);
    const edgeRate = edge.missed / edge.shown;
    const centreRate = centre.missed / centre.shown;
    if (edge.missed < EDGE_MISSES) return null;
    const ratio = centreRate === 0 ? null : hundredths(edgeRate / centreRate);
    if (ratio !== null && ratio < EDGE_RATIO) return null;
    return {
      params: {
        times: ratio === null ? 0 : aboutTimes(ratio),
        edge: percentShown(edgeRate),
        centre: percentShown(centreRate),
        edgeShown: edge.shown,
        centreShown: centre.shown,
      },
      action: rig(EDGE_RIG),
      strength: ratio === null ? NO_CENTRE_MISS_STRENGTH : hundredths(ratio / EDGE_RATIO),
    };
  },
};

const weakType: InsightRule<{ exposures: number }> = {
  id: "weakType",
  priority: 1,
  minSample: { exposures: LAB_THRESHOLDS.typeExposures },
  evaluate({ summary }, _prior, { exposures }) {
    const weakest = PIECE_LETTERS.filter((type) => type !== "k")
      .map((type) => {
        const shown = summary.typeShown[type] ?? 0;
        const recalled = shown - (summary.typeMissed[type] ?? 0);
        return { type, shown, recalled, recall: recalled / shown };
      })
      .filter(({ shown, recall }) => shown >= exposures && recall < WEAK_RECALL)
      .sort((a, b) => a.recall - b.recall || b.shown - a.shown)[0];
    if (!weakest) return null;
    const { type, recalled, shown, recall } = weakest;
    return {
      params: { type, recalled, shown, percent: percent(recall) },
      action: { kind: "guide", guide: "patterns" },
      strength: hundredths(WEAK_RECALL / Math.max(recall, 0.01)),
    };
  },
};

const fasterLessAccurate: InsightRule<{ rounds: number }> = {
  id: "fasterLessAccurate",
  priority: 2,
  minSample: { rounds: TWO_WINDOWS },
  evaluate(_input, prior, { rounds }) {
    const speed = prior.speed.value;
    if (!speed || speed.accuracyAtSameRounds.points.length < rounds) return null;
    const pace = speed.recent.change;
    const accuracy = speed.accuracyAtSameRounds.recent.change;
    if (pace == null || accuracy == null || -pace < FASTER_SECONDS || -accuracy < ACCURACY_FALL_POINTS) return null;
    return {
      params: { ...speed.setting, faster: Math.round(-pace * 10) / 10, fell: Math.round(-accuracy) },
      action: rig(speed.setting),
      strength: hundredths(Math.min(-pace / FASTER_SECONDS, -accuracy / ACCURACY_FALL_POINTS)),
    };
  },
};

const recallOf = (shown: ColorCounts, missed: ColorCounts, color: keyof ColorCounts) => (shown[color] - missed[color]) / shown[color];

const colourGap: InsightRule<{ exposures: number }> = {
  id: "colourGap",
  priority: 2,
  minSample: { exposures: COLOUR_EXPOSURES },
  evaluate({ summary: { colorShown, colorMissed } }, _prior, { exposures }) {
    if (Math.min(colorShown.w, colorShown.b) < exposures) return null;
    const white = recallOf(colorShown, colorMissed, "w");
    const black = recallOf(colorShown, colorMissed, "b");
    const gap = hundredths(Math.abs(white - black) * 100);
    if (gap < COLOUR_GAP_POINTS) return null;
    const [weaker, stronger] = white < black ? (["w", "b"] as const) : (["b", "w"] as const);
    return {
      params: {
        weaker,
        weakerPercent: percent(Math.min(white, black)),
        strongerPercent: percent(Math.max(white, black)),
        weakerShown: colorShown[weaker],
        strongerShown: colorShown[stronger],
      },
      action: { kind: "guide", guide: "vision" },
      strength: hundredths(gap / COLOUR_GAP_POINTS),
    };
  },
};

const plateau: InsightRule<{ rounds: number }> = {
  id: "plateau",
  priority: 3,
  minSample: { rounds: TWO_WINDOWS },
  evaluate(input, prior, { rounds: least }) {
    const { rounds } = busiestSetting(input, input.records, TREND_THRESHOLDS, least);
    const window = LAB_THRESHOLDS.rollingWindow;
    if (rounds.length < least) return null;
    const accuracy = rounds.map((record) => record.accuracy);
    const last = mean(accuracy.slice(-window));
    const before = mean(accuracy.slice(-2 * window, -window));
    const moved = Math.abs(last - before);
    const span = prior.span.value;
    const setting = settingOf(rounds[rounds.length - 1]);
    if (moved > PLATEAU_POINTS || span?.change !== 0 || span.pieceCount !== setting.pieceCount || span.pieceCount >= PIECE_COUNT_RANGE.max) return null;
    return {
      params: { ...setting, last: Math.round(last), before: Math.round(before), span: span.pieceCount },
      action: rig({ ...setting, pieceCount: span.pieceCount + 1 }),
      strength: hundredths(PLATEAU_POINTS / Math.max(moved, 1)),
    };
  },
};

const INSIGHT_RULES: readonly BoundRule[] = [bind(edgeFiles), bind(weakType), bind(fasterLessAccurate), bind(colourGap), bind(plateau)];

export function computeInsights(input: LabInput, prior: InsightPrior): MetricResult<InsightsValue> {
  const { rounds } = input.summary;
  const readiness = readinessFor(input, { sampleSize: rounds, have: { rounds }, thresholds: INSIGHTS_THRESHOLDS });
  return measured(readiness, () => {
    if (!hasFigure(readiness)) return { insights: [] };
    const found = INSIGHT_RULES.flatMap((rule) => {
      const finding = rule.find(input, prior);
      return finding ? [{ rule, insight: { ruleId: rule.id, ...finding } }] : [];
    });
    found.sort((a, b) => a.rule.priority - b.rule.priority || b.insight.strength - a.insight.strength);
    return { insights: found.slice(0, MAX_INSIGHTS).map(({ insight }) => insight) };
  });
}
