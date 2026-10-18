"use client";

import { useEffect, useState } from "react";
import { readDailyTop, type DailyBoardRead, type DailyTopRender } from "@/lib/daily/topTen";
import type { DailyEntry } from "@/lib/lab/entries";
import { checkStanding } from "@/lib/leaderboard/standingClient";
import type { Standing } from "@/lib/leaderboard/standing";
import type { LeaderboardEntry } from "@/types/leaderboard";

export type DailyRows =
  | { readonly state: "loading" }
  /** The board shown: today's, or yesterday's while nobody has joined today's yet. */
  | { readonly state: "ready"; readonly board: DailyBoardRead }
  | { readonly state: "failed" };

/** The page revalidates every minute, so a render older than this was served from a stale copy. */
const RENDER_FRESH_MS = 120_000;

async function readBoard(day: string, after: string | null): Promise<DailyBoardRead | null> {
  const read = (query: string) => fetch(`/api/leaderboard?difficulty=daily${query}`, { cache: "no-store" });
  try {
    // A device whose clock is off names a day the server will not read, so it shows the server's today instead.
    const named = await read(after === null ? `&daily_day=${day}` : `&daily_day=${day}&after=${after}`);
    const response = named.status === 400 ? await read("") : named;
    const body: { data?: LeaderboardEntry[]; playedLike?: unknown; error?: string } = await response.json();
    if (body.error || !Array.isArray(body.data)) return null;
    const playedLike = typeof body.playedLike === "number" && Number.isFinite(body.playedLike) ? body.playedLike : null;
    return { day, rows: body.data, playedLike };
  } catch {
    return null;
  }
}

/**
 * The rows the server rendered, read again only when they may be out of date: when this device has joined the day's
 * board (`after` is its row's id, which keeps the read past any cached copy made before the join), when the device's
 * day is not the one rendered, as at midnight UTC, or when the render is stale.
 */
export function useDailyRows(day: string | null, rendered: DailyTopRender, after: string | null): DailyRows {
  const [rows, setRows] = useState<DailyRows>(rendered.board === null ? { state: "loading" } : { state: "ready", board: rendered.board });

  useEffect(() => {
    if (day === null) return;
    const renderIsCurrent = rendered.board !== null && day === rendered.today && Date.now() - rendered.readAt < RENDER_FRESH_MS;
    if (after === null && renderIsCurrent) return;
    let live = true;
    void readDailyTop(day, (asked) => readBoard(asked, after)).then((board) => {
      if (live) setRows(board === null ? { state: "failed" } : { state: "ready", board });
    });
    return () => {
      live = false;
    };
  }, [day, after, rendered]);

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
