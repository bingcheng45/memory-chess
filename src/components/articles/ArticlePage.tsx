import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { ViewCount } from "@/components/articles/ArticleCounts";
import ArticleLink from "@/components/articles/ArticleLink";
import ArticleRail from "@/components/articles/ArticleRail";
import ArrivingPortrait from "@/components/articles/ArrivingPortrait";
import EnglishPageLink from "@/components/articles/EnglishPageLink";
import FactFile from "@/components/articles/FactFile";
import LikeButton from "@/components/articles/LikeButton";
import TranslationNote from "@/components/articles/TranslationNote";
import TypedBody from "@/components/articles/TypedBody";
import ViewBeacon from "@/components/articles/ViewBeacon";
import { ARTICLE_FOCUS_RING, ARTICLE_LINK, ARTICLE_LONG_WORDS } from "@/components/articles/articleStyles";
import { EditorialPageShell } from "@/components/editorial/EditorialPage";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { formatArticleDate } from "@/lib/articles/format";
import { articlePath } from "@/lib/articles/paths";
import type {
  Article,
  ArticleDrill,
  ArticleSource,
  ArticleSummary,
  PhotoCredit,
} from "@/lib/articles/schema";
import type { ArticleCounts } from "@/lib/articles/stats";
import { buildArticleStructuredData } from "@/lib/articles/structuredData";
import { gameHref, LEARN_AUTHOR } from "@/lib/seo/learn/schema";
import "./articlePage.css";

type ArticlePageProps = {
  article: Article;
  nextArticle?: ArticleSummary;
  counts?: ArticleCounts;
  /** How fast the body types. A translation's rate is set so it takes as long as the English body. */
  charsPerSecond?: number;
};

const SOURCES_HEADING_ID = "article-sources-heading";
const DRILL_WHY_ID = "article-drill-why";
const NOTE_CLASS = "max-w-2xl";
const AUTHOR_PATH = new URL(LEARN_AUTHOR.url).pathname;

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={ARTICLE_LINK}>
      {children}
    </a>
  );
}

function Credit({ credit }: { credit: PhotoCredit }) {
  const t = useTranslations("articles.page");
  const { author, license, licenseUrl, sourceUrl, changes } = credit;

  return (
    <cite className="mt-1.5 block text-[11.5px] not-italic leading-normal text-text-muted">
      {t.rich("photoCredit", {
        author,
        license,
        changes,
        licenseLink: (name) => (licenseUrl === null ? name : <ExternalLink href={licenseUrl}>{name}</ExternalLink>),
        source: (name) => <ExternalLink href={sourceUrl}>{name}</ExternalLink>,
      })}
    </cite>
  );
}

function Portrait({ article }: { article: Article }) {
  const { slug, photo, person } = article;
  const { src, width, height, alt } = photo;

  return (
    <figure className="row-start-1 mb-[22px] max-w-[190px] min-[821px]:mb-0 min-[821px]:max-w-none">
      <ArrivingPortrait key={slug} slug={slug} photo={{ src, width, height, alt }} />
      <figcaption className={`mt-3 text-sm leading-[1.4] text-text-muted ${ARTICLE_LONG_WORDS}`}>
        <b className="block font-semibold text-text-secondary">{person.name}</b>
        <span>{person.role}</span>
        <Credit credit={photo} />
      </figcaption>
    </figure>
  );
}

function HeadingBlock({ article, counts }: Pick<ArticlePageProps, "article" | "counts">) {
  const t = useTranslations("articles.page");
  const locale = useLocale();

  return (
    <header className="row-start-2 min-[821px]:col-start-2 min-[821px]:row-start-1">
      <p className="text-sm text-peach-500">
        <time dateTime={article.publishedAt} data-flight="date" className="inline-block">
          {formatArticleDate(article.publishedAt, locale)}
        </time>
      </p>
      <h1
        data-flight="title"
        className={`mt-2.5 text-[clamp(30px,4.6vw,48px)] font-bold leading-[1.06] tracking-[-0.025em] text-white [text-wrap:balance] ${ARTICLE_LONG_WORDS}`}
      >
        {article.title}
      </h1>
      <p className="mt-4 max-w-[58ch] text-[19px] leading-normal text-text-muted">{article.description}</p>
      <div className="mt-[18px] text-sm leading-6 text-text-muted">
        <address data-article-byline className="not-italic">
          {t.rich("byline", {
            name: LEARN_AUTHOR.name,
            author: (name) => <EnglishPageLink href={AUTHOR_PATH}>{name}</EnglishPageLink>,
          })}
        </address>
        <p data-authorship-note className={NOTE_CLASS}>
          {t("authorshipNote")}
        </p>
        <TranslationNote englishPath={articlePath(article.slug)} className={NOTE_CLASS} />
      </div>
      <div
        data-article-counts
        className="mt-4 flex flex-wrap items-center gap-x-[18px] gap-y-2.5 text-sm text-text-muted [font-variant-numeric:tabular-nums]"
      >
        <ViewCount count={counts?.views} />
        <LikeButton key={article.slug} slug={article.slug} likes={counts?.likes} />
      </div>
    </header>
  );
}

