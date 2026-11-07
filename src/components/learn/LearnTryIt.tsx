import { useTranslations } from "next-intl";
import { chessOf } from "@/lib/seo/learn/positions";
import type { TryIt } from "@/lib/seo/learn/schema";
import { guideTryHref } from "@/lib/seo/learn/links";
import { TRY_IT_PIECES, TRY_IT_POSITION } from "@/lib/seo/learn/tryIt";
import { BoardPlate } from "./LearnBoard";
import GuideLink from "./GuideLink";

const POSITION_ID = "lg-try-position";

export default function LearnTryIt({ tryIt, locale }: { readonly tryIt: TryIt; readonly locale: string }) {
  const t = useTranslations("learnTryIt");
  const blindfold = tryIt.blindfold === true;
  const round = { pieces: TRY_IT_PIECES, seconds: tryIt.memorizeTime };

  return (
    <aside className="lg-try" aria-labelledby="lg-try-label" data-try-it>
      <p id="lg-try-label" data-interface-label className="lg-answer-label">
        {t("title")}
      </p>
      <div className="lg-try-body">
        {blindfold ? null : (
          <div className="lg-try-board">
            <BoardPlate chess={chessOf(TRY_IT_POSITION)} labelledBy={POSITION_ID} />
          </div>
        )}
        <div className="lg-try-text">
          <p>{t(blindfold ? "introBlindfold" : "intro", round)}</p>
          <p id={POSITION_ID} className="lg-try-position">
            {t("position", { white: TRY_IT_POSITION.white.join(", "), black: TRY_IT_POSITION.black.join(", ") })}
          </p>
          <GuideLink href={guideTryHref(tryIt)} locale={locale} className="lab-btn lab-btn-primary" data-try-it-start>
            {t(blindfold ? "startBlindfold" : "start", round)}
          </GuideLink>
        </div>
      </div>
    </aside>
  );
}
