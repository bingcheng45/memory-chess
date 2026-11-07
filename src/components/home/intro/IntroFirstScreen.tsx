import { useLocale } from "next-intl";
import { FIRST_SCREEN_LOCALES, HOME_INTRO } from "@/lib/home/intro/introGate";
import { Link } from "../HomeLinks";
import { QUICK_START_HREF } from "../links";
import { FIRST_SCREEN_BOARDS, FIRST_SCREEN_COPY as COPY, NAJDORF_ARTICLE_HREF, piecesOf, squareAt } from "./firstScreen";
import { IntroStoryButton } from "./IntroStoryButton";
import "./intro.css";

/** One board as the intro paints it: 8 by 8 squares (from CSS), the last move lit, the pieces as glyphs. */
function MiniBoard({ fen, lit }: { readonly fen: string; readonly lit: string }) {
  const move = squareAt(lit);
  return (
    <svg className="home-first-board" viewBox="0 0 8 8" aria-hidden="true">
      <rect x={move.file} y={move.rank} width="1" height="1" />
      {piecesOf(fen).map((piece) => (
        <text key={`${piece.file}${piece.rank}`} x={piece.file + 0.5} y={piece.rank + 0.54} data-white={piece.white || undefined}>
          {piece.glyph}
        </text>
      ))}
    </svg>
  );
}

/**
 * The phone first screen: Najdorf's 45 boards as a still grid, the question, and Play in the thumb zone. Shown below
 * FIRST_SCREEN_MEDIA in FIRST_SCREEN_LOCALES, where the gate does not play the intro; desktop keeps the hero.
 */
export function IntroFirstScreen() {
  const locale = useLocale();
  if (!FIRST_SCREEN_LOCALES.includes(locale)) return null;

  return (
    <section className="home-first" aria-label={COPY.label}>
      <p className="home-first-kicker">{COPY.kicker}</p>
      <figure className="home-first-figure">
        <div className="home-first-boards" role="img" aria-label={COPY.boardsAlt}>
          {FIRST_SCREEN_BOARDS.map((board) => (
            <MiniBoard key={board.fen} fen={board.fen} lit={board.lit} />
          ))}
        </div>
        <figcaption>{COPY.boardsCaption}</figcaption>
      </figure>
      <h2 className="home-first-title">
        {COPY.headlineBefore}
        <em>{COPY.headlineEm}</em>
        {COPY.headlineAfter}
      </h2>
      <p className="home-first-lede">{COPY.lede}</p>
      <div className="home-first-actions">
        <Link className="home-first-play" href={QUICK_START_HREF}>
          {COPY.play}
        </Link>
        {HOME_INTRO ? (
          <IntroStoryButton label={COPY.story} />
        ) : (
          <Link className="home-first-story" href={NAJDORF_ARTICLE_HREF} prefetch={false}>
            {COPY.story}
          </Link>
        )}
        <p className="home-first-fine">{COPY.fine}</p>
      </div>
    </section>
  );
}
