"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DailyResetsIn, useNow } from "@/components/home/DailyResetsIn";
import { LAB_SECTIONS } from "@/components/home/SectionHeading";

const LINK_CLASS =
  "rounded font-semibold text-peach-500 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-500/60";

/** Shown in place of a second attempt at today's board, until the player chooses a round of their own. Loaded only then. */
export default function DailyPlayedNotice({ onChoose }: { onChoose: () => void }) {
  const t = useTranslations("home.lab.record.daily");
  const now = useNow();
  return (
    <section role="status" className="w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-5 text-sm sm:p-7 md:max-w-lg">
      <p className="font-semibold text-text-primary">{t("locked")}</p>
      <p className="mt-1 min-h-[1.25rem] text-text-secondary">{now !== null && <DailyResetsIn now={now} />}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link className={LINK_CLASS} href={`/#${LAB_SECTIONS.record.anchor}`}>
          {t("seeRecord")} <span aria-hidden="true">→</span>
        </Link>
        <button type="button" className={LINK_CLASS} onClick={onChoose}>
          {t("chooseRound")}
        </button>
      </div>
    </section>
  );
}
