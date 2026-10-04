import type { CSSProperties } from "react";
import { LikeCount, ViewCount } from "@/components/articles/ArticleCounts";
import ArticleLink from "@/components/articles/ArticleLink";
import ArticlePortrait from "@/components/articles/ArticlePortrait";
import { ARTICLE_FOCUS_RING } from "@/components/articles/articleStyles";
import { useLikesSeen } from "@/components/articles/useLikesSeen";
import type { ArticleSummary } from "@/lib/articles/schema";
import { hasCounts, atLeastLikesSeen, type ArticleCounts } from "@/lib/articles/stats";

type ArticleCardProps = {
  article: ArticleSummary;
  counts?: ArticleCounts;
  priority: boolean;
  style?: CSSProperties;
};

const CARD_CLASS =
  "group grid grid-cols-[96px_minmax(0,1fr)] gap-3.5 rounded-[18px] border border-white/10 bg-bg-card p-3.5 " +
  "hover:border-peach-500/35 hover:bg-white/[0.06] motion-safe:transition-transform motion-safe:duration-300 " +
  `motion-safe:hover:-translate-y-0.5 ${ARTICLE_FOCUS_RING} ` +
  "min-[561px]:grid-cols-[148px_minmax(0,1fr)] min-[561px]:gap-[26px] min-[561px]:rounded-[22px] min-[561px]:p-[18px]";

export default function ArticleCard({ article, counts: listed, priority, style }: ArticleCardProps) {
  const { slug, photo, person, publishedAt, publishedLabel, title, description } = article;
  const counts = atLeastLikesSeen(listed, useLikesSeen(slug));
  const descriptionId = `${slug}-description`;
  const countsId = `${slug}-counts`;

  return (
    <li style={style}>
      <ArticleLink
        article={slug}
        portrait={photo}
        data-article-card={slug}
        aria-labelledby={`${slug}-title`}
        aria-describedby={hasCounts(counts) ? `${descriptionId} ${countsId}` : descriptionId}
        className={CARD_CLASS}
      >
        <div>
          <ArticlePortrait
            photo={photo}
            sizes="(max-width: 560px) 96px, 148px"
            priority={priority}
            className="rounded-xl"
          />
          <p className="mt-[9px] text-[12.5px] leading-[1.35] text-text-muted">
            <b className="block font-semibold text-text-secondary">{person.name}</b>
            <span>{person.role}</span>
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 py-1">
          <time
            dateTime={publishedAt}
            data-flight="date"
            className="self-start text-[12.5px] tracking-[0.02em] text-peach-500"
          >
            {publishedLabel}
          </time>
          <h2
            id={`${slug}-title`}
            data-flight="title"
            className="text-[clamp(19px,2.7vw,25px)] font-bold leading-[1.18] tracking-[-0.015em] text-white [text-wrap:balance] group-hover:text-peach-200"
          >
            {title}
          </h2>
          <p
            id={descriptionId}
            className="text-[14.5px] leading-normal text-text-muted min-[561px]:text-[15.5px]"
          >
            {description}
          </p>
          {hasCounts(counts) ? (
            <p
              id={countsId}
              data-article-counts
              className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[13px] text-text-muted [font-variant-numeric:tabular-nums]"
            >
              <ViewCount count={counts.views} />
              <LikeCount count={counts.likes} />
            </p>
          ) : null}
        </div>
      </ArticleLink>
    </li>
  );
}
