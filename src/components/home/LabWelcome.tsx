"use client";

import { useTranslations } from "next-intl";
import type { WelcomeBack } from "@/lib/lab/welcome";
import { seconds } from "./labFormat";

/** Greets a player back after days away. Client only, and rendered only for that player: nothing is reserved for it. */
export function LabWelcome({ welcome: { day, accuracy, pieceCount, memorizeSeconds } }: { readonly welcome: WelcomeBack }) {
  const t = useTranslations("home.lab.record.welcome");
  const values = { accuracy, pieceCount, studyTime: seconds(memorizeSeconds) };
  return <p className="lab-welcome">{day === null ? t("lineNoDay", values) : t("line", { ...values, day })}</p>;
}
