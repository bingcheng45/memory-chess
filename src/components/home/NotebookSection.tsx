"use client";

import { useTranslations } from "next-intl";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const ENTRIES = ["observation", "hypothesis", "method"] as const;

export function NotebookSection() {
  const t = useTranslations("home.lab.notebook");

  return (
    <section className="lab-sec" id={LAB_SECTIONS.notebook.anchor}>
      <div className="lab-wrap">
        <SectionHeading section="notebook" title={t("title")} lede={t("lede")} />
        <div className="lab-nb">
          {ENTRIES.map((entry) => (
            <article key={entry}>
              <span className="lab-k">{t(`${entry}.kicker`)}</span>
              <h3>{t(`${entry}.title`)}</h3>
              <p>
                {t.rich(`${entry}.body`, {
                  hl: (chunks) => <span className="lab-hl">{chunks}</span>,
                })}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
