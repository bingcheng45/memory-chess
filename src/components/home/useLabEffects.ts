"use client";

import { useEffect, useState } from "react";
import { REDUCED_MOTION_QUERY } from "@/components/articles/articleFlight";

/** Total rounds played site-wide, or null until (and unless) the stat loads. */
export function useTotalPlays(): number | null {
  const [totalPlays, setTotalPlays] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/game-stats?metric=total_plays");
        if (!response.ok) return;
        const data = await response.json();
        const raw = data?.data?.metric_value;
        // Postgres bigint columns can arrive as numeric strings.
        const plays = raw === undefined || raw === null ? NaN : Number(raw);
        if (Number.isFinite(plays) && !cancelled) setTotalPlays(plays);
      } catch {
        // Stats are optional; keep the homepage usable when local Supabase env vars are absent.
      }
    }

    load();
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
