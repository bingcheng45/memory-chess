import type { SquareName } from "@/lib/game/board";
import {
  SHOWCASE,
  type GroupId,
  type Showcase,
  type ShowcaseArrow,
  type ShowcaseRing,
} from "./showcase";

/** A piece is named by the square it stands on in the study position; this says where it stands now. */
export type Placements = Readonly<Partial<Record<SquareName, SquareName>>>;

export type StepTone = "white" | "black" | "mate" | "rebuild";
export type StepTag = "study" | "threat" | "finish" | "checkmate" | "rebuild";

export const STEP_MS = {
  intro: 3400,
  group: 1900,
  threat: 3300,
  reply: 3200,
  checkmate: 4400,
  blank: 1800,
  rebuild: 3000,
} as const;

export interface Annotations {
  readonly focus: SquareName | null;
  readonly arrows: readonly ShowcaseArrow[];
  readonly rings: readonly ShowcaseRing[];
  readonly crosses: readonly SquareName[];
}

interface StepBase {
  /** Names the step's copy in the message catalogue: `<phase>.<id>`. */
  readonly key: string;
  readonly tag: StepTag;
  readonly tone: StepTone;
  readonly durationMs: number;
  readonly placements: Placements;
  readonly annotations: Annotations;
  /** Place within the phase, for the step counter. The intro and the rebuild have none. */
  readonly ordinal: { readonly n: number; readonly of: number } | null;
}

export interface StudyStep extends StepBase {
  readonly phase: "study";
  readonly circles: readonly GroupId[];
  readonly active: GroupId | null;
}

export interface ThreatStep extends StepBase {
  readonly phase: "threat";
  /** Pieces the step is not about, drawn faint. */
  readonly dimmed: readonly SquareName[];
}

export interface FinishStep extends StepBase {
  readonly phase: "finish";
}

export interface RebuildStep extends StepBase {
  readonly phase: "rebuild";
  /** False on the blank board; true while the groups come back one after another. */
  readonly revealed: boolean;
}

export type ShowcaseStep = StudyStep | ThreatStep | FinishStep | RebuildStep;

export const NO_ANNOTATIONS: Annotations = { focus: null, arrows: [], rings: [], crosses: [] };

/** The study position, then six groups, three threats, the finish and the rebuild. */
export function buildShowcaseSteps(showcase: Showcase = SHOWCASE): readonly ShowcaseStep[] {
  const occupied = Object.keys(showcase.position) as SquareName[];
  const start: Placements = Object.fromEntries(occupied.map((square) => [square, square]));
  const afterReply: Placements = { ...start, [showcase.finish.reply.from]: showcase.finish.reply.to };
  const afterMate: Placements = { ...afterReply, [showcase.finish.mate.from]: showcase.finish.mate.to };
  const { groups, threats, finish } = showcase;

  const study: StudyStep[] = [
    {
      phase: "study",
      key: "study.intro",
      tag: "study",
      tone: "white",
      durationMs: STEP_MS.intro,
      placements: start,
      annotations: NO_ANNOTATIONS,
      ordinal: null,
      circles: [],
      active: null,
    },
    ...groups.map(
      (group, index): StudyStep => ({
        phase: "study",
        key: `study.${group.id}`,
        tag: "study",
        tone: group.side === "black" ? "black" : "white",
        durationMs: STEP_MS.group,
        placements: start,
        annotations: NO_ANNOTATIONS,
        ordinal: { n: index + 1, of: groups.length },
        circles: groups.slice(0, index + 1).map((earlier) => earlier.id),
        active: group.id,
      }),
    ),
  ];

  const threat = threats.map((item, index): ThreatStep => {
    const involved = new Set<SquareName>([
      item.focus,
      ...item.arrows.map((arrow) => arrow.from),
      ...item.rings.map((ring) => ring.square),
    ]);
    return {
      phase: "threat",
      key: `threat.${item.id}`,
      tag: "threat",
      tone: "white",
      durationMs: STEP_MS.threat,
      placements: start,
      annotations: { focus: item.focus, arrows: item.arrows, rings: item.rings, crosses: [] },
      ordinal: { n: index + 1, of: threats.length },
      dimmed: occupied.filter((square) => !involved.has(square)),
    };
  });

  const ending: FinishStep[] = [
    {
      phase: "finish",
      key: "finish.reply",
      tag: "finish",
      tone: "mate",
      durationMs: STEP_MS.reply,
      placements: afterReply,
      annotations: { ...NO_ANNOTATIONS, focus: finish.reply.to },
      ordinal: { n: 1, of: 2 },
    },
    {
      phase: "finish",
      key: "finish.checkmate",
      tag: "checkmate",
      tone: "mate",
      durationMs: STEP_MS.checkmate,
      placements: afterMate,
      annotations: {
        focus: finish.mate.to,
        arrows: [{ from: finish.mate.supporter, to: finish.mate.to }],
        rings: [{ square: finish.mate.king, kind: "king" }],
        crosses: [finish.mate.covered],
      },
      ordinal: { n: 2, of: 2 },
    },
  ];

  const rebuild: RebuildStep[] = [
    {
      phase: "rebuild",
      key: "rebuild.blank",
      tag: "rebuild",
      tone: "rebuild",
      durationMs: STEP_MS.blank,
      // The pieces fade where they stood rather than sliding home as they go.
      placements: afterMate,
      annotations: NO_ANNOTATIONS,
      ordinal: null,
      revealed: false,
    },
    {
      phase: "rebuild",
      key: "rebuild.back",
      tag: "rebuild",
      tone: "rebuild",
      durationMs: STEP_MS.rebuild,
      placements: start,
      annotations: NO_ANNOTATIONS,
      ordinal: null,
      revealed: true,
    },
  ];

  return [...study, ...threat, ...ending, ...rebuild];
}

export const SHOWCASE_STEPS: readonly ShowcaseStep[] = buildShowcaseSteps();

/** Every piece on its study square: where the board stands before any step moves it. */
export const STUDY_PLACEMENTS: Placements = SHOWCASE_STEPS[0].placements;
