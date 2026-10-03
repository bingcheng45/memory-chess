import { ARTICLE_FOCUS_RING } from "@/components/articles/articleStyles";
import { FIRST_PAGE, writePage } from "@/components/articles/listAddress";
import { ARTICLE_PAGER_COPY } from "@/lib/articles/copy";
import type { Page } from "@/lib/articles/paging";

type ArticlePagerProps = {
  current: Page<unknown>;
  total: number;
};

type StepButtonProps = {
  label: string;
  symbol: string;
  target: number;
  isAtEnd: boolean;
};

const BUTTON_CLASS =
  "h-11 min-w-11 rounded-xl border border-white/10 bg-bg-card px-3 text-text-secondary " +
  "hover:border-peach-500/35 hover:text-peach-300 aria-disabled:cursor-default aria-disabled:opacity-40 " +
  "aria-disabled:hover:border-white/10 aria-disabled:hover:text-text-secondary " +
  ARTICLE_FOCUS_RING;
const CURRENT_CLASS = "border-transparent bg-peach-500 font-semibold text-bg-dark";

function StepButton({ label, symbol, target, isAtEnd }: StepButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={isAtEnd}
      onClick={() => {
        if (!isAtEnd) writePage(target);
      }}
      className={BUTTON_CLASS}
    >
      {symbol}
    </button>
  );
}

export default function ArticlePager({ current, total }: ArticlePagerProps) {
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
              onClick={() => writePage(page)}
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
