import { useTranslations } from "next-intl";
import { FIRST_PAGE, writePage } from "@/components/articles/listAddress";
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

const BUTTON_CLASS = "art-pager-btn h-11 min-w-11 px-3";

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
  const t = useTranslations("articles.pager");
  const pages = Array.from({ length: current.pageCount }, (_, index) => index + 1);

  return (
    <nav
      aria-label={t("label")}
      className="art-counts mt-8 flex flex-wrap items-center justify-between gap-3"
    >
      <p aria-live="polite">
        {t("showing", { first: current.firstPosition, last: current.lastPosition, total })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <StepButton
          label={t("previous")}
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
              aria-label={t("page", { page })}
              aria-current={isCurrent ? "page" : undefined}
              onClick={() => writePage(page)}
              className={BUTTON_CLASS}
            >
              {page}
            </button>
          );
        })}
        <StepButton
          label={t("next")}
          symbol="→"
          target={current.page + 1}
          isAtEnd={current.page === current.pageCount}
        />
      </div>
    </nav>
  );
}
