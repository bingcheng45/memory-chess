import { useEffect } from "react";
import type { RoundState } from "@/lib/round/round";

/** Ends a round's study when its study time runs out. Done ends it sooner through the same action. */
export function useStudyDeadline(state: RoundState, onStudyEnded: (now: number) => void): void {
  const study = state.phase === "study" ? state : null;
  const startedAt = study?.startedAt ?? null;
  const studyMs = study?.config.studyMs ?? 0;

  useEffect(() => {
    if (startedAt === null) return;
    const left = Math.max(0, studyMs - (performance.now() - startedAt));
    const timer = setTimeout(() => onStudyEnded(performance.now()), left);
    return () => clearTimeout(timer);
  }, [startedAt, studyMs, onStudyEnded]);
}
