/**
 * §06 in reading order: what a player wants to know first comes first. Figure numbers are positions in PANEL_ORDER,
 * so a panel inserted into a row renumbers every figure after it. Programs and tools rows hold no numbered figure.
 */
export const PANEL_ROWS = [
  { row: "reading", panels: ["span", "piecesHeld", "trend", "speed"] },
  { row: "habit", panels: ["streak", "curve"] },
  { row: "diagnosis", panels: ["missMap", "typeRecall"] },
  { row: "programs", panels: [] },
  { row: "compare", panels: ["bests", "board"] },
  { row: "tools", panels: [] },
] as const;

export type PanelRow = (typeof PANEL_ROWS)[number]["row"];
export type PanelId = (typeof PANEL_ROWS)[number]["panels"][number];

export const PANEL_ORDER: readonly PanelId[] = PANEL_ROWS.flatMap(({ panels }) => panels);

/** "6.3" for the third figure of section 6. */
export const figureNumber = (section: number, panel: PanelId) => `${section}.${PANEL_ORDER.indexOf(panel) + 1}`;
