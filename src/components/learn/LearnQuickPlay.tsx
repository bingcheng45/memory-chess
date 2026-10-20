"use client";

import { Link } from "@/i18n/navigation";
import { useReaderRound } from "@/hooks/useReaderRound";
import { IntlMessageFormat } from "intl-messageformat";
import type { GameSettings } from "@/lib/game/configPrefill";
import { DAILY_PATH, guideRoundHref } from "@/lib/seo/learn/links";

interface LearnQuickPlayProps {
  readonly unrated: GameSettings;
  readonly locale: string;
  readonly copy: { readonly quickPlay: string; readonly tryRound: string; readonly dailyBoard: string };
}

export default function LearnQuickPlay({ unrated, locale, copy }: LearnQuickPlayProps) {
  const round = useReaderRound(unrated);
  const label = new IntlMessageFormat(copy.tryRound, locale).format({ pieces: round.pieceCount, seconds: round.memorizeTime });

  return (
    <aside className="lg-quickplay" aria-label={copy.quickPlay} data-reader-round={`${round.pieceCount}/${round.memorizeTime}`}>
      <Link href={guideRoundHref(round)} className="lab-btn lab-btn-primary">
        {String(label)}
      </Link>
      <Link href={DAILY_PATH} className="lg-link">
        {copy.dailyBoard}
      </Link>
    </aside>
  );
}
