"use client";

import { useEffect, useMemo, useState } from "react";
import type { LabInput } from "@/lib/lab/engine";
import { deriveLab, type LabResults } from "@/lib/lab/metrics";
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
}

const LOADING: LabData = { storage: "loading", records: [], summary: EMPTY_SUMMARY, lastBackup: null, today: "" };

async function readLab(): Promise<Partial<LabData> | null> {
  const store = labStore();
  if (!store) return null;
  const available = await store.isAvailable();
  const found = { storage: available ? "available" : "unavailable", today: localDayOf(new Date()) } as const;
  if (!available) return found;
  // The summary is read after the rounds: a write lands in the log before the summary, so this order never sees a
  // round the summary has not counted.
  const records = await store.listRounds();
  const summary = await store.readSummary();
  return { ...found, records, summary, lastBackup: store.readLastBackup() };
}

/**
 * The lab record on this device, kept fresh when this tab or another one
 * changes it. Nothing here depends on the home page, so any screen can load
 * it lazily.
 */
export function useLabData(): LabData {
  const [data, setData] = useState<LabData>(LOADING);

  useEffect(() => {
    let live = true;
    let requested = 0;
    let answered = 0;
    let reading = false;
    let missedWhileHidden = false;

    // One read at a time: a change during a read makes its answer stale, so it is dropped and the record read once more.
    const readUntilCurrent = async () => {
      reading = true;
      try {
        while (live && answered < requested) {
          const asked = requested;
          const next = await readLab();
          answered = asked;
          if (live && next && asked === requested) setData((previous) => ({ ...previous, ...next }));
        }
      } finally {
        reading = false;
      }
    };
    const reload = () => {
      requested += 1;
      if (!reading) void readUntilCurrent();
    };
    const onChange = () => {
      if (document.visibilityState === "hidden") missedWhileHidden = true;
      else reload();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden" || !missedWhileHidden) return;
      missedWhileHidden = false;
      reload();
    };

    reload();
    const stopListening = onLabChange(onChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      live = false;
      stopListening();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return data;
}

export function useLabResults({ records, summary, today, plan = null, target = null }: LabInput): LabResults {
  return useMemo(() => deriveLab({ records, summary, today, plan, target }), [records, summary, today, plan, target]);
}
