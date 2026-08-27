import { Link } from "@/i18n/navigation";
import {
  EditorialActionLink,
  EditorialHero,
  EditorialPageShell,
} from "@/components/editorial/EditorialPage";
import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";
import { useTranslations } from "next-intl";
import type { LearnPageContent } from "@/lib/seo/learn/schema";
import type { LearnGoal } from "@/lib/seo/learn";
import { learnContentLocale } from "@/lib/seo/learn";
import { languageTag, localizedUrl } from "@/lib/seo/alternates";

const SITE_URL = "https://thememorychess.com";

// `id` keys into the `learnHub.paths` messages; `href` is language-neutral.
// Slugs stay English across every locale so inbound links keep working.
const QUICK_STARTS = [
  { id: "newToChess", href: "/learn/how-to-get-better-at-chess-for-beginners" },
  { id: "missingThreats", href: "/learn/chess-board-vision-drills" },
  { id: "losingPosition", href: "/learn/chess-visualization-exercises" },
] as const;


type LearnHubSchemaInput = {
  allPages: LearnPageContent[];
  locale: string;
  name: string;
  description: string;
};

/**
 * Page-scoped nodes carry the active locale so the hub's JSON-LD agrees with
 * its own canonical and with the sitemap. The WebSite node keeps the bare
 * origin -- it is one entity for the whole site, not one per language.
 */
function buildLearnHubSchema({
  allPages,
  locale,
  name,
  description,
}: LearnHubSchemaInput) {
  const homeUrl = localizedUrl("/", locale);
  const hubUrl = localizedUrl("/learn", locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${hubUrl}#webpage`,
        url: hubUrl,
        name,
        description,
        inLanguage: languageTag(locale),
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "Memory Chess",
          url: SITE_URL,
        },
        mainEntity: { "@id": `${hubUrl}#guides` },
      },
      {
        "@type": "ItemList",
        "@id": `${hubUrl}#guides`,
        name: "Memory Chess learning guides",
        numberOfItems: allPages.length,
        itemListElement: allPages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: page.title,
          url: localizedUrl(`/learn/${page.slug}`, locale),
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Learn",
            item: hubUrl,
          },
        ],
      },
    ],
  };
}

type LearnHubProps = {
  allPages: LearnPageContent[];
  goals: LearnGoal[];
  locale: string;
};

export default function LearnHubPageContent({
  allPages,
  goals,
  locale,
}: LearnHubProps) {
  const t = useTranslations("learnHub");
  const learnHubSchema = buildLearnHubSchema({
    allPages,
    locale: learnContentLocale(locale),
    name: t("meta.title"),
    description: t("meta.description"),
  });
  return (
    <EditorialPageShell>
      <EditorialHero
        eyebrow="Learn with Memory Chess"
        title={t("title")}
        description="Choose what you want to improve. Each guide explains one useful idea in plain English, then gives you a short drill to try."
      >
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <EditorialActionLink href="/learn/how-to-get-better-at-chess-for-beginners">{t("startBeginner")}</EditorialActionLink>
          <EditorialActionLink href="/game" variant="secondary">{t("playCta")}</EditorialActionLink>
        </div>
      </EditorialHero>

      <div className={EDITORIAL_STYLES.wideColumn}>
        <section aria-labelledby="next-step-heading" className="pb-10 sm:pb-12">
          <div className="mb-7">
            <p className={`${EDITORIAL_STYLES.eyebrow} mb-3`}>{t("startHere")}</p>
            <h2
              id="next-step-heading"
              className={EDITORIAL_STYLES.sectionTitle}
            >{t("pickNext")}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">
              Choose the sentence that sounds most like your current game. There
              is no perfect order, and you can change paths at any time.
            </p>
          </div>

          <ol className="border-y border-white/10">
            {QUICK_STARTS.map((item, index) => (
              <li
                key={item.id}
                className="border-b border-white/10 last:border-b-0"
              >
                <Link
                  href={item.href}
                  className="group grid gap-3 py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:items-start sm:gap-5"
                >
                  <span className="font-mono text-xs tabular-nums text-peach-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-peach-300">
                      {t(`paths.${item.id}.label`)}
                    </span>
                    <span className="mt-1 block text-xl font-semibold tracking-tight text-white">
                      {t(`paths.${item.id}.title`)}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-text-muted sm:text-base sm:leading-7">
                      {t(`paths.${item.id}.description`)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden pt-6 text-xl text-peach-400 transition-transform group-hover:translate-x-1 sm:block"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="choose-goal-heading"
          className="border-t border-white/10 pt-10 sm:pt-12"
        >
          <div className="mb-3">
            <p className={`${EDITORIAL_STYLES.eyebrow} mb-3`}>
              All {allPages.length} guides
            </p>
            <h2
              id="choose-goal-heading"
              className={EDITORIAL_STYLES.sectionTitle}
            >{t("chooseGoal")}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">
              Each path moves from a simple first exercise toward a more
              complete practice habit.
            </p>
          </div>

          {goals.map((goal) => {
            const goalId = goal.id;
            const pages = allPages.filter((page) => page.goal === goalId);

            return (
              <section
                key={goalId}
                id={goalId}
                aria-labelledby={`${goalId}-heading`}
                className={EDITORIAL_STYLES.section}
              >
                <p className={`${EDITORIAL_STYLES.subsectionTitle} mb-3`}>
                  {goal.accent}
                </p>
                <h3
                  id={`${goalId}-heading`}
                  className="text-2xl font-semibold tracking-tight text-white"
                >
                  {goal.label}
                </h3>
                <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">
                  {goal.description}
                </p>

                <ol className="mt-7 divide-y divide-white/10 border-y border-white/10">
                  {pages.map((page, index) => (
                    <li key={page.slug}>
                      <Link
                        href={`/learn/${page.slug}`}
                        className="group grid gap-2 py-5 sm:grid-cols-[6rem_1fr_auto] sm:items-start sm:gap-5"
                      >
                        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                          Guide {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="block text-lg font-semibold leading-6 text-white transition-colors group-hover:text-peach-200">
                            {page.title}
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-text-muted">
                            {page.description}
                          </span>
                          <span className="mt-2 block text-xs text-text-muted">
                            {page.timeToRead} · {page.difficulty}
                          </span>
                        </span>
                        <span
                          aria-hidden="true"
                          className="hidden text-lg text-peach-400 transition-transform group-hover:translate-x-1 sm:block"
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </section>

        <section className="border-t border-white/10 pt-10 text-center sm:pt-12">
          <p className={`${EDITORIAL_STYLES.eyebrow} mb-3`}>{t("readRecallPlay")}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">{t("turnIdea")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-text-muted">
            Read one guide, play one short round while the idea is fresh, then
            notice what was easy to remember and what needs another try.
          </p>
          <div className="mt-6 flex justify-center">
            <EditorialActionLink href="/game">{t("startRound")}</EditorialActionLink>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(learnHubSchema) }}
      />
    </EditorialPageShell>
  );
}
