import { articlePath } from "@/lib/articles/paths";
import { playHref } from "@/lib/game/roundLink";
import type { CtaTarget, GameSetup } from "./schema";

export const guidePath = (slug: string) => `/learn/${slug}`;

export const groupAnchor = (groupId: string) => `/learn#${groupId}`;

export const guideRoundHref = ({ pieceCount, memorizeTime }: GameSetup) => playHref(pieceCount, memorizeTime, "guide_cta");

/** The dashboard tile a stat call to action opens. DashboardTiles gives each tile this id. */
export const dashboardTileHref = (tile: string) => `/dashboard#tile-${tile}`;

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
