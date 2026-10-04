"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import ArticleCard from "@/components/articles/ArticleCard";
import ArticlePager from "@/components/articles/ArticlePager";
import SortControl from "@/components/articles/SortControl";
import { measureCards, slideCards } from "@/components/articles/cardReorder";
import {
  BARE_SEARCH,
  notifyAddressListeners,
  pageOf,
  readSearch,
  sortOf,
  subscribeToAddress,
  writeSort,
} from "@/components/articles/listAddress";
import { clearSortedFirstPaint, rankStyles } from "@/components/articles/sortedFirstPaint";
import { paginate } from "@/lib/articles/paging";
import type { ArticleSummary } from "@/lib/articles/schema";
import { hasCountsToSortBy, sortArticles, type SortKey } from "@/lib/articles/sorting";
import { countsFor, type ArticleStats } from "@/lib/articles/stats";
import "./articleList.css";

type ArticleListProps = {
  articles: readonly ArticleSummary[];
  stats: ArticleStats;
  heading: ReactNode;
};

// A link to the bare list URL changes the address without remounting the list
// or firing popstate. useSearchParams is the only signal Next gives for that,
// and it sits behind its own Suspense boundary so the cards stay in the server HTML.
function AddressWatcher() {
  const searchParams = useSearchParams();
  useEffect(notifyAddressListeners, [searchParams]);
  return null;
}

export default function ArticleList({ articles, stats, heading }: ArticleListProps) {
  const search = useSyncExternalStore(subscribeToAddress, readSearch, () => BARE_SEARCH);
  const sort = sortOf(search);
  const current = paginate(sortArticles(articles, stats, sort), pageOf(search));
  const ranks = rankStyles(articles, stats);

  const list = useRef<HTMLOListElement>(null);
  const slides = useRef<readonly Animation[]>([]);

  // Hydration renders the server's newest-first order once before it renders
  // the address's. The mark holds the sorted order on screen through that
  // render, and has to go with it, or it would pin the cards against the next sort.
  useLayoutEffect(() => {
    if (search === readSearch()) clearSortedFirstPaint();
  }, [search]);

  function finishSlides() {
    slides.current.forEach((slide) => slide.finish());
    slides.current = [];
  }

  function chooseSort(chosen: SortKey) {
    if (chosen === sort || list.current === null) return;

    finishSlides();
    const before = measureCards(list.current);
    flushSync(() => writeSort(chosen));
    slides.current = slideCards(list.current, before);
  }

  return (
    <>
      <Suspense fallback={null}>
        <AddressWatcher />
      </Suspense>
      <div className="mb-[26px] mt-[22px] flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        {heading}
        {hasCountsToSortBy(articles, stats) ? <SortControl current={sort} onChoose={chooseSort} /> : null}
      </div>
      <ol ref={list} data-article-list onClickCapture={finishSlides} className="grid gap-3.5">
        {current.items.map((article, index) => (
          <ArticleCard
            key={article.slug}
            article={article}
            counts={countsFor(stats, article.slug)}
            priority={index === 0}
            style={ranks.get(article.slug)}
          />
        ))}
      </ol>
      {current.pageCount > 1 ? <ArticlePager current={current} total={articles.length} /> : null}
    </>
  );
}