function Drill({ drill }: { drill: ArticleDrill }) {
  const t = useTranslations("articles.page");
  const action = t("drillAction", { pieces: drill.pieceCount, seconds: drill.memorizeTime });

  return (
    <aside className="mt-10 max-w-[720px]">
      <Link
        href={gameHref(drill)}
        data-article-drill
        aria-label={action}
        aria-describedby={DRILL_WHY_ID}
        className={`group flex flex-wrap items-center justify-between gap-3.5 rounded-[18px] border border-peach-500/25 bg-peach-500/10 p-[22px] hover:border-peach-400/50 ${ARTICLE_FOCUS_RING}`}
      >
        <span className="min-w-0 flex-[1_1_260px] text-[15.5px] leading-[1.45] text-text-muted">
          <b className="block text-lg font-semibold text-white">{t("drillHeading")}</b>
          <span id={DRILL_WHY_ID}>{drill.why}</span>
        </span>
        <span className="inline-flex min-h-[46px] items-center rounded-full bg-peach-500 px-5 font-semibold text-bg-dark group-hover:bg-peach-400">
          {action}
        </span>
      </Link>
    </aside>
  );
}

function Sources({ sources }: { sources: readonly ArticleSource[] }) {
  const t = useTranslations("articles.page");
  const titleLang = useLocale() === DEFAULT_LOCALE ? undefined : DEFAULT_LOCALE;

  return (
    <section aria-labelledby={SOURCES_HEADING_ID} className="mt-12 max-w-[720px] border-t border-white/10 pt-8">
      <h2 id={SOURCES_HEADING_ID} className="text-xl font-semibold tracking-tight text-white">
        {t("sources")}
      </h2>
      <ol className="mt-4 divide-y divide-white/10 border-t border-white/10">
        {sources.map((source) => (
          <li key={source.url} className="py-4">
            <cite lang={titleLang} className="not-italic">
              <ExternalLink href={source.url}>{source.title}</ExternalLink>
            </cite>
            <p className="mt-2 text-sm leading-6 text-text-muted">{source.note}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NextArticle({ next }: { next: ArticleSummary }) {
  const t = useTranslations("articles.page");

  return (
    <ArticleLink
      article={next.slug}
      portrait={next.photo}
      className={`group mt-7 block max-w-[720px] rounded border-t border-white/10 pt-5 text-[13px] text-text-muted ${ARTICLE_FOCUS_RING}`}
    >
      {t("nextArticle")}
      <b className="mt-1 block text-lg font-semibold leading-[1.3] text-white group-hover:text-peach-300">
        {next.title}
      </b>
    </ArticleLink>
  );
}

export default function ArticlePage({ article, nextArticle, counts, charsPerSecond }: ArticlePageProps) {
  const t = useTranslations("articles");
  const locale = useLocale();
  const structuredData = buildArticleStructuredData(article, locale, t("list.heading"));

  return (
    <EditorialPageShell mainClassName="!max-w-[1080px]">
      <ArticleLink
        backFrom={article.slug}
        className={`mb-2.5 mt-1.5 inline-flex min-h-11 items-center gap-2 rounded text-sm text-text-muted hover:text-peach-300 ${ARTICLE_FOCUS_RING}`}
      >
        <span aria-hidden="true">←</span>
        {t("page.backToList")}
      </ArticleLink>
      <article
        data-article-flight=""
        className="grid grid-cols-[minmax(0,1fr)] min-[821px]:grid-cols-[280px_minmax(0,1fr)] min-[821px]:items-start min-[821px]:gap-x-14"
      >
        <HeadingBlock article={article} counts={counts} />
        <ArticleRail>
          <Portrait article={article} />
          <FactFile facts={article.facts} className="row-start-3 mt-7 min-[821px]:mt-[22px]" />
        </ArticleRail>
        <div className="row-start-4 min-[821px]:col-start-2 min-[821px]:row-start-2">
          <TypedBody
            key={article.slug}
            slug={article.slug}
            sections={article.sections}
            charsPerSecond={charsPerSecond}
          />
          <Drill drill={article.drill} />
          <Sources sources={article.sources} />
          {nextArticle ? <NextArticle next={nextArticle} /> : null}
        </div>
      </article>
      <ViewBeacon slug={article.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </EditorialPageShell>
  );
}
