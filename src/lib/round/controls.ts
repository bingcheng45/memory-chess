import type { RoundPhase } from "./round";

export type ControlIntent = "start" | "endStudy" | "submit";

export interface RoundControl {
  readonly label: "start" | "done" | "restart" | "again" | "submit";
  readonly intent: ControlIntent;
  readonly enabled: boolean;
}

export interface PhaseControls {
  readonly first: RoundControl;
  readonly second: RoundControl;
  readonly primary: "first" | "second";
  readonly clearEnabled: boolean;
}

const SUBMIT_OFF: RoundControl = { label: "submit", intent: "submit", enabled: false };

/** Before study the board's own Start button leads; the round's buttons wait, as they will read in study. */
const WAITING: PhaseControls = {
  first: { label: "done", intent: "endStudy", enabled: false },
  second: SUBMIT_OFF,
  primary: "first",
  clearEnabled: false,
};

/** The round's two buttons in each phase, which of them is primary, and whether the board can be cleared. */
export const ROUND_CONTROLS = {
  idle: {
    first: { label: "start", intent: "start", enabled: true },
    second: SUBMIT_OFF,
    primary: "first",
    clearEnabled: false,
  },
  ready: WAITING,
  countdown: WAITING,
  study: {
    first: { label: "done", intent: "endStudy", enabled: true },
    second: SUBMIT_OFF,
    primary: "first",
    clearEnabled: false,
  },
  rebuild: {
    first: { label: "restart", intent: "start", enabled: true },
    second: { label: "submit", intent: "submit", enabled: true },
    primary: "second",
    clearEnabled: true,
  },
  scored: {
    first: { label: "again", intent: "start", enabled: true },
    second: SUBMIT_OFF,
    primary: "first",
    clearEnabled: false,
  },
} as const satisfies Record<RoundPhase, PhaseControls>;
