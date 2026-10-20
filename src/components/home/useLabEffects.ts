"use client";

import { useEffect, useState } from "react";
import { REDUCED_MOTION_QUERY } from "@/components/articles/articleFlight";

/** The site-wide games-played count: still loading, known, or not available (no Supabase, a failed request). */
export type TotalPlays =
  | { readonly status: "loading" }
  | { readonly status: "known"; readonly plays: number }
  | { readonly status: "unavailable" };

const UNAVAILABLE: TotalPlays = { status: "unavailable" };

async function fetchTotalPlays(): Promise<TotalPlays> {
  try {
    const response = await fetch("/api/game-stats?metric=total_plays");
    if (!response.ok) return UNAVAILABLE;
    const data = await response.json();
    const raw = data?.data?.metric_value;
    // Postgres bigint columns can arrive as numeric strings.
    const plays = raw === undefined || raw === null ? NaN : Number(raw);
    return Number.isFinite(plays) ? { status: "known", plays } : UNAVAILABLE;
  } catch {
    return UNAVAILABLE;
  }
}

const keepKnownCountOnFailure = (current: TotalPlays, next: TotalPlays): TotalPlays =>
  next.status === "unavailable" && current.status === "known" ? current : next;

export function useTotalPlays(initialPlays?: number): TotalPlays {
  const [totalPlays, setTotalPlays] = useState<TotalPlays>(() =>
    initialPlays === undefined ? { status: "loading" } : { status: "known", plays: initialPlays },
  );

  useEffect(() => {
    let cancelled = false;
    fetchTotalPlays().then((result) => {
      if (cancelled) return;
      setTotalPlays((current) => keepKnownCountOnFailure(current, result));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return totalPlays;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
