"use client";

import { useTranslations } from "next-intl";
import TutorialVideoFrame from "./TutorialVideoFrame";

export default function VideoSection() {
  const t = useTranslations("home.video");
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-2 sm:px-4 mt-4 mb-8 border-t border-bg-light">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-text-primary">
        {t("title")}
      </h2>

      <p className="text-text-secondary text-center max-w-2xl mx-auto mb-8 text-sm sm:text-base">
        {t("subtitle")}
      </p>

      <div className="relative w-full pb-[56.25%] overflow-hidden rounded-xl shadow-lg border border-bg-light bg-bg-card">
        <TutorialVideoFrame className="absolute top-0 left-0 w-full h-full" />
      </div>

      <div className="mt-6 text-center text-text-secondary text-xs italic">
        {t("credit")}
      </div>
    </div>
  );
}
