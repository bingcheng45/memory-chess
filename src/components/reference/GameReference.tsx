import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import "./game-reference.css";
import {
  ACCURACY_BANDS,
  MEMORIZE_SECONDS_RANGE,
  PIECE_COUNT_RANGE,
  PRESET_FACTS,
} from "@/lib/reference/facts";
import { getReferenceProse, interpolate, type ReferenceProse } from "@/lib/reference/prose";
import { DEFAULT_LOCALE } from "@/i18n/routing";
import { articlePath } from "@/lib/articles/paths";
import { DEFAULT_ROUND_PIECES, DEFAULT_ROUND_SECONDS, RECALL_DATA, RECALL_PATH, presetCells } from "@/lib/data/recall";
import { EXTRA_PIECE_PENALTY } from "@/lib/game/scoring";
import { localizedPath } from "@/lib/seo/alternates";

/**
 * The Learn guides are English-only, so the list that links them is too: a
 * translated game page would otherwise carry an English section.
 */
const TRAINING_GUIDES = {
  heading: "Train between rounds",
  links: [
    { slug: "chess-visualization-exercises", before: "Hold the picture longer with these ", anchor: "chess visualization exercises", after: "." },
    { slug: "blindfold-chess-training-for-beginners", before: "Work through a four-stage ", anchor: "blindfold chess training plan", after: "." },
    { slug: "chess-memory-training", before: "Climb the ", anchor: "chess memory training ladder", after: " one preset at a time." },
    { slug: "how-to-see-the-whole-board-in-chess", before: "Learn to ", anchor: "see the whole board", after: " before you move." },
  ],
} as const;

function withNodes(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template.split(/\{(\w+)\}/).map((part, index) => (
    <Fragment key={index}>{index % 2 === 1 && part in nodes ? nodes[part] : part}</Fragment>
  ));
}

function MemoryTestAnswer({ answer, locale }: { answer: ReferenceProse["game"]["answer"]; locale: string }) {
  const { easy, medium, hard } = presetCells(RECALL_DATA);
  const number = new Intl.NumberFormat(locale);
  const percent = (value: number) => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(value / 100);
  const day = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

  return (
    <section aria-labelledby="game-answer-title" className="lab-ref-answer">
      <h2 id="game-answer-title">{answer.heading}</h2>
      <div className="lab-ref-paras">
        <p>{withNodes(answer.what, { deGroot: <Link href={localizedPath(articlePath("adriaan-de-groot"), locale)}>{answer.deGroot}</Link> })}</p>
        <p>{interpolate(answer.scoring, { penalty: EXTRA_PIECE_PENALTY })}</p>
        <p>
          {interpolate(answer.typical, {
            rounds: number.format(medium.rounds),
            pieces: DEFAULT_ROUND_PIECES,
            seconds: DEFAULT_ROUND_SECONDS,
            start: day(RECALL_DATA.start),
            end: day(RECALL_DATA.end),
            mean: percent(medium.meanAccuracy),
            perfect: percent(medium.perfectShare),
            easyPieces: easy.pieceCount,
            easyMean: percent(easy.meanAccuracy),
            easyRounds: number.format(easy.rounds),
            hardPieces: hard.pieceCount,
            hardSeconds: hard.memorizeSeconds,
            hardMean: percent(hard.meanAccuracy),
            hardRounds: number.format(hard.rounds),
          })}
        </p>
        <p>
          {answer.limits} <Link href={localizedPath(RECALL_PATH, locale)}>{answer.dataLink}</Link>
        </p>
      </div>
    </section>
  );
}

/**
 * Rendered by the game route's layout, not its page: the page wraps the game
 * in a Suspense boundary whose child calls useSearchParams, so during static
 * prerender only the fallback serialises and nothing inside the page reaches
 * the served HTML. The route's h1 is the configuration card's, which comes
 * first in the document, so this block starts at h2.
 */
