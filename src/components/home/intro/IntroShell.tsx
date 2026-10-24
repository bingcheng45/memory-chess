import { useTranslations } from "next-intl";
import { INTRO_GATE } from "@/lib/home/intro/introGate";
import { IntroSkip } from "./IntroSkip";
import "./intro.css";

/**
 * The 45-board intro's gate and its first frame. Every visitor gets this HTML; CSS shows the layer only when the gate
 * marked its script, so a visitor the gate skips paints the home page as before.
 */
export function IntroShell() {
  const t = useTranslations("home.lab.intro");
  return (
    <>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      <section className="home-intro" aria-label={t("label")}>
        <p className="home-intro-caption">{t("one")}</p>
        <IntroSkip label={t("skip")} />
      </section>
    </>
  );
}
