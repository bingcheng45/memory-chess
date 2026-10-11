import type { SquareName } from "@/lib/game/board";
import { labPositionFromFen, type LabPosition } from "./calibration";
import { relation, type Group, type Relation } from "./relations";

export type GroupId = "whiteCorner" | "longDiagonal" | "blackWall" | "runner";

export interface ReachMove {
  readonly to: SquareName;
  readonly san: string;
}

/** What one piece attacks and where it may legally go. Generated, never written by hand. */
export interface PieceReach {
  readonly attacks: readonly SquareName[];
  readonly legal: readonly ReachMove[];
}

export type ShowcaseReach = Readonly<Partial<Record<SquareName, PieceReach>>>;

/** One ply of the game after the study position. Generated, never written by hand. */
export interface ShowcaseFrame {
  readonly san: string;
  readonly from: SquareName;
  readonly to: SquareName;
  /** The square of the piece this ply took, if any. */
  readonly captured: SquareName | null;
  /** The board after this ply. */
  readonly fen: string;
}

export interface ShowcaseMove {
  readonly from: SquareName;
  readonly to: SquareName;
}

export interface ShowcaseRing {
  readonly square: SquareName;
  readonly kind: "target" | "king";
}

/** The marks one step draws over its board. */
export interface Annotations {
  readonly focus: SquareName | null;
  /** True relations on the step's board, checked against chess.js. */
  readonly relations: readonly Relation[];
  /** The path a piece took. */
  readonly moves: readonly ShowcaseMove[];
  readonly rings: readonly ShowcaseRing[];
  readonly crosses: readonly SquareName[];
  /** Squares a rebuild check has confirmed. */
  readonly ticks: readonly SquareName[];
}

export const NO_ANNOTATIONS: Annotations = { focus: null, relations: [], moves: [], rings: [], crosses: [], ticks: [] };

const marks = (partial: Partial<Annotations>): Annotations => ({ ...NO_ANNOTATIONS, ...partial });

/** A stretch of the game: plies `from` to `to` of SHOWCASE_FRAMES, played in order. */
export interface ShowcaseScene {
  readonly id: "sacrifice" | "walk" | "runners";
  readonly plies: { readonly from: number; readonly to: number };
  readonly annotations: Annotations;
}

export interface Showcase {
  readonly fen: string;
  readonly position: LabPosition;
  readonly groups: readonly Group<GroupId>[];
  /** Why the black king is stuck: drawn over the study position. */
  readonly trap: Annotations;
  readonly scenes: readonly ShowcaseScene[];
  /** What the rebuild checks once the pieces are back. */
  readonly check: Annotations;
}

/** Topalov against Shirov, Linares 1998, after 47.Kg1. Black to move. */
const FEN = "8/8/4kpp1/3p1b2/p6P/2B5/6P1/6K1 b - - 2 47";

export const SHOWCASE: Showcase = {
  fen: FEN,
  position: labPositionFromFen(FEN),
  groups: [
    { id: "whiteCorner", side: "white", squares: ["g1", "g2", "h4"], relations: [relation("defends", "g1", "g2")] },
    {
      id: "longDiagonal",
      side: "white",
      squares: ["c3"],
      relations: [relation("attacks", "c3", "f6"), relation("controls", "c3", "a1")],
    },
    {
      id: "blackWall",
      side: "black",
      squares: ["e6", "f5", "d5", "f6", "g6"],
      relations: [relation("defends", "e6", "f6"), relation("defends", "e6", "d5"), relation("defends", "g6", "f5")],
    },
    { id: "runner", side: "black", squares: ["a4"], relations: [] },
  ],
  trap: marks({
    focus: "c3",
    relations: [relation("controls", "c3", "e5"), relation("attacks", "c3", "f6")],
    rings: [{ square: "e6", kind: "king" }],
    crosses: ["d5", "e5", "f5"],
  }),
  scenes: [
    {
      id: "sacrifice",
      plies: { from: 0, to: 0 },
      annotations: marks({
        focus: "h3",
        moves: [{ from: "f5", to: "h3" }],
        relations: [relation("attacks", "g2", "h3")],
        rings: [{ square: "f5", kind: "target" }],
      }),
    },
    {
      id: "walk",
      plies: { from: 1, to: 4 },
      annotations: marks({
        focus: "e4",
        moves: [
          { from: "e6", to: "f5" },
          { from: "f5", to: "e4" },
        ],
      }),
    },
    {
      id: "runners",
      plies: { from: 5, to: 12 },
      annotations: marks({
        focus: "b3",
        relations: [relation("controls", "e7", "a3"), relation("controls", "b3", "a2")],
        rings: [
          { square: "a4", kind: "target" },
          { square: "d4", kind: "target" },
        ],
      }),
    },
  ],
  check: marks({
    relations: [relation("attacks", "c3", "f6")],
    ticks: ["c3", "f5", "f6"],
  }),
};

/** The squares a group's outline spans, from its lower-left corner to its upper-right corner. */
export function groupBounds(group: Group<string>): readonly [SquareName, SquareName] {
  const files = group.squares.map((square) => square[0]).sort();
  const ranks = group.squares.map((square) => square[1]).sort();
  return [`${files[0]}${ranks[0]}` as SquareName, `${files.at(-1)}${ranks.at(-1)}` as SquareName];
}

/** Each piece's place in the group order, so the rebuild can bring the groups back one after another. */
export const GROUP_INDEX: Readonly<Partial<Record<SquareName, number>>> = Object.fromEntries(
  SHOWCASE.groups.flatMap((group, index) => group.squares.map((square) => [square, index])),
);
