import type { LeaderboardDifficulty } from "@/types/leaderboard";

export type FunnelEvent =
  | {
      name: "round_start";
      params: { piece_count: number; memorize_time: number };
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
    };

export function trackEvent({ name, params }: FunnelEvent): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
