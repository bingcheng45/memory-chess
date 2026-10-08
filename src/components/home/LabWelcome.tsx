"use client";

import { useTranslations } from "next-intl";
import { welcomeBack } from "@/lib/lab/welcome";
import { seconds } from "./labFormat";
import type { LabRecord } from "./useLabRecord";

/** A reserved line above the panels that greets a player back after days away. Empty on the server and for everyone else. */
export function LabWelcome({ record }: { readonly record: LabRecord }) {
  const t = useTranslations("home.lab.record.welcome");
  const welcome = record.storage === "available" ? welcomeBack(record) : null;
  if (!welcome) return <div className="lab-welcome" />;
  const { day, accuracy, pieceCount, memorizeSeconds } = welcome;
  const values = { accuracy, pieceCount, studyTime: seconds(memorizeSeconds) };

  return (
    <div className="lab-welcome">
      <p>{day === null ? t("lineNoDay", values) : t("line", { ...values, day })}</p>
    </div>
  );
}
