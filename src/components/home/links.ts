import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { playHref } from "@/lib/game/roundLink";

export const QUICK_START_HREF = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime, "home_quick");

/** The same round from Play in the intro layer, told apart only by its round_source. */
export const INTRO_START_HREF = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime, "home_intro");
