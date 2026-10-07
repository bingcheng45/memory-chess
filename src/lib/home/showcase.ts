import type { SquareName } from "@/lib/game/board";
import { labPositionFromFen, type LabPosition } from "./calibration";

export type GroupId = "kingCorner" | "queenPawn" | "cage" | "blackQueen" | "blackPawns" | "bishopPawn";
export type ThreatId = "knight" | "queen" | "mate";

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

/** A rectangle of squares, from its lower-left corner to its upper-right corner. */
export type SquareBox = readonly [SquareName, SquareName];

export interface ShowcaseGroup {
  readonly id: GroupId;
  /** Which colour the circle takes: a group of one side, or pieces of both. */
  readonly side: "white" | "black" | "mixed";
  readonly box: SquareBox;
}

export interface ShowcaseArrow {
  readonly from: SquareName;
  readonly to: SquareName;
  /** A square the piece attacks that the step is not about: drawn thin and without a head. */
  readonly faint?: true;
}

export interface ShowcaseRing {
  readonly square: SquareName;
  readonly kind: "target" | "king";
}

export interface ShowcaseThreat {
  readonly id: ThreatId;
  readonly focus: SquareName;
  readonly arrows: readonly ShowcaseArrow[];
  readonly rings: readonly ShowcaseRing[];
}

export interface ShowcaseMove {
  readonly from: SquareName;
  readonly to: SquareName;
}

export interface Showcase {
  readonly fen: string;
  readonly position: LabPosition;
  readonly groups: readonly ShowcaseGroup[];
  readonly threats: readonly ShowcaseThreat[];
  /** 34...Qe3 and 35.Qh7#. */
  readonly finish: {
    readonly reply: ShowcaseMove;
    readonly mate: ShowcaseMove & {
      readonly supporter: SquareName;
      readonly king: SquareName;
      readonly covered: SquareName;
    };
  };
}

const FEN = "5N1k/q5p1/7p/4P3/pp2Q3/8/1P4PP/2b4K b - - 0 34";

export const SHOWCASE: Showcase = {
  fen: FEN,
  position: labPositionFromFen(FEN),
  groups: [
    { id: "kingCorner", side: "white", box: ["g1", "h2"] },
    { id: "queenPawn", side: "white", box: ["e4", "e5"] },
    { id: "cage", side: "mixed", box: ["f6", "h8"] },
    { id: "blackQueen", side: "black", box: ["a7", "a7"] },
    { id: "blackPawns", side: "black", box: ["a4", "b4"] },
    { id: "bishopPawn", side: "mixed", box: ["b1", "c2"] },
  ],
  threats: [
    {
      id: "knight",
      focus: "f8",
      arrows: [
        { from: "f8", to: "g6", faint: true },
        { from: "f8", to: "e6", faint: true },
        { from: "f8", to: "d7", faint: true },
        { from: "f8", to: "h7" },
      ],
      rings: [{ square: "h8", kind: "king" }],
    },
    {
      id: "queen",
      focus: "e4",
      arrows: [
        { from: "e4", to: "g6", faint: true },
        { from: "e4", to: "f5", faint: true },
        { from: "e4", to: "h7" },
        { from: "e4", to: "b4" },
      ],
      rings: [
        { square: "b4", kind: "target" },
        { square: "h8", kind: "king" },
      ],
    },
    {
      id: "mate",
      focus: "e4",
      arrows: [
        { from: "e4", to: "h7" },
        { from: "f8", to: "h7" },
      ],
      rings: [{ square: "h8", kind: "king" }],
    },
  ],
  finish: {
    reply: { from: "a7", to: "e3" },
    mate: { from: "e4", to: "h7", supporter: "f8", king: "h8", covered: "g8" },
  },
};

const FILE_LETTERS = "abcdefgh";

/** Every square inside the box, in file-then-rank order. */
export function squaresInBox([from, to]: SquareBox): SquareName[] {
  const files = [from[0], to[0]].map((file) => FILE_LETTERS.indexOf(file));
  const ranks = [from[1], to[1]].map(Number);
  const squares: SquareName[] = [];
  for (let file = files[0]; file <= files[1]; file++) {
    for (let rank = ranks[0]; rank <= ranks[1]; rank++) {
      squares.push(`${FILE_LETTERS[file]}${rank}` as SquareName);
    }
  }
  return squares;
}

/** Each piece's place in the group order, so the rebuild can bring the groups back one after another. */
export const GROUP_INDEX: Readonly<Partial<Record<SquareName, number>>> = Object.fromEntries(
  SHOWCASE.groups.flatMap((group, index) => squaresInBox(group.box).map((square) => [square, index])),
);
