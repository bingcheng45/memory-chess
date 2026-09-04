import { getTranslations } from "next-intl/server";

import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";
import {
  ACCURACY_BANDS,
  MEMORIZE_SECONDS_RANGE,
  PIECE_COUNT_RANGE,
  PRESET_FACTS,
} from "@/lib/reference/facts";
import { getReferenceProse, interpolate } from "@/lib/reference/prose";

/**
 * Rendered by the game route's layout, not its page: the page wraps the game
 * in a Suspense boundary whose child calls useSearchParams, so during static
 * prerender only the fallback serialises and nothing inside the page reaches
 * the served HTML. This block is also the route's sole h1; the game UI has
 * none.
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
      className="bg-bg-dark text-text-primary"
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

      <div className="container mx-auto max-w-4xl px-1 sm:px-4 pb-4 pt-10 sm:pt-12">
        <div className={EDITORIAL_STYLES.readingColumn}>
          <h1
            id="game-reference-title"
            className={EDITORIAL_STYLES.pageTitle}
          >
            {prose.title}
          </h1>
          <p className={`${EDITORIAL_STYLES.body} mt-4`}>{prose.intro}</p>

          <section className={EDITORIAL_STYLES.section}>
            <h2 className={EDITORIAL_STYLES.sectionTitle}>
              {prose.phases.heading}
            </h2>
            {phases.map((phase) => (
              <div key={phase.title} className="mt-5">
                <h3 className={EDITORIAL_STYLES.subsectionTitle}>
                  {phase.title}
                </h3>
                <p className={`${EDITORIAL_STYLES.body} mt-2`}>{phase.body}</p>
              </div>
            ))}
          </section>

          <section className={EDITORIAL_STYLES.section}>
            <h2 className={EDITORIAL_STYLES.sectionTitle}>
              {prose.presets.heading}
            </h2>
            <p className={`${EDITORIAL_STYLES.body} mt-5`}>
              {prose.presets.intro}
            </p>
            <div className={`${EDITORIAL_STYLES.tableFrame} mt-4`}>
              <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {prose.presets.columns.preset}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {prose.presets.columns.pieces}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      {prose.presets.columns.time}
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium w-1/2">
                      {prose.presets.columns.trains}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-text-secondary">
                  {PRESET_FACTS.map((preset) => (
                    <tr key={preset.difficulty}>
                      <th
                        scope="row"
                        className="px-4 py-3 font-medium text-text-primary"
                      >
                        {t(`presets.${preset.difficulty}.label`)}
                      </th>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {preset.pieceCount}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {interpolate(prose.presets.seconds, {
                          seconds: preset.memorizeSeconds,
                        })}
                      </td>
                      <td className="px-4 py-3 leading-6">
                        {prose.presets.trains[preset.difficulty]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <h3 className={EDITORIAL_STYLES.subsectionTitle}>
                {prose.presets.custom.title}
              </h3>
              <p className={`${EDITORIAL_STYLES.body} mt-2`}>
                {interpolate(prose.presets.custom.body, {
                  minPieces: PIECE_COUNT_RANGE.min,
                  maxPieces: PIECE_COUNT_RANGE.max,
                  minSeconds: MEMORIZE_SECONDS_RANGE.min,
                  maxSeconds: MEMORIZE_SECONDS_RANGE.max,
                })}
              </p>
            </div>
          </section>

          <section className={EDITORIAL_STYLES.section}>
            <h2 className={EDITORIAL_STYLES.sectionTitle}>
              {prose.scoring.heading}
            </h2>
            <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-4`}>
              <p>{prose.scoring.match}</p>
              <p>{prose.scoring.accuracy}</p>
              <p>{prose.scoring.wrong}</p>
              <p>{prose.scoring.bandsIntro}</p>
            </div>
            <ul className={`${EDITORIAL_STYLES.body} mt-4 space-y-2`}>
              {ACCURACY_BANDS.map((band, index) => (
                <li key={band.key}>
                  <span className="font-medium text-text-primary">
                    {t(`result.messages.${band.key}`)}
                  </span>{" "}
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
            <p className={`${EDITORIAL_STYLES.body} mt-4`}>
              {prose.scoring.ranking}
            </p>
          </section>

          <section className={EDITORIAL_STYLES.section}>
            <h2 className={EDITORIAL_STYLES.sectionTitle}>
              {prose.positions.heading}
            </h2>
            <p className={`${EDITORIAL_STYLES.body} mt-5`}>
              {prose.positions.intro}
            </p>
            <ul
              className={`${EDITORIAL_STYLES.body} mt-4 list-disc space-y-2 pl-5`}
            >
              {Object.values(prose.positions.rules).map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div className={`${EDITORIAL_STYLES.body} mt-4 space-y-4`}>
              <p>{prose.positions.distribution}</p>
              <p>{prose.positions.outro}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
