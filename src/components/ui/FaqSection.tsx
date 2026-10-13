"use client";

import { useTranslations } from "next-intl";

type Faq = {
  question: string;
  answer: string;
};

/** The homepage questions. Read as raw so the list stays one array in the message file rather than a set of numbered keys that drift apart between locales. */
export function useFaqs(): Faq[] {
  return useTranslations("home.faq").raw("items") as Faq[];
}

/**
 * Built from the translated copy on purpose: the structured data should match
 * what the page actually says, so each locale gets its own FAQ rich result.
 *
 * Plain script tag, not next/script: `strategy="afterInteractive"` keeps the
 * JSON-LD out of the served HTML entirely, so crawlers only see it if they
 * execute JS. This matches how the Learn pages already emit their structured
 * data.
 */
export function FaqStructuredData({ faqs }: { faqs: Faq[] }) {
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

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />;
}
