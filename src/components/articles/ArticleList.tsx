"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import ArticleCard from "@/components/articles/ArticleCard";
import ArticlePager from "@/components/articles/ArticlePager";
import SortControl from "@/components/articles/SortControl";
import { measureCards, slideCards, type CardPlaces } from "@/components/articles/cardReorder";
import {
  FIRST_PAGE,
  notifyAddressListeners,
  readPage,
  readSort,
  subscribeToAddress,
  writeSort,
} from "@/components/articles/listAddress";
import { paginate } from "@/lib/articles/paging";
import type { ArticleSummary } from "@/lib/articles/schema";
import { DEFAULT_SORT, hasCountsToSortBy, sortArticles, type SortKey } from "@/lib/articles/sorting";
import { countsFor, type ArticleStats } from "@/lib/articles/stats";

type ArticleListProps = {
  articles: readonly ArticleSummary[];
  stats: ArticleStats;
  heading: ReactNode;
};

const NO_PLACES: CardPlaces = new Map();

// A link to the bare list URL changes the address without remounting the list
// or firing popstate. useSearchParams is the only signal Next gives for that,
// and it sits behind its own Suspense boundary so the cards stay in the server HTML.
function AddressWatcher() {
  const searchParams = useSearchParams();
  useEffect(notifyAddressListeners, [searchParams]);
  return null;
}

export default function ArticleList({ articles, stats, heading }: ArticleListProps) {
  const requestedPage = useSyncExternalStore(subscribeToAddress, readPage, () => FIRST_PAGE);
  const sort = useSyncExternalStore(subscribeToAddress, readSort, () => DEFAULT_SORT);
  const current = paginate(sortArticles(articles, stats, sort), requestedPage);

  const list = useRef<HTMLOListElement>(null);
  const places = useRef<CardPlaces>(NO_PLACES);
  const slides = useRef<readonly Animation[]>([]);
  const wasSortPressed = useRef(false);

  useLayoutEffect(() => {
    if (list.current === null) return;

    // Only a press on the sort control slides the cards. A slide that began on
    // arrival or on Back would run under the view transition of the same navigation.
    if (wasSortPressed.current) slides.current = slideCards(list.current, places.current);
    wasSortPressed.current = false;
    places.current = measureCards(list.current);
  });

  function chooseSort(chosen: SortKey) {
    if (chosen === sort) return;

    finishSlides();
    wasSortPressed.current = true;
    writeSort(chosen);
  }

  function finishSlides() {
    slides.current.forEach((slide) => slide.finish());
    slides.current = [];
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
      <ol ref={list} onClickCapture={finishSlides} className="grid gap-3.5">
        {current.items.map((article, index) => (
          <ArticleCard
            key={article.slug}
            article={article}
            counts={countsFor(stats, article.slug)}
            priority={index === 0}
          />
        ))}
      </ol>
      {current.pageCount > 1 ? <ArticlePager current={current} total={articles.length} /> : null}
    </>
  );
}
