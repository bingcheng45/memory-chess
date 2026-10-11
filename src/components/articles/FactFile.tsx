import { useTranslations } from "next-intl";
import { ARTICLE_LONG_WORDS } from "@/components/articles/articleStyles";
import { FACT_KEYS, type ArticleFacts } from "@/lib/articles/schema";

type FactFileProps = {
  facts: ArticleFacts;
  className?: string;
};

const HEADING_ID = "article-fact-file-heading";

export default function FactFile({ facts, className = "" }: FactFileProps) {
  const t = useTranslations("articles.page");
  const rows = FACT_KEYS.flatMap((key) => {
    const value = facts[key];
    return value === undefined ? [] : [{ key, value }];
  });

  return (
    <section aria-labelledby={HEADING_ID} className={className}>
      <h2
        id={HEADING_ID}
        className="art-facts-h mb-3"
      >
        {t("factFile")}
      </h2>
      <dl>
        {rows.map(({ key, value }) => (
          <div
            key={key}
            className="art-facts-row grid grid-cols-[88px_minmax(0,1fr)] gap-2.5 py-2"
          >
            <dt className={ARTICLE_LONG_WORDS}>{t(`facts.${key}`)}</dt>
            <dd className={ARTICLE_LONG_WORDS}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
