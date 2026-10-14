"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { useNow } from "@/components/home/DailyResetsIn";
import { useResetsIn } from "@/components/daily/useResetsIn";
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
  return reason === "daily" ? <DailyNotice onChoose={onChoose} /> : <ReviewNotice reason={reason} onChoose={onChoose} />;
}

/** In every locale, so it leads to the daily page rather than the English lab record. */
function DailyNotice({ onChoose }: Pick<SetBoardNoticeProps, "onChoose">) {
  const t = useTranslations("daily.round");
  const resetsIn = useResetsIn(useNow());
  return (
    <Notice
      lines={[t("locked"), resetsIn]}
      link={{ href: "/daily", label: t("seeBoard") }}
      choose={t("chooseRound")}
      onChoose={onChoose}
    />
  );
}

function ReviewNotice({ reason, onChoose }: { reason: Exclude<SetBoardRefusal, "daily"> } & Pick<SetBoardNoticeProps, "onChoose">) {
  const t = useTranslations("home.lab.daily");
  const review = useTranslations("home.lab.review");
  const lines = {
    review: [review("none"), review("schedule")],
    reviewCap: [review("capped", { cap: REVIEW_DAILY_CAP }), review("cappedNext")],
  }[reason];
  return <Notice lines={lines} link={{ href: `/#${LAB_SECTIONS.record.anchor}`, label: t("seeRecord") }} choose={t("chooseRound")} onChoose={onChoose} />;
}

interface NoticeProps {
  readonly lines: readonly ReactNode[];
  readonly link: { readonly href: string; readonly label: string };
  readonly choose: string;
  readonly onChoose: () => void;
}

function Notice({ lines, link, choose, onChoose }: NoticeProps) {
  return (
    <section className="lab-card lab-config lab-ui-face text-sm">
      <p role="status" className="font-semibold text-[var(--lp-ink)]">{lines[0]}</p>
      <p className="mt-1 min-h-[1.25rem] text-[var(--lp-ink-2)]">{lines[1]}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link className={RESULT_LAB_LINK} href={link.href}>
          {link.label} <span aria-hidden="true">→</span>
        </Link>
        <button type="button" className={RESULT_LAB_LINK} onClick={onChoose}>
          {choose}
        </button>
      </div>
    </section>
  );
}
