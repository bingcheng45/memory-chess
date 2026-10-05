import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ArticleList from "@/components/articles/ArticleList";
import TranslationNote from "@/components/articles/TranslationNote";
import { ARTICLE_LINK } from "@/components/articles/articleStyles";
import { sortedFirstPaintInlineScript } from "@/components/articles/sortedFirstPaint";
import { EditorialPageShell } from "@/components/editorial/EditorialPage";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ARTICLE_SLUGS, getArticleSummaries, type ArticleListMeta } from "@/lib/articles";
import { ARTICLES_PATH } from "@/lib/articles/paths";
import { buildArticleListStructuredData } from "@/lib/articles/structuredData";
import { servesArticlesIn } from "@/lib/articles/articleLocales";
import { buildArticleListMetadata } from "@/lib/seo/articleMetadata";
import { getArticleStats } from "@/lib/services/articleStatsService";

export const revalidate = 300;

const ABOUT_HEADING_ID = "articles-about-heading";
const ABOUT_PARAGRAPH_CLASS = "mt-4 text-base leading-7 text-text-secondary";
const ABOUT_PARAGRAPHS = ["about1", "about2", "about3"] as const;
const CORRECTIONS_PATH = "/contact-us";

type ArticlesRouteProps = { params: Promise<{ locale: string }> };

async function listCopy(locale: Locale): Promise<{ heading: string; sub: string; meta: ArticleListMeta }> {
  const t = await getTranslations({ locale, namespace: "articles" });

  return {
    heading: t("list.heading"),
    sub: t("list.sub"),
    meta: { title: t("meta.title"), description: t("meta.description") },
  };
}

export async function generateMetadata({ params }: ArticlesRouteProps): Promise<Metadata> {
  const { locale } = await params;
  if (!servesArticlesIn(locale)) notFound();
  const [copy, [newest]] = await Promise.all([listCopy(locale), getArticleSummaries(locale)]);

  return buildArticleListMetadata(newest, locale, copy.meta);
}

function About() {
  const t = useTranslations("articles.list");

  return (
    <section
      aria-labelledby={ABOUT_HEADING_ID}
      className="mt-14 max-w-[66ch] border-t border-white/10 pt-10"
    >
      <h2 id={ABOUT_HEADING_ID} className="text-xl font-semibold tracking-tight text-white">
        {t("aboutHeading")}
      </h2>
      {ABOUT_PARAGRAPHS.map((paragraph) => (
        <p key={paragraph} className={ABOUT_PARAGRAPH_CLASS}>
          {t(paragraph)}
        </p>
      ))}
      <p className={ABOUT_PARAGRAPH_CLASS}>
        {t.rich("corrections", {
          link: (label) => (
            <Link href={CORRECTIONS_PATH} className={ARTICLE_LINK}>
              {label}
            </Link>
          ),
        })}
      </p>
      <TranslationNote englishPath={ARTICLES_PATH} className={ABOUT_PARAGRAPH_CLASS} />
    </section>
  );
}

export default async function ArticlesPage({ params }: ArticlesRouteProps) {
  const { locale } = await params;
  // Without this next-intl reads the locale from the request headers, and a
  // page that reads headers is rendered on every request instead of at build.
  setRequestLocale(locale);
  if (!servesArticlesIn(locale)) notFound();
  const [copy, articles, stats] = await Promise.all([
    listCopy(locale),
    getArticleSummaries(locale),
    getArticleStats(ARTICLE_SLUGS),
  ]);

  return (
    <EditorialPageShell>
      <script dangerouslySetInnerHTML={{ __html: sortedFirstPaintInlineScript() }} />
      <ArticleList
        articles={articles}
        stats={stats}
        heading={
          <header>
            <h1 className="text-[clamp(30px,5vw,44px)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
              {copy.heading}
            </h1>
            <p className="mt-2 text-text-muted">{copy.sub}</p>
          </header>
        }
      />
      <About />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArticleListStructuredData(articles, locale, copy.meta)),
        }}
      />
    </EditorialPageShell>
  );
}
