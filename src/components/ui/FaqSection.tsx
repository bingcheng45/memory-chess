'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Script from 'next/script';

export default function FaqSection() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is mental visualization and why is it valuable?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mental visualization is creating and manipulating images in your mind's eye. It accelerates thinking and improves decision making. Memory Chess exercises these skills by challenging you to recreate chessboard positions from memory."
        }
      },
      {
        "@type": "Question",
        "name": "How do experts demonstrate visualization abilities?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Chess grandmasters track pieces mentally across simultaneous games. Memory Chess builds similar skills by starting with simple patterns and increasing difficulty to train expert-level board vision."
        }
      },
      {
        "@type": "Question",
        "name": "What short-term strategies can optimize my visualization for specific tasks?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Focus on key pieces first, practice visualizing 3D relationships, and recreate positions from memory before submitting answers in Memory Chess."
        }
      },
      {
        "@type": "Question",
        "name": "What long-term practices improve visualization abilities permanently?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Progress through harder Memory Chess levels, analyze mistakes, and challenge yourself to visualize accurately under tighter time constraints."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a limit to how much one can visualize at once?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Memory Chess expands your capacity gradually. By chunking patterns rather than individual pieces, you learn to handle more complex positions."
        }
      },
      {
        "@type": "Question",
        "name": "How does visualization practice improve overall thinking?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Regular Memory Chess training makes your brain more efficient at processing complex information mentally, benefiting tasks from programming to design."
        }
      },
      {
        "@type": "Question",
        "name": "Can anyone improve visualization skills, or is it innate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Almost everyone can enhance visualization with structured practice. Memory Chess users report significant gains, showing the skill is learnable."
        }
      },
      {
        "@type": "Question",
        "name": "How much time should I dedicate to visualization practice?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sessions of 10-15 minutes a day on Memory Chess can yield noticeable improvements within weeks."
        }
      }
    ]
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-2 sm:px-4 md:py-16 mt-8 border-t border-bg-light">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10 text-text-primary">
        Frequently Asked Questions About Memory Chess Visualization Training
      </h2>

      <Script id="faq-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(faqSchema)}
      </Script>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            What is mental visualization and why is it valuable?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            Mental visualization is creating and manipulating images in your mind&apos;s eye. It accelerates thinking, enhances problem-solving, improves decision-making, and makes information more intuitive. Memory Chess provides targeted training by challenging you to remember board positions after viewing them briefly, then recreating them from memory—directly exercising the visualization muscles needed for advanced thinking across domains.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            How do experts demonstrate visualization abilities?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            Chess grandmasters track pieces mentally across multiple simultaneous games. Competitive programmers maintain complex mental models of problems without referencing original information. Memory Chess specifically builds this skill by starting with simple board patterns and progressively increasing difficulty, training your mind to hold and manipulate positions the way experts do naturally.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            What short-term strategies can optimize my visualization for specific tasks?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 sm:space-y-3">
              <li>Focus on important pieces first when using Memory Chess, ignoring less crucial elements</li>
              <li>Practice visualizing the 3D relationships between pieces on Memory Chess&apos;s 2D board</li>
              <li>Use the physical Memory Chess board initially, then close your eyes to recreate positions before submitting answers</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            What long-term practices improve visualization abilities permanently?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            <ul className="list-disc pl-5 sm:pl-6 space-y-2 sm:space-y-3">
              <li>Start with easier Memory Chess levels, progressively reducing viewing time as your skills improve</li>
              <li>After each Memory Chess exercise, analyze where your memory failed and develop strategies to strengthen those areas</li>
              <li>Set personal speed records on Memory Chess, challenging yourself to visualize positions accurately under tighter time constraints</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            Is there a limit to how much one can visualize at once?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            Yes, but Memory Chess helps expand these limits systematically. The platform&apos;s progressive difficulty increases the number of pieces and complexity of positions gradually, training your mind to handle increasingly complex visual information. Focus on chunking—seeing patterns rather than individual pieces—to overcome natural limitations.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            How does visualization practice improve overall thinking?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            Regular Memory Chess training enhances your ability to process complex information mentally. As you improve at holding chess positions in mind, you&apos;ll notice benefits in other areas requiring visualization—from programming to design. Your brain becomes more efficient at creating mental workspaces for reasoning through problems without external aids.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            Can anyone improve visualization skills, or is it innate?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            Almost everyone can significantly improve their visualization through structured practice. Memory Chess provides this structure with measurable progress metrics, allowing anyone (except those with aphantasia) to enhance their visualization skills regardless of starting ability. Many Memory Chess users report dramatic improvements from consistent practice, confirming this skill is learnable, not just innate.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-8" className="border-bg-light">
          <AccordionTrigger className="text-left font-medium text-base sm:text-lg py-3 px-2 sm:py-4 text-text-primary hover:text-peach-500">
            How much time should I dedicate to visualization practice?
          </AccordionTrigger>
          <AccordionContent className="text-text-secondary text-sm sm:text-base px-2 pb-6">
            Memory Chess sessions as brief as 10-15 minutes daily can yield significant improvements. The platform&apos;s game-like format makes consistent practice enjoyable rather than tedious. Users typically see progress within weeks of regular engagement, making it an efficient use of limited practice time compared to unstructured visualization exercises.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
} 