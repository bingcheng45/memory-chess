import type { SquareName } from "@/lib/game/board";
import { labPositionFromFen, scoreReading, type LabPosition } from "@/lib/home/calibration";
import { relation, type Group, type Relation, type RelationCheck } from "./relations";

/** Kasparov against Topalov, Wijk aan Zee 1999, after 44.Qa7: the final position. Black to move. */
export const SPECIMEN_FEN = "8/Q6p/6p1/5p2/5P2/2p3P1/3r3P/2K1k3 b - - 3 44";
export const SPECIMEN: LabPosition = labPositionFromFen(SPECIMEN_FEN);

export type SpecimenGroupId = "standoff" | "mirror" | "longShots";

/** The two kings: placed first, and everything else hangs off them. */
export const SPECIMEN_ANCHORS: readonly SquareName[] = ["c1", "e1"];

/** Rd2 sits in two groups on purpose: the overlap ties the chunks together. */
export const SPECIMEN_GROUPS: readonly Group<SpecimenGroupId>[] = [
  {
    id: "standoff",
    side: "mixed",
    squares: ["c1", "e1", "d2", "c3"],
    relations: [relation("attacks", "c1", "d2"), relation("defends", "e1", "d2"), relation("defends", "c3", "d2")],
  },
  {
    id: "mirror",
    side: "mixed",
    squares: ["h2", "g3", "f4", "h7", "g6", "f5"],
    relations: [
      relation("chain", "h2", "g3"),
      relation("chain", "g3", "f4"),
      relation("chain", "h7", "g6"),
      relation("chain", "g6", "f5"),
      relation("blocked", "f4", "f5"),
    ],
  },
  {
    id: "longShots",
    side: "mixed",
    squares: ["a7", "d2", "h7", "h2"],
    relations: [relation("attacks", "a7", "h7"), relation("attacks", "d2", "h2")],
  },
];

/** The example rebuild's one slip: the black pawn lands on c2 instead of c3. */
export const SPECIMEN_SLIP = { from: "c3", to: "c2" } as const satisfies { from: SquareName; to: SquareName };

const moved = (square: SquareName): SquareName => (square === SPECIMEN_SLIP.from ? SPECIMEN_SLIP.to : square);

export const SPECIMEN_RECALL: LabPosition = Object.fromEntries(
  Object.entries(SPECIMEN).map(([square, piece]) => [moved(square as SquareName), piece]),
);

export const SPECIMEN_SCORE = scoreReading(SPECIMEN, SPECIMEN_RECALL);

const ALL_RELATIONS: readonly Relation[] = SPECIMEN_GROUPS.flatMap((group) => group.relations);

/**
 * Every relation re-derived on the rebuild, with the slipped piece where it landed.
 * A relation through the slipped piece is the one that breaks; relations.test.ts
 * holds each verdict against chess.js.
 */
export const SPECIMEN_CHECKS: readonly RelationCheck[] = ALL_RELATIONS.map((item) => ({
  relation: { ...item, from: moved(item.from), to: moved(item.to) },
  holds: item.from !== SPECIMEN_SLIP.from && item.to !== SPECIMEN_SLIP.from,
}));

/** The order the rebuild brings pieces back: the anchors, then each group in turn. */
export const REBUILD_ORDER: Readonly<Partial<Record<SquareName, number>>> = Object.fromEntries(
  [SPECIMEN_ANCHORS, ...SPECIMEN_GROUPS.map((group) => group.squares)]
    .flatMap((squares, index) => squares.map((square) => [moved(square), index] as const))
    .reverse(),
);

export const SIDE_COUNTS = {
  white: Object.values(SPECIMEN_RECALL).filter((piece) => piece?.color === "white").length,
  black: Object.values(SPECIMEN_RECALL).filter((piece) => piece?.color === "black").length,
};

export type MicroscopePhaseId = "study" | "anchors" | "chunk" | "encode" | "blank" | "rebuild" | "score";

export interface MicroscopePhase {
  readonly id: MicroscopePhaseId;
  /** Illustrative round clock shown on the diagram. */
  readonly clock: string;
  readonly pieces: "specimen" | "none" | "recall";
  /** Pieces left lit, ringed; the rest are dimmed. Empty leaves every piece lit. */
  readonly focus: readonly SquareName[];
  /** Groups outlined on the board. */
  readonly groups: readonly SpecimenGroupId[];
  /** Name each outlined group on the board. */
  readonly labels: boolean;
  readonly relations: readonly Relation[];
  readonly checks: readonly RelationCheck[];
  readonly marks: boolean;
  readonly scoreChip: boolean;
}

const STILL: Omit<MicroscopePhase, "id" | "clock" | "pieces"> = {
  focus: [],
  groups: [],
  labels: false,
  relations: [],
  checks: [],
  marks: false,
  scoreChip: false,
};
const EVERY_GROUP = SPECIMEN_GROUPS.map((group) => group.id);

export const MICROSCOPE_PHASES: readonly MicroscopePhase[] = [
  { ...STILL, id: "study", clock: "0.0", pieces: "specimen" },
  { ...STILL, id: "anchors", clock: "1.6", pieces: "specimen", focus: SPECIMEN_ANCHORS },
  { ...STILL, id: "chunk", clock: "4.2", pieces: "specimen", groups: EVERY_GROUP, relations: ALL_RELATIONS },
  { ...STILL, id: "encode", clock: "7.5", pieces: "specimen", groups: EVERY_GROUP, labels: true },
  { ...STILL, id: "blank", clock: "10.0", pieces: "none" },
  { ...STILL, id: "rebuild", clock: "21.6", pieces: "recall" },
  { ...STILL, id: "score", clock: "24.1", pieces: "recall", checks: SPECIMEN_CHECKS, marks: true, scoreChip: true },
];

/** The only source of a phase's number, as the two-digit label shown beside its name. */
export function phaseNumber(id: MicroscopePhaseId): string {
  return String(MICROSCOPE_PHASES.findIndex((phase) => phase.id === id) + 1).padStart(2, "0");
}
