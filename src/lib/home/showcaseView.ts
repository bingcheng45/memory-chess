import type { SquareName } from "@/lib/game/board";
import type { PieceColor } from "@/types/chess";
import { SHOWCASE, type GroupId } from "./showcase";
import { SHOWCASE_REACH } from "./showcaseReach";
import { NO_ANNOTATIONS, STUDY_PLACEMENTS, type Annotations, type Placements, type ShowcaseStep } from "./showcaseTour";

/** Where one piece may go and what it guards, read from the generated reach table. */
export interface Inspection {
  readonly source: SquareName;
  readonly color: PieceColor;
  readonly moves: readonly SquareName[];
  readonly captures: readonly SquareName[];
  readonly guards: readonly SquareName[];
  /** The moves that give check, in standard notation. */
  readonly checks: readonly string[];
}

/** Everything the board draws for one moment: a tour step, or a piece being inspected. */
export interface ShowcaseView {
  /** Changes whenever the marks should be drawn afresh. */
  readonly key: string;
  readonly placements: Placements;
  readonly hidden: boolean;
  readonly dimmed: readonly SquareName[];
  readonly circles: readonly GroupId[];
  readonly active: GroupId | null;
  readonly annotations: Annotations;
  readonly inspection: Inspection | null;
  /** Pieces return one group after another. */
  readonly staggered: boolean;
  /** Pieces slide between squares. Off while the board blanks and refills, which moves them unseen. */
  readonly glide: boolean;
}

const BASE_VIEW: Omit<ShowcaseView, "key" | "placements"> = {
  hidden: false,
  dimmed: [],
  circles: [],
  active: null,
  annotations: NO_ANNOTATIONS,
  inspection: null,
  staggered: false,
  glide: true,
};

export function viewOfStep(step: ShowcaseStep): ShowcaseView {
  const view = { ...BASE_VIEW, key: step.key, placements: step.placements, annotations: step.annotations };
  switch (step.phase) {
    case "study":
      return { ...view, circles: step.circles, active: step.active };
    case "threat":
      return { ...view, dimmed: step.dimmed };
    case "finish":
      return view;
    case "rebuild":
      return { ...view, hidden: !step.revealed, staggered: step.revealed, glide: false };
  }
}

export function inspect(source: SquareName): Inspection {
  const piece = SHOWCASE.position[source];
  const reach = SHOWCASE_REACH[source];
  if (!piece || !reach) throw new Error(`No piece to inspect on ${source}`);
  return {
    source,
    color: piece.color,
    moves: reach.legal.filter((move) => !move.san.includes("x")).map((move) => move.to),
    captures: reach.legal.filter((move) => move.san.includes("x")).map((move) => move.to),
    guards: reach.attacks.filter((target) => SHOWCASE.position[target]?.color === piece.color),
    checks: reach.legal.filter((move) => /[+#]/.test(move.san)).map((move) => move.san),
  };
}

/** The study position, whichever step the tour is on, with the piece's reach drawn over it. */
export function viewOfInspection(inspection: Inspection): ShowcaseView {
  return {
    ...BASE_VIEW,
    key: `inspect-${inspection.source}`,
    placements: STUDY_PLACEMENTS,
    annotations: { ...NO_ANNOTATIONS, focus: inspection.source },
    inspection,
  };
}
