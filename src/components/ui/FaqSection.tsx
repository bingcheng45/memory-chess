"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Faq = {
  question: string;
  answer: string;
};

export default function FaqSection() {
  const t = useTranslations("home.faq");

  // Read as raw so the FAQ list stays one array in the message file rather than
  // a set of numbered keys that drift apart between locales.
  const faqs = t.raw("items") as Faq[];

  // Built from the translated copy on purpose: the structured data should match
  // what the page actually says, so each locale gets its own FAQ rich result.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="mx-auto mt-8 w-full max-w-4xl border-t border-bg-light px-2 py-12 sm:px-4 md:py-16">
      <h2 className="mb-8 text-center text-2xl font-bold text-text-primary sm:mb-10 sm:text-3xl">
        {t("title")}
      </h2>

      {/*
        Plain script tag, not next/script: `strategy="afterInteractive"` keeps
        the JSON-LD out of the served HTML entirely, so crawlers only see it if
        they execute JS. This matches how the Learn pages already emit their
        structured data.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={faq.question}
            value={`item-${index + 1}`}
            className="border-bg-light"
          >
            <AccordionTrigger className="px-2 py-3 text-left text-base font-medium text-text-primary hover:text-peach-500 sm:py-4 sm:text-lg">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="px-2 pb-6 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
