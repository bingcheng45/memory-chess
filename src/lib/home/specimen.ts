import { scoreReading, type LabPosition } from "@/lib/home/calibration";

/** The illustrative position the hero and the microscope diagram study. */
export const SPECIMEN: LabPosition = {
  g1: { color: "white", type: "king" },
  f2: { color: "white", type: "pawn" },
  g2: { color: "white", type: "pawn" },
  h2: { color: "white", type: "pawn" },
  f3: { color: "white", type: "knight" },
  d8: { color: "black", type: "rook" },
  d6: { color: "black", type: "queen" },
  c4: { color: "white", type: "bishop" },
};

/** The example rebuild: every piece right except the knight, one file off. */
export const SPECIMEN_RECALL: LabPosition = Object.fromEntries([
  ...Object.entries(SPECIMEN).filter(([square]) => square !== "f3"),
  ["e3", { color: "white", type: "knight" }],
]);

export const SPECIMEN_SCORE = scoreReading(SPECIMEN, SPECIMEN_RECALL);

export const SPECIMEN_STUDY_SECONDS = 10;

export type MicroscopePhaseId = "study" | "chunk" | "blind" | "recall" | "score";

export interface MicroscopePhase {
  readonly id: MicroscopePhaseId;
  /** Illustrative round clock shown on the diagram. */
  readonly clock: string;
  readonly pieces: "specimen" | "none" | "recall";
  readonly overlay: "fixation" | "chunks" | null;
  readonly marks: boolean;
  readonly scoreChip: boolean;
}

export const MICROSCOPE_PHASES: readonly MicroscopePhase[] = [
  { id: "study", clock: "0.0", pieces: "specimen", overlay: "fixation", marks: false, scoreChip: false },
  { id: "chunk", clock: "4.2", pieces: "specimen", overlay: "chunks", marks: false, scoreChip: false },
  { id: "blind", clock: "10.0", pieces: "none", overlay: null, marks: false, scoreChip: false },
  { id: "recall", clock: "21.6", pieces: "recall", overlay: null, marks: true, scoreChip: false },
  { id: "score", clock: "24.1", pieces: "recall", overlay: null, marks: true, scoreChip: true },
];
