"use client";

import { Link } from "@/i18n/navigation";
import { useReaderRound } from "@/hooks/useReaderRound";
import { LEARN_GUIDE_COPY as COPY } from "@/lib/seo/learn/copy";
import { DAILY_PATH, guideRoundHref } from "@/lib/seo/learn/links";

export default function LearnQuickPlay() {
  const round = useReaderRound();

  return (
    <aside className="lg-quickplay" aria-label={COPY.quickPlay} data-reader-round={`${round.pieceCount}/${round.memorizeTime}`}>
      <Link href={guideRoundHref(round)} className="lab-btn lab-btn-primary">
        {COPY.tryRound(round.pieceCount, round.memorizeTime)}
      </Link>
      <Link href={DAILY_PATH} className="lg-link">
        {COPY.dailyBoard}
      </Link>
    </aside>
  );
}
