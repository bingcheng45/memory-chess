import { useTranslations } from "next-intl";
import { ARTICLE_FOCUS_RING } from "@/components/articles/articleStyles";
import { SORT_KEYS, type SortKey } from "@/lib/articles/sorting";

type SortControlProps = {
  current: SortKey;
  onChoose: (sort: SortKey) => void;
};

const OPTION_CLASS =
  `min-h-11 whitespace-nowrap rounded-full px-[13px] text-[13px] text-text-muted hover:text-peach-200 ${ARTICLE_FOCUS_RING}`;

export default function SortControl({ current, onChoose }: SortControlProps) {
  const t = useTranslations("articles.sort");

  return (
    <div className="flex items-center gap-2.5 text-[13px] text-text-muted">
      <span aria-hidden="true">{t("label")}</span>
      <div
        role="group"
        aria-label={t("group")}
        className="inline-flex flex-wrap gap-0.5 rounded-[25px] border border-white/10 bg-bg-dark p-[3px]"
      >
        {SORT_KEYS.map((sort) => (
          <button
            key={sort}
            type="button"
            aria-pressed={sort === current}
            data-sort-option={sort}
            onClick={() => onChoose(sort)}
            className={OPTION_CLASS}
          >
            {t(`options.${sort}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
