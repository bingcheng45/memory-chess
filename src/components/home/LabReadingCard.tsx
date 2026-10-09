"use client";

import { useTranslations } from "next-intl";
import type { ReadingCard } from "@/lib/lab/readingCard";
import { LAB_THRESHOLDS } from "@/lib/lab/readiness";
import { settingValues, seconds } from "./labFormat";
import { useCopyText } from "./useCopyText";

type Translate = ReturnType<typeof useTranslations<"home.lab.record.tools.card">>;

function cardText(t: Translate, { span, held, speed }: ReadingCard): string {
  return [
    t("title"),
    t("span", { pieceCount: span.pieceCount, accuracy: LAB_THRESHOLDS.spanAccuracy, count: span.rounds }),
    held && t("held", { average: held.average.toFixed(1), count: held.rounds }),
    speed && t("speed", { ...settingValues(speed.setting), average: seconds(speed.secondsPerPiece.toFixed(1)), count: speed.rounds }),
    t("site"),
  ]
    .filter(Boolean)
    .join("\n");
}

/** A text card rather than an image: it pastes anywhere, reads aloud as it is, and needs no drawing code. */
export function LabReadingCard({ card }: { card: ReadingCard }) {
  const t = useTranslations("home.lab.record.tools.card");
  const text = cardText(t, card);
  const { state, copy, textRef } = useCopyText(text);

  return (
    <details className="lab-card">
      <summary className="lab-note">{t("open")}</summary>
      <pre ref={textRef} className="lab-card-text">
        {text}
      </pre>
      <button type="button" className="lab-btn lab-btn-secondary" onClick={copy}>
        {t("copy")}
      </button>
      <p className="lab-note lab-card-copied" role="status">
        {state === "idle" ? "" : t(state === "copied" ? "copied" : "copyFailed")}
      </p>
    </details>
  );
}
