import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  EditorialActionLink,
  EditorialPageShell,
} from "@/components/editorial/EditorialPage";
import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";
import {
  type LearnComparisonRow,
  type LearnPageContent,
} from "@/lib/seo/learn/schema";
import type { LearnGoal } from "@/lib/seo/learn";
import { learnContentLocale } from "@/lib/seo/learn";
import { languageTag, localizedUrl } from "@/lib/seo/alternates";
import LearnArticleTracking from "@/components/learn/LearnArticleTracking";

const SITE_URL = "https://thememorychess.com";

type LearnArticleProps = {
  page: LearnPageContent;
  goals: LearnGoal[];
  /** Every article in the same locale, used to resolve the "read next" links. */
  allPages: LearnPageContent[];
  locale: string;
};

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
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

export default function LearnArticleRich({
  page,
  goals,
  allPages,
  locale,
}: LearnArticleProps) {
  const t = useTranslations("learnArticle");
  const goalsById = new Map(goals.map((entry) => [entry.id, entry]));
  const goal = goalsById.get(page.goal)!;
  // Page-scoped identifiers follow the locale the reader is actually on, so
  // the JSON-LD agrees with the localized canonical instead of claiming the
  // German page is the English document. Organization nodes below stay on the
  // bare origin: publisher and author are one entity site-wide, and a
  // per-locale @id would split one organization into twenty-four.
  const contentLocale = learnContentLocale(locale);
  const homeUrl = localizedUrl("/", contentLocale);
  const hubUrl = localizedUrl("/learn", contentLocale);
  const articleUrl = localizedUrl(`/learn/${page.slug}`, contentLocale);
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
        inLanguage: languageTag(contentLocale),
        isAccessibleForFree: true,
        articleSection: goal.label,
        author: {
          "@type": "Person",
          "@id": `${SITE_URL}/about#bing-cheng`,
          name: "Bing Cheng",
          url: `${SITE_URL}/about`,
        },
        reviewedBy: {
          "@type": "Person",
          "@id": `${SITE_URL}/about#bing-cheng`,
          name: page.reviewedBy,
          url: `${SITE_URL}/about`,
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
        about: page.painPoint,
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
      {
        "@type": "FAQPage",
        "@id": `${articleUrl}#faq-schema`,
        mainEntity: page.faq.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer },
        })),
      },
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
              {t("updated", { date: formatDate(page.updatedAt, locale) })}
            </time>
            <span>{t("reviewedBy", { name: page.reviewedBy })}</span>
          </div>
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

        {page.contentSections.map((section, sectionIndex) => (
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

            {section.paragraphs ? (
              <div className="max-w-[68ch] space-y-5 text-base leading-8 text-text-secondary">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {section.orderedBullets ? (
              <ol className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {section.orderedBullets.map((bullet, index) => (
                  <li
                    key={bullet}
                    className="grid grid-cols-[2rem_1fr] gap-4 py-5 text-base leading-7 text-text-secondary"
                  >
                    <span className="font-mono text-xs tabular-nums text-peach-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ol>
            ) : null}

            {section.bullets ? (
              <ul className="mt-6 space-y-3">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="grid grid-cols-[auto_1fr] gap-3 text-base leading-7 text-text-secondary"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-3 h-1 w-1 rounded-full bg-peach-400"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.drillCards ? (
              <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
                {section.drillCards.map((drill, index) => (
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
                        {drill.description}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-text-muted">
                        <span className="font-medium text-text-secondary">
                          {t("aimFor")}
                        </span>{" "}
                        {drill.goal}
                      </p>
                    </div>
                    <Link
                      href={drill.href}
                      data-learn-cta={`section-drill-${section.id}`}
                      className={`${EDITORIAL_STYLES.link} self-start text-sm`}
                    >
                      {drill.ctaLabel}
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}

            {section.comparisonRows ? (
              <div className={`${EDITORIAL_STYLES.tableFrame} mt-7`}>
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <thead className="bg-white/[0.03]">
                    <tr>
                      {section.comparisonColumns?.map((column) => (
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
                  <tbody>{renderComparisonRows(section.comparisonRows)}</tbody>
                </table>
              </div>
            ) : null}

            {section.planSteps ? (
              <ol className="mt-7 divide-y divide-white/10 border-y border-white/10">
                {section.planSteps.map((step, index) => (
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
            ) : null}

            {section.callout ? (
              <aside className={`${EDITORIAL_STYLES.callout} mt-7`}>
                <h3 className={EDITORIAL_STYLES.subsectionTitle}>
                  {section.callout.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-text-secondary sm:text-base">
                  {section.callout.body}
                </p>
              </aside>
            ) : null}

            {sectionIndex === 1 ? (
              <aside className="mt-8 border-y border-peach-500/20 py-6">
                <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-2`}>
                  {t("tryItNow")}
                </p>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xl">
                    <h3 className="text-lg font-semibold text-white">
                      {t("tryItNowTitle")}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-text-muted">
                      {t("tryItNowBody")}
                    </p>
                  </div>
                  <EditorialActionLink
                    href={page.ctaHref}
                    trackingName="mid-article"
                  >
                    {t("startTrainingRound")}
                  </EditorialActionLink>
                </div>
              </aside>
            ) : null}
          </section>
        ))}

        <section className={EDITORIAL_STYLES.section}>
          <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
            {t("keepLearning")}
          </p>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>
            {t("whatToLearnNext")}
          </h2>
          <p className="mt-3 text-base leading-7 text-text-muted">
            {t("whatToLearnNextBody")}
          </p>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {relatedPages.map((entry) => (
              <article key={entry.slug} className="py-5">
                <p className="text-xs font-medium uppercase tracking-wider text-peach-300">
                  {goalsById.get(entry.page.goal)?.label}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {entry.page.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {entry.reason}
                </p>
                <Link
                  href={`/learn/${entry.slug}`}
                  data-learn-link={entry.slug}
                  className={`${EDITORIAL_STYLES.link} mt-3 inline-block text-sm`}
                >
                  {t("readThisGuide")}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={EDITORIAL_STYLES.section}>
          <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
            {t("putItOnTheBoard")}
          </p>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>{t("practiceTitle")}</h2>
          <p className="mt-3 text-base leading-7 text-text-muted">
            {t("practiceBody")}
          </p>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {page.relatedDrills.map((drill) => (
              <article key={`${page.slug}-${drill.title}`} className="py-5">
                <p className="text-xs font-medium uppercase tracking-wider text-peach-300">
                  {drill.duration}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {drill.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {drill.description}
                </p>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  <span className="font-medium text-text-secondary">
                    {t("goalLabel")}
                  </span>{" "}
                  {drill.goal}
                </p>
                <Link
                  href={drill.href}
                  data-learn-cta="end-drill"
                  className={`${EDITORIAL_STYLES.link} mt-3 inline-block text-sm`}
                >
                  {drill.ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className={EDITORIAL_STYLES.section}>
          <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
            {t("commonQuestions")}
          </p>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>{t("faqLabel")}</h2>
          <Accordion type="single" collapsible className="mt-6 w-full">
            {page.faq.map((entry, index) => (
              <AccordionItem
                key={entry.question}
                value={`item-${index}`}
                className="border-white/10"
              >
                <AccordionTrigger className="text-left text-base font-semibold leading-6 text-white hover:text-peach-200 hover:no-underline">
                  {entry.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-[68ch] text-sm leading-7 text-text-secondary sm:text-base">
                  {entry.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className={EDITORIAL_STYLES.section}>
          <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
            {t("editorialNotes")}
          </p>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>
            {t("aboutThisGuide")}
          </h2>
          <div className="mt-5 max-w-[68ch] space-y-4 text-sm leading-7 text-text-muted sm:text-base">
            <p>{t("aboutBody")}</p>
            <p>
              {t("publishedLine", {
                published: formatDate(page.publishedAt, locale),
                updated: formatDate(page.updatedAt, locale),
                reviewer: page.reviewedBy,
              })}
            </p>
          </div>

          <h2 className="mt-9 text-xl font-semibold tracking-tight text-white">
            {t("referenceLinks")}
          </h2>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {page.sources.map((source) => (
              <li key={source.url} className="py-4">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={EDITORIAL_STYLES.link}
                >
                  {source.title}
                </a>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {source.note}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </EditorialPageShell>
  );
}
