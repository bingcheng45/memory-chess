import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import {
  EditorialHero,
  EditorialPageShell,
} from "@/components/editorial/EditorialPage";
import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";

const siteUrl = "https://thememorychess.com";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who builds Memory Chess, why the game exists, how a round is scored, and how the Learn guides are written.",
  // Placeholder: replaced with buildAlternates once the page is translated.
  // Kept as a plain canonical so nothing points at a locale that does not yet
  // differ in content.
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Memory Chess",
    description:
      "Who builds Memory Chess, why the game exists, and how it works.",
    url: `${siteUrl}/about`,
  },
  twitter: {
    title: "About Memory Chess",
    description:
      "Who builds Memory Chess, why the game exists, and how it works.",
  },
};

const external = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

export default function AboutPage() {
  return (
    <EditorialPageShell>
      <EditorialHero
        eyebrow="About"
        title="About Memory Chess"
        description="Memory Chess is a free board-memory game built and run by one person. This page explains who that is, why the game exists, and how it actually works."
      />

      <div className={EDITORIAL_STYLES.readingColumn}>
        <section className={EDITORIAL_STYLES.section}>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>Who runs this site</h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-5`}>
            <p>
              I am Bing Cheng, a solo developer. I design, code, and maintain
              everything on Memory Chess myself. There is no team and no company
              behind it, just me. I also build{" "}
              <a href="https://tont.app" className={EDITORIAL_STYLES.link} {...external}>
                Tont
              </a>
              , and I post updates about this site at{" "}
              <a
                href="https://x.com/TheMemoryChess"
                className={EDITORIAL_STYLES.link}
                {...external}
              >
                @TheMemoryChess
              </a>
              .
            </p>
            <p>
              Because one person writes all of it, the site stays small on
              purpose. One game, a set of training guides, a leaderboard, and a
              changelog that records what actually shipped.
            </p>
            <p>
              The game is free and needs no account. Ads through Google AdSense
              help cover the hosting costs, and nothing on the site is locked
              behind a payment or a signup.
            </p>
          </div>
        </section>

        <section className={EDITORIAL_STYLES.section}>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>Why the game exists</h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-5`}>
            <p>
              Most chess improvement advice points beginners at openings,
              puzzles, and courses. In my experience the earlier problem sits
              underneath all of that. Beginners lose track of the board. They
              miss a defender, forget a piece moved two turns ago, and blunder
              into captures they would spot instantly on a diagram.
            </p>
            <p>
              Holding a position in your head is a trainable skill, and there
              were few places to practice it directly. So I built one. Memory
              Chess isolates that one skill and gives it a score, so you can
              watch it improve. More than 37,000 games have been played on the
              site so far, and if you want stakes you can put a chosen name on
              the public leaderboard and measure yourself against everyone
              else.
            </p>
          </div>
        </section>

        <section className={EDITORIAL_STYLES.section}>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>How a round works</h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-5`}>
            <p>
              You choose how many pieces to face and how long you may study
              them. The presets range from Easy, two pieces with ten seconds,
              up to Grandmaster, twenty pieces with five seconds, and you can
              set any custom combination. Then the round runs in three phases.
            </p>
            <p>
              First you memorize. The board shows a position for the time you
              chose, and then it disappears. Next you rebuild. You place pieces
              on an empty board from memory. Finally you get your result. The
              game compares your board with the original, square by square.
            </p>
            <p>
              The scoring is strict. A piece counts as correct only when the
              right piece of the right color stands on the exact square it
              occupied in the original position. A rook where a knight belongs
              is wrong twice over. It counts as a misplaced piece, and the
              knight it displaced counts as missing. Your accuracy is the share
              of the original pieces you reproduced exactly.
            </p>
            <p>
              The results screen shows all three groups, the placements you got
              right, the ones you got wrong, and the pieces you forgot
              entirely, so every round tells you what to attack next time. You
              can{" "}
              <Link href="/game" className={EDITORIAL_STYLES.link}>
                try a round
              </Link>{" "}
              in under a minute.
            </p>
          </div>
        </section>

        <section className={EDITORIAL_STYLES.section}>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>
            How the Learn guides are written
          </h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-5`}>
            <p>
              The{" "}
              <Link href="/learn" className={EDITORIAL_STYLES.link}>
                Learn library
              </Link>{" "}
              holds sixteen guides on board vision, visualization, and memory
              training. I write and review them myself, and I keep them
              deliberately practical. Each one ends in drills you can run on
              this site rather than advice you can only nod at.
            </p>
            <p>
              Where the guides make claims about memory and learning, they cite
              published research, including Gobet and Simon&apos;s work on
              chess memory and the experimental literature on retrieval and
              spaced practice. Every citation links its source. I have not
              conducted research of my own, and the guides do not pretend
              otherwise.
            </p>
            <p>
              Each guide follows the same working shape. A quick answer up
              front, a place to start, drills you can run on the board, the
              mistakes I see most often, and a short plan that fits in twenty
              minutes a day.
            </p>
          </div>
        </section>

        <section className={EDITORIAL_STYLES.section}>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>
            Where the site has been
          </h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-5`}>
            <p>
              The first release went live in March 2025 as a bare version of
              the game. Mobile play and piece selection followed within weeks.
              In August 2026 the site grew its Learn library and shipped in 24
              languages, with all sixteen guides translated. The{" "}
              <Link href="/changelog" className={EDITORIAL_STYLES.link}>
                changelog
              </Link>{" "}
              records every release since the beginning, including the bug
              fixes. I keep it honest because I use it myself to remember what
              changed and when.
            </p>
          </div>
        </section>

        <section className={EDITORIAL_STYLES.section}>
          <h2 className={EDITORIAL_STYLES.sectionTitle}>Get in touch</h2>
          <div className={`${EDITORIAL_STYLES.body} mt-5 space-y-5`}>
            <p>
              Write to me at{" "}
              <a
                href="mailto:bingcheng45@gmail.com"
                className={EDITORIAL_STYLES.link}
              >
                bingcheng45@gmail.com
              </a>{" "}
              or use the{" "}
              <Link href="/contact-us" className={EDITORIAL_STYLES.link}>
                contact form
              </Link>
              . I read everything, and player reports have fixed real bugs
              before. If you want the fine print, the{" "}
              <Link href="/privacy" className={EDITORIAL_STYLES.link}>
                privacy policy
              </Link>{" "}
              and the{" "}
              <Link href="/terms" className={EDITORIAL_STYLES.link}>
                terms of service
              </Link>{" "}
              cover how the site handles data and what you agree to by playing.
            </p>
          </div>
        </section>
      </div>
    </EditorialPageShell>
  );
}
