import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import { playHref } from "@/lib/game/roundLink";

export const QUICK_START_HREF = playHref(DEFAULT_PRESET.pieceCount, DEFAULT_PRESET.memorizeTime, "home_quick");

export const insightRigHref = (pieceCount: number, memorizeSeconds: number) => playHref(pieceCount, memorizeSeconds, "insight");
