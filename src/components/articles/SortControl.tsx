import { useTranslations } from "next-intl";
import { SORT_KEYS, type SortKey } from "@/lib/articles/sorting";

type SortControlProps = {
  current: SortKey;
  onChoose: (sort: SortKey) => void;
};

const OPTION_CLASS = "art-seg-option min-h-11 whitespace-nowrap px-3.5";

export default function SortControl({ current, onChoose }: SortControlProps) {
  const t = useTranslations("articles.sort");

  return (
    <div className="art-sort flex items-center gap-2.5">
      <span aria-hidden="true">{t("label")}</span>
      <div
        role="group"
        aria-label={t("group")}
        className="art-seg inline-flex flex-wrap gap-0.5 p-[3px]"
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
