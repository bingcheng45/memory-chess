import type { LeaderboardDifficulty } from "@/types/leaderboard";

/** Where a round was started from. `link` is a round link that names no known source. */
const ROUND_SOURCES = [
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
  "link",
] as const;

export type RoundSource = (typeof ROUND_SOURCES)[number];

export function roundSourceFrom(value: string | null): RoundSource {
  return ROUND_SOURCES.find((source) => source === value) ?? "link";
}

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
  // Lab record events carry counts only, never positions, squares or round ids.
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
    };

export function trackEvent({ name, params }: FunnelEvent): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
