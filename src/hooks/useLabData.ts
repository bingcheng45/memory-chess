"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deriveLab, type LabInput, type LabResults } from "@/lib/lab/metrics";
import { localDayOf, type RoundRecord } from "@/lib/lab/record";
import { onLabChange } from "@/lib/lab/recordSync";
import { labStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, type LabSummary } from "@/lib/lab/summary";

export type LabStorageState = "loading" | "available" | "unavailable";

interface LabSnapshot {
  readonly storage: LabStorageState;
  readonly records: readonly RoundRecord[];
  readonly summary: LabSummary;
  readonly lastBackup: number | null;
  /** The client's local day, "" until storage has been read, so the server never renders date-based text. */
  readonly today: string;
}

export interface LabData extends LabSnapshot {
  reload(): Promise<void>;
}

const LOADING: LabSnapshot = { storage: "loading", records: [], summary: EMPTY_SUMMARY, lastBackup: null, today: "" };

async function readLab(): Promise<Partial<LabSnapshot> | null> {
  const store = labStore();
  if (!store) return null;
  const available = await store.isAvailable();
  const found = { storage: available ? "available" : "unavailable", today: localDayOf(new Date()) } as const;
  if (!available) return found;
  const [records, summary] = await Promise.all([store.listRounds(), store.readSummary()]);
  return { ...found, records, summary, lastBackup: store.readLastBackup() };
}

/**
 * The lab record on this device, kept fresh when this tab or another one
 * changes it. Nothing here depends on the home page, so any screen can load
 * it lazily.
 */
export function useLabData(): LabData {
  const [snapshot, setSnapshot] = useState<LabSnapshot>(LOADING);
  const request = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    let live = true;
    let requested = 0;
    let answered = 0;
    let running: Promise<void> | null = null;
    let missedWhileHidden = false;

    // One read at a time: a change during a read makes its answer stale, so it is dropped and the record read once more.
    const readUntilCurrent = async () => {
      try {
        while (live && answered < requested) {
          const asked = requested;
          const next = await readLab();
          answered = asked;
          if (live && next && asked === requested) setSnapshot((previous) => ({ ...previous, ...next }));
        }
      } finally {
        running = null;
      }
    };
    request.current = () => {
      requested += 1;
      running ??= readUntilCurrent();
      return running;
    };
    const onChange = () => {
      if (document.visibilityState === "hidden") missedWhileHidden = true;
      else void request.current();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden" || !missedWhileHidden) return;
      missedWhileHidden = false;
      void request.current();
    };

    void request.current();
    const stopListening = onLabChange(onChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      live = false;
      stopListening();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const reload = useCallback(() => request.current(), []);
  return { ...snapshot, reload };
}

export function useLabResults({ records, summary, today }: LabInput): LabResults {
  return useMemo(() => deriveLab({ records, summary, today }), [records, summary, today]);
}
