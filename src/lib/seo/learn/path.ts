import type { LearnGroupPages } from ".";
import { ctaHref } from "./links";
import type { CtaTarget, LearnGroupId } from "./schema";

export type StageCta = { readonly label: string; readonly href: string };

/** Written per stage: each line appears only on the hub, so none can repeat across pages. */
const STAGE_CTAS: Partial<Record<LearnGroupId, { readonly label: string; readonly target: CtaTarget }>> = {
  foundations: {
    label: "Check where you stand first: play a 6-piece round",
    target: { kind: "game", label: "Play 6 pieces, 10 seconds", pieceCount: 6, memorizeTime: 10 },
  },
  "board-vision": {
    label: "Watch your recent accuracy as the scan becomes a habit",
    target: { kind: "stat", tile: "recentAccuracy", label: "Recent accuracy" },
  },
  memory: {
    label: "Track your memory span as you climb the ladder",
    target: { kind: "stat", tile: "span", label: "Memory span" },
  },
};

export type LearnStage = LearnGroupPages & { readonly number: number; readonly cta?: StageCta };

export type LearnShelves = { readonly stages: readonly LearnStage[]; readonly offPath: readonly LearnGroupPages[] };

const isOnPath = ({ group }: LearnGroupPages) => group.placement === "path";

export function pathStages(groups: readonly LearnGroupPages[]): LearnShelves {
  const stages = groups.filter(isOnPath).map((entry, index) => {
    const cta = STAGE_CTAS[entry.group.id];
    return { ...entry, number: index + 1, ...(cta ? { cta: { label: cta.label, href: ctaHref(cta.target) } } : {}) };
  });
  return { stages, offPath: groups.filter((entry) => !isOnPath(entry)) };
}

export const stageGuideNumber = (stage: LearnStage, index: number) => `${stage.number}.${index + 1}`;
