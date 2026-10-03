import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import ArticlePortrait from "@/components/articles/ArticlePortrait";
import FactFile from "@/components/articles/FactFile";
import { ARTICLE_FOCUS_RING, ARTICLE_LINK } from "@/components/articles/articleStyles";
import { EditorialPageShell } from "@/components/editorial/EditorialPage";
import { ARTICLE_COPY, formatArticleDate } from "@/lib/articles/copy";
import { ARTICLES_PATH, articlePath } from "@/lib/articles/paths";
import { readingFont } from "@/lib/articles/readingFont";
import type {
  Article,
  ArticleDrill,
  ArticleSection,
  ArticleSource,
  ArticleSummary,
  PhotoCredit,
} from "@/lib/articles/schema";
import { buildArticleStructuredData } from "@/lib/articles/structuredData";
import { gameHref, LEARN_AUTHOR } from "@/lib/seo/learn/schema";
import "./articlePage.css";

type ArticlePageProps = {
  article: Article;
  nextArticle?: ArticleSummary;
};

const SOURCES_HEADING_ID = "article-sources-heading";
const AUTHOR_PATH = new URL(LEARN_AUTHOR.url).pathname;

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={ARTICLE_LINK}>
      {children}
    </a>
  );
}

function Credit({ credit }: { credit: PhotoCredit }) {
  return (
    <cite className="mt-1.5 block text-[11.5px] not-italic leading-normal text-text-muted">
      {ARTICLE_COPY.photoCredit}: {credit.author},{" "}
      {credit.licenseUrl === null ? (
        credit.license
      ) : (
        <ExternalLink href={credit.licenseUrl}>{credit.license}</ExternalLink>
      )}
      , via <ExternalLink href={credit.sourceUrl}>{ARTICLE_COPY.photoSource}</ExternalLink>.{" "}
      {credit.changes}.
    </cite>
  );
}

function Portrait({ article }: { article: Article }) {
  const { photo, person } = article;

  return (
    <figure className="row-start-1 mb-[22px] max-w-[190px] min-[821px]:mb-0 min-[821px]:max-w-none">
      <ArticlePortrait photo={photo} sizes="(max-width: 820px) 190px, 280px" priority className="rounded-[18px]" />
      <figcaption className="mt-3 text-sm leading-[1.4] text-text-muted">
        <b className="block font-semibold text-text-secondary">{person.name}</b>
        <span>{person.role}</span>
      </figcaption>
      <Credit credit={photo} />
    </figure>
  );
}

function HeadingBlock({ article }: { article: Article }) {
  return (
    <header className="row-start-2 min-[821px]:col-start-2 min-[821px]:row-start-1">
      <p className="text-sm text-peach-500">
        <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
      </p>
      <h1 className="mt-2.5 text-[clamp(30px,4.6vw,48px)] font-bold leading-[1.06] tracking-[-0.025em] text-white [text-wrap:balance]">
        {article.title}
      </h1>
      <p className="mt-4 max-w-[58ch] text-[19px] leading-normal text-text-muted">{article.description}</p>
      <div className="mt-[18px] text-sm leading-6 text-text-muted">
        <address data-article-byline className="not-italic">
          {ARTICLE_COPY.byline}{" "}
          <Link href={AUTHOR_PATH} className={ARTICLE_LINK}>
            {LEARN_AUTHOR.name}
          </Link>
        </address>
        <p data-authorship-note className="max-w-2xl">
          {ARTICLE_COPY.authorshipNote}
        </p>
      </div>
    </header>
  );
}

function Body({ article }: { article: Article }) {
  return (
    <div
      data-article-body
      className={`${readingFont.className} mt-[34px] max-w-[66ch] text-[18.5px] leading-[1.75] text-text-secondary min-[561px]:text-xl`}
    >
      {article.sections.map((section) => (
        <SectionText key={section.heading} section={section} />
      ))}
    </div>
  );
}

