import { INTRO_GATE } from "@/lib/home/intro/introGate";
import { IntroLayer } from "./IntroLayer";
import "./intro.css";

/**
 * The 45-board intro's gate and its layer. Every visitor gets this HTML; CSS shows the layer only when the gate marked
 * its script, so a visitor the gate skips paints the home page as before.
 */
export function IntroShell() {
  return (
    <>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      <IntroLayer />
    </>
  );
}
