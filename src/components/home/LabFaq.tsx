import { useTranslations } from "next-intl";
import { FaqStructuredData, useFaqs } from "@/components/ui/FaqSection";
import { LAB_SECTIONS, SectionHeading } from "./SectionHeading";

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
        </div>
      </div>
    </section>
  );
}
