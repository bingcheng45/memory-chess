"use client";

import { useTranslations } from "next-intl";
import type { TimeLeft } from "./useDailyState";

export function useTimeLeftText(): (left: TimeLeft) => string {
  const t = useTranslations("dailyEntry");
  return ({ hours, minutes }) => (hours > 0 ? t("hoursLeft", { hours, minutes }) : minutes > 0 ? t("minutesLeft", { minutes }) : t("underMinute"));
}
