"use client";

import Script from "next/script";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Memory Chess?",
    answer:
      "Memory Chess is a free board-memory game. You study a chess position for a short time, rebuild it from memory, and get a score based on how many pieces you placed correctly.",
  },
  {
    question: "How do I play?",
    answer:
      "Choose how many pieces you want and how long you want to study the board. When the position disappears, place the pieces back on the squares you remember. Submit your answer to see your accuracy and time.",
  },
  {
    question: "Can beginners play Memory Chess?",
    answer:
      "Yes. You do not need to know chess openings or calculate moves. Start with fewer pieces and more study time, then make the game harder when you feel ready.",
  },
  {
    question: "How does it train chess visualization?",
    answer:
      "Each round gives you focused practice holding a chess position in your mind and recalling where the pieces belong. Your score shows which positions feel easy and where you need more practice.",
  },
  {
    question: "What should I look for when memorizing the board?",
    answer:
      "Start with easy anchors such as kings, queens, corners, and edge squares. Then look for groups, lines, diagonals, and empty spaces instead of trying to remember every piece on its own.",
  },
  {
    question: "How can I make the game harder?",
    answer:
      "Add more pieces, shorten the study time, or hide the board coordinates. Change one setting at a time so you can see what makes the biggest difference.",
  },
  {
    question: "Is Memory Chess free?",
    answer:
      "Yes. You can play for free without creating an account. Adding a name to the leaderboard is optional.",
  },
  {
    question: "How often should I practice?",
    answer:
      "A few focused rounds on a regular schedule is a good place to start. Keep sessions short enough that you can still study each position carefully.",
  },
] as const;

export default function FaqSection() {
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
        Questions About Memory Chess
      </h2>

      <Script
        id="faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify(faqSchema)}
      </Script>

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
