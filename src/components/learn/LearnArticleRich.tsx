import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  EditorialActionLink,
  EditorialPageShell,
} from "@/components/editorial/EditorialPage";
import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";
import {
  gameHref,
  LEARN_AUTHOR,
  LEARN_AUTHORSHIP_NOTE,
  type LearnBlock,
  type LearnComparisonRow,
  type LearnInlineLink,
  type LearnPageContent,
} from "@/lib/seo/learn/schema";
import type { LearnGoal } from "@/lib/seo/learn";
import LearnArticleTracking from "@/components/learn/LearnArticleTracking";

const SITE_URL = "https://thememorychess.com";
const AUTHOR_PATH = new URL(LEARN_AUTHOR.url).pathname;

type LearnArticleProps = {
  page: LearnPageContent;
  goals: LearnGoal[];
  /** Every article, used to resolve the "read next" links. */
  allPages: LearnPageContent[];
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function buildRelatedPageData(
  page: LearnPageContent,
  allPages: LearnPageContent[],
) {
  return page.relatedArticles
    .map((entry) => {
      const relatedPage = allPages.find(
        (candidate) => candidate.slug === entry.slug,
      );

      return relatedPage ? { ...entry, page: relatedPage } : null;
    })
    .filter(Boolean) as Array<{
    slug: string;
    reason: string;
    page: LearnPageContent;
  }>;
}

function withInlineLink(text: string, link?: LearnInlineLink) {
  const at = link ? text.indexOf(link.phrase) : -1;
  if (!link || at === -1) return text;

  return (
    <>
      {text.slice(0, at)}
      <Link href={link.href} className={EDITORIAL_STYLES.link}>
        {link.phrase}
      </Link>
      {text.slice(at + link.phrase.length)}
    </>
  );
}

function renderComparisonRows(rows: LearnComparisonRow[]) {
  return rows.map((row) => (
    <tr key={row.label} className="border-t border-white/10">
      <th
        scope="row"
        className="px-4 py-4 text-left align-top text-sm font-medium text-white"
      >
        {row.label}
      </th>
      <td className="px-4 py-4 align-top text-sm leading-6 text-text-secondary">
        {row.struggling}
      </td>
      <td className="px-4 py-4 align-top text-sm leading-6 text-text-secondary">
        {row.stronger}
      </td>
    </tr>
  ));
}

function LearnBlockView({
  block,
  sectionId,
  aimForLabel,
}: {
  block: LearnBlock;
  sectionId: string;
  aimForLabel: string;
}) {
  switch (block.kind) {
    case "paragraphs":
      return (
        <div className="max-w-[68ch] space-y-5 text-base leading-8 text-text-secondary">
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph}>{withInlineLink(paragraph, block.link)}</p>
          ))}
        </div>
      );
    case "steps":
      return block.ordered ? (
        <ol className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {block.items.map((item, index) => (
            <li
              key={item}
              className="grid grid-cols-[2rem_1fr] gap-4 py-5 text-base leading-7 text-text-secondary"
            >
              <span className="font-mono text-xs tabular-nums text-peach-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-6 space-y-3">
          {block.items.map((item) => (
            <li
              key={item}
              className="grid grid-cols-[auto_1fr] gap-3 text-base leading-7 text-text-secondary"
            >
              <span
                aria-hidden="true"
                className="mt-3 h-1 w-1 rounded-full bg-peach-400"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "drills":
      return (
        <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
          {block.drills.map((drill, index) => (
            <article
              key={drill.title}
              className="grid gap-4 py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:gap-5"
            >
              <span className="font-mono text-xs tabular-nums text-peach-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-peach-300">
                  {drill.duration}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {drill.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {withInlineLink(drill.description, drill.link)}
                </p>
                <p className="mt-3 text-sm leading-6 text-text-muted">
                  <span className="font-medium text-text-secondary">
                    {aimForLabel}
                  </span>{" "}
                  {drill.goal}
                </p>
              </div>
              {drill.setup ? (
                <Link
                  href={gameHref(drill.setup)}
                  data-learn-cta={`section-drill-${sectionId}`}
                  className={`${EDITORIAL_STYLES.link} self-start text-sm`}
                >
                  {drill.ctaLabel}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      );
    case "comparison":
      return (
        <div className={`${EDITORIAL_STYLES.tableFrame} mt-7`}>
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <thead className="bg-white/[0.03]">
              <tr>
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted first:w-1/4"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{renderComparisonRows(block.rows)}</tbody>
          </table>
        </div>
      );
    case "plan":
      return (
        <ol className="mt-7 divide-y divide-white/10 border-y border-white/10">
          {block.steps.map((step, index) => (
            <li
              key={step.label}
              className="grid gap-3 py-5 sm:grid-cols-[2.5rem_9rem_1fr] sm:gap-5"
            >
              <span className="font-mono text-xs tabular-nums text-peach-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-peach-300">
                  {step.label}
                </p>
                <h3 className="mt-1 font-semibold text-white">
                  {step.duration}
                </h3>
              </div>
              <p className="text-sm leading-7 text-text-secondary">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <aside className={`${EDITORIAL_STYLES.callout} mt-7`}>
          <h3 className={EDITORIAL_STYLES.subsectionTitle}>{block.title}</h3>
          <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
            {block.body}
          </p>
        </aside>
      );
  }
}

export default function LearnArticleRich({
  page,
  goals,
  allPages,
}: LearnArticleProps) {
  const t = useTranslations("learnArticle");
  const goalsById = new Map(goals.map((entry) => [entry.id, entry]));
  const goal = goalsById.get(page.goal)!;
  const homeUrl = SITE_URL;
  const hubUrl = `${SITE_URL}/learn`;
  const articleUrl = `${hubUrl}/${page.slug}`;
  const socialImageUrl = `${articleUrl}/opengraph-image`;
  const relatedPages = buildRelatedPageData(page, allPages);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${articleUrl}#article`,
        headline: page.h1,
        name: page.title,
        description: page.description,
        image: {
          "@type": "ImageObject",
          url: socialImageUrl,
          width: 1200,
          height: 630,
        },
        datePublished: page.publishedAt,
        dateModified: page.updatedAt,
        inLanguage: "en-US",
        isAccessibleForFree: true,
        articleSection: goal.label,
        author: {
          "@type": "Person",
          "@id": LEARN_AUTHOR.id,
          name: LEARN_AUTHOR.name,
          url: LEARN_AUTHOR.url,
        },
        publisher: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Memory Chess",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/apple-touch-icon.png`,
          },
        },
        mainEntityOfPage: { "@id": `${articleUrl}#webpage` },
        keywords: [page.primaryKeyword, ...page.secondaryKeywords].join(", "),
      },
      {
        "@type": "WebPage",
        "@id": `${articleUrl}#webpage`,
        url: articleUrl,
        name: page.title,
        description: page.description,
        isPartOf: {
          "@type": "CollectionPage",
          "@id": `${hubUrl}#webpage`,
        },
        mainEntity: { "@id": `${articleUrl}#article` },
        breadcrumb: { "@id": `${articleUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Learn",
            item: hubUrl,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.title,
            item: articleUrl,
          },
        ],
      },
      ...(page.faq.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${articleUrl}#faq-schema`,
              mainEntity: page.faq.map((entry) => ({
                "@type": "Question",
                name: entry.question,
                acceptedAnswer: { "@type": "Answer", text: entry.answer },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <EditorialPageShell>
      <LearnArticleTracking page={page} />

      <article className={EDITORIAL_STYLES.wideColumn}>
        <nav aria-label="Breadcrumb" className="mb-9 text-sm text-text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-peach-300">
                {t("breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden="true" className="text-white/30">
              /
            </li>
            <li>
              <Link
                href="/learn"
                className="transition-colors hover:text-peach-300"
              >
                {t("breadcrumbLearn")}
              </Link>
            </li>
            <li aria-hidden="true" className="text-white/30">
              /
            </li>
            <li className="text-text-secondary" aria-current="page">
              {goal.label}
            </li>
          </ol>
        </nav>

        <header className="mb-10 sm:mb-12">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={EDITORIAL_STYLES.pill}>{goal.label}</span>
            <span className="text-xs text-text-muted">{page.timeToRead}</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span className="text-xs text-text-muted">{page.difficulty}</span>
          </div>
          <p className={`${EDITORIAL_STYLES.eyebrow} mb-4`}>{t("eyebrow")}</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {page.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-text-muted">
            {page.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-muted">
            <time dateTime={page.updatedAt}>
              {t("updated", { date: formatDate(page.updatedAt) })}
            </time>
          </div>
          <p data-learn-byline className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
            By{" "}
            <Link href={AUTHOR_PATH} className={EDITORIAL_STYLES.link}>
              {LEARN_AUTHOR.name}
            </Link>
            . {LEARN_AUTHORSHIP_NOTE}
          </p>
        </header>

        <section
          aria-labelledby="quick-answer-heading"
          className={`${EDITORIAL_STYLES.callout} mb-10 sm:mb-12`}
        >
          <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
            {t("startHere")}
          </p>
          <h2
            id="quick-answer-heading"
            className="text-xl font-semibold leading-8 tracking-tight text-white sm:text-2xl"
          >
            {page.quickAnswer}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-8">
            {page.keyTakeaways?.length ? (
            <div>
              <h3 className="text-sm font-semibold text-white">
                {t("whatYouWillLearn")}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {page.keyTakeaways.map((takeaway) => (
                  <li
                    key={takeaway}
                    className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-text-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1 w-1 rounded-full bg-peach-400"
                    />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
            ) : null}
            {page.whoThisIsFor?.length ? (
            <div>
              <h3 className="text-sm font-semibold text-white">
                {t("whoThisIsFor")}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {page.whoThisIsFor.map((item) => (
                  <li
                    key={item}
                    className="grid grid-cols-[auto_1fr] gap-3 text-sm leading-6 text-text-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1 w-1 rounded-full bg-peach-400"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <EditorialActionLink
              href={page.ctaHref}
              trackingName="hero-primary"
            >
              {page.ctaLabel}
            </EditorialActionLink>
            <EditorialActionLink
              href="/learn"
              variant="secondary"
              trackingName="hero-secondary"
            >
              {t("browseAllGuides")}
            </EditorialActionLink>
          </div>
        </section>

        <nav
          aria-labelledby="on-this-page-heading"
          className="mb-2 border-y border-white/10 py-6"
        >
          <p
            id="on-this-page-heading"
            className={`${EDITORIAL_STYLES.subsectionTitle} mb-4`}
          >
            {t("onThisPage")}
          </p>
          <ol className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {page.tableOfContents.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={`#${item.id}`}
                  className="group flex items-baseline gap-3 text-sm leading-6 text-text-secondary transition-colors hover:text-peach-200"
                >
                  <span className="font-mono text-xs tabular-nums text-peach-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="underline decoration-white/15 underline-offset-4 group-hover:decoration-peach-400/40">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {page.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className={EDITORIAL_STYLES.section}
          >
            <header className="mb-6">
              {section.eyebrow ? (
                <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
                  {section.eyebrow}
                </p>
              ) : null}
              <h2 className={EDITORIAL_STYLES.sectionTitle}>{section.title}</h2>
              {section.summary ? (
                <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">
                  {section.summary}
                </p>
              ) : null}
            </header>

            {section.blocks.map((block, blockIndex) => (
              <LearnBlockView
                key={`${section.id}-${blockIndex}`}
                block={block}
                sectionId={section.id}
                aimForLabel={t("aimFor")}
              />
            ))}
          </section>
        ))}

        <section className={EDITORIAL_STYLES.section}>
          <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
            {t("keepLearning")}
          </p>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>
            {t("whatToLearnNext")}
          </h2>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {relatedPages.map((entry) => (
              <article key={entry.slug} className="py-5">
                <p className="text-xs font-medium uppercase tracking-wider text-peach-300">
                  {goalsById.get(entry.page.goal)?.label}
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  <Link
                    href={`/learn/${entry.slug}`}
                    data-learn-link={entry.slug}
                    className="text-white transition-colors hover:text-peach-200"
                  >
                    {entry.page.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {entry.reason}
                </p>
              </article>
            ))}
          </div>
        </section>

        {page.faq.length > 0 ? (
        <section id="faq" className={EDITORIAL_STYLES.section}>
          <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
            {t("commonQuestions")}
          </p>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>{t("faqLabel")}</h2>
          {/*
            Native details/summary instead of the Radix accordion: Radix
            unmounts closed content, so the served HTML carried the questions
            and none of the answers. Here every answer is in the DOM and
            toggling works with no JavaScript at all.
          */}
          <div className="mt-6 w-full">
            {page.faq.map((entry) => (
              <details
                key={entry.question}
                className="group border-b border-white/10"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-semibold leading-6 text-white transition-all hover:text-peach-200 [&::-webkit-details-marker]:hidden">
                  {entry.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="max-w-[68ch] pb-4 text-sm leading-7 text-text-secondary sm:text-base">
                  {entry.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
        ) : null}

        {page.sources.length > 0 ? (
        <section className={EDITORIAL_STYLES.section}>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {t("referenceLinks")}
          </h2>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {page.sources.map((source) => (
              <li key={source.url} className="py-4">
                <cite className="not-italic">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={EDITORIAL_STYLES.link}
                  >
                    {source.title}
                  </a>
                </cite>
                {source.note ? (
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {source.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
        ) : null}
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </EditorialPageShell>
  );
}
