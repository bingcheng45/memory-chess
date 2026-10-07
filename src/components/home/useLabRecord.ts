"use client";

import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { localDayOf, type RoundRecordV1 } from "@/lib/lab/record";
import { LAB_RECORD_CHANGED } from "@/lib/lab/recordRound";
import { labStore } from "@/lib/lab/storage";
import { EMPTY_SUMMARY, type LabSummary } from "@/lib/lab/summary";
import { buildExport, readImportFile } from "@/lib/lab/transfer";

export type LabStorageState = "loading" | "available" | "unavailable";

export type ImportOutcome =
  | { readonly ok: true; readonly added: number; readonly rejected: number; readonly overCap: number }
  | { readonly ok: false; readonly tooLarge: boolean };

export interface LabRecord {
  readonly storage: LabStorageState;
  readonly records: readonly RoundRecordV1[];
  readonly summary: LabSummary;
  readonly lastBackup: number | null;
  readonly today: string;
  download(): Promise<void>;
  importFile(file: File): Promise<ImportOutcome>;
}

const EXPORT_FILE = "memory-chess-lab-record.json";

/** The player's on-device lab record, re-read whenever a round is saved. */
export function useLabRecord(): LabRecord {
  const [storage, setStorage] = useState<LabStorageState>("loading");
  const [records, setRecords] = useState<readonly RoundRecordV1[]>([]);
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
    const onChange = () => void reload();
    window.addEventListener(LAB_RECORD_CHANGED, onChange);
    return () => window.removeEventListener(LAB_RECORD_CHANGED, onChange);
  }, [reload]);

  const download = useCallback(async () => {
    const store = labStore();
    if (!store) return;
    const rounds = await store.listRounds();
    const now = Date.now();
    const blob = new Blob([JSON.stringify(buildExport(rounds, now))], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = EXPORT_FILE;
    link.click();
    URL.revokeObjectURL(url);
    store.markBackedUp(now);
    setLastBackup(now);
    trackEvent({ name: "lab_export", params: { rounds: rounds.length } });
  }, []);

  const importFile = useCallback(
    async (file: File): Promise<ImportOutcome> => {
      const store = labStore();
      if (!store) return { ok: false, tooLarge: false };
      const parsed = await readImportFile(file);
      if (!parsed.ok) return { ok: false, tooLarge: parsed.reason === "too-large" };
      try {
        const added = await store.mergeRounds(parsed.rounds);
        trackEvent({ name: "lab_import", params: { added, rejected: parsed.rejected } });
        await reload();
        return { ok: true, added, rejected: parsed.rejected, overCap: parsed.overCap };
      } catch {
        return { ok: false, tooLarge: false };
      }
    },
    [reload],
  );

  return { storage, records, summary, lastBackup, today, download, importFile };
}
