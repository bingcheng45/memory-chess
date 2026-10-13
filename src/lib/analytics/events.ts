import type { DAILY_BOARD, LeaderboardDifficulty } from "@/types/leaderboard";
import type { SearchOutcome } from "@/lib/seo/learn/search";
import type { ShareNetwork } from "@/lib/shareIntents";

/** Where a round was started from. `link` is a round link that names no known source. */
export const ROUND_SOURCES = [
  "home_quick",
  "home_tier",
  "calibration",
  "calibration_cta",
  "guide_cta",
  "article_cta",
  "game_form",
  "tile_drill",
  "try_again",
  "insight",
  "result_next",
  "plan",
  "daily",
  "review",
  "dashboard",
  "share",
  "link",
] as const;

export type RoundSource = (typeof ROUND_SOURCES)[number];

/** Sources no control sends any more. A lab record written while one did still carries it, so an import accepts it. */
export const RETIRED_ROUND_SOURCES = ["game_quick"] as const;
export type RecordedRoundSource = RoundSource | (typeof RETIRED_ROUND_SOURCES)[number];
export const RECORDED_ROUND_SOURCES: readonly RecordedRoundSource[] = [...ROUND_SOURCES, ...RETIRED_ROUND_SOURCES];

export function roundSourceFrom(value: string | null): RoundSource {
  return ROUND_SOURCES.find((source) => source === value) ?? "link";
}

/** Lab parts with a link or a control: the unlock strip, each §06 panel that can go stale, the insights a finding links from, the plans and goal, the daily board, the review queue on the forgetting curve, the leaderboard standing check, and the card on the result screen. */
export type LabPanel =
  | "unlock"
  | "span"
  | "piecesHeld"
  | "trend"
  | "speed"
  | "missMap"
  | "streak"
  | "bests"
  | "typeRecall"
  | "insights"
  | "plans"
  | "goal"
  | "daily"
  | "curve"
  | "board"
  | "resultCard";

/** What the player did: follow a link, start, stop or finish a plan, set or clear a goal, or check a standing. Never which plan or goal, and never an entry id or rank. */
export type LabPanelAction = "play" | "guide" | "next" | "start" | "stop" | "finish" | "setGoal" | "clearGoal" | "check";

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
      params: { difficulty: LeaderboardDifficulty | typeof DAILY_BOARD; piece_count: number };
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
      params: { panel: LabPanel; action: LabPanelAction };
    }
  /** How the progress card left the dashboard: the share sheet, a saved or copied image, the caption copied, or a network's post page. Never its figures. */
  | {
      name: "lab_dashboard_share";
      params: ShareParams;
    }
  /** One settled Learn search. Never the words typed, only how many characters, as the privacy page promises. */
  | {
      name: "learn_search";
      params: { query_length: number; results: number; top: string; outcome: SearchOutcome; surface: LearnSearchSurface };
    }
  | {
      name: "learn_search_select";
      params: { slug: string; rank: number; matched_question: boolean; surface: LearnSearchSurface };
    }
  /** The same for a round's result card on /game. Never the round's score or position. */
  | {
      name: "result_share";
      params: ShareParams;
    };

export type LearnSearchSurface = "hub" | "server";

export type ShareMethod = "native" | "download" | "copy_image" | "copy" | "post";

export type ShareParams = { method: Exclude<ShareMethod, "post"> } | { method: "post"; network: ShareNetwork };

/** Where a share dialog opens, and the event it reports under: each surface keeps its own name, so neither one's counts need a custom dimension to read apart. */
export const SHARE_EVENTS = { dashboard: "lab_dashboard_share", result: "result_share" } as const satisfies Record<string, FunnelEvent["name"]>;

export type ShareSurface = keyof typeof SHARE_EVENTS;

export function trackEvent({ name, params }: FunnelEvent): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
