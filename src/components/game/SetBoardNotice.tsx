"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DailyResetsIn, useNow } from "@/components/home/DailyResetsIn";
import { LAB_SECTIONS } from "@/components/home/SectionHeading";
import { REVIEW_DAILY_CAP } from "@/lib/lab/review";
import { RESULT_LAB_LINK } from "./ResultLabSlot";

export type SetBoardRefusal = "daily" | "review" | "reviewCap";

interface SetBoardNoticeProps {
  /** Today's board already opened, no board due for review, or today's reviews done. */
  readonly reason: SetBoardRefusal;
  readonly onChoose: () => void;
}

/** Shown in place of a set board the link cannot open, until the player chooses a round of their own. Loaded only then. */
export default function SetBoardNotice({ reason, onChoose }: SetBoardNoticeProps) {
  const t = useTranslations("home.lab.daily");
  const review = useTranslations("home.lab.review");
  const now = useNow();
  const lines = {
    daily: [t("locked"), <DailyResetsIn key="resets" now={now} />],
    review: [review("none"), review("schedule")],
    reviewCap: [review("capped", { cap: REVIEW_DAILY_CAP }), review("cappedNext")],
  }[reason];
  return (
    <section className="w-full max-w-md rounded-xl border border-bg-light bg-bg-card p-5 text-sm sm:p-7 md:max-w-lg">
      <p role="status" className="font-semibold text-text-primary">{lines[0]}</p>
      <p className="mt-1 min-h-[1.25rem] text-text-secondary">{lines[1]}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link className={RESULT_LAB_LINK} href={`/#${LAB_SECTIONS.record.anchor}`}>
          {t("seeRecord")} <span aria-hidden="true">→</span>
        </Link>
        <button type="button" className={RESULT_LAB_LINK} onClick={onChoose}>
          {t("chooseRound")}
        </button>
      </div>
    </section>
  );
}
