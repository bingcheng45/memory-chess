"use client";

import { ViewCount } from "@/components/articles/ArticleCounts";
import LikeButton from "@/components/articles/LikeButton";
import { useLiveArticleStats } from "@/components/articles/useLiveArticleStats";
import { countsFor, NO_ARTICLE_STATS, type ArticleCounts } from "@/lib/articles/stats";

type ArticleCountsRowProps = {
  slug: string;
  counts?: ArticleCounts;
};

export default function ArticleCountsRow({ slug, counts: built }: ArticleCountsRowProps) {
  const counts = countsFor(useLiveArticleStats(built === undefined ? NO_ARTICLE_STATS : { [slug]: built }), slug);

  return (
    <div data-article-counts className="art-counts mt-5 flex flex-wrap items-center gap-x-[18px] gap-y-2.5">
      <ViewCount count={counts?.views} />
      <LikeButton key={slug} slug={slug} likes={counts?.likes} />
    </div>
  );
}
