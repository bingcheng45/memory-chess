export const INSTALL_NUDGE_KEY = "memory-chess-lab-install-nudge";

/** Days played before the record says where it lives: a second day is the first sign the player is coming back. */
export const INSTALL_NUDGE_DAYS = 2;

interface NudgeInput {
  readonly days: number;
  /** Null until the page has checked whether it runs as a Home Screen app. */
  readonly installed: boolean | null;
  /** When the note first came into view on any visit, from local storage. */
  readonly seenAt: number | null;
  /** Whether that first sight was on this visit, so the note stays put until the player leaves or dismisses it. */
  readonly seenHere: boolean;
}

export function showsInstallNudge({ days, installed, seenAt, seenHere }: NudgeInput): boolean {
  return days >= INSTALL_NUDGE_DAYS && installed === false && (seenAt === null || seenHere);
}

export function parseNudgeSeen(text: string | null): number | null {
  const at = Number(text);
  return text && Number.isFinite(at) ? at : null;
}
