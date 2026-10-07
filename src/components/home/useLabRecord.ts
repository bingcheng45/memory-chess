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
  | {
      readonly ok: true;
      readonly added: number;
      readonly rejected: number;
      readonly overCap: number;
      /** Lifetime totals from the file: restored, ignored because this record already had rounds, or unreadable. */
      readonly summary: "restored" | "ignored" | "dropped" | null;
    }
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
const REVOKE_AFTER_MS = 30_000;

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
    // Summary first: a round saved between the two reads is then in the file but uncounted, never counted but missing.
    const lifetime = await store.readSummary();
    const rounds = await store.listRounds();
    const now = Date.now();
    const blob = new Blob([JSON.stringify(buildExport(rounds, now, lifetime))], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = EXPORT_FILE;
    // Firefox ignores a click on a detached link, and Safari can still be reading the blob after click returns.
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
    // Records that an export was started; whether the file was saved is up to the browser.
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
        const exported = typeof parsed.summary === "object" ? parsed.summary : null;
        const restored = exported && (await store.restore(parsed.rounds, exported));
        const added = restored ?? (await store.mergeRounds(parsed.rounds));
        trackEvent({ name: "lab_import", params: { added, rejected: parsed.rejected } });
        await reload();
        const summary = parsed.summary === "dropped" ? "dropped" : exported && (restored === null ? "ignored" : "restored");
        return { ok: true, added, rejected: parsed.rejected, overCap: parsed.overCap, summary };
      } catch {
        return { ok: false, tooLarge: false };
      }
    },
    [reload],
  );

  return { storage, records, summary, lastBackup, today, download, importFile };
}
