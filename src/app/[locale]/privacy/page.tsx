import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Footer from "@/components/ui/Footer";
import PageHeader from "@/components/ui/PageHeader";

const siteUrl = "https://thememorychess.com";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Memory Chess uses data, browser storage, analytics, cookies, and advertising services.",
  // Placeholder: replaced with buildAlternates once the policy copy is
  // translated. Kept as a plain canonical so nothing points at a locale that
  // does not yet differ in content.
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Memory Chess Privacy Policy",
    description:
      "Learn how Memory Chess handles data, cookies, analytics, and advertising.",
    url: `${siteUrl}/privacy`,
  },
  twitter: {
    title: "Memory Chess Privacy Policy",
    description:
      "Learn how Memory Chess handles data, cookies, analytics, and advertising.",
  },
};

const sectionClassName =
  "space-y-4 border-b border-white/10 py-8 last:border-0";
const headingClassName = "text-xl font-semibold tracking-tight text-white";
const copyClassName = "text-sm leading-7 text-text-muted sm:text-base";
const linkClassName =
  "text-peach-300 underline decoration-peach-500/40 underline-offset-4 transition-colors hover:text-peach-200";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary">
      <main className="container mx-auto max-w-4xl px-1 sm:px-4 py-8 sm:py-10">
        <div className="mb-10 flex justify-center">
          <PageHeader showSoundSettings={false} className="mb-0" />
        </div>

        <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-peach-400">
            Your privacy
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
            A simple guide to what Memory Chess collects, why we use it, and the
            choices you have.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            Last updated: September 4, 2026
          </p>
        </header>

        <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-bg-card/60 px-5 sm:px-8">
          <section className={sectionClassName}>
            <h2 className={headingClassName}>The short version</h2>
            <p className={copyClassName}>
              You can play Memory Chess without creating an account. We use a
              small amount of data to run the game, remember your settings,
              understand how the site performs, respond to messages, maintain
              the leaderboard, and improve the experience. We also use Google
              AdSense, which may use cookies and similar technology for ads when
              advertising is enabled.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Who is responsible for your data</h2>
            <p className={copyClassName}>
              Memory Chess is run by Bing Cheng, an independent developer, who
              acts as the data controller for the personal information described
              in this policy. For any privacy question or request, email{" "}
              <a
                href="mailto:bingcheng45@gmail.com"
                className={linkClassName}
              >
                bingcheng45@gmail.com
              </a>{" "}
              or use the contact form.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Information you give us</h2>
            <ul className={`${copyClassName} list-disc space-y-3 pl-5`}>
              <li>
                <span className="font-medium text-text-secondary">
                  Contact messages:
                </span>{" "}
                your name, email address, inquiry type, and message when you use
                the contact form.
              </li>
              <li>
                <span className="font-medium text-text-secondary">
                  Game feedback:
                </span>{" "}
                your star rating, optional comments, and game details such as
                accuracy, difficulty, piece count, and completion times. This
                feedback form does not ask for your name or email address.
              </li>
              <li>
                <span className="font-medium text-text-secondary">
                  Leaderboard entries:
                </span>{" "}
                the player name you choose and the score details you submit.
                These are displayed publicly, so please do not use your real
                name if you would rather keep it private.
              </li>
            </ul>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>
              Information collected automatically
            </h2>
            <p className={copyClassName}>
              Our measurement providers may receive technical and usage
              information such as pages viewed, approximate location, browser
              and device type, referring page, IP address, and performance
              timings. Memory Chess uses Google Analytics, Vercel Analytics, and
              Vercel Speed Insights to understand traffic and keep the site fast
              and reliable.
            </p>
            <p className={copyClassName}>
              We do not ask these tools to collect the content of your contact
              messages or game-feedback comments.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Cookies and browser storage</h2>
            <p className={copyClassName}>
              Memory Chess uses browser storage to keep game history and
              settings on your device, remember sound preferences, avoid
              repeating a dismissed update banner, and time when the feedback
              prompt may return. We also create a random local identifier for
              in-browser usage events. Clearing your browser data resets these
              choices.
            </p>
            <p className={copyClassName}>
              Google Analytics and advertising services may use cookies or
              similar identifiers. You can block or delete cookies in your
              browser, although some preferences may stop working as expected.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Advertising and Google AdSense</h2>
            <p className={copyClassName}>
              Memory Chess uses Google AdSense to support the site. Third-party
              vendors, including Google, may place or read cookies, use web
              beacons, or process IP addresses when advertising services or ad
              tags are used.
            </p>
            <p className={copyClassName}>
              Google and its advertising partners may use advertising cookies to
              serve ads based on your visits to Memory Chess and other websites.
              Depending on your location, choices, and settings, ads may be
              personalized or non-personalized. Other Google-certified ad
              vendors may also participate in serving and measuring ads.
            </p>
            <p className={copyClassName}>
              Google is one of these vendors and uses the DoubleClick cookie,
              also known as the DART cookie, to serve ads based on your visits
              to this site and other sites on the internet. You can opt out of
              the DART cookie through Google&apos;s ad settings linked below.
            </p>
            <p className={copyClassName}>
              Learn more about{" "}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                how Google uses information from partner sites
              </a>
              . You can manage personalized advertising in{" "}
              <a
                href="https://myadcenter.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                My Ad Center
              </a>{" "}
              and opt out of some other vendors through{" "}
              <a
                href="https://optout.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                YourAdChoices
              </a>
              .
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Consent choices</h2>
            <p className={copyClassName}>
              Where required, visitors are shown a consent message before
              eligible advertising data is used. Visitors in the European
              Economic Area, the United Kingdom, and Switzerland can consent,
              decline, or manage individual choices through Google&apos;s
              consent platform. You can also change cookie controls in your
              browser and adjust Google advertising preferences in My Ad Center.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>
              How we use and share information
            </h2>
            <p className={copyClassName}>
              We use information to provide and secure Memory Chess, calculate
              results, publish submitted leaderboard scores, reply to contact
              messages, review feedback, measure site performance, prevent
              abuse, and support the site with advertising. We do not sell the
              contact details or feedback you submit.
            </p>
            <p className={copyClassName}>
              Data is handled by service providers only where needed: Google
              Sheets for contact messages and game feedback, Supabase for game
              statistics and leaderboard entries, Vercel for hosting and
              performance measurement, and Google for analytics, consent, and
              advertising. These providers may process data in other countries
              under their own privacy terms.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Retention and security</h2>
            <p className={copyClassName}>
              We keep submitted information only for as long as it remains
              useful for the purposes described above, including maintaining the
              public leaderboard and responding to messages, or as required by
              law. No online service is perfectly secure, but we limit access
              and use reasonable safeguards for the systems we control.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Your choices</h2>
            <ul className={`${copyClassName} list-disc space-y-3 pl-5`}>
              <li>Play without submitting a leaderboard name or feedback.</li>
              <li>Clear stored game data and preferences in your browser.</li>
              <li>Manage cookies, consent choices, and personalized ads.</li>
              <li>
                Ask us about, correct, or request deletion of information you
                submitted, subject to applicable law and our ability to verify
                the request.
              </li>
            </ul>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Your rights under GDPR and CCPA</h2>
            <p className={copyClassName}>
              If you are in the European Economic Area or the United Kingdom,
              the GDPR gives you the rights of access, rectification, erasure,
              restriction of processing, objection to processing, and data
              portability. The legal bases we rely on are your consent, for
              personalized advertising and analytics cookies where consent is
              required, and our legitimate interests, for running and securing
              the site, publishing the leaderboard scores you submit, and
              answering the messages you send. You may withdraw consent at any
              time through the consent message or your browser settings, and
              you may lodge a complaint with your local supervisory authority.
            </p>
            <p className={copyClassName}>
              If you are a California resident, the CCPA gives you the right to
              know what personal information is collected, to request its
              deletion, and to opt out of its sale or sharing. We do not sell
              your personal information. Cookies used for personalized
              advertising may count as sharing under the CCPA, and you can opt
              out through the consent message, My Ad Center, and YourAdChoices
              linked above. This is our Do Not Sell or Share My Personal
              Information notice. To exercise any of these rights, email{" "}
              <a
                href="mailto:bingcheng45@gmail.com"
                className={linkClassName}
              >
                bingcheng45@gmail.com
              </a>
              .
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Children&apos;s privacy</h2>
            <p className={copyClassName}>
              Memory Chess is a general-audience training game and is not
              designed to collect personal information from children. If you are
              a parent or guardian and believe a child submitted personal
              information, please contact us so we can review and remove it
              where appropriate.
            </p>
          </section>

          <section className={sectionClassName}>
            <h2 className={headingClassName}>Changes and contact</h2>
            <p className={copyClassName}>
              We may update this policy when the site or our service providers
              change. The date at the top shows the latest revision. For privacy
              questions or requests, use the{" "}
              <Link href="/contact-us" className={linkClassName}>
                Memory Chess contact form
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
