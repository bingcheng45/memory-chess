import type { LeaderboardDifficulty } from "@/types/leaderboard";

/** Where a round was started from. `link` is a round link that names no known source. */
export const ROUND_SOURCES = [
  "home_quick",
  "home_tier",
  "calibration",
  "calibration_cta",
  "guide_cta",
  "article_cta",
  "game_quick",
  "game_form",
  "tile_drill",
  "try_again",
  "insight",
  "link",
] as const;

export type RoundSource = (typeof ROUND_SOURCES)[number];

export function roundSourceFrom(value: string | null): RoundSource {
  return ROUND_SOURCES.find((source) => source === value) ?? "link";
}

/** §06 parts with a play link: the unlock strip and each panel that can go stale. */
export type LabPanel = "unlock" | "span" | "piecesHeld" | "trend" | "speed" | "missMap" | "streak" | "bests" | "typeRecall";

/**
 * The GA4 event contract. Round events carry the setting and the score, and
 * `source` names where the round started (calibration included). Lab events
 * carry counts and fixed ids only, never positions, squares, round ids, dates
 * or streak lengths, which the privacy page promises.
 */
export type FunnelEvent =
  | {
      name: "round_start";
      params: { piece_count: number; memorize_time: number; source: RoundSource };
    }
  | {
      name: "round_complete";
      params: {
        piece_count: number;
        memorize_time: number;
        correct_pieces: number;
        accuracy: number;
        source: RoundSource;
      };
    }
  | {
      name: "score_submit";
      params: { difficulty: LeaderboardDifficulty; piece_count: number };
    }
  | {
      name: "article_like";
      params: { slug: string };
    }
  | {
      name: "article_tile_click";
      params: { slug: string; action: "read" | "drill" };
    }
  | {
      name: "lab_export";
      params: { rounds: number };
    }
  | {
      name: "lab_import";
      params: { added: number; rejected: number };
    }
  | {
      name: "lab_backup_interest";
      params: { rounds: number };
    }
  /** Once per page view, when §06 first scrolls into sight. */
  | {
      name: "lab_section_view";
      params: Record<string, never>;
    }
  | {
      name: "lab_panel_action";
      params: { panel: LabPanel; action: "play" };
    };

export function trackEvent({ name, params }: FunnelEvent): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