function SectionText({ section }: { section: ArticleSection }) {
  return (
    <>
      <h2 className="mb-[0.55em] mt-[1.8em] text-[22px] font-bold leading-tight tracking-[-0.01em] text-white [font-family:var(--font-geist-sans)] first:mt-0">
        {section.heading}
      </h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mb-[1.3em]">
          {paragraph}
        </p>
      ))}
    </>
  );
}

function Drill({ drill }: { drill: ArticleDrill }) {
  return (
    <aside className="mt-10 max-w-[720px]">
      <Link
        href={gameHref(drill)}
        data-article-drill
        className={`group flex flex-wrap items-center justify-between gap-3.5 rounded-[18px] border border-peach-500/25 bg-peach-500/10 p-[22px] hover:border-peach-400/50 ${ARTICLE_FOCUS_RING}`}
      >
        <span className="min-w-0 flex-[1_1_260px] text-[15.5px] leading-[1.45] text-text-muted">
          <b className="block text-lg font-semibold text-white">{ARTICLE_COPY.drillHeading}</b>
          {drill.why}
        </span>
        <span className="inline-flex min-h-[46px] items-center rounded-full bg-peach-500 px-5 font-semibold text-bg-dark group-hover:bg-peach-400">
          {ARTICLE_COPY.drillAction(drill.pieceCount, drill.memorizeTime)}
        </span>
      </Link>
    </aside>
  );
}

function Sources({ sources }: { sources: readonly ArticleSource[] }) {
  return (
    <section aria-labelledby={SOURCES_HEADING_ID} className="mt-12 max-w-[720px] border-t border-white/10 pt-8">
      <h2 id={SOURCES_HEADING_ID} className="text-xl font-semibold tracking-tight text-white">
        {ARTICLE_COPY.sources}
      </h2>
      <ol className="mt-4 divide-y divide-white/10 border-t border-white/10">
        {sources.map((source) => (
          <li key={source.url} className="py-4">
            <cite className="not-italic">
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
  return (
    <Link
      href={articlePath(next.slug)}
      className={`group mt-7 block max-w-[720px] rounded border-t border-white/10 pt-5 text-[13px] text-text-muted ${ARTICLE_FOCUS_RING}`}
    >
      {ARTICLE_COPY.nextArticle}
      <b className="mt-1 block text-lg font-semibold leading-[1.3] text-white group-hover:text-peach-300">
        {next.title}
      </b>
    </Link>
  );
}

export default function ArticlePage({ article, nextArticle }: ArticlePageProps) {
  return (
    <EditorialPageShell mainClassName="!max-w-[1080px]">
      <Link
        href={ARTICLES_PATH}
        className={`mb-2.5 mt-1.5 inline-flex min-h-11 items-center gap-2 rounded text-sm text-text-muted hover:text-peach-300 ${ARTICLE_FOCUS_RING}`}
      >
        <span aria-hidden="true">←</span>
        {ARTICLE_COPY.backToList}
      </Link>
      <article className="grid grid-cols-[minmax(0,1fr)] min-[821px]:grid-cols-[280px_minmax(0,1fr)] min-[821px]:items-start min-[821px]:gap-x-14">
        <HeadingBlock article={article} />
        <div
          data-article-rail
          className="contents min-[821px]:col-start-1 min-[821px]:row-span-2 min-[821px]:row-start-1 min-[821px]:block min-[821px]:[@media(min-height:820px)]:sticky min-[821px]:[@media(min-height:820px)]:top-5"
        >
          <Portrait article={article} />
          <FactFile facts={article.facts} className="row-start-3 mt-7 min-[821px]:mt-[22px]" />
        </div>
        <div className="row-start-4 min-[821px]:col-start-2 min-[821px]:row-start-2">
          <Body article={article} />
          <Drill drill={article.drill} />
          <Sources sources={article.sources} />
          {nextArticle ? <NextArticle next={nextArticle} /> : null}
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleStructuredData(article)) }}
      />
    </EditorialPageShell>
  );
}
