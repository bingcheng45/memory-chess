import type { SquareName } from "@/lib/game/board";
import { NO_ANNOTATIONS, SHOWCASE, type Annotations, type GroupId, type Showcase, type ShowcaseFrame } from "./showcase";
import { SHOWCASE_FRAMES } from "./showcaseReplay";

/** A piece is named by the square it stands on in the study position; this says where it stands now. */
export type Placements = Readonly<Partial<Record<SquareName, SquareName>>>;

/** Where every piece stands, and which have been taken. */
export interface BoardState {
  readonly placements: Placements;
  /** Pieces captured so far, by study square. */
  readonly gone: readonly SquareName[];
}

export type StepTone = "white" | "black" | "game" | "rebuild";
export type StepTag = "study" | "trap" | "sacrifice" | "walk" | "runners" | "rebuild";

export const STEP_MS = {
  intro: 3600,
  group: 2000,
  trap: 4400,
  ply: 1000,
  scene: 2800,
  blank: 1800,
  back: 2400,
  check: 4000,
} as const;

interface StepBase {
  /** Names the step's copy in the message catalogue: `<phase>.<id>`. */
  readonly key: string;
  readonly tag: StepTag;
  readonly tone: StepTone;
  readonly durationMs: number;
  /**
   * The board at each beat of the step. A still step has one; a stretch of the
   * game has one per ply, shown one after another.
   */
  readonly boards: readonly BoardState[];
  /** Drawn once the last board is shown. */
  readonly annotations: Annotations;
  /** Place within the phase, for the step counter. Steps without one show their tag. */
  readonly ordinal: { readonly n: number; readonly of: number } | null;
}

export interface StudyStep extends StepBase {
  readonly phase: "study";
  readonly circles: readonly GroupId[];
  readonly active: GroupId | null;
}

export interface TrapStep extends StepBase {
  readonly phase: "trap";
  /** Pieces the step is not about, drawn faint. */
  readonly dimmed: readonly SquareName[];
}

export interface GameStep extends StepBase {
  readonly phase: "game";
}

export interface RebuildStep extends StepBase {
  readonly phase: "rebuild";
  /** False on the blank board; true while the groups come back one after another. */
  readonly revealed: boolean;
}

export type ShowcaseStep = StudyStep | TrapStep | GameStep | RebuildStep;

/** Plays the first `plies` frames from the study position, following each piece by its study square. */
export function boardAfter(
  plies: number,
  study: readonly SquareName[] = Object.keys(SHOWCASE.position) as SquareName[],
  frames: readonly ShowcaseFrame[] = SHOWCASE_FRAMES,
): BoardState {
  const placements: Partial<Record<SquareName, SquareName>> = Object.fromEntries(study.map((square) => [square, square]));
  const gone: SquareName[] = [];
  const pieceOn = (square: SquareName) =>
    study.find((home) => placements[home] === square && !gone.includes(home));
  frames.slice(0, plies).forEach((frame) => {
    const taken = frame.captured && pieceOn(frame.captured);
    if (taken) gone.push(taken);
    const mover = pieceOn(frame.from);
    if (!mover) throw new Error(`No piece on ${frame.from} for ${frame.san}`);
    placements[mover] = frame.to;
  });
  return { placements, gone };
}

/** The study position, four groups, the trap, three stretches of the game, then the rebuild. */
export function buildShowcaseSteps(showcase: Showcase = SHOWCASE): readonly ShowcaseStep[] {
  const occupied = Object.keys(showcase.position) as SquareName[];
  const start = boardAfter(0, occupied);
  const { groups, trap, scenes, check } = showcase;

  const study: StudyStep[] = [
    {
      phase: "study",
      key: "study.intro",
      tag: "study",
      tone: "white",
      durationMs: STEP_MS.intro,
      boards: [start],
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
        boards: [start],
        annotations: { ...NO_ANNOTATIONS, relations: group.relations },
        ordinal: { n: index + 1, of: groups.length },
        circles: groups.slice(0, index + 1).map((earlier) => earlier.id),
        active: group.id,
      }),
    ),
  ];

  const involved = new Set<SquareName>([
    ...(trap.focus ? [trap.focus] : []),
    ...trap.rings.map((ring) => ring.square),
    ...trap.crosses,
    ...trap.relations.flatMap((item) => [item.from, item.to]),
  ]);
  const trapStep: TrapStep = {
    phase: "trap",
    key: "trap.king",
    tag: "trap",
    tone: "black",
    durationMs: STEP_MS.trap,
    boards: [start],
    annotations: trap,
    ordinal: null,
    dimmed: occupied.filter((square) => !involved.has(square)),
  };

  const game = scenes.map((scene, index): GameStep => {
    const plies = Array.from({ length: scene.plies.to - scene.plies.from + 1 }, (_, ply) => scene.plies.from + ply + 1);
    return {
      phase: "game",
      key: `game.${scene.id}`,
      tag: scene.id,
      tone: "game",
      durationMs: plies.length * STEP_MS.ply + STEP_MS.scene,
      boards: plies.map((count) => boardAfter(count, occupied)),
      annotations: scene.annotations,
      ordinal: { n: index + 1, of: scenes.length },
    };
  });
  const end = game.at(-1)?.boards.at(-1) ?? start;

  const rebuild: RebuildStep[] = [
    {
      phase: "rebuild",
      key: "rebuild.blank",
      tag: "rebuild",
      tone: "rebuild",
      durationMs: STEP_MS.blank,
      // The pieces fade where they stood rather than sliding home as they go.
      boards: [end],
      annotations: NO_ANNOTATIONS,
      ordinal: null,
      revealed: false,
    },
    {
      phase: "rebuild",
      key: "rebuild.back",
      tag: "rebuild",
      tone: "rebuild",
      durationMs: STEP_MS.back,
      boards: [start],
      annotations: NO_ANNOTATIONS,
      ordinal: null,
      revealed: true,
    },
    {
      phase: "rebuild",
      key: "rebuild.check",
      tag: "rebuild",
      tone: "rebuild",
      durationMs: STEP_MS.check,
      boards: [start],
      annotations: check,
      ordinal: null,
      revealed: true,
    },
  ];

  return [...study, trapStep, ...game, ...rebuild];
}

export const SHOWCASE_STEPS: readonly ShowcaseStep[] = buildShowcaseSteps();

/** Every piece on its study square: where the board stands before any step moves it. */
export const STUDY_BOARD: BoardState = SHOWCASE_STEPS[0].boards[0];
