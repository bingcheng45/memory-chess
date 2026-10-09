"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics/events";
import type { ReadingCard } from "@/lib/lab/readingCard";
import { LabReadingCard } from "./LabReadingCard";
import { useIsSafari } from "./useIsSafari";
import type { LabRecord } from "./useLabRecord";

type Notice = { readonly kind: "ok" | "error"; readonly text: string } | null;

export function LabRecordTools({ record, card }: { record: LabRecord; card: ReadingCard | null }) {
  const t = useTranslations("home.lab.record.tools");
  const format = useFormatter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const isSafari = useIsSafari();

  if (record.storage === "loading") return null;

  if (record.storage === "unavailable") {
    return (
      <div className="lab-tools" role="status">
        <p className="lab-tools-warn">{t("unavailable")}</p>
      </div>
    );
  }

  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = await record.importFile(file);
    setNotice(
      result.ok
        ? {
            kind: "ok",
            text: [
              t("imported", { added: result.added }),
              result.rejected > 0 ? t("skipped", { count: result.rejected }) : "",
              result.overCap > 0 ? t("overCap", { count: result.overCap }) : "",
              result.added > 0 && result.summary === "ignored" ? t("summaryIgnored") : "",
              result.added > 0 && result.summary === "dropped" ? t("summaryDropped") : "",
            ]
              .filter(Boolean)
              .join(" "),
          }
        : { kind: "error", text: result.tooLarge ? t("tooLarge") : t("importFailed") },
    );
  };

  const onBackupInterest = () => {
    setNotice({ kind: "ok", text: t("backupNoted") });
    trackEvent({ name: "lab_backup_interest", params: { rounds: record.summary.rounds } });
  };

  return (
    <div className="lab-tools">
      <div>
        <span className="lab-k">{t("title")}</span>
        <p className="lab-panel-desc">{t("body")}</p>
        <p className="lab-note">
          {record.lastBackup
            ? t("lastBackup", { date: format.dateTime(record.lastBackup, { dateStyle: "medium", timeStyle: "short" }) })
            : t("neverBackedUp")}
        </p>
        {isSafari && <p className="lab-note">{t("safari")}</p>}
      </div>
      <div className="lab-tools-actions">
        <button type="button" className="lab-btn lab-btn-secondary" onClick={() => void record.download()}>
          {t("download")}
        </button>
        <button type="button" className="lab-btn lab-btn-secondary" onClick={() => fileInput.current?.click()}>
          {t("import")}
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
        {/* aria-disabled rather than disabled, so the click still registers the interest. */}
        <button type="button" className="lab-btn lab-btn-secondary" aria-disabled="true" onClick={onBackupInterest}>
          {t("backup")}
        </button>
      </div>
      <p className="lab-note" role="status" data-kind={notice?.kind}>
        {notice?.text}
      </p>
      {card && <LabReadingCard card={card} />}
    </div>
  );
}
