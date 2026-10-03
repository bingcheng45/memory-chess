import { ARTICLE_COPY } from "@/lib/articles/copy";
import { FACT_ROWS, type ArticleFacts } from "@/lib/articles/schema";

type FactFileProps = {
  facts: ArticleFacts;
  className?: string;
};

const HEADING_ID = "article-fact-file-heading";

export default function FactFile({ facts, className = "" }: FactFileProps) {
  const rows = FACT_ROWS.flatMap(({ key, label }) => {
    const value = facts[key];
    return value === undefined ? [] : [{ key, label, value }];
  });

  return (
    <section aria-labelledby={HEADING_ID} className={className}>
      <h2
        id={HEADING_ID}
        className="mb-3 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.1em] text-text-muted"
      >
        {ARTICLE_COPY.factFile}
      </h2>
      <dl>
        {rows.map(({ key, label, value }) => (
          <div
            key={key}
            className="grid grid-cols-[88px_minmax(0,1fr)] gap-2.5 border-t border-white/10 py-[7px]"
          >
            <dt className="text-xs leading-[1.6] text-text-muted">{label}</dt>
            <dd className="text-sm leading-[1.4] text-text-secondary">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
