import { articlePath } from "@/lib/articles/paths";
import { playHref } from "@/lib/game/roundLink";
import type { DashboardTileId } from "@/lib/lab/dashboard";
import { tileAnchor } from "@/lib/lab/tileAnchor";
import type { CtaTarget, GameSetup } from "./schema";

export const guidePath = (slug: string) => `/learn/${slug}`;

export const groupAnchor = (groupId: string) => `/learn#${groupId}`;

export const DAILY_PATH = "/daily";

export const guideRoundHref = ({ pieceCount, memorizeTime, blindfold }: GameSetup) => playHref(pieceCount, memorizeTime, "guide_cta", blindfold);

export const dashboardTileHref = (tile: DashboardTileId) => `/dashboard#${tileAnchor(tile)}`;

export function ctaHref(target: CtaTarget): string {
  switch (target.kind) {
    case "game":
      return guideRoundHref(target);
    case "article":
      return articlePath(target.slug);
    case "stat":
      return dashboardTileHref(target.tile);
  }
}

export const LEARN_SEARCH_PATH = "/learn/search";
export const LEARN_SEARCH_INDEX_PATH = "/api/learn/search-index";

export const learnSearchHref = (query: string) => `${LEARN_SEARCH_PATH}?${new URLSearchParams({ q: query })}`;
