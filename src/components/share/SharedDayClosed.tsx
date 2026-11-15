"use client";

import { useNow } from "@/components/home/DailyResetsIn";
import { utcDayOf } from "@/lib/lab/daily";

/** A card's page is cached from its first visit, so whether its day is still today is read in the browser, never in the cached HTML. */
export function SharedDayClosed({ day }: { day: string }) {
  const now = useNow();
  if (now === null || utcDayOf(now) === day) return null;
  return <p>That day&apos;s board has closed. Today&apos;s board is open now.</p>;
}
