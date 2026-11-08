"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";

/** Rated rounds the player has finished, this one included, before the line appears; a first round is never asked. */
export const SAVE_LINE_MIN_ROUNDS = 2;

// Loaded on press, so /game carries none of the export code until a player asks for a copy.
const labDownload = () => import("@/components/home/labDownload");

/** Set when the player hides the line; it stays hidden on every result until the page is reloaded. */
let hiddenThisSession = false;

/** Clears the session's choice, so tests do not depend on the order they run in. */
export function resetSaveLine(): void {
  hiddenThisSession = false;
}

/** One line on the result screen: the record lives only in this browser, with a copy to download and the backup interest. */
export default function ResultSaveLine() {
  const t = useTranslations("game.result.saveLine");
  const tTools = useTranslations("home.lab.record.tools");
  const tBackup = useTranslations("dashboard.backup");
  const [hidden, setHidden] = useState(hiddenThisSession);
  const [notice, setNotice] = useState("");
  if (hidden) return null;

  const download = () => {
    void labDownload()
      .then(({ downloadLabRecord }) => downloadLabRecord())
      .then((startedAt) => setNotice(startedAt === null ? "" : tBackup("started")))
      .catch(() => setNotice(""));
  };

  const onBackupInterest = () => {
    setNotice(tTools("backupNoted"));
    void labDownload()
      .then(({ lifetimeRounds }) => lifetimeRounds())
      .catch(() => 0)
      .then((rounds) => trackEvent({ name: "lab_backup_interest", params: { rounds, surface: "result_screen" } }));
  };

  const hide = () => {
    hiddenThisSession = true;
    setHidden(true);
  };

  return (
    <div className="lab-result-save" data-result-save>
      <div className="lab-result-save-head">
        <p className="lab-result-save-text">{t("text")}</p>
        <button type="button" className="lab-result-save-hide" aria-label={t("hide")} onClick={hide}>
          <X aria-hidden size={18} />
        </button>
      </div>
      <div className="lab-result-save-actions">
        <button type="button" className="lab-btn lab-btn-secondary" onClick={download}>
          {t("download")}
        </button>
        {/* aria-disabled rather than disabled, so the click still registers the interest. */}
        <button type="button" className="lab-btn lab-btn-secondary" aria-disabled="true" onClick={onBackupInterest}>
          {tTools("backup")}
        </button>
      </div>
      <p className="lab-result-save-note" role="status">
        {notice}
      </p>
    </div>
  );
}
