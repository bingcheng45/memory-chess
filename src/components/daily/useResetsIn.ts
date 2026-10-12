"use client";

import { useTranslations } from "next-intl";
import { msToNextUtcDay } from "@/lib/lab/daily";

/** Time left until the next board, or null on the server, which has no clock of the player's. */
export function useResetsIn(now: number | null): string | null {
  const t = useTranslations("daily.round");
  if (now === null) return null;
  const minutes = Math.floor(msToNextUtcDay(now) / 60_000);
  return t("resetsIn", { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
}
