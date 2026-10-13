"use client";

import { useTranslations } from "next-intl";
import { timeLeftOf } from "@/hooks/useDailyState";
import { useTimeLeftText } from "@/hooks/useTimeLeftText";

export function useResetsIn(now: number | null): string | null {
  const t = useTranslations("dailyEntry");
  const timeLeft = useTimeLeftText();
  if (now === null) return null;
  return t("next", { timeLeft: timeLeft(timeLeftOf(now)) });
}
