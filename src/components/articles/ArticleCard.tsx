import type { CSSProperties } from "react";
import { LikeCount, ViewCount } from "@/components/articles/ArticleCounts";
import ArticleLink from "@/components/articles/ArticleLink";
import ArticlePortrait from "@/components/articles/ArticlePortrait";
import { ARTICLE_LONG_WORDS } from "@/components/articles/articleStyles";
import { useLikesSeen } from "@/components/articles/useLikesSeen";
import type { ArticleSummary } from "@/lib/articles/schema";
import { ENGLISH_ONLY_ARTICLE_SLUGS } from "@/lib/articles/translatedLocales";
import { hasCounts, atLeastLikesSeen, type ArticleCounts } from "@/lib/articles/stats";

type ArticleCardProps = {
  article: ArticleSummary;
  counts?: ArticleCounts;
  priority: boolean;
  style?: CSSProperties;
};

const CARD_CLASS =
  "art-card group grid grid-cols-[96px_minmax(0,1fr)] gap-3.5 p-3.5 " +
  "motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 " +
  "min-[561px]:grid-cols-[148px_minmax(0,1fr)] min-[561px]:gap-6 min-[561px]:p-5";

export default function ArticleCard({ article, counts: listed, priority, style }: ArticleCardProps) {
  const { slug, photo, person, publishedAt, publishedLabel, title, description, summary } = article;
  const counts = atLeastLikesSeen(listed, useLikesSeen(slug));
  const descriptionId = `${slug}-description`;
  const countsId = `${slug}-counts`;

  return (
    <li style={style} data-english-only-article={ENGLISH_ONLY_ARTICLE_SLUGS.includes(slug) || undefined}>
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
            className="rounded-lg"
          />
          <p className={`art-card-person mt-2 ${ARTICLE_LONG_WORDS}`}>
            <b className="block">{person.name}</b>
            <span>{person.role}</span>
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 py-1">
          <time
            dateTime={publishedAt}
            data-flight="date"
            className="art-meta self-start"
          >
            {publishedLabel}
          </time>
          <h2
            id={`${slug}-title`}
            data-flight="title"
            className={`art-card-title [text-wrap:balance] ${ARTICLE_LONG_WORDS}`}
          >
            {title}
          </h2>
          <p
            id={descriptionId}
            className={`art-card-desc ${ARTICLE_LONG_WORDS}`}
          >
            {summary ?? description}
          </p>
          {hasCounts(counts) ? (
            <p
              id={countsId}
              data-article-counts
              className="art-counts mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-1.5"
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
