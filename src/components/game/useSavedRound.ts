"use client";

import { useEffect, useState } from "react";
import { useLabData, type LabData } from "@/hooks/useLabData";
import type { RoundRecord } from "@/lib/lab/record";
import { summaryCounts } from "@/lib/lab/resultCard";

export const RESULT_LAB_WAIT_MS = 3000;

export type SavedRound =
  | { readonly state: "waiting" }
  | { readonly state: "gaveUp" }
  | { readonly state: "found"; readonly round: RoundRecord; readonly data: LabData };

/**
 * The round just played, once the record holds it and the summary has counted it. When it is not there in time
 * (storage that will not open, a failed or held write) this gives up for good, so a round that lands later cannot
 * redraw the screen.
 */
export function useSavedRound(roundId: string): SavedRound {
  const data = useLabData();
  const [waited, setWaited] = useState(false);
  const saved = data.today ? data.records.find(({ id }) => id === roundId) : undefined;
  const round = saved && summaryCounts(data.summary, saved) ? saved : undefined;
  const found = round !== undefined;

  useEffect(() => {
    if (found) return;
    const timer = setTimeout(() => setWaited(true), RESULT_LAB_WAIT_MS);
    return () => clearTimeout(timer);
  }, [found]);

  if (data.storage === "unavailable" || waited) return { state: "gaveUp" };
  return round ? { state: "found", round, data } : { state: "waiting" };
}
