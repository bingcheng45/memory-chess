"use client";

import { useTranslations } from "next-intl";
import { msToNextUtcDay } from "@/lib/lab/daily";

/** Time left until the next board, or null on the server, which has no clock of the player's. */
export function useResetsIn(now: number | null): string | null {
  const t = useTranslations("daily.round");
  if (now === null) return null;
  const left = Math.floor(msToNextUtcDay(now) / 60_000);
  const hours = Math.floor(left / 60);
  const minutes = left % 60;
  return hours === 0 ? t("resetsInMinutes", { minutes }) : t("resetsIn", { hours, minutes });
}
