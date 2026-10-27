import { isTrackerAvailable, track } from "@databuddy/sdk";
import type { DAILY_BOARD, LeaderboardDifficulty } from "@/types/leaderboard";
import type { SearchOutcome } from "@/lib/seo/learn/search";
import type { ShareNetwork } from "@/lib/shareIntents";
import type { ResultView } from "@/lib/store/gameStore";
import type { BeatId } from "@/lib/home/intro/introBeats";

/** Where a round was started from. `link` is a round link that names no known source. */
export const ROUND_SOURCES = [
  "home_quick",
  "home_tier",
  "calibration",
  "calibration_cta",
  "guide_cta",
  "guide_try",
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
export type LabPanelAction = "play" | "guide" | "next" | "next_round" | "start" | "stop" | "finish" | "setGoal" | "clearGoal" | "check";

/** Sent only for a blindfold round, which studies notation instead of the board; a board round sends no mode. */
export type RoundMode = "blindfold";

export type RoundStartParams = { piece_count: number; memorize_time: number; round_source: RoundSource; round_mode?: RoundMode };

/**
 * The GA4 event contract. Round events carry the setting, the score and `round_source`, never `source`, which
 * GA4 reads as the session's traffic source. Lab events carry counts and fixed ids only, never positions,
 * squares, round ids, dates or streak lengths, which the privacy page promises.
 */
export type FunnelEvent =
  | {
      name: "round_start";
      params: RoundStartParams;
    }
  /** Once per round from a link, when its one-line rule and Start show; its round_start follows on Start. */
  | {
      name: "round_intro_view";
      params: RoundStartParams;
    }
  | {
      name: "round_complete";
      params: {
        piece_count: number;
        memorize_time: number;
        correct_pieces: number;
        accuracy: number;
        round_source: RoundSource;
        round_mode?: RoundMode;
        /** The result view the round was reviewed in. Sent by game rounds only; the homepage calibration has no toggle. */
        result_view?: ResultView;
      };
    }
  /** The player switched the result screen between side by side and one board. */
  | {
      name: "result_view_select";
      params: { result_view: ResultView };
    }
  | {
      name: "score_submit";
      params: { difficulty: LeaderboardDifficulty | typeof DAILY_BOARD; piece_count: number; round_mode?: RoundMode };
    }
  | {
      name: "article_like";
      params: { slug: string };
    }
  | {
      name: "article_tile_click";
      params: { slug: string; action: "read" | "drill" | "drill_original" };
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
  /** The home intro played by itself, on a first visit. Never why it did not play for anyone else. */
  | {
      name: "home_intro_shown";
      params: Record<string, never>;
    }
  /** The home intro played again from the hero's replay link. */
  | {
      name: "home_intro_replayed";
      params: Record<string, never>;
    }
  /** Skip or Esc ended the intro, at this beat. */
  | {
      name: "home_intro_skipped";
      params: { beat: BeatId; play: IntroPlay };
    }
  | {
      name: "home_intro_completed";
      params: { play: IntroPlay };
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
    }
  /** A shop link followed from a guide. GA4's page_location already names the guide. */
  | {
      name: "affiliate_click";
      params: { store: "amazon" };
    }
  /** The daily board's calendar file was downloaded. Only where the button was, never the visitor's time zone. */
  | {
      name: "reminder_set";
      params: { surface: ReminderSurface };
    };

/** Where a reminder button sits: under the result screen's tomorrow line, on the dashboard, or on /daily. */
export type ReminderSurface = "result" | "dashboard" | "daily";

/** Whether an intro event belongs to the first-visit play or to a replay. */
export type IntroPlay = "first" | "replay";

export type LearnSearchSurface = "hub" | "server";

export type ShareMethod = "native" | "download" | "copy_image" | "copy" | "post";

export type ShareParams = { method: Exclude<ShareMethod, "post"> } | { method: "post"; network: ShareNetwork };

/** Where a share dialog opens, and the event it reports under: each surface keeps its own name, so neither one's counts need a custom dimension to read apart. */
export const SHARE_EVENTS = { dashboard: "lab_dashboard_share", result: "result_share" } as const satisfies Record<string, FunnelEvent["name"]>;

export type ShareSurface = keyof typeof SHARE_EVENTS;

/**
 * The few events Databuddy builds its goals and funnel from: a round started, a round finished (its first per
 * visitor is the first successful use), and a score sent to a leaderboard or the daily board. Accuracy and the
 * recalled count stay with GA4 so each property keeps few values.
 */
function databuddyEvent(event: FunnelEvent): [string, Record<string, string | number>] | null {
  switch (event.name) {
    case "round_start": {
      const { piece_count, memorize_time, round_source } = event.params;
      return ["round_started", { piece_count, memorize_time, source: round_source }];
    }
    case "round_complete": {
      const { piece_count, memorize_time, round_source } = event.params;
      return ["round_completed", { piece_count, memorize_time, source: round_source }];
    }
    case "score_submit":
      return ["score_submitted", event.params];
    default:
      return null;
  }
}

export function trackEvent(event: FunnelEvent): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag("event", event.name, event.params);
  // The tracker loads only on production; without it, track() would queue the call and poll for the script.
  const mirrored = databuddyEvent(event);
  if (mirrored && isTrackerAvailable()) track(...mirrored);
}

/** Keeps the player's result view on every later GA4 event, so reports can split any event by it. */
export function rememberResultView(resultView: ResultView): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("set", "user_properties", { result_view: resultView });
}
