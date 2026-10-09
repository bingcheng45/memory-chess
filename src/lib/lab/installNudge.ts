export const INSTALL_NUDGE_KEY = "memory-chess-lab-install-nudge";

/** Days played before the record says where it lives: a second day is the first sign the player is coming back. */
export const INSTALL_NUDGE_DAYS = 2;

interface NudgeInput {
  readonly days: number;
  /** Null until the page has checked whether it runs as a Home Screen app. */
  readonly installed: boolean | null;
  /**
   * Whether the note's place started below the screen when the record loaded, so adding it moves nothing in view.
   * Null until checked. Checked once, so a note that waits for a later visit never appears under the player's eyes.
   */
  readonly belowScreen: boolean | null;
  /** When the note first came into view on any visit, from local storage. */
  readonly seenAt: number | null;
  /** Whether that first sight was on this visit, so the note stays put until the player leaves or dismisses it. */
  readonly seenHere: boolean;
}

export function showsInstallNudge({ days, installed, belowScreen, seenAt, seenHere }: NudgeInput): boolean {
  return days >= INSTALL_NUDGE_DAYS && installed === false && belowScreen === true && (seenAt === null || seenHere);
}

export function parseNudgeSeen(text: string | null): number | null {
  const at = Number(text);
  return text && Number.isFinite(at) ? at : null;
}
