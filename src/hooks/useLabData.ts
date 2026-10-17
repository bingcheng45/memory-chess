"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import type { LabInput } from "@/lib/lab/engine";
import { deriveLab, type LabResults } from "@/lib/lab/metrics";
import { localDayOf, type RoundRecord } from "@/lib/lab/record";
import { onLabChange } from "@/lib/lab/recordSync";
import { labStore, type LabStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, type LabSummary } from "@/lib/lab/summary";

export type LabStorageState = "loading" | "available" | "unavailable";

export interface LabSummaryData {
  readonly storage: LabStorageState;
  readonly summary: LabSummary;
  /** The client's local day, "" until storage has been read, so the server never renders date-based text. */
  readonly today: string;
}

export interface LabData extends LabSummaryData {
  readonly records: readonly RoundRecord[];
  readonly lastBackup: number | null;
}

type ReadOpen<T> = (store: LabStore) => Promise<Partial<T>>;

const SUMMARY_LOADING: LabSummaryData = { storage: "loading", summary: EMPTY_SUMMARY, today: "" };
const LOADING: LabData = { ...SUMMARY_LOADING, records: [], lastBackup: null };

/** Null when this browser has no store, which leaves the data loading. */
async function readLab<T extends LabSummaryData>(readOpen: ReadOpen<T>): Promise<Partial<T> | null> {
  const store = labStore();
  if (!store) return null;
  const available = await store.isAvailable();
  const found = { storage: available ? "available" : "unavailable", today: localDayOf(new Date()) } as const;
  if (!available) return found as Partial<T>;
  return { ...found, ...(await readOpen(store)) };
}

const readWholeRecord: ReadOpen<LabData> = async (store) => {
  // The summary is read after the rounds: a write lands in the log before the summary, so this order never sees a
  // round the summary has not counted.
  const records = await store.listRounds();
  const summary = await store.readSummary();
  return { records, summary, lastBackup: store.readLastBackup() };
};

const readSummaryAlone: ReadOpen<LabSummaryData> = async (store) => ({ summary: await store.readSummary() });

/** What `readOpen` reads, read again whenever this tab or another one changes the record. */
function useLabRead<T extends LabSummaryData>(readOpen: ReadOpen<T>, loading: T): T {
  const [data, setData] = useState<T>(loading);

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
          const next = await readLab(readOpen);
          answered = asked;
          // A transition lets React render a long record in slices that yield to input, instead of one long task.
          if (live && next && asked === requested) startTransition(() => setData((previous) => ({ ...previous, ...next })));
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
  }, [readOpen]);

  return data;
}

/**
 * The lab record on this device, kept fresh when this tab or another one
 * changes it. Nothing here depends on the home page, so any screen can load
 * it lazily.
 */
export function useLabData(): LabData {
  return useLabRead(readWholeRecord, LOADING);
}

/** The lifetime summary alone, which lives beside the log and is read without it. */
export function useLabSummary(): LabSummaryData {
  return useLabRead(readSummaryAlone, SUMMARY_LOADING);
}

export function useLabResults({ records, summary, today, plan = null, target = null }: LabInput): LabResults {
  return useMemo(() => deriveLab({ records, summary, today, plan, target }), [records, summary, today, plan, target]);
}
