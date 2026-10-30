"use client";

import { useCallback, useMemo, useState } from "react";
import { useLabData, type LabData } from "@/hooks/useLabData";
import { trackEvent } from "@/lib/analytics/events";
import { announceLabChange } from "@/lib/lab/recordSync";
import { labStore } from "@/lib/lab/storage";
import { buildExport, readImportFile, type PlayerStanding } from "@/lib/lab/transfer";
import { saveBlob } from "@/lib/saveBlob";

export type ImportOutcome =
  | {
      readonly ok: true;
      readonly added: number;
      readonly rejected: number;
      readonly overCap: number;
      /** Lifetime totals from the file: restored, ignored because this record already had rounds, or unreadable. */
      readonly summary: "restored" | "ignored" | "dropped" | null;
      /** The rating and streak from the file: restored, kept because this device has played more rated rounds, or unreadable. */
      readonly player?: "restored" | "kept" | "dropped" | null;
    }
  | { readonly ok: false; readonly tooLarge: boolean };

export interface LabRecord extends LabData {
  download(): Promise<void>;
  importFile(file: File): Promise<ImportOutcome>;
}

const EXPORT_FILE = "memory-chess-lab-record.json";

// Loaded on demand so the game store stays out of the home bundle until a backup or a restore needs it.
const gameStore = () => import("@/lib/store/gameStore");

async function readStanding(): Promise<PlayerStanding | undefined> {
  try {
    const { useGameStore, standingOf } = await gameStore();
    return standingOf(useGameStore.getState());
  } catch {
    return undefined;
  }
}

async function restoreStanding(imported: PlayerStanding): Promise<"restored" | "kept" | "dropped"> {
  try {
    const { useGameStore } = await gameStore();
    return useGameStore.getState().restoreStanding(imported) ? "restored" : "kept";
  } catch {
    return "dropped";
  }
}

export function useLabRecord(): LabRecord {
  const data = useLabData();
  const [exportedAt, setExportedAt] = useState<number | null>(null);

  const download = useCallback(async () => {
    const store = labStore();
    if (!store) return;
    // Summary first: a round saved between the two reads is then in the file but uncounted, never counted but missing.
    const lifetime = await store.readSummary();
    const rounds = await store.listRounds();
    const standing = await readStanding();
    const now = Date.now();
    saveBlob(new Blob([JSON.stringify(buildExport(rounds, now, lifetime, standing))], { type: "application/json" }), EXPORT_FILE);
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
        const player = parsed.player === null || parsed.player === "dropped" ? parsed.player : await restoreStanding(parsed.player);
        return { ok: true, added, rejected: parsed.rejected, overCap: parsed.overCap, summary, player };
      } catch {
        return { ok: false, tooLarge: false };
      }
    },
    [],
  );

  return useMemo(() => ({ ...data, lastBackup: exportedAt ?? data.lastBackup, download, importFile }), [data, exportedAt, download, importFile]);
}
