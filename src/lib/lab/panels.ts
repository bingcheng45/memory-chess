/**
 * §06 in reading order: what a player wants to know first comes first. Figure numbers are positions in PANEL_ORDER,
 * so a panel inserted into a row renumbers every figure after it. Programs and tools rows hold no numbered figure.
 */
export const PANEL_ROWS = [
  { row: "reading", panels: ["span", "piecesHeld", "trend", "speed"] },
  { row: "habit", panels: ["streak", "curve", "notebook"] },
  { row: "diagnosis", panels: ["missMap", "typeRecall", "insights"] },
  { row: "programs", panels: [] },
  { row: "compare", panels: ["bests", "board"] },
  { row: "tools", panels: [] },
] as const;

export type PanelRow = (typeof PANEL_ROWS)[number]["row"];
/** Rows drawn by their own component. Only a row with no panels is one, so a panel listed there fails to compile instead of never rendering. */
export type CustomRow = Extract<(typeof PANEL_ROWS)[number], { readonly panels: readonly [] }>["row"];
export type PanelId = (typeof PANEL_ROWS)[number]["panels"][number];

export const PANEL_ORDER: readonly PanelId[] = PANEL_ROWS.flatMap(({ panels }) => panels);

export const figureNumber = (section: number, panel: PanelId) => `${section}.${PANEL_ORDER.indexOf(panel) + 1}`;
