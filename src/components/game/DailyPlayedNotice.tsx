"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DailyResetsIn, useNow } from "@/components/home/DailyResetsIn";
import { LAB_SECTIONS } from "@/components/home/SectionHeading";

/** Shown in place of a second attempt at today's board. Loaded only then, so /game carries none of it otherwise. */
export default function DailyPlayedNotice() {
  const t = useTranslations("home.lab.record.daily");
  const now = useNow();
  return (
    <section role="status" className="mb-6 w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-4 text-sm md:max-w-lg">
      <p className="font-semibold text-text-primary">{t("locked")}</p>
      <p className="mt-1 min-h-[1.25rem] text-text-secondary">{now !== null && <DailyResetsIn now={now} />}</p>
      <Link
        className="mt-2 inline-block rounded font-semibold text-peach-500 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500/60"
        href={`/#${LAB_SECTIONS.record.anchor}`}
      >
        {t("seeResult")} <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