export default async function GameReference({ locale }: { locale: string }) {
  const prose = getReferenceProse(locale).game;
  const t = await getTranslations({ locale, namespace: "game" });

  const phases = [
    prose.phases.memorize,
    prose.phases.place,
    prose.phases.score,
  ];

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: prose.title,
    description: prose.intro,
    step: phases.map((phase, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: phase.title,
      text: phase.body,
    })),
  };

  return (
    <section
      data-below-game
      aria-labelledby="game-reference-title"
      className={`${LAB_PAPER_CLASS} lab-ref`}
    >
      {/*
        Plain script tag, not next/script: `strategy="afterInteractive"` keeps
        the JSON-LD out of the served HTML entirely, so crawlers only see it
        if they execute JS. This matches how the Learn pages already emit
        their structured data.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className="lab-wrap">
        <div className="lab-ref-col">
          <MemoryTestAnswer answer={prose.answer} locale={locale} />
          <h2 id="game-reference-title" className="lab-ref-title">
            {prose.title}
          </h2>
          <p className="lab-ref-lede">{prose.intro}</p>

          <section className="lab-ref-sec">
            <h2>
              {prose.phases.heading}
            </h2>
            {phases.map((phase) => (
              <div key={phase.title} className="lab-ref-phase">
                <h3>{phase.title}</h3>
                <p>{phase.body}</p>
              </div>
            ))}
          </section>

          <section className="lab-ref-sec">
            <h2>
              {prose.presets.heading}
            </h2>
            <p>
              {prose.presets.intro}
            </p>
            <div className="lab-ref-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">
                      {prose.presets.columns.preset}
                    </th>
                    <th scope="col">
                      {prose.presets.columns.pieces}
                    </th>
                    <th scope="col">
                      {prose.presets.columns.time}
                    </th>
                    <th scope="col" className="lab-ref-wide">
                      {prose.presets.columns.trains}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PRESET_FACTS.map((preset) => (
                    <tr key={preset.difficulty}>
                      <th scope="row">
                        {t(`presets.${preset.difficulty}.label`)}
                      </th>
                      <td className="lab-mono">
                        {preset.pieceCount}
                      </td>
                      <td className="lab-mono">
                        {interpolate(prose.presets.seconds, {
                          seconds: preset.memorizeSeconds,
                        })}
                      </td>
                      <td>
                        {prose.presets.trains[preset.difficulty]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lab-ref-phase">
              <h3>
                {prose.presets.custom.title}
              </h3>
              <p>
                {interpolate(prose.presets.custom.body, {
                  minPieces: PIECE_COUNT_RANGE.min,
                  maxPieces: PIECE_COUNT_RANGE.max,
                  minSeconds: MEMORIZE_SECONDS_RANGE.min,
                  maxSeconds: MEMORIZE_SECONDS_RANGE.max,
                })}
              </p>
            </div>
          </section>

          <section className="lab-ref-sec">
            <h2>
              {prose.scoring.heading}
            </h2>
            <div className="lab-ref-paras">
              <p>{prose.scoring.match}</p>
              <p>{prose.scoring.accuracy}</p>
              <p>{prose.scoring.wrong}</p>
              <p>{prose.scoring.bandsIntro}</p>
            </div>
            <ul className="lab-ref-bands">
              {ACCURACY_BANDS.map((band, index) => (
                <li key={band.key}>
                  <b>
                    {t(`result.messages.${band.key}`)}
                  </b>{" "}
                  {interpolate(prose.scoring.bands[band.key], {
                    // keepPracticing is "below X", where X is the floor of
                    // the band above it; every other band states its own.
                    threshold:
                      band.minAccuracy > 0
                        ? band.minAccuracy
                        : ACCURACY_BANDS[index - 1].minAccuracy,
                  })}
                </li>
              ))}
            </ul>
            <p>
              {prose.scoring.ranking}
            </p>
          </section>

          <section className="lab-ref-sec">
            <h2>
              {prose.positions.heading}
            </h2>
            <p>
              {prose.positions.intro}
            </p>
            <ul className="lab-ref-list">
              {Object.values(prose.positions.rules).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div className="lab-ref-paras">
              <p>{prose.positions.distribution}</p>
              <p>{prose.positions.outro}</p>
            </div>
          </section>

          {locale === DEFAULT_LOCALE ? (
            <section className="lab-ref-sec">
              <h2>
                {TRAINING_GUIDES.heading}
              </h2>
              <ul className="lab-ref-list">
                {TRAINING_GUIDES.links.map((link) => (
                  <li key={link.slug}>
                    {link.before}
                    <Link href={`/learn/${link.slug}`}>
                      {link.anchor}
                    </Link>
                    {link.after}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
