"use client";

import { useTranslations } from "next-intl";
import { FaqStructuredData, useFaqs } from "@/components/ui/FaqSection";
import EnglishOnlyLink from "@/components/ui/EnglishOnlyLink";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

const BOARD_GAME_GUIDE = "/learn/how-to-play-memory-chess-board-game";

export function LabFaq() {
  const t = useTranslations("home.faq");
  const faqs = useFaqs();

  return (
    <section className="lab-sec" id={LAB_SECTIONS.faq.anchor}>
      <div className="lab-wrap lab-faq">
        <SectionHeading section="faq" title={t("title")} />
        <FaqStructuredData faqs={faqs} />
        <div>
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
          <p className="lab-faq-more">
            {t.rich("boardGame", {
              link: (chunks) => (
                <EnglishOnlyLink href={BOARD_GAME_GUIDE}>
                  {(suffix) => (
                    <>
                      {chunks}
                      {suffix}
                    </>
                  )}
                </EnglishOnlyLink>
              ),
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
