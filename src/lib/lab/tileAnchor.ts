import type { DashboardTileId } from "./dashboard";

/** The id a dashboard tile, or its row in the unlocks list, carries, so a link can open it. */
export const tileAnchor = (id: DashboardTileId) => `tile-${id}`;
