"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import ArticleCard from "@/components/articles/ArticleCard";
import { ARTICLE_FOCUS_RING } from "@/components/articles/articleStyles";
import { ARTICLE_PAGER_COPY } from "@/lib/articles/copy";
import { paginate, type Page } from "@/lib/articles/paging";
import type { ArticleSummary } from "@/lib/articles/schema";

type ArticleListProps = {
  articles: readonly ArticleSummary[];
};

const PAGE_PARAM = "page";
const FIRST_PAGE = 1;

const BUTTON_CLASS =
  "h-11 min-w-11 rounded-xl border border-white/10 bg-bg-card px-3 text-text-secondary " +
  "hover:border-peach-500/35 hover:text-peach-300 aria-disabled:cursor-default aria-disabled:opacity-40 " +
  "aria-disabled:hover:border-white/10 aria-disabled:hover:text-text-secondary " +
  ARTICLE_FOCUS_RING;
const CURRENT_CLASS = "border-transparent bg-peach-500 font-semibold text-bg-dark";

const pageListeners = new Set<() => void>();

function notifyPageListeners(): void {
  pageListeners.forEach((notify) => notify());
}

function subscribeToPage(onChange: () => void): () => void {
  pageListeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    pageListeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

function readPageFromAddress(): number {
  const requested = new URLSearchParams(window.location.search).get(PAGE_PARAM);
  return requested === null ? FIRST_PAGE : Number(requested);
}

function writePageToAddress(page: number): void {
  const url = new URL(window.location.href);
  if (page === FIRST_PAGE) {
    url.searchParams.delete(PAGE_PARAM);
  } else {
    url.searchParams.set(PAGE_PARAM, String(page));
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  notifyPageListeners();
}

// A link to the bare list URL changes the address without remounting the list
// or firing popstate. useSearchParams is the only signal Next gives for that,
// and it sits behind its own Suspense boundary so the cards stay in the server HTML.
function AddressWatcher() {
  const searchParams = useSearchParams();
  useEffect(notifyPageListeners, [searchParams]);
  return null;
}

type StepButtonProps = {
  label: string;
  symbol: string;
  target: number;
  isAtEnd: boolean;
};

function StepButton({ label, symbol, target, isAtEnd }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={isAtEnd}
      onClick={() => {
        if (!isAtEnd) writePageToAddress(target);
      }}
      className={BUTTON_CLASS}
    >
      {symbol}
    </button>
  );
}

function Pager({ current, total }: { current: Page<ArticleSummary>; total: number }) {
  const pager = ARTICLE_PAGER_COPY;
  const pages = Array.from({ length: current.pageCount }, (_, index) => index + 1);

  return (
    <nav
      aria-label={pager.label}
      className="mt-[34px] flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted [font-variant-numeric:tabular-nums]"
    >
      <p aria-live="polite">{pager.showing(current.firstPosition, current.lastPosition, total)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <StepButton
          label={pager.previous}
          symbol="←"
          target={current.page - 1}
          isAtEnd={current.page === FIRST_PAGE}
        />
        {pages.map((page) => {
          const isCurrent = page === current.page;
          return (
            <button
              key={page}
              type="button"
              aria-label={pager.page(page)}
              aria-current={isCurrent ? "page" : undefined}
              onClick={() => writePageToAddress(page)}
              className={isCurrent ? `${BUTTON_CLASS} ${CURRENT_CLASS}` : BUTTON_CLASS}
            >
              {page}
            </button>
          );
        })}
        <StepButton
          label={pager.next}
          symbol="→"
          target={current.page + 1}
          isAtEnd={current.page === current.pageCount}
        />
      </div>
    </nav>
  );
}

export default function ArticleList({ articles }: ArticleListProps) {
  const requestedPage = useSyncExternalStore(subscribeToPage, readPageFromAddress, () => FIRST_PAGE);
  const current = paginate(articles, requestedPage);

  return (
    <>
      <Suspense fallback={null}>
        <AddressWatcher />
      </Suspense>
      <ol className="grid gap-3.5">
        {current.items.map((article, index) => (
          <ArticleCard key={article.slug} article={article} priority={index === 0} />
        ))}
      </ol>
      {current.pageCount > 1 ? <Pager current={current} total={articles.length} /> : null}
    </>
  );
}
