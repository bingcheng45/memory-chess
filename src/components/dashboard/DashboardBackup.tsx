"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { LabRecord } from "@/components/home/useLabRecord";
import { choiceStore } from "@/components/home/labChoices";
import { useFirstSight } from "@/components/home/useFirstSight";
import { BACKUP_SNOOZE_KEY, backupStatusOf, CAP_NOTICE_KEY, parseStoredTime, snoozeUntil } from "@/lib/lab/backup";
import { ROUND_CAP } from "@/lib/lab/storage";

const snooze = choiceStore<number>(BACKUP_SNOOZE_KEY, parseStoredTime);
const capSeen = choiceStore<number>(CAP_NOTICE_KEY, parseStoredTime);

function usePersisted(): boolean | null {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    navigator.storage?.persisted?.().then(
      (answer) => live && setPersisted(answer),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, []);
  return persisted;
}

type BackupRecord = Pick<LabRecord, "records" | "summary" | "lastBackup" | "download">;

function BackupCard({ record }: { record: BackupRecord }) {
  const t = useTranslations("dashboard.backup");
  const format = useFormatter();
  const persisted = usePersisted();
  const snoozedUntil = snooze.useValue();
  const [now] = useState(() => Date.now());
  const [started, setStarted] = useState(false);
  const status = backupStatusOf({ persisted, lastBackup: record.lastBackup, records: record.records, lifetimeRounds: record.summary.rounds, snoozedUntil, now });
  if (status.kind === "quiet" && !started) return null;

  const download = () => {
    setStarted(true);
    record.download().catch(() => setStarted(false));
  };

  return (
    <aside className="lab-dash-note-card" data-note="backup" aria-labelledby="lab-dash-backup-title">
      <div className="lab-dash-note-text">
        <h2 id="lab-dash-backup-title">{t("title")}</h2>
        <p role="status">
          {started
            ? t("started")
            : status.kind === "never"
              ? t("never", { rounds: status.rounds })
              : status.kind === "behind" && t("behind", { rounds: status.roundsSince, date: format.dateTime(status.lastBackup, { dateStyle: "medium" }) })}
        </p>
      </div>
      {!started && (
        <div className="lab-dash-note-actions">
          <button type="button" className="lab-btn lab-btn-primary" onClick={download}>
            {t("download")}
          </button>
          <button type="button" className="lab-btn lab-btn-secondary" onClick={() => snooze.set(snoozeUntil(Date.now()))}>
            {t("later")}
          </button>
        </div>
      )}
    </aside>
  );
}

function CapNotice({ evicting }: { evicting: boolean }) {
  const t = useTranslations("dashboard.backup");
  const seenAt = capSeen.useValue();
  const [seenHere, setSeenHere] = useState(false);
  const onSight = useCallback(() => {
    setSeenHere(true);
    capSeen.update((current) => current ?? Date.now());
  }, []);
  const ref = useFirstSight<HTMLElement>(onSight);
  const dismissCap = () => {
    setSeenHere(false);
    capSeen.update((current) => current ?? Date.now());
  };
  if (!evicting || !(seenAt === null || seenHere)) return null;

  return (
    <aside className="lab-dash-note-card" data-note="cap" aria-labelledby="lab-dash-cap-title" ref={ref}>
      <div className="lab-dash-note-text">
        <h2 id="lab-dash-cap-title">{t("capTitle")}</h2>
        <p>{t("cap", { cap: ROUND_CAP })}</p>
      </div>
      <div className="lab-dash-note-actions">
        <button type="button" className="lab-btn lab-btn-secondary" onClick={dismissCap}>
          {t("gotIt")}
        </button>
      </div>
    </aside>
  );
}

export function DashboardBackup({ record }: { record: BackupRecord }) {
  return (
    <>
      <CapNotice evicting={record.summary.evictedThrough !== null} />
      <BackupCard record={record} />
    </>
  );
}
