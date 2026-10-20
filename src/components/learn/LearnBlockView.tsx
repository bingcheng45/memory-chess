import { articlePath } from "@/lib/articles/paths";
import type { GuideCopy } from "@/lib/seo/learn/copy";
import { ctaHref, DAILY_PATH, guidePath, guideRoundHref } from "@/lib/seo/learn/links";
import type { CtaBlock, LearnBlock, Rich } from "@/lib/seo/learn/schema";
import { AFFILIATE, AMAZON_DISCLOSURE } from "@/lib/affiliate/amazon";
import GuideLink from "./GuideLink";
import LearnAffiliateLink from "./LearnAffiliateLink";
import LearnBoard from "./LearnBoard";
import LearnRulesDemo from "./LearnRulesDemo";
import { WoodenSetIllustration } from "./WoodenSet";

export type TitleLookup = { readonly guide: (slug: string) => string; readonly article: (slug: string) => string };

export type GuideContext = { readonly copy: GuideCopy; readonly locale: string };

function RichText({ value, locale }: { readonly value: Rich; readonly locale: string }) {
  if (typeof value === "string") return value;
  return value.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <GuideLink key={`${part.href}-${index}`} href={part.href} locale={locale} className="lg-link">
        {part.text}
      </GuideLink>
    ),
  );
}

function ctaTag(block: CtaBlock, copy: GuideCopy): string {
  const { target } = block;
  switch (target.kind) {
    case "game":
      return `${copy.pieces(target.pieceCount)} · ${copy.secondsToLook(target.memorizeTime)}`;
    case "article":
      return copy.ctaTag.article;
    case "stat":
      return `${copy.ctaTag.stat} · ${copy.statLabel(target.tile)}`;
  }
}

function Cta({ block, context: { copy, locale } }: { readonly block: CtaBlock; readonly context: GuideContext }) {
  return (
    <GuideLink href={ctaHref(block.target)} locale={locale} marksEnglish={false} className="lg-cta" data-cta-kind={block.target.kind}>
      <span className="lg-cta-text">
        <span className="lg-cta-tag">{ctaTag(block, copy)}</span>
        <b>{block.target.label}</b>
        <span>{block.why}</span>
      </span>
      <span className="lg-cta-action" aria-hidden="true">
        {copy.ctaAction[block.target.kind]}
      </span>
    </GuideLink>
  );
}

interface LearnBlockViewProps {
  readonly block: LearnBlock;
  readonly figure?: number;
  readonly titles: TitleLookup;
  readonly context: GuideContext;
}

export default function LearnBlockView({ block, figure = 0, titles, context }: LearnBlockViewProps) {
  const { copy, locale } = context;
  switch (block.kind) {
    case "prose":
      return (
        <div className="lg-prose">
          {block.paragraphs.map((paragraph, index) => (
            <p key={index}>
              <RichText value={paragraph} locale={locale} />
            </p>
          ))}
        </div>
      );
    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index}>
          <RichText value={item} locale={locale} />
        </li>
      ));
      return block.ordered ? <ol className="lg-list">{items}</ol> : <ul className="lg-list">{items}</ul>;
    }
    case "takeaway":
      return (
        <aside className="lg-takeaway">
          <p className="lg-takeaway-title">{block.title}</p>
          <p>{block.body}</p>
        </aside>
      );
    case "board":
      return <LearnBoard block={block} figure={figure} copy={copy} />;
    case "image":
      return (
        <figure className="lg-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} width={block.width} height={block.height} alt={block.alt} loading="lazy" decoding="async" />
          <figcaption>
            {block.caption}
            {block.credit === "own" ? null : (
              <>
                {" "}
                <a className="lg-link" href={block.credit.sourceUrl} rel="noopener noreferrer">
                  {block.credit.author}, {block.credit.license}
                </a>
              </>
            )}
          </figcaption>
        </figure>
      );
    case "drills":
      return (
        <div className="lg-drills">
          {block.drills.map((drill) => (
            <article key={drill.title} className="lg-drill">
              <p className="lg-drill-meta">
                <span>{drill.duration}</span>
                {drill.play ? (
                  <span className="lg-chip">
                    {copy.pieces(drill.play.pieceCount)} · {copy.secondsToLook(drill.play.memorizeTime)}
                  </span>
                ) : (
                  <span className="lg-chip">{copy.atABoard}</span>
                )}
              </p>
              <h3>{drill.title}</h3>
              <p>
                <RichText value={drill.description} locale={locale} />
              </p>
              <p className="lg-drill-goal">
                <b>{copy.aimFor}</b> {drill.goal}
              </p>
              {drill.play ? (
                <GuideLink href={guideRoundHref(drill.play)} locale={locale} className="lab-btn lab-btn-secondary lab-btn-sm">
                  {drill.play.label}
                </GuideLink>
              ) : null}
            </article>
          ))}
          {block.drills.some((drill) => drill.play) ? (
            <p className="lg-drills-daily">
              <GuideLink href={DAILY_PATH} locale={locale} className="lg-link">
                {copy.dailyBoard}
              </GuideLink>
            </p>
          ) : null}
        </div>
      );
    case "table":
      return (
        <div className="lg-table">
          <table>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.cells.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "plan":
      return (
        <ol className="lg-plan">
          {block.steps.map((step) => (
            <li key={step.label}>
              <span className="lg-plan-label">{step.label}</span>
              <b>{step.duration}</b>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>
      );
    case "affiliate": {
      const href = AFFILIATE.amazonProductUrl;
      if (!href) return null;
      return (
        <div className="lg-buy">
          <WoodenSetIllustration />
          <div>
            <LearnAffiliateLink href={href} label={block.label} />
            <p>{AMAZON_DISCLOSURE}</p>
          </div>
        </div>
      );
    }
    case "rulesDemo":
      return <LearnRulesDemo caption={block.caption} />;
    case "cta":
      return <Cta block={block} context={context} />;
    case "faq":
      return (
        <div className="lg-faq">
          {block.items.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      );
    case "furtherReading":
      return (
        <ul className="lg-further">
          {block.items.map((item) => (
            <li key={item.slug}>
              <GuideLink
                href={item.kind === "guide" ? guidePath(item.slug) : articlePath(item.slug)}
                locale={locale}
                className="lg-further-title"
              >
                {item.kind === "guide" ? titles.guide(item.slug) : titles.article(item.slug)}
              </GuideLink>
              <p>{item.reason}</p>
            </li>
          ))}
        </ul>
      );
    case "sources":
      return (
        <ol className="lg-sources">
          {block.items.map((source) => (
            <li key={source.url}>
              <cite>
                <a className="lg-link" href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title}
                </a>
              </cite>
              {source.note ? <p>{source.note}</p> : null}
            </li>
          ))}
        </ol>
      );
    default: {
      const unhandled: never = block;
      throw new Error(`no view for block ${JSON.stringify(unhandled)}`);
    }
  }
}
