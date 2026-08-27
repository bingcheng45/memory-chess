#!/usr/bin/env node
/**
 * Derives the translatable prose skeleton from the English Learn articles.
 *
 * Structural fields (slug, goal, difficulty, featured, drill hrefs,
 * relatedArticles slugs, source urls) are intentionally excluded: they must be
 * identical across locales, so translators never see them and cannot break
 * them. Academic source titles are excluded too -- papers keep their published
 * English titles.
 *
 * Usage: node scripts/extract-learn-prose.mjs > src/lib/seo/learn/prose/en.json
 */
import { EN_GUIDES } from "../src/lib/seo/learn/content.en.ts";

const prose = EN_GUIDES.map((g) => ({
  slug: g.slug, // present for alignment only; never translated
  title: g.title,
  h1: g.h1,
  description: g.description,
  primaryKeyword: g.primaryKeyword,
  secondaryKeywords: g.secondaryKeywords,
  painPoint: g.painPoint,
  ctaLabel: g.ctaLabel,
  quickAnswer: g.quickAnswer,
  keyTakeaways: g.keyTakeaways,
  whoThisIsFor: g.whoThisIsFor,
  timeToRead: g.timeToRead,
  introParagraphs: g.introParagraphs,
  startHereTitle: g.startHereTitle,
  startHereSteps: g.startHereSteps,
  drillSectionTitle: g.drillSectionTitle,
  drillCards: g.drillCards.map((d) => ({
    title: d.title,
    description: d.description,
    duration: d.duration,
    goal: d.goal,
    ctaLabel: d.ctaLabel,
  })),
  comparisonTitle: g.comparisonTitle,
  comparisonSummary: g.comparisonSummary,
  comparisonRows: g.comparisonRows.map((r) => ({
    label: r.label,
    struggling: r.struggling,
    stronger: r.stronger,
  })),
  mistakes: g.mistakes,
  mistakesCallout: g.mistakesCallout,
  planTitle: g.planTitle,
  planSteps: g.planSteps.map((s) => ({
    label: s.label,
    duration: s.duration,
    detail: s.detail,
  })),
  faq: g.faq.map((f) => ({ question: f.question, answer: f.answer })),
  relatedArticles: g.relatedArticles.map((r) => ({ reason: r.reason })),
}));

process.stdout.write(JSON.stringify(prose, null, 2) + "\n");
