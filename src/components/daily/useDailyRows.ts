"use client";

import { useEffect, useState } from "react";
import type { DailyEntry } from "@/lib/lab/entries";
import { checkStanding } from "@/lib/leaderboard/standingClient";
import type { Standing } from "@/lib/leaderboard/standing";
import type { LeaderboardEntry } from "@/types/leaderboard";

export type DailyRows =
  | { readonly state: "loading" }
  /** playedLike is the rating the board played at, or null before enough players have joined it. */
  | { readonly state: "ready"; readonly rows: readonly LeaderboardEntry[]; readonly playedLike: number | null }
  | { readonly state: "failed" };

export function useDailyRows(day: string | null, version: number): DailyRows {
  const [rows, setRows] = useState<DailyRows>({ state: "loading" });

  useEffect(() => {
    if (day === null) return;
    let live = true;
    const read = (query: string) => fetch(`/api/leaderboard?difficulty=daily${query}`, { cache: "no-store" });
    // A device whose clock is off names a day the server will not read, so it shows the server's today instead.
    read(`&daily_day=${day}`)
      .then((response) => (response.status === 400 ? read("") : response))
      .then((response) => response.json())
      .then((body: { data?: LeaderboardEntry[]; playedLike?: unknown; error?: string }) => {
        if (!live) return;
        const playedLike = typeof body.playedLike === "number" && Number.isFinite(body.playedLike) ? body.playedLike : null;
        setRows(body.error || !Array.isArray(body.data) ? { state: "failed" } : { state: "ready", rows: body.data, playedLike });
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
