"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ARTICLE_LINK } from "@/components/articles/articleStyles";
import { useReaderRound } from "@/hooks/useReaderRound";
import type { ArticleDrill as Drill } from "@/lib/articles/schema";
import { playHref } from "@/lib/game/roundLink";

const DRILL_WHY_ID = "article-drill-why";

const articleRoundHref = ({ pieceCount, memorizeTime }: { pieceCount: number; memorizeTime: number }) =>
  playHref(pieceCount, memorizeTime, "article_cta");

export function EarlyDrillLink() {
  const t = useTranslations("articles.page");
  const round = useReaderRound();

  return (
    <p className="art-early mt-5">
      <Link href={articleRoundHref(round)} data-article-early-drill className="art-early-link inline-flex min-h-11 items-center gap-2">
        <b>{t("drillHeading")}</b>
        <span>{t("drillAction", { pieces: round.pieceCount, seconds: round.memorizeTime })}</span>
        <span aria-hidden="true">→</span>
      </Link>
    </p>
  );
}

export function ArticleDrill({ drill }: { drill: Drill }) {
  const t = useTranslations("articles.page");
  const round = useReaderRound();
  const action = t("drillAction", { pieces: round.pieceCount, seconds: round.memorizeTime });
  const isArticleRound = round.pieceCount === drill.pieceCount && round.memorizeTime === drill.memorizeTime;

  return (
    <aside className="mt-10 max-w-[720px]">
      <Link
        href={articleRoundHref(round)}
        data-article-drill
        aria-label={action}
        aria-describedby={DRILL_WHY_ID}
        className="art-drill group flex flex-wrap items-center justify-between gap-4 p-6"
      >
        <span className="art-drill-text min-w-0 flex-[1_1_260px]">
          <b>{t("drillHeading")}</b>
          <span id={DRILL_WHY_ID}>{drill.why}</span>
        </span>
        <span className="art-drill-btn inline-flex min-h-11 items-center px-5">{action}</span>
      </Link>
      {isArticleRound ? null : (
        <p className="mt-2">
          <Link href={articleRoundHref(drill)} data-article-drill-original className={`${ARTICLE_LINK} art-drill-original inline-flex min-h-11 items-center`}>
            {t("drillAction", { pieces: drill.pieceCount, seconds: drill.memorizeTime })}
          </Link>
        </p>
      )}
    </aside>
  );
}
