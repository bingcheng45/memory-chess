"use client";

import { useEffect, useState } from "react";
import type { DailyEntry } from "@/lib/lab/entries";
import { checkStanding } from "@/lib/leaderboard/standingClient";
import type { Standing } from "@/lib/leaderboard/standing";
import type { LeaderboardEntry } from "@/types/leaderboard";

export type DailyRows = { readonly state: "loading" } | { readonly state: "ready"; readonly rows: readonly LeaderboardEntry[] } | { readonly state: "failed" };

export function useDailyRows(day: string | null, version: number): DailyRows {
  const [rows, setRows] = useState<DailyRows>({ state: "loading" });

  useEffect(() => {
    if (day === null) return;
    let live = true;
    fetch(`/api/leaderboard?difficulty=daily&daily_day=${day}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { data?: LeaderboardEntry[]; error?: string }) => {
        if (live) setRows(body.error || !Array.isArray(body.data) ? { state: "failed" } : { state: "ready", rows: body.data });
      })
      .catch(() => {
        if (live) setRows({ state: "failed" });
      });
    return () => {
      live = false;
    };
  }, [day, version]);

  return rows;
}

export function useDailyStanding(joined: DailyEntry | null): Standing | null {
  const [standing, setStanding] = useState<Standing | null>(null);
  const id = joined?.id ?? null;

  useEffect(() => {
    setStanding(null);
    if (id === null) return;
    let live = true;
    void checkStanding(id, "world").then((check) => {
      if (live && check.kind === "ranked") setStanding(check.standing);
    });
    return () => {
      live = false;
    };
  }, [id]);

  return standing;
}
