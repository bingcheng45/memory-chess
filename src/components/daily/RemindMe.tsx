"use client";

import { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { trackEvent, type ReminderSurface } from "@/lib/analytics/events";
import { msToNextUtcDay } from "@/lib/lab/daily";
import { REMINDER_FILENAME, reminderIcs } from "./reminder";
import "./remind.css";

function download(file: string, name: string): void {
  const url = URL.createObjectURL(new Blob([file], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Saves a calendar event that repeats daily when the board opens. Nothing is sent anywhere but the count of presses. */
export function RemindMe({ surface }: { surface: ReminderSurface }) {
  const t = useTranslations("dailyEntry");
  const format = useFormatter();
  const noteId = useId();
  const [saved, setSaved] = useState(false);

  function remind() {
    const now = Date.now();
    const opens = now + msToNextUtcDay(now);
    const time = format.dateTime(opens, { hour: "numeric", minute: "2-digit", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    download(reminderIcs(now, { title: t("remindTitle"), description: t("remindDescription", { time }) }), REMINDER_FILENAME);
    setSaved(true);
    trackEvent({ name: "reminder_set", params: { surface } });
  }

  return (
    <div className="remind-me" data-remind-surface={surface}>
      <button type="button" className="remind-me-button" aria-describedby={noteId} onClick={remind}>
        {t("remindButton")}
      </button>
      <span id={noteId} className="remind-me-note">
        {t("remindNote")}
      </span>
      <p className="remind-me-done" aria-live="polite">
        {saved ? t("remindDone") : ""}
      </p>
    </div>
  );
}
