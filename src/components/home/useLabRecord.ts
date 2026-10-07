"use client";

import { useCallback, useState } from "react";
import { useLabData, type LabData } from "@/hooks/useLabData";
import { trackEvent } from "@/lib/analytics/events";
import { announceLabChange } from "@/lib/lab/recordSync";
import { labStore } from "@/lib/lab/storage";
import { buildExport, readImportFile } from "@/lib/lab/transfer";

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

export interface LabRecord extends LabData {
  download(): Promise<void>;
  importFile(file: File): Promise<ImportOutcome>;
}

const EXPORT_FILE = "memory-chess-lab-record.json";
const REVOKE_AFTER_MS = 30_000;

export function useLabRecord(): LabRecord {
  const data = useLabData();
  const [exportedAt, setExportedAt] = useState<number | null>(null);

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
    setExportedAt(now);
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
        if (restored !== null || added > 0) announceLabChange();
        const summary = parsed.summary === "dropped" ? "dropped" : exported && (restored === null ? "ignored" : "restored");
        return { ok: true, added, rejected: parsed.rejected, overCap: parsed.overCap, summary };
      } catch {
        return { ok: false, tooLarge: false };
      }
    },
    [],
  );

  return { ...data, lastBackup: exportedAt ?? data.lastBackup, download, importFile };
}
