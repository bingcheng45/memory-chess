"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { portraitImageProps } from "@/components/articles/ArticlePortrait";
import { ARTICLE_FOCUS_RING, ARTICLE_LONG_WORDS } from "@/components/articles/articleStyles";
import { useTileArticles } from "@/components/game/TileArticlesProvider";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { articlePath } from "@/lib/articles/paths";
import {
  chooseTile,
  HIDDEN_TILE,
  type ArticleTileState,
  type RandomSource,
  type RoundSize,
  type TileArticle,
} from "@/lib/articles/tile";
import { viewedStore } from "@/lib/articles/viewedStore";
import { useGameStore } from "@/lib/store/gameStore";
import { playSound } from "@/lib/utils/soundEffects";

type ArticleTileProps = {
  round: RoundSize;
  random?: RandomSource;
};

const EYEBROW_ID = "article-tile-eyebrow";
const PORTRAIT_SIZES = "(max-width: 639px) 72px, 112px";
const ACTION_CLASS = `inline-flex min-h-11 items-center rounded-full px-4 text-[14.5px] font-semibold ${ARTICLE_FOCUS_RING}`;

function useChosenTile(random: RandomSource): ArticleTileState {
  const articles = useTileArticles();
  const [tile, setTile] = useState(HIDDEN_TILE);

  // Before paint, so the page under the tile does not move a frame after the result appears.
  useLayoutEffect(() => {
    if (tile.kind === "showing" || articles.length === 0) return;
    setTile(chooseTile(articles, viewedStore.has, random));
  }, [tile, articles, random]);

  return tile;
}

function RoundBox({ label, size }: { label: string; size: RoundSize }) {
  const t = useTranslations("articles.tile");

  return (
    <div className="rounded-lg bg-bg-light/45 px-3 py-2.5">
      <dt className="text-[12.5px] text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-[15.5px] font-semibold text-white [font-variant-numeric:tabular-nums]">
        {t("roundSize", { pieces: size.pieceCount, seconds: size.memorizeTime })}
      </dd>
    </div>
  );
}

function TileHeader({ article }: { article: TileArticle }) {
  const { title, person, photo } = article;

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3.5 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-[22px]">
      <Image
        {...portraitImageProps(photo, PORTRAIT_SIZES)}
        alt={photo.alt}
        loading="lazy"
        className="aspect-[4/5] h-auto w-full rounded-[10px] bg-bg-light object-cover"
      />
      <div className="min-w-0">
        <h3
          className={`text-[19px] font-bold leading-[1.2] tracking-[-0.012em] text-white [text-wrap:balance] ${ARTICLE_LONG_WORDS}`}
        >
          {title}
        </h3>
        <p className={`mt-1.5 text-[12.5px] leading-[1.35] text-text-muted ${ARTICLE_LONG_WORDS}`}>
          <b className="block font-semibold text-text-secondary">{person.name}</b>
          <span>{person.role}</span>
        </p>
      </div>
    </div>
  );
}

function ShownTile({ article, round }: { article: TileArticle; round: RoundSize }) {
  const t = useTranslations("articles.tile");
  const { startGame } = useGameStore();
  const { slug, drill } = article;

  function startDrill() {
    trackEvent({ name: "article_tile_click", params: { slug, action: "drill" } });
    playSound("click");
    startGame(drill.pieceCount, drill.memorizeTime);
  }

  return (
    <section
      aria-labelledby={EYEBROW_ID}
      data-article-tile={slug}
      className="w-full rounded-[18px] border border-white/10 bg-bg-card p-4 text-left"
    >
      <p id={EYEBROW_ID} className="mb-2.5 text-xs uppercase tracking-[0.12em] text-text-muted">
        {t("eyebrow")}
      </p>
      <TileHeader article={article} />
      <dl className="mb-3 mt-3.5 grid grid-cols-2 gap-2">
        <RoundBox label={t("yourRound")} size={round} />
        <RoundBox label={t("articleDrill")} size={drill} />
      </dl>
      <p className={`mb-3.5 text-[14.5px] leading-normal text-text-secondary ${ARTICLE_LONG_WORDS}`}>{drill.why}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={articlePath(slug)}
          onClick={() => trackEvent({ name: "article_tile_click", params: { slug, action: "read" } })}
          className={`${ACTION_CLASS} bg-peach-500 text-bg-dark hover:bg-peach-400`}
        >
          {t("read")}
        </Link>
        <button
          type="button"
          onClick={startDrill}
          className={`${ACTION_CLASS} border border-peach-500/35 text-peach-500 hover:bg-peach-500/10`}
        >
          {t("tryDrill")}
        </button>
      </div>
    </section>
  );
}

export default function ArticleTile({ round, random = Math.random }: ArticleTileProps) {
  const tile = useChosenTile(random);

  if (tile.kind === "hidden") return null;
  return <ShownTile article={tile.article} round={round} />;
}
