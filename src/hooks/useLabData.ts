"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveLab, type LabInput, type LabResults } from "@/lib/lab/metrics";
import { localDayOf, type RoundRecord } from "@/lib/lab/record";
import { onLabChange } from "@/lib/lab/recordSync";
import { labStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, type LabSummary } from "@/lib/lab/summary";

export type LabStorageState = "loading" | "available" | "unavailable";

export interface LabData {
  readonly storage: LabStorageState;
  readonly records: readonly RoundRecord[];
  readonly summary: LabSummary;
  readonly lastBackup: number | null;
  /** The client's local day, "" until storage has been read, so the server never renders date-based text. */
  readonly today: string;
  reload(): Promise<void>;
}

/**
 * The lab record on this device, kept fresh when this tab or another one
 * changes it. Nothing here depends on the home page, so any screen can load
 * it lazily.
 */
export function useLabData(): LabData {
  const [storage, setStorage] = useState<LabStorageState>("loading");
  const [records, setRecords] = useState<readonly RoundRecord[]>([]);
  const [summary, setSummary] = useState<LabSummary>(EMPTY_SUMMARY);
  const [lastBackup, setLastBackup] = useState<number | null>(null);
  const [today, setToday] = useState("");

  const reload = useCallback(async () => {
    const store = labStore();
    if (!store) return;
    const available = await store.isAvailable();
    setStorage(available ? "available" : "unavailable");
    setToday(localDayOf(new Date()));
    if (!available) return;
    const [rounds, lifetime] = await Promise.all([store.listRounds(), store.readSummary()]);
    setRecords(rounds);
    setSummary(lifetime);
    setLastBackup(store.readLastBackup());
  }, []);

  useEffect(() => {
    void reload();
    return onLabChange(() => void reload());
  }, [reload]);

  return { storage, records, summary, lastBackup, today, reload };
}

/** Every metric for the record, recomputed only when the rounds, the summary or the day change. */
export function useLabResults({ records, summary, today }: LabInput): LabResults {
  return useMemo(() => deriveLab({ records, summary, today }), [records, summary, today]);
}
